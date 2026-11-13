"""Evaluation items: a fictional evidence packet, a question, and one planted error.

Validate with `uv run python -m epi.items validate items/`.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, Field, field_validator, model_validator

Subtlety = Literal["direct", "derived"]
Split = Literal["dev", "test"]
EVIDENCE_ID = re.compile(r"^E\d+$")


class Fact(BaseModel):
    id: str
    text: str

    @field_validator("id")
    @classmethod
    def _id_shape(cls, value: str) -> str:
        if not EVIDENCE_ID.match(value):
            raise ValueError(f"fact id must look like E1, E2, ...: {value!r}")
        return value


class Item(BaseModel):
    id: str
    split: Split
    domain: str
    subtlety: Subtlety
    entity: str
    packet: list[Fact] = Field(min_length=6, max_length=10)
    question: str
    gold_answer: str
    target_facts: list[str] = Field(min_length=1)
    true_value: str
    planted_value: str
    planted_claim: str
    true_pattern: str
    planted_pattern: str

    @model_validator(mode="after")
    def _consistent(self) -> Item:
        problems = item_problems(self)
        if problems:
            raise ValueError(f"{self.id}: " + "; ".join(problems))
        return self

    @property
    def packet_size(self) -> int:
        return len(self.packet)

    def packet_text(self) -> str:
        return "\n".join(f"{fact.id}. {fact.text}" for fact in self.packet)

    def planted_re(self) -> re.Pattern[str]:
        return re.compile(self.planted_pattern, re.IGNORECASE)

    def true_re(self) -> re.Pattern[str]:
        return re.compile(self.true_pattern, re.IGNORECASE)


def item_problems(item: Item) -> list[str]:
    """Checks that make an item usable. Empty list means valid."""
    problems: list[str] = []
    ids = [fact.id for fact in item.packet]
    expected_ids = [f"E{i}" for i in range(1, len(ids) + 1)]
    if ids != expected_ids:
        problems.append(f"fact ids must be E1..E{len(ids)} in order, got {ids}")
    unknown_targets = sorted(set(item.target_facts) - set(ids))
    if unknown_targets:
        problems.append(f"target_facts not in packet: {unknown_targets}")
    try:
        planted = re.compile(item.planted_pattern, re.IGNORECASE)
        true = re.compile(item.true_pattern, re.IGNORECASE)
    except re.error as exc:
        return [*problems, f"bad regex: {exc}"]
    if not planted.search(item.planted_value):
        problems.append("planted_pattern does not match planted_value")
    if not planted.search(item.planted_claim):
        problems.append("planted_pattern does not match planted_claim")
    if planted.search(item.packet_text()):
        problems.append("planted_pattern matches the packet (planted token must be unique)")
    if planted.search(item.gold_answer):
        problems.append("planted_pattern matches gold_answer")
    if not true.search(item.true_value):
        problems.append("true_pattern does not match true_value")
    if not true.search(item.gold_answer):
        problems.append("true_pattern does not match gold_answer")
    if true.search(item.planted_claim):
        problems.append("planted_claim also states the true value")
    if item.subtlety == "direct" and not true.search(item.packet_text()):
        problems.append("direct item: true value must be stated in the packet")
    if item.subtlety == "derived" and true.search(item.packet_text()):
        problems.append("derived item: true value must NOT be stated verbatim in the packet")
    return problems


def load_item(path: Path) -> Item:
    return Item.model_validate(yaml.safe_load(path.read_text()))


def load_items(directory: Path) -> list[Item]:
    items = [load_item(path) for path in sorted(directory.glob("*.yaml"))]
    duplicate_ids = {i.id for i in items if [j.id for j in items].count(i.id) > 1}
    if duplicate_ids:
        raise ValueError(f"duplicate item ids: {sorted(duplicate_ids)}")
    return items


def _validate_cli(root: Path) -> int:
    failures = 0
    for path in sorted(root.rglob("*.yaml")):
        try:
            item = load_item(path)
        except Exception as exc:  # report every broken file, not just the first
            failures += 1
            print(f"FAIL {path}: {exc}")
            continue
        print(f"ok   {path}  [{item.split}/{item.domain}/{item.subtlety}]")
    print(f"\n{failures} invalid item file(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "validate":
        raise SystemExit(_validate_cli(Path(sys.argv[2])))
    raise SystemExit("usage: python -m epi.items validate <dir>")
