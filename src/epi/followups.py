"""Post-hoc follow-ups (exploratory) and the full second-judge agreement.
Writes results/main/followups.md and followups.json.
Usage: uv run python -m epi.followups results/main"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

from epi.analysis import load_runs, paired_contrast, rate_table
from epi.judge_validation import cohen_kappa
from epi.report import PANEL_ORDER, _drop_excluded, excluded_items

KEY = ("kind", "item", "attribution", "verification", "rep", "seat")


def conf_labels(r2: pd.DataFrame) -> dict:
    """CONF-* (only confederates named) against the main run's ANON and NAMED-* (no check)."""
    base = r2[(r2["run"] == "vulnerable") & (r2["verification"] == "NONE")]
    frame = pd.concat([base, r2[r2["run"] == "conf-labels"]])
    out = {}
    for panel in PANEL_ORDER:
        p = frame[frame["panel"] == panel]
        rates = p.groupby("attribution")["adopts"].mean().round(4).to_dict()
        tests = {
            f"{a} − {b}": paired_contrast(p, "attribution", a, b, match=("item", "seat", "rep"))
            for a, b in [
                ("CONF-HIGH", "ANON"),
                ("ANON", "CONF-LOW"),
                ("NAMED-HIGH", "CONF-HIGH"),
                ("NAMED-LOW", "CONF-LOW"),
            ]
        }
        out[panel] = {"rates": rates, "tests": tests}
    return out


def evidence_flags(r2: pd.DataFrame, finals: pd.DataFrame) -> dict:
    """*-EV flags against the main run's quote-style flags, matched on everything else."""
    main = r2[(r2["run"] == "vulnerable") & r2["verification"].isin(["PLAIN", "ORC"])]
    ev = r2[r2["run"] == "evidence-flags"].copy()
    ev["verification"] = ev["verification"].str.replace("-EV", "", regex=False)
    main = main.assign(flag_style="quote")
    ev = ev.assign(flag_style="evidence")
    frame = pd.concat([main, ev])
    out = {
        "by_panel": {},
        "pooled": paired_contrast(
            frame,
            "flag_style",
            "quote",
            "evidence",
            match=("panel", "item", "seat", "rep", "attribution", "verification"),
        ),
    }
    for panel in PANEL_ORDER:
        p = frame[frame["panel"] == panel]
        out["by_panel"][panel] = {
            "rates": p.groupby(["flag_style", "verification"])["adopts"]
            .mean()
            .round(4)
            .unstack()
            .to_dict(),
            "quote − evidence": paired_contrast(
                p,
                "flag_style",
                "quote",
                "evidence",
                match=("item", "seat", "rep", "attribution", "verification"),
            ),
        }
    ev_finals = finals[finals["run"] == "evidence-flags"]
    out["final_absorption_evidence_flags"] = {
        "n": int(len(ev_finals)),
        "adopted": int(ev_finals["adopts"].sum()),
    }
    return out


def second_judge(root: Path) -> dict:
    """Spread agreement of the second judge with the primary judge over every answer."""
    pairs = []
    for check_path in root.rglob("grades_check.jsonl"):
        primary = {}
        for line in (check_path.parent / "grades.jsonl").read_text().splitlines():
            g = json.loads(line)
            if "error" not in g and g["kind"] != "round1":
                primary[tuple(g.get(k) for k in KEY)] = g["label"]
        for line in check_path.read_text().splitlines():
            c = json.loads(line)
            label = primary.get(tuple(c.get(k) for k in KEY))
            if "error" not in c and label is not None:
                pairs.append(
                    (str(label in ("ADOPTS", "MIXED")), str(c["label"] in ("ADOPTS", "MIXED")))
                )
    a, b = zip(*pairs, strict=True)
    return {
        "n": len(pairs),
        "agreement": sum(x == y for x, y in pairs) / len(pairs),
        "kappa": cohen_kappa(list(a), list(b)),
    }


def _fmt(t: dict) -> str:
    return (
        f"{t['diff'] * 100:+.1f} pts [{t['ci_low'] * 100:+.1f}, {t['ci_high'] * 100:+.1f}], "
        f"p={t['p']:.4f}"
    )


def build(root: Path) -> dict:
    frame = load_runs(root)
    frame = _drop_excluded(frame, excluded_items(frame))
    r2, finals = frame[frame["kind"] == "round2"], frame[frame["kind"] == "final"]
    result = {
        "conf_labels": conf_labels(r2),
        "evidence_flags": evidence_flags(r2, finals),
        "second_judge": second_judge(root),
    }
    lines = ["# Post-hoc follow-ups (exploratory)", "", "## Confederate-only labels", ""]
    for panel, d in result["conf_labels"].items():
        lines.append(f"**{panel}** rates: {d['rates']}")
        lines += [f"- {name}: {_fmt(t)}" for name, t in d["tests"].items()]
        lines.append("")
    ev = result["evidence_flags"]
    lines += ["## Evidence-stating flags", "", f"- pooled quote − evidence: {_fmt(ev['pooled'])}"]
    for panel, d in ev["by_panel"].items():
        lines.append(f"- {panel}: {_fmt(d['quote − evidence'])}; rates {d['rates']}")
    lines += [
        f"- final answers with the error under evidence flags: "
        f"{ev['final_absorption_evidence_flags']}",
        "",
        "## Second judge (GPT-6 Luna Pro) vs primary judge, spread",
        "",
        f"- {result['second_judge']}",
        "",
        "## Spread by run and attribution",
        "",
        rate_table(
            r2[r2["run"].isin(["conf-labels", "evidence-flags"])],
            ["panel", "run", "attribution", "verification"],
        )
        .round(3)
        .to_markdown(index=False),
    ]
    (root / "followups.md").write_text("\n".join(lines) + "\n")
    (root / "followups.json").write_text(json.dumps(result, indent=1))
    print("\n".join(lines[:40]))
    return result


if __name__ == "__main__":
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("results/main"))
