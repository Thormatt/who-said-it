"""Second, independent judge (a different lab's model) over every round-2 and final answer.
Writes grades_check.jsonl next to each run's grades.jsonl and prints agreement.

  uv run python -m epi.crosscheck results/main
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

from epi import config
from epi.items import load_items
from epi.judge_validation import cohen_kappa
from epi.llm import LLMClient
from epi.pipeline import RunStore, stage_grade

ITEMS = [i for split in ("dev", "test") for i in load_items(config.ROOT / "items" / split)]
KEY_FIELDS = ("kind", "item", "attribution", "verification", "rep", "seat")


def _rows(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [r for r in map(json.loads, path.read_text().splitlines()) if "error" not in r]


def _key(row: dict) -> tuple:
    return tuple(row.get(f) for f in KEY_FIELDS)


async def crosscheck(root: Path, model: str = config.CHECK_JUDGE_MODEL) -> None:
    async with LLMClient() as client:
        for grades_path in sorted(root.rglob("grades.jsonl")):
            run_dir = grades_path.parent
            check = await stage_grade(
                client,
                ITEMS,
                [],
                _rows(run_dir / "round2.jsonl"),
                _rows(run_dir / "final.jsonl"),
                model=model,
            )
            RunStore(run_dir).write("grades_check", check)
            primary = {_key(g): g for g in _rows(grades_path) if g["kind"] != "round1"}
            pairs = [
                (primary[_key(c)], c) for c in check if "error" not in c and _key(c) in primary
            ]
            spread = [
                (str(p["label"] in ("ADOPTS", "MIXED")), str(c["label"] in ("ADOPTS", "MIXED")))
                for p, c in pairs
            ]
            agreement = sum(a == b for a, b in spread) / max(1, len(spread))
            kappa = cohen_kappa(*map(list, zip(*spread, strict=True))) if spread else float("nan")
            errors = sum("error" in c for c in check)
            print(
                f"{run_dir.relative_to(root)}: n={len(pairs)} spread agreement "
                f"{agreement:.3f} kappa {kappa:.3f}; errors {errors}; "
                f"spend ${client.ledger.spent:.2f}"
            )


if __name__ == "__main__":
    asyncio.run(crosscheck(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("results/main")))
