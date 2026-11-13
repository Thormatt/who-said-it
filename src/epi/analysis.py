"""Analysis: outcome rates with item-clustered bootstrap CIs, paired contrasts between
conditions, and paired permutation tests (labels swapped within matched units)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from epi import config
from epi.items import load_items

N_BOOT = 10_000
SUBTLETY = {
    item.id: item.subtlety
    for split in ("dev", "test")
    for item in load_items(config.ROOT / "items" / split)
}


def load_run(run_dir: Path) -> pd.DataFrame:
    """All grades of one run, joined with the run's design settings."""
    manifest = json.loads((run_dir / "manifest.jsonl").read_text().splitlines()[0])
    rows = [json.loads(line) for line in (run_dir / "grades.jsonl").read_text().splitlines()]
    frame = pd.DataFrame([r for r in rows if "error" not in r])
    frame["panel"] = manifest["panel"]
    frame["n_wrong"] = manifest["n_wrong"]
    frame["evidence_r2"] = manifest["evidence_r2"]
    frame["run"] = run_dir.name
    frame["subtlety"] = frame["item"].map(SUBTLETY)
    frame["adopts"] = frame["label"].isin(["ADOPTS", "MIXED"])
    frame["rejects"] = frame["label"] == "REJECTS"
    return frame


def load_runs(root: Path) -> pd.DataFrame:
    run_dirs = sorted(p.parent for p in root.rglob("grades.jsonl"))
    return pd.concat([load_run(d) for d in run_dirs], ignore_index=True)


def cluster_bootstrap_ci(
    frame: pd.DataFrame, column: str, *, seed: int = 0, n_boot: int = N_BOOT
) -> tuple[float, float, float]:
    """Mean of a 0/1 column with a 95% CI that resamples items, not answers."""
    if frame.empty:
        return float("nan"), float("nan"), float("nan")
    per_item = frame.groupby("item")[column].agg(["sum", "count"])
    sums, counts = per_item["sum"].to_numpy(float), per_item["count"].to_numpy(float)
    rng = np.random.default_rng(seed)
    draws = rng.integers(0, len(per_item), size=(n_boot, len(per_item)))
    boot = sums[draws].sum(axis=1) / counts[draws].sum(axis=1)
    low, high = np.percentile(boot, [2.5, 97.5])
    return float(sums.sum() / counts.sum()), float(low), float(high)


def rate_table(frame: pd.DataFrame, by: list[str], column: str = "adopts") -> pd.DataFrame:
    records = []
    for keys, group in frame.groupby(by):
        mean, low, high = cluster_bootstrap_ci(group, column)
        keys = keys if isinstance(keys, tuple) else (keys,)
        records.append(
            {
                **dict(zip(by, keys, strict=True)),
                "n": len(group),
                "items": group["item"].nunique(),
                column: mean,
                "ci_low": low,
                "ci_high": high,
            }
        )
    return pd.DataFrame(records)


def paired_contrast(
    frame: pd.DataFrame,
    factor: str,
    a: str,
    b: str,
    *,
    column: str = "adopts",
    match: tuple[str, ...] = ("item", "seat", "rep", "verification"),
    seed: int = 0,
) -> dict[str, float]:
    """Difference in `column` between levels a and b of `factor`, matched on `match`.
    CI by item-cluster bootstrap; p by permutation swapping a/b within matched pairs."""
    keyed = (
        frame[frame[factor].isin([a, b])]
        .pivot_table(index=list(match), columns=factor, values=column, aggfunc="mean")
        .dropna()
    )
    diffs = (keyed[a] - keyed[b]).rename("diff").reset_index()
    observed = float(diffs["diff"].mean())
    per_item = diffs.groupby("item")["diff"].agg(["sum", "count"])
    sums, counts = per_item["sum"].to_numpy(float), per_item["count"].to_numpy(float)
    rng = np.random.default_rng(seed)
    draws = rng.integers(0, len(per_item), size=(N_BOOT, len(per_item)))
    boot = sums[draws].sum(axis=1) / counts[draws].sum(axis=1)
    signs = rng.choice([-1.0, 1.0], size=(N_BOOT, len(diffs)))
    null = (signs * diffs["diff"].to_numpy()).mean(axis=1)
    p_value = float((np.abs(null) >= abs(observed) - 1e-12).mean())
    low, high = np.percentile(boot, [2.5, 97.5])
    return {
        "diff": observed,
        "ci_low": float(low),
        "ci_high": float(high),
        "p": p_value,
        "pairs": int(len(diffs)),
        "items": int(len(per_item)),
    }


def holm(p_values: dict[str, float]) -> dict[str, float]:
    ordered = sorted(p_values.items(), key=lambda kv: kv[1])
    adjusted, running = {}, 0.0
    for rank, (name, p) in enumerate(ordered):
        running = max(running, min(1.0, (len(ordered) - rank) * p))
        adjusted[name] = running
    return adjusted


def explore_report(root: Path) -> None:
    frame = load_runs(root)
    r2 = frame[frame["kind"] == "round2"]
    table = rate_table(r2, ["panel", "n_wrong", "evidence_r2", "attribution"])
    with pd.option_context("display.width", 160, "display.max_rows", 200):
        print(table.round(3).to_string(index=False))
        print("\nby subtlety (all conditions pooled):")
        print(
            rate_table(r2, ["panel", "n_wrong", "evidence_r2", "subtlety"])
            .round(3)
            .to_string(index=False)
        )
        print("\nby panelist model:")
        print(r2.groupby(["panel", "seat"])["adopts"].agg(["mean", "count"]).round(3).to_string())


if __name__ == "__main__":
    explore_report(Path(sys.argv[1]) if len(sys.argv) > 1 else config.RESULTS_DIR / "explore")
