"""The two verification arms. Both return the same Flag tuples, so panelists see an
identical format and the only difference is the machinery that produced them."""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

from epi import config
from epi.items import Item
from epi.llm import Ledger, LLMClient, OutOfCreditsError, load_api_key
from epi.prompts import Flag, plain_check_messages

PLAIN_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "evidence_check",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "issues": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "claim": {"type": "string"},
                            "verdict": {
                                "type": "string",
                                "enum": ["contradicted", "not_in_evidence"],
                            },
                        },
                        "required": ["claim", "verdict"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["issues"],
            "additionalProperties": False,
        },
    },
}
ORC_LABEL_TO_VERDICT = {"contradicted": "contradicted", "not_found": "not_in_evidence"}
TOKENS_RE = re.compile(r'"(input|output)_tokens":\s*(\d+)')
MODEL_RE = re.compile(r'"model":\s*"([^"]+)"')


def parse_plain_flags(text: str) -> tuple[Flag, ...]:
    data = json.loads(_strip_fences(text))
    return tuple(Flag(claim=i["claim"].strip(), verdict=i["verdict"]) for i in data["issues"])


def _strip_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
    return cleaned


async def plain_check(client: LLMClient, item: Item, answer_text: str) -> tuple[Flag, ...]:
    completion = await client.complete(
        model=config.PLAIN_CHECK_MODEL,
        messages=plain_check_messages(item, answer_text),
        params={**config.SUPPORT_PARAMS, "response_format": PLAIN_SCHEMA},
        stage="verify-plain",
    )
    return parse_plain_flags(completion.text)


def parse_orc_flags(orc_json: dict) -> tuple[Flag, ...]:
    return tuple(
        Flag(claim=r["claim"].strip(), verdict=ORC_LABEL_TO_VERDICT[r["label"]])
        for r in orc_json.get("results", [])
        if r.get("label") in ORC_LABEL_TO_VERDICT
    )


class OrcRunner:
    """Runs the frozen ORC CLI (sprint worktree) as a subprocess. One workspace per
    item, named by packet hash, so an edited packet never reuses a stale corpus."""

    def __init__(self, ledger: Ledger, cache_dir: Path = config.RESULTS_DIR / "orc") -> None:
        self.ledger = ledger
        self.cache_dir = cache_dir
        self._item_locks: dict[str, asyncio.Lock] = {}

    def _env(self) -> dict[str, str]:
        return {
            **os.environ,
            "OPENROUTER_API_KEY": load_api_key(),
            "ORC_VERIFY_MODEL": config.ORC_VERIFY_MODEL,
            "ORC_EXTRACT_MODEL": config.ORC_EXTRACT_MODEL,
        }

    def _orc(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["uv", "run", "--directory", str(config.ORC_DIR), "orc", *args],
            capture_output=True,
            text=True,
            env=self._env(),
            timeout=600,
        )

    @staticmethod
    def workspace_name(item: Item) -> str:
        digest = hashlib.sha256(item.packet_text().encode()).hexdigest()[:8]
        return f"epi-{item.id}-{digest}"

    def _ensure_workspace(self, item: Item) -> str:
        name = self.workspace_name(item)
        if (Path.home() / ".orc" / "workspaces" / name).exists():
            return name
        packet_file = self.cache_dir / item.id / "packet.md"
        packet_file.parent.mkdir(parents=True, exist_ok=True)
        sections = [f"## {fact.id}\n\n{fact.id}. {fact.text}" for fact in item.packet]
        packet_file.write_text(f"# Evidence packet: {item.entity}\n\n" + "\n\n".join(sections))
        for args in (("workspace", "create", name), ("ingest", str(packet_file), "-w", name)):
            result = self._orc(*args)
            if result.returncode != 0:
                raise RuntimeError(f"orc {' '.join(args)} failed: {result.stderr[-800:]}")
        return name

    def _traces(self, workspace: str) -> set[Path]:
        root = Path.home() / ".orc" / "workspaces" / workspace / "traces"
        return set(root.rglob("*.json")) if root.exists() else set()

    def _record_cost(self, workspace: str, new_traces: set[Path], detail: str) -> None:
        cost = 0.0
        for path in new_traces:
            text = path.read_text()
            model = (MODEL_RE.findall(text) or [""])[0]
            prices = config.PRICES_PER_MTOK.get(model)
            if prices is None:
                continue
            tokens = {"input": 0, "output": 0}
            for kind, count in TOKENS_RE.findall(text):
                tokens[kind] += int(count)
            cost += tokens["input"] * prices[0] / 1e6 + tokens["output"] * prices[1] / 1e6
        self.ledger.record(
            stage="verify-orc",
            model=config.ORC_VERIFY_MODEL,
            cost_usd=cost,
            detail=f"estimated from {len(new_traces)} traces; {detail}",
        )

    def check_sync(self, item: Item, seat: str, answer_text: str) -> tuple[Flag, ...]:
        key = hashlib.sha256(
            f"{config.ORC_VERIFY_MODEL}|{config.ORC_EXTRACT_MODEL}|{answer_text}".encode()
        ).hexdigest()[:16]
        out_path = self.cache_dir / item.id / f"{seat}-{key}.json"
        if out_path.exists():
            return parse_orc_flags(json.loads(out_path.read_text()))
        self.ledger.check()
        workspace = self._ensure_workspace(item)
        answer_file = out_path.with_suffix(".md")
        answer_file.write_text(answer_text)
        before = self._traces(workspace)
        result = self._orc("verify", "--file", str(answer_file), "-w", workspace, "--json", "-y")
        self._record_cost(workspace, self._traces(workspace) - before, f"{item.id}/{seat}")
        if result.returncode != 0 and "Insufficient credits" in result.stderr:
            raise OutOfCreditsError(f"orc verify: provider out of credits ({item.id}/{seat})")
        if result.returncode != 0:
            raise RuntimeError(f"orc verify failed for {item.id}/{seat}: {result.stderr[-800:]}")
        raw = result.stdout
        payload = json.loads(raw[raw.find("{") :])
        out_path.write_text(json.dumps(payload, indent=1))
        return parse_orc_flags(payload)

    async def check(self, item: Item, seat: str, answer_text: str) -> tuple[Flag, ...]:
        # Calls for one item run in sequence so trace-based cost attribution stays exact.
        lock = self._item_locks.setdefault(item.id, asyncio.Lock())
        async with lock:
            return await asyncio.to_thread(self.check_sync, item, seat, answer_text)
