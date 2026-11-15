"""Build the results slideshow (single self-contained HTML) from the result files.

Usage: python3 presentation/build.py  ->  presentation/who-said-it.html
Numbers come from video/src/data.json (generated from results/main) and
results/main/followups.json; the few remaining constants cite their source."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "video/src/data.json").read_text())
FOLLOW = json.loads((ROOT / "results/main/followups.json").read_text())

PANELS = ["frontier-2026-11", "frontier-2026-early", "small"]
LABELS = {"frontier-2026-11": "Frontier · Nov 2026",
          "frontier-2026-early": "Previous frontier · 2025–early 2026",
          "small": "Small / cheap"}


def mean(*xs: float) -> float:
    return sum(xs) / len(xs)


ev = FOLLOW["evidence_flags"]["by_panel"]
payload = {
    "labels": [LABELS[p] for p in PANELS],
    "regimes": DATA["regimes"],
    "generation": [g["rate"] for g in DATA["generation"]],
    "attribution": [[a["ANON"], a["NAMED-HIGH"], a["NAMED-LOW"]] for a in DATA["attribution"]],
    "conf": [[FOLLOW["conf_labels"][p]["rates"][k] for k in ("ANON", "CONF-HIGH", "CONF-LOW")]
             for p in PANELS],
    "verify": [[v["NONE"], mean(v["PLAIN"], v["ORC"])] for v in DATA["verification"]],
    "finalsNone": [v["final_none"] for v in DATA["verification"]],
    "evFlags": [[mean(ev[p]["rates"]["PLAIN"]["quote"], ev[p]["rates"]["ORC"]["quote"]),
                 mean(ev[p]["rates"]["PLAIN"]["evidence"], ev[p]["rates"]["ORC"]["evidence"])]
                for p in PANELS],
    # results/main/report.md, "Adoption by panel × subtlety"
    "subtlety": [[0.061, 0.001], [0.130, 0.017], [0.191, 0.083]],
    "secondJudge": FOLLOW["second_judge"],
    "evFinals": FOLLOW["evidence_flags"]["final_absorption_evidence_flags"],
    "checkedFinals": DATA["finals"]["checked_total"],
}

TEMPLATE = (Path(__file__).parent / "template.html").read_text()
html = TEMPLATE.replace("/*__DATA__*/{}", json.dumps(payload, ensure_ascii=False))
out = Path(__file__).parent / "who-said-it.html"
out.write_text(html)
print(f"wrote {out} ({len(html):,} characters)")
