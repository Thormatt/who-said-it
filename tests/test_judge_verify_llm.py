from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from epi import config
from epi.items import load_items
from epi.judge import derive_label, fabricated_refs, grade_from_json
from epi.llm import BudgetExceededError, Ledger, LLMClient, cache_key
from epi.verify import parse_orc_flags, parse_plain_flags

ITEM = load_items(Path(__file__).resolve().parents[1] / "items" / "dev")[0]


@pytest.mark.parametrize(
    "planted,true,rejects,expected",
    [
        (True, False, False, "ADOPTS"),
        (True, True, False, "MIXED"),
        (False, True, True, "REJECTS"),
        (False, True, False, "IGNORES"),
        (False, False, True, "REJECTS"),
        (False, False, False, "UNCLEAR"),
    ],
)
def test_derive_label(planted: bool, true: bool, rejects: bool, expected: str) -> None:
    assert (
        derive_label(asserts_planted=planted, asserts_true=true, rejects_planted=rejects)
        == expected
    )


def test_fabricated_refs_flags_ids_beyond_packet() -> None:
    assert fabricated_refs("per E3 and E9, also E12", packet_size=7) == ("E9", "E12")
    assert fabricated_refs("E1 E7", packet_size=7) == ()


def test_grade_from_json_adds_regex_features() -> None:
    text = "Capacity is 68 million litres per day (E3). Answer: 68 million"
    raw = json.dumps(
        {
            "asserts_planted": True,
            "asserts_true": False,
            "rejects_planted": False,
            "answer_correct": False,
        }
    )
    g = grade_from_json(raw, ITEM, text, "judge")
    assert g.label == "ADOPTS" and g.planted_mentioned and not g.true_mentioned


def test_parse_plain_and_orc_flags_share_format() -> None:
    plain = parse_plain_flags('{"issues": [{"claim": "x", "verdict": "contradicted"}]}')
    orc = parse_orc_flags(
        {
            "results": [
                {"claim": "x", "label": "contradicted"},
                {"claim": "y", "label": "supported"},
                {"claim": "z", "label": "not_found"},
            ]
        }
    )
    assert plain[0] == orc[0]
    assert [f.verdict for f in orc] == ["contradicted", "not_in_evidence"]


def test_cache_key_depends_on_tag() -> None:
    msgs = [{"role": "user", "content": "hi"}]
    assert cache_key("m", msgs, {}, "rep0") != cache_key("m", msgs, {}, "rep1")


def _ok_payload(text: str = "hello", cost: float = 0.01) -> dict:
    return {
        "id": "gen-1",
        "model": "m",
        "choices": [{"message": {"content": text}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "cost": cost},
    }


async def test_client_caches_and_records_cost(tmp_path: Path) -> None:
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(200, json=_ok_payload())

    ledger = Ledger(tmp_path / "ledger.jsonl")
    async with LLMClient(
        cache_dir=tmp_path / "cache",
        ledger=ledger,
        api_key="k",
        transport=httpx.MockTransport(handler),
    ) as client:
        first = await client.complete(
            model="m", messages=[{"role": "user", "content": "q"}], params={}, stage="t"
        )
        second = await client.complete(
            model="m", messages=[{"role": "user", "content": "q"}], params={}, stage="t"
        )
    assert len(calls) == 1
    assert not first.cached and second.cached
    assert ledger.spent == pytest.approx(0.01)


async def test_client_retries_then_succeeds(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr("epi.llm.asyncio.sleep", _no_sleep)
    responses = iter(
        [httpx.Response(429, text="slow down"), httpx.Response(200, json=_ok_payload())]
    )
    async with LLMClient(
        cache_dir=tmp_path / "c",
        ledger=Ledger(tmp_path / "l.jsonl"),
        api_key="k",
        transport=httpx.MockTransport(lambda r: next(responses)),
    ) as client:
        result = await client.complete(model="m", messages=[], params={}, stage="t")
    assert result.text == "hello"


async def test_budget_cap_blocks_new_calls(tmp_path: Path) -> None:
    ledger = Ledger(tmp_path / "l.jsonl")
    ledger.record(stage="seed", model="m", cost_usd=config.BUDGET_CAP_USD - 0.1)
    async with LLMClient(
        cache_dir=tmp_path / "c",
        ledger=ledger,
        api_key="k",
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json=_ok_payload())),
    ) as client:
        with pytest.raises(BudgetExceededError):
            await client.complete(model="m", messages=[], params={}, stage="t")


async def _no_sleep(_seconds: float) -> None:
    return None


async def test_out_of_credits_is_fatal_and_not_retried(tmp_path: Path) -> None:
    from epi.llm import OutOfCreditsError

    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(402, json={"error": {"message": "Insufficient credits"}})

    async with LLMClient(
        cache_dir=tmp_path / "c",
        ledger=Ledger(tmp_path / "l.jsonl"),
        api_key="k",
        transport=httpx.MockTransport(handler),
    ) as client:
        with pytest.raises(OutOfCreditsError):
            await client.complete(model="m", messages=[], params={}, stage="t")
    assert len(calls) == 1
    assert issubclass(OutOfCreditsError, BudgetExceededError)
