"""Experiment stages. Round 1, verification and facilitator syntheses are computed once
per item and shared by every condition; only round 2 and the final synthesis branch.

A RunSpec fixes the panel tier, how many of the five answers each viewer sees are wrong
(n_wrong confederates), and whether round 2 shows the evidence packet."""

from __future__ import annotations

import asyncio
import json
import random
from collections.abc import Awaitable, Iterable
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from epi import config, prompts
from epi.items import Item
from epi.judge import grade
from epi.llm import BudgetExceededError, CallFailedError, LLMClient
from epi.prompts import Flag, SeatAnswer
from epi.verify import OrcRunner, plain_check, plain_check_ev

CONFEDERATE_MODELS = dict(config.CONFEDERATES)


@dataclass(frozen=True)
class RunSpec:
    panel: str = config.DEFAULT_PANEL
    n_wrong: int = 1
    evidence_r2: bool = True
    attributions: tuple[str, ...] = config.ATTRIBUTIONS
    verifications: tuple[str, ...] = config.VERIFICATIONS
    reps: int = 1
    notes: list[str] = field(default_factory=list, compare=False)

    def __post_init__(self) -> None:
        if not 1 <= self.n_wrong <= len(config.CONFEDERATES):
            raise ValueError(f"n_wrong must be 1..{len(config.CONFEDERATES)}")
        if self.n_wrong > 1 and "SYNTH" in self.attributions:
            # The facilitator summarises one shared panel; with several confederates each
            # viewer sees a different subset, so SYNTH is only defined for n_wrong == 1.
            object.__setattr__(
                self, "attributions", tuple(a for a in self.attributions if a != "SYNTH")
            )
            self.notes.append("SYNTH dropped: only defined for n_wrong == 1")

    @property
    def panelists(self) -> tuple[config.Panelist, ...]:
        return config.PANELS[self.panel]

    @property
    def real_seats(self) -> list[str]:
        return [p.seat for p in self.panelists]

    @property
    def confederate_seats(self) -> list[str]:
        return [seat for seat, _ in config.CONFEDERATES[: self.n_wrong]]

    @property
    def all_seats(self) -> list[str]:
        return [*self.real_seats, *self.confederate_seats]

    def model_of(self, seat: str) -> str:
        by_seat = {p.seat: p.model for p in self.panelists}
        return by_seat.get(seat) or CONFEDERATE_MODELS[seat]

    def visible_others(self, item_id: str, viewer: str, rep: int) -> list[str]:
        """The five answers a viewer sees: every confederate plus enough real peers.
        Chosen by item/viewer/rep only, so the same set appears in every condition."""
        real_others = sorted(s for s in self.real_seats if s != viewer)
        n_real = config.VISIBLE_OTHERS - self.n_wrong
        chosen = random.Random(f"{item_id}|{viewer}|{rep}|visible").sample(real_others, n_real)
        return prompts.seat_order(item_id, viewer, rep, [*chosen, *self.confederate_seats])


class RunStore:
    def __init__(self, run_dir: Path) -> None:
        self.dir = run_dir
        self.dir.mkdir(parents=True, exist_ok=True)

    def write(self, name: str, rows: Iterable[dict[str, Any]]) -> Path:
        path = self.dir / f"{name}.jsonl"
        with path.open("w") as handle:
            for row in rows:
                handle.write(json.dumps(row, ensure_ascii=False) + "\n")
        return path


async def _gather_rows(tasks: list[Awaitable[dict[str, Any]]]) -> list[dict[str, Any]]:
    """Run tasks; a failed call becomes an error row, but the budget cap stops everything."""
    results = await asyncio.gather(*tasks, return_exceptions=True)
    rows = []
    for result in results:
        if isinstance(result, BudgetExceededError):
            raise result
        if isinstance(result, BaseException):
            rows.append({"error": f"{type(result).__name__}: {result}"})
        else:
            rows.append(result)
    return rows


# ---------- round 1 ----------


async def _panelist_r1(client: LLMClient, spec: RunSpec, item: Item, seat: str) -> dict[str, Any]:
    model = spec.model_of(seat)
    c = await client.complete(
        model=model,
        messages=prompts.round1_messages(item),
        params=config.PANELIST_PARAMS,
        stage="round1",
    )
    return {"item": item.id, "seat": seat, "model": model, "text": c.text, "cost": c.cost_usd}


async def _confederate_r1(client: LLMClient, item: Item, seat: str) -> dict[str, Any]:
    model = CONFEDERATE_MODELS[seat]
    failures = []
    for attempt in range(config.CONFEDERATE_MAX_ATTEMPTS):
        try:
            c = await client.complete(
                model=model,
                messages=prompts.confederate_messages(item),
                params=config.PANELIST_PARAMS,
                stage="round1-confederate",
                tag=f"attempt{attempt}",
            )
        except CallFailedError as exc:  # e.g. empty reply; budget/credit errors still propagate
            failures.append({"attempt": attempt, "error": str(exc)[:200]})
            continue
        has_planted = bool(item.planted_re().search(c.text))
        has_true = bool(item.true_re().search(c.text))
        if has_planted and not has_true:
            return {
                "item": item.id,
                "seat": seat,
                "model": model,
                "text": c.text,
                "cost": c.cost_usd,
                "attempt": attempt,
            }
        failures.append({"attempt": attempt, "planted": has_planted, "true": has_true})
    raise RuntimeError(f"{seat} never produced a clean planted answer for {item.id}: {failures}")


async def stage_round1(client: LLMClient, spec: RunSpec, items: list[Item]) -> list[dict[str, Any]]:
    tasks: list[Awaitable[dict[str, Any]]] = []
    for item in items:
        tasks += [_panelist_r1(client, spec, item, seat) for seat in spec.real_seats]
        tasks += [_confederate_r1(client, item, seat) for seat in spec.confederate_seats]
    return await _gather_rows(tasks)


def round1_texts(rows: list[dict[str, Any]]) -> dict[str, dict[str, str]]:
    texts: dict[str, dict[str, str]] = {}
    for row in rows:
        if "error" not in row:
            texts.setdefault(row["item"], {})[row["seat"]] = row["text"]
    return texts


def complete_items(
    spec: RunSpec, items: list[Item], texts: dict[str, dict[str, str]]
) -> list[Item]:
    """Items with every round-1 answer. Others are excluded (and reported)."""
    return [i for i in items if set(spec.all_seats) <= set(texts.get(i.id, {}))]


# ---------- verification ----------


async def _verify_one(client, orc, orc_gate, item, verification, seat, text) -> dict[str, Any]:
    if verification == "PLAIN":
        flags = await plain_check(client, item, text)
    elif verification == "PLAIN-EV":
        flags = await plain_check_ev(client, item, text)
    else:  # ORC or ORC-EV; ORC-EV reuses the cached ORC run and adds the cited fact
        async with orc_gate:
            flags = await orc.check(item, seat, text, evidence=verification == "ORC-EV")
    return {
        "item": item.id,
        "verification": verification,
        "seat": seat,
        "flags": [asdict(f) for f in flags],
    }


async def stage_verification(
    client: LLMClient,
    orc: OrcRunner,
    spec: RunSpec,
    items: list[Item],
    texts: dict[str, dict[str, str]],
) -> list[dict[str, Any]]:
    orc_gate = asyncio.Semaphore(4)
    tasks = [
        _verify_one(client, orc, orc_gate, item, verification, seat, texts[item.id][seat])
        for item in items
        for verification in spec.verifications
        if verification != "NONE"
        for seat in spec.all_seats
    ]
    return await _gather_rows(tasks)


def flags_index(rows: list[dict[str, Any]]) -> dict[tuple[str, str, str], tuple[Flag, ...]]:
    return {
        (r["item"], r["verification"], r["seat"]): tuple(Flag(**f) for f in r["flags"])
        for r in rows
        if "error" not in r
    }


def fully_flagged(spec: RunSpec, items: list[Item], flags: dict) -> list[Item]:
    needed = [v for v in spec.verifications if v != "NONE"]
    return [i for i in items if all((i.id, v, s) in flags for v in needed for s in spec.all_seats)]


def seat_answers(
    spec: RunSpec, item: Item, verification: str, texts, flags
) -> dict[str, SeatAnswer]:
    def seat_flags(seat: str) -> tuple[Flag, ...] | None:
        return None if verification == "NONE" else flags[(item.id, verification, seat)]

    return {s: SeatAnswer(s, texts[item.id][s], seat_flags(s)) for s in spec.all_seats}


# ---------- facilitator (SYNTH condition) ----------


async def _facilitate(client, spec, item, verification, answers) -> dict[str, Any]:
    order = sorted(spec.all_seats)
    random.Random(f"{item.id}|facilitator").shuffle(order)
    c = await client.complete(
        model=config.FACILITATOR_MODEL,
        messages=prompts.facilitator_messages(item, [answers[s] for s in order], verification),
        params=config.SUPPORT_PARAMS,
        stage="facilitator",
    )
    return {"item": item.id, "verification": verification, "text": c.text, "order": order}


async def stage_facilitator(client, spec: RunSpec, items, texts, flags) -> list[dict[str, Any]]:
    if "SYNTH" not in spec.attributions:
        return []
    tasks = [
        _facilitate(client, spec, item, v, seat_answers(spec, item, v, texts, flags))
        for item in items
        for v in spec.verifications
    ]
    return await _gather_rows(tasks)


# ---------- round 2 ----------


async def _round2_one(
    client, spec, item, attribution, verification, rep, seat, answers, synthesis
) -> dict[str, Any]:
    labels = prompts.attribution_labels(attribution, spec.panelists, spec.confederate_seats)
    messages = prompts.round2_messages(
        item=item,
        own=answers[seat],
        attribution=attribution,
        verification=verification,
        answers=answers,
        order=spec.visible_others(item.id, seat, rep),
        synthesis=synthesis,
        labels=labels,
        include_evidence=spec.evidence_r2,
    )
    model = spec.model_of(seat)
    c = await client.complete(
        model=model,
        messages=messages,
        params=config.PANELIST_PARAMS,
        stage="round2",
        tag=f"rep{rep}",
    )
    return {
        "item": item.id,
        "attribution": attribution,
        "verification": verification,
        "rep": rep,
        "seat": seat,
        "model": model,
        "text": c.text,
        "cost": c.cost_usd,
    }


async def stage_round2(client, spec: RunSpec, items, texts, flags, syntheses) -> list[dict]:
    synth_text = {(r["item"], r["verification"]): r["text"] for r in syntheses if "error" not in r}
    tasks = []
    for item in items:
        for verification in spec.verifications:
            answers = seat_answers(spec, item, verification, texts, flags)
            for attribution in spec.attributions:
                synthesis = synth_text.get((item.id, verification))
                if attribution == "SYNTH" and synthesis is None:
                    continue
                for rep in range(spec.reps):
                    tasks += [
                        _round2_one(
                            client,
                            spec,
                            item,
                            attribution,
                            verification,
                            rep,
                            seat,
                            answers,
                            synthesis,
                        )
                        for seat in spec.real_seats
                    ]
    return await _gather_rows(tasks)


# ---------- final synthesis ----------


async def _final_one(client, item, key, panel_texts) -> dict[str, Any]:
    attribution, verification, rep = key
    order = sorted(panel_texts)
    random.Random(f"{item.id}|final|{rep}").shuffle(order)
    c = await client.complete(
        model=config.FACILITATOR_MODEL,
        messages=prompts.final_messages(item, [panel_texts[s] for s in order]),
        params=config.SUPPORT_PARAMS,
        stage="final",
        tag=f"rep{rep}",
    )
    return {
        "item": item.id,
        "attribution": attribution,
        "verification": verification,
        "rep": rep,
        "text": c.text,
        "n_panelists": len(order),
    }


async def stage_final(client, spec: RunSpec, items, round2_rows) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str, int], dict[str, str]] = {}
    for r in round2_rows:
        if "error" not in r:
            key = (r["item"], r["attribution"], r["verification"], r["rep"])
            grouped.setdefault(key, {})[r["seat"]] = r["text"]
    by_id = {i.id: i for i in items}
    tasks = [
        _final_one(client, by_id[k[0]], k[1:], texts)
        for k, texts in sorted(grouped.items())
        if len(texts) == len(spec.real_seats)
    ]
    return await _gather_rows(tasks)


# ---------- grading ----------


async def _grade_row(client, item, row, kind, model) -> dict[str, Any]:
    g = await grade(client, item, row["text"], model)
    keep = {k: row[k] for k in ("item", "seat", "attribution", "verification", "rep") if k in row}
    return {**keep, "kind": kind, **asdict(g)}


async def stage_grade(
    client, items, round1_rows, round2_rows, final_rows, model: str = config.JUDGE_MODEL
) -> list[dict[str, Any]]:
    by_id = {i.id: i for i in items}
    tasks = []
    for kind, rows in (("round1", round1_rows), ("round2", round2_rows), ("final", final_rows)):
        tasks += [
            _grade_row(client, by_id[r["item"]], r, kind, model)
            for r in rows
            if "error" not in r and r["item"] in by_id
        ]
    return await _gather_rows(tasks)
