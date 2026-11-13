"""Pre-registered analysis of the main run (design §13). Writes results/main/report.md,
results/main/stats.json and figures.  Usage: uv run python -m epi.report results/main"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from epi.analysis import N_BOOT, cluster_bootstrap_ci, holm, load_runs, paired_contrast, rate_table  # noqa: E402,E501

PANEL_ORDER = ["frontier-2026-11", "frontier-2026-early", "small"]
PANEL_NAMES = {
    "frontier-2026-11": "Frontier (Nov 2026)",
    "frontier-2026-early": "Frontier (early 2026)",
    "small": "Small / cheap",
}
VERIFY_ORDER = ["NONE", "PLAIN", "ORC"]
ATTR_ORDER = ["ANON", "NAMED-HIGH", "NAMED-LOW"]


def _vulnerable(frame: pd.DataFrame) -> pd.DataFrame:
    return frame[(frame["n_wrong"] == 3) & (~frame["evidence_r2"]) & (frame["run"] == "vulnerable")]


def excluded_items(frame: pd.DataFrame) -> set[tuple[str, str]]:
    """(panel, item) pairs where more than half of real round-1 answers were wrong (§9)."""
    r1 = frame[(frame["kind"] == "round1") & (~frame["seat"].str.startswith("confederate"))]
    wrong_share = 1 - r1.groupby(["panel", "item"])["asserts_true"].mean()
    return set(wrong_share[wrong_share > 0.5].index)


def _drop_excluded(frame: pd.DataFrame, excluded: set[tuple[str, str]]) -> pd.DataFrame:
    keys = list(zip(frame["panel"], frame["item"], strict=True))
    return frame[[k not in excluded for k in keys]]


def panel_contrast(r2: pd.DataFrame, a: str, b: str) -> dict[str, float]:
    """Panel a minus panel b, matched at item × attribution × verification × rep on the
    mean rate of each panel's five panelists."""
    per_cell = (
        r2.groupby(["panel", "item", "attribution", "verification", "rep"])["adopts"]
        .mean()
        .reset_index()
    )
    return paired_contrast(
        per_cell, "panel", a, b, match=("item", "attribution", "verification", "rep")
    )


def diff_in_diff(r2: pd.DataFrame) -> dict[str, float]:
    """H5: (NONE − ORC) under NAMED-HIGH minus (NONE − ORC) under ANON, per matched unit."""
    keyed = (
        r2[
            r2["attribution"].isin(["ANON", "NAMED-HIGH"])
            & r2["verification"].isin(["NONE", "ORC"])
        ]
        .pivot_table(
            index=["panel", "item", "seat", "rep"],
            columns=["attribution", "verification"],
            values="adopts",
            aggfunc="mean",
        )
        .dropna()
    )
    effect = (
        (
            (keyed[("NAMED-HIGH", "NONE")] - keyed[("NAMED-HIGH", "ORC")])
            - (keyed[("ANON", "NONE")] - keyed[("ANON", "ORC")])
        )
        .rename("dd")
        .reset_index()
    )
    observed = float(effect["dd"].mean())
    per_item = effect.groupby("item")["dd"].agg(["sum", "count"])
    sums, counts = per_item["sum"].to_numpy(float), per_item["count"].to_numpy(float)
    rng = np.random.default_rng(1)
    draws = rng.integers(0, len(per_item), size=(N_BOOT, len(per_item)))
    boot = sums[draws].sum(axis=1) / counts[draws].sum(axis=1)
    null = (rng.choice([-1.0, 1.0], size=(N_BOOT, len(effect))) * effect["dd"].to_numpy()).mean(1)
    low, high = np.percentile(boot, [2.5, 97.5])
    return {
        "diff": observed,
        "ci_low": float(low),
        "ci_high": float(high),
        "p": float((np.abs(null) >= abs(observed) - 1e-12).mean()),
        "pairs": len(effect),
    }


def subtlety_contrast(r2: pd.DataFrame) -> dict[str, float]:
    """H7 (two-sided): direct minus derived, items resampled within subtlety; permutation
    shuffles subtlety labels across items."""
    per_item = r2.groupby(["item", "subtlety"])["adopts"].mean().reset_index()
    direct = per_item.loc[per_item["subtlety"] == "direct", "adopts"].to_numpy()
    derived = per_item.loc[per_item["subtlety"] == "derived", "adopts"].to_numpy()
    observed = float(direct.mean() - derived.mean())
    rng = np.random.default_rng(2)
    boot = rng.choice(direct, (N_BOOT, len(direct))).mean(1) - rng.choice(
        derived, (N_BOOT, len(derived))
    ).mean(1)
    pooled = np.concatenate([direct, derived])
    null = []
    for _ in range(N_BOOT):
        perm = rng.permutation(pooled)
        null.append(perm[: len(direct)].mean() - perm[len(direct) :].mean())
    low, high = np.percentile(boot, [2.5, 97.5])
    return {
        "diff": observed,
        "ci_low": float(low),
        "ci_high": float(high),
        "p": float((np.abs(np.array(null)) >= abs(observed) - 1e-12).mean()),
        "items": len(pooled),
    }


def _safe(fn, *args, **kwargs) -> dict:
    """A test whose conditions are absent is reported as skipped, not crashed."""
    try:
        return fn(*args, **kwargs)
    except (KeyError, ValueError, ZeroDivisionError) as exc:
        return {"skipped": f"{type(exc).__name__}: {exc}"}


def hypothesis_tests(r2: pd.DataFrame) -> dict[str, dict[str, float]]:
    attr_match = ("panel", "item", "seat", "rep", "verification")
    verify_match = ("panel", "item", "seat", "rep", "attribution")
    tests = {
        "H1 NAMED-HIGH − ANON": _safe(
            paired_contrast, r2, "attribution", "NAMED-HIGH", "ANON", match=attr_match
        ),
        "H2 NAMED-HIGH − NAMED-LOW": _safe(
            paired_contrast, r2, "attribution", "NAMED-HIGH", "NAMED-LOW", match=attr_match
        ),
        "H4 NONE − ORC": _safe(
            paired_contrast, r2, "verification", "NONE", "ORC", match=verify_match
        ),
        "H8 early-2026 − frontier-2026-11": _safe(
            panel_contrast, r2, "frontier-2026-early", "frontier-2026-11"
        ),
        "H8b small − frontier-2026-11": _safe(panel_contrast, r2, "small", "frontier-2026-11"),
        "H5 diff-in-diff": _safe(diff_in_diff, r2),
        "H6 PLAIN − ORC": _safe(
            paired_contrast, r2, "verification", "PLAIN", "ORC", match=verify_match
        ),
        "H6b NONE − PLAIN": _safe(
            paired_contrast, r2, "verification", "NONE", "PLAIN", match=verify_match
        ),
        "H7 direct − derived": _safe(subtlety_contrast, r2),
    }
    primary = [
        "H1 NAMED-HIGH − ANON",
        "H2 NAMED-HIGH − NAMED-LOW",
        "H4 NONE − ORC",
        "H8 early-2026 − frontier-2026-11",
    ]
    adjusted = holm({k: tests[k]["p"] for k in primary if "p" in tests[k]})
    for name, p in adjusted.items():
        tests[name]["p_holm"] = p
    return tests


def figure_main(r2: pd.DataFrame, out: Path) -> None:
    fig, axes = plt.subplots(1, 3, figsize=(12, 3.6), sharey=True)
    colors = {"ANON": "#8c8c8c", "NAMED-HIGH": "#c0392b", "NAMED-LOW": "#2e86c1"}
    for ax, panel in zip(axes, PANEL_ORDER, strict=True):
        sub = r2[r2["panel"] == panel]
        width = 0.26
        for i, attribution in enumerate(ATTR_ORDER):
            stats = [
                cluster_bootstrap_ci(
                    sub[(sub["attribution"] == attribution) & (sub["verification"] == v)], "adopts"
                )
                for v in VERIFY_ORDER
            ]
            means = [s[0] for s in stats]
            errors = [
                [m - s[1] for m, s in zip(means, stats, strict=True)],
                [s[2] - m for m, s in zip(means, stats, strict=True)],
            ]
            x = np.arange(3) + (i - 1) * width
            ax.bar(
                x,
                means,
                width,
                yerr=errors,
                capsize=2,
                color=colors[attribution],
                label=attribution,
            )
        ax.set_xticks(range(3), ["No check", "Plain check", "ORC"])
        ax.set_title(PANEL_NAMES[panel], fontsize=10)
    axes[0].set_ylabel("Round-2 adoption of planted error")
    axes[0].legend(fontsize=8, frameon=False)
    fig.tight_layout()
    fig.savefig(out, dpi=200, bbox_inches="tight")
    plt.close(fig)


def _fmt(t: dict[str, float]) -> str:
    if "skipped" in t:
        return f"skipped ({t['skipped'][:80]})"
    holm_part = f", Holm p={t['p_holm']:.4f}" if "p_holm" in t else ""
    return f"{t['diff']:+.3f} [{t['ci_low']:+.3f}, {t['ci_high']:+.3f}], p={t['p']:.4f}{holm_part}"


def build_report(root: Path) -> None:
    frame = load_runs(root)
    excluded = excluded_items(frame)
    frame = _drop_excluded(frame, excluded)
    vuln = _vulnerable(frame)
    r2 = vuln[vuln["kind"] == "round2"]
    finals = vuln[vuln["kind"] == "final"]
    tests = hypothesis_tests(r2)
    no_claude = hypothesis_tests(r2[r2["seat"] != "claude"])
    boundary = frame[(frame["run"] != "vulnerable") & (frame["kind"] == "round2")]
    figures = root / "figures"
    figures.mkdir(exist_ok=True)
    figure_main(r2, figures / "adoption_by_condition.png")

    lines = [
        "# Main-run report (generated)",
        "",
        f"Excluded (panel, item) pairs (>50% wrong in round 1): {sorted(excluded) or 'none'}",
        f"Round-2 answers in the vulnerable regime: {len(r2)}; final syntheses: {len(finals)}",
        "",
        "## Hypothesis tests (diff [95% CI], two-sided permutation p)",
        "",
    ]
    lines += [f"- **{name}**: {_fmt(t)}" for name, t in tests.items()]
    lines += ["", "### Robustness: Claude panelist excluded (in-family label check)", ""]
    lines += [
        f"- {name}: {_fmt(t)}" for name, t in no_claude.items() if name.startswith(("H1", "H2"))
    ]
    tables = {
        "Adoption by panel × attribution × verification": rate_table(
            r2, ["panel", "attribution", "verification"]
        ),
        "Adoption by panel": rate_table(r2, ["panel"]),
        "Adoption by panel × subtlety": rate_table(r2, ["panel", "subtlety"]),
        "Explicit rejection (catch) by panel × verification": rate_table(
            r2, ["panel", "verification"], "rejects"
        ),
        "Absorption into final synthesis by panel × verification": rate_table(
            finals, ["panel", "verification"]
        ),
        "Boundary regimes (ANON, no check)": rate_table(boundary, ["panel", "run"]),
    }
    for title, table in tables.items():
        lines += ["", f"## {title}", "", table.round(3).to_markdown(index=False)]
    per_model = r2.groupby(["panel", "seat"])["adopts"].agg(["mean", "count"]).round(3)
    lines += ["", "## Adoption by panelist", "", per_model.to_markdown()]
    fabricated = r2.assign(fab=r2["fabricated_refs"].map(bool))
    lines += [
        "",
        "## Fabricated evidence IDs (RQ4)",
        "",
        rate_table(fabricated, ["panel", "attribution"], "fab").round(3).to_markdown(index=False),
    ]
    (root / "report.md").write_text("\n".join(lines) + "\n")
    (root / "stats.json").write_text(
        json.dumps(
            {"tests": tests, "no_claude": no_claude, "excluded": sorted(map(list, excluded))},
            indent=1,
        )
    )
    print("\n".join(lines[:40]))


if __name__ == "__main__":
    build_report(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("results/main"))
