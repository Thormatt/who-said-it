"""Run the experiment, e.g.
`uv run python -m epi.cli run --split dev --run pilot --panel small --n-wrong 3 --no-evidence`.
Calls are cached, so re-running a stage or sharing round 1 across runs costs nothing."""

from __future__ import annotations

import argparse
import asyncio
import json
from collections import Counter
from dataclasses import asdict
from typing import Any

from epi import config
from epi.items import load_items
from epi.llm import Ledger, LLMClient
from epi.pipeline import (
    RunSpec,
    RunStore,
    complete_items,
    flags_index,
    fully_flagged,
    round1_texts,
    stage_facilitator,
    stage_final,
    stage_grade,
    stage_round1,
    stage_round2,
    stage_verification,
)
from epi.verify import OrcRunner

STAGES = ("round1", "verify", "facilitator", "round2", "final", "grade")


def _report(stage: str, rows: list[dict[str, Any]], ledger: Ledger) -> None:
    errors = [r["error"] for r in rows if "error" in r]
    print(
        f"[{stage}] {len(rows) - len(errors)} ok, {len(errors)} errors; "
        f"total spend ${ledger.spent:.2f}"
    )
    for error in errors[:5]:
        print(f"    ! {error[:300]}")


async def run(spec: RunSpec, split: str, run_name: str, limit: int | None, stop_after: str) -> None:
    items = load_items(config.ROOT / "items" / split)[:limit]
    store = RunStore(config.RESULTS_DIR / run_name)
    manifest = {
        "split": split,
        "items": [i.id for i in items],
        **asdict(spec),
        "panel_models": [p.model for p in spec.panelists],
        "confederates": [spec.model_of(s) for s in spec.confederate_seats],
        "facilitator": config.FACILITATOR_MODEL,
        "judge": config.JUDGE_MODEL,
    }
    store.write("manifest", [manifest])
    for note in spec.notes:
        print(f"note: {note}")
    async with LLMClient() as client:
        ledger = client.ledger
        r1 = await stage_round1(client, spec, items)
        store.write("round1", r1)
        _report("round1", r1, ledger)
        texts = round1_texts(r1)
        usable = complete_items(spec, items, texts)
        if stop_after == "round1":
            return
        vrows = await stage_verification(client, OrcRunner(ledger), spec, usable, texts)
        store.write("flags", vrows)
        _report("verify", vrows, ledger)
        flags = flags_index(vrows)
        usable = fully_flagged(spec, usable, flags)
        excluded = sorted({i.id for i in items} - {i.id for i in usable})
        store.write(
            "exclusions",
            [{"item": i, "reason": "missing round-1 answer or flags"} for i in excluded],
        )
        if excluded:
            print(f"    excluded items: {excluded}")
        if stop_after == "verify":
            return
        syn = await stage_facilitator(client, spec, usable, texts, flags)
        store.write("facilitator", syn)
        _report("facilitator", syn, ledger)
        if stop_after == "facilitator":
            return
        r2 = await stage_round2(client, spec, usable, texts, flags, syn)
        store.write("round2", r2)
        _report("round2", r2, ledger)
        if stop_after == "round2":
            return
        fin = await stage_final(client, spec, usable, r2)
        store.write("final", fin)
        _report("final", fin, ledger)
        if stop_after == "final":
            return
        grades = await stage_grade(client, usable, r1, r2, fin)
        store.write("grades", grades)
        _report("grade", grades, ledger)
        labels = Counter((g["kind"], g["label"]) for g in grades if "error" not in g)
        print(json.dumps({f"{k[0]}:{k[1]}": v for k, v in sorted(labels.items())}, indent=1))


def spend() -> None:
    if not config.LEDGER_PATH.exists():
        print("no spend recorded")
        return
    by_stage: Counter[str] = Counter()
    for line in config.LEDGER_PATH.read_text().splitlines():
        entry = json.loads(line)
        by_stage[entry["stage"]] += entry["cost_usd"]
    for stage, cost in by_stage.most_common():
        print(f"{stage:<22} ${cost:.4f}")
    print(f"{'TOTAL':<22} ${sum(by_stage.values()):.4f} of ${config.BUDGET_CAP_USD:.2f} cap")


def _csv(value: str) -> tuple[str, ...]:
    return tuple(v.strip() for v in value.split(",") if v.strip())


def main() -> None:
    parser = argparse.ArgumentParser(prog="epi")
    sub = parser.add_subparsers(dest="command", required=True)
    run_p = sub.add_parser("run")
    run_p.add_argument("--split", choices=("dev", "test"), required=True)
    run_p.add_argument("--run", required=True, help="results/<run> output directory")
    run_p.add_argument("--panel", choices=sorted(config.PANELS), default=config.DEFAULT_PANEL)
    run_p.add_argument("--n-wrong", type=int, default=1)
    run_p.add_argument("--no-evidence", action="store_true", help="hide the packet in round 2")
    run_p.add_argument("--attributions", type=_csv, default=config.ATTRIBUTIONS)
    run_p.add_argument("--verifications", type=_csv, default=config.VERIFICATIONS)
    run_p.add_argument("--reps", type=int, default=1)
    run_p.add_argument("--limit", type=int, default=None, help="only the first N items")
    run_p.add_argument("--stop-after", choices=STAGES, default="grade")
    sub.add_parser("spend")
    args = parser.parse_args()
    if args.command == "spend":
        spend()
        return
    spec = RunSpec(
        panel=args.panel,
        n_wrong=args.n_wrong,
        evidence_r2=not args.no_evidence,
        attributions=args.attributions,
        verifications=args.verifications,
        reps=args.reps,
    )
    asyncio.run(run(spec, args.split, args.run, args.limit, args.stop_after))


if __name__ == "__main__":
    main()
