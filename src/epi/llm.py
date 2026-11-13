"""OpenRouter chat client with a content-addressed cache, a cost ledger and a hard
budget cap. Every completed call is cached, so reruns of a stage cost nothing."""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from epi import config

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
RETRYABLE_STATUS = {408, 429, 500, 502, 503, 504, 529}
MAX_ATTEMPTS = 5


class BudgetExceededError(RuntimeError):
    pass


class CallFailedError(RuntimeError):
    pass


class OutOfCreditsError(BudgetExceededError):
    """Provider account is empty (HTTP 402). Fatal: every further call would fail too."""


@dataclass(frozen=True)
class Completion:
    text: str
    model: str
    cost_usd: float
    prompt_tokens: int
    completion_tokens: int
    generation_id: str
    finish_reason: str
    cached: bool


def cache_key(model: str, messages: list[dict[str, Any]], params: dict[str, Any], tag: str) -> str:
    payload = json.dumps(
        {"model": model, "messages": messages, "params": params, "tag": tag},
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.sha256(payload.encode()).hexdigest()


class Ledger:
    """Append-only record of spend. Survives restarts; the cap applies across runs."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.spent = self._load()

    def _load(self) -> float:
        if not self.path.exists():
            return 0.0
        lines = self.path.read_text().splitlines()
        return sum(json.loads(line)["cost_usd"] for line in lines if line.strip())

    def record(self, *, stage: str, model: str, cost_usd: float, detail: str = "") -> None:
        self.spent += cost_usd
        entry = {
            "ts": time.time(),
            "stage": stage,
            "model": model,
            "cost_usd": cost_usd,
            "detail": detail,
        }
        with self.path.open("a") as handle:
            handle.write(json.dumps(entry) + "\n")

    def check(self, cap: float = config.BUDGET_CAP_USD) -> None:
        if self.spent >= cap - config.BUDGET_MARGIN_USD:
            raise BudgetExceededError(f"spent ${self.spent:.2f} of ${cap:.2f} cap")


def load_api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if key:
        return key
    if config.ORC_ENV_FILE.exists():
        for line in config.ORC_ENV_FILE.read_text().splitlines():
            if line.startswith("OPENROUTER_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("OPENROUTER_API_KEY not set and not found in orc/.env")


class LLMClient:
    def __init__(
        self,
        *,
        cache_dir: Path = config.CACHE_DIR,
        ledger: Ledger | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
        api_key: str | None = None,
        max_concurrency: int = config.MAX_CONCURRENCY,
    ) -> None:
        self.cache_dir = cache_dir
        self.ledger = ledger or Ledger(config.LEDGER_PATH)
        self._api_key = api_key
        self._transport = transport
        self._semaphore = asyncio.Semaphore(max_concurrency)
        self._http: httpx.AsyncClient | None = None

    async def __aenter__(self) -> LLMClient:
        self._http = httpx.AsyncClient(timeout=300, transport=self._transport)
        return self

    async def __aexit__(self, *exc: object) -> None:
        if self._http is not None:
            await self._http.aclose()

    def _cache_path(self, key: str) -> Path:
        return self.cache_dir / key[:2] / f"{key}.json"

    def _read_cache(self, key: str) -> Completion | None:
        path = self._cache_path(key)
        if not path.exists():
            return None
        data = json.loads(path.read_text())["completion"]
        return Completion(**{**data, "cached": True})

    def _write_cache(self, key: str, request: dict[str, Any], completion: Completion) -> None:
        path = self._cache_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        record = {"request": request, "completion": {**completion.__dict__, "cached": False}}
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(record, ensure_ascii=False))
        tmp.replace(path)

    async def complete(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        params: dict[str, Any],
        stage: str,
        tag: str = "",
    ) -> Completion:
        key = cache_key(model, messages, params, tag)
        hit = self._read_cache(key)
        if hit is not None:
            return hit
        async with self._semaphore:
            self.ledger.check()
            completion = await self._post_with_retries(model, messages, params)
        self.ledger.record(
            stage=stage, model=model, cost_usd=completion.cost_usd, detail=completion.generation_id
        )
        if not completion.text.strip():
            raise CallFailedError(
                f"{model} returned empty text (finish={completion.finish_reason})"
            )
        self._write_cache(
            key, {"model": model, "messages": messages, "params": params, "tag": tag}, completion
        )
        return completion

    async def _post_with_retries(
        self, model: str, messages: list[dict[str, Any]], params: dict[str, Any]
    ) -> Completion:
        assert self._http is not None, "use LLMClient as an async context manager"
        body = {"model": model, "messages": messages, "usage": {"include": True}, **params}
        headers = {
            "Authorization": f"Bearer {self._api_key or load_api_key()}",
            "X-Title": "epi-sprint",
        }
        last_error = ""
        for attempt in range(MAX_ATTEMPTS):
            try:
                response = await self._http.post(OPENROUTER_URL, json=body, headers=headers)
            except httpx.TransportError as exc:
                last_error = f"transport: {exc}"
            else:
                if response.status_code == 200:
                    payload = response.json()
                    if "error" not in payload:
                        return _parse_completion(model, payload)
                    last_error = f"in-body error: {payload['error']}"
                elif response.status_code in RETRYABLE_STATUS:
                    last_error = f"HTTP {response.status_code}: {response.text[:300]}"
                elif response.status_code == 402:
                    raise OutOfCreditsError(
                        f"provider account out of credits: {response.text[:300]}"
                    )
                else:
                    raise CallFailedError(
                        f"{model} HTTP {response.status_code}: {response.text[:500]}"
                    )
            await asyncio.sleep(min(60, 2**attempt + 0.5 * attempt))
        raise CallFailedError(f"{model} failed after {MAX_ATTEMPTS} attempts: {last_error}")


def _parse_completion(model: str, payload: dict[str, Any]) -> Completion:
    choice = payload["choices"][0]
    usage = payload.get("usage") or {}
    return Completion(
        text=(choice.get("message") or {}).get("content") or "",
        model=payload.get("model", model),
        cost_usd=float(usage.get("cost") or 0.0),
        prompt_tokens=int(usage.get("prompt_tokens") or 0),
        completion_tokens=int(usage.get("completion_tokens") or 0),
        generation_id=payload.get("id", ""),
        finish_reason=choice.get("finish_reason") or "",
        cached=False,
    )
