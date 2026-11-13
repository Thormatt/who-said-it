from __future__ import annotations

from pathlib import Path

from epi.items import load_items
from epi.llm import CallFailedError, Completion
from epi.pipeline import _confederate_r1

ITEM = load_items(Path(__file__).resolve().parents[1] / "items" / "dev")[0]


class _FlakyClient:
    """First attempt returns empty text (raised as CallFailedError), second is clean."""

    def __init__(self) -> None:
        self.tags: list[str] = []

    async def complete(self, *, model, messages, params, stage, tag=""):
        self.tags.append(tag)
        if tag == "attempt0":
            raise CallFailedError("returned empty text (finish=error)")
        text = f"{ITEM.planted_claim} Answer: {ITEM.planted_value}"
        return Completion(text, model, 0.0, 0, 0, "g", "stop", False)


async def test_confederate_moves_to_next_attempt_after_failed_call() -> None:
    client = _FlakyClient()
    row = await _confederate_r1(client, ITEM, "confederate")
    assert client.tags == ["attempt0", "attempt1"]
    assert row["attempt"] == 1
