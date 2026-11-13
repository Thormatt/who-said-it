"""Judge validation by assistant pre-labels reviewed by the author.

  prepare <root> <n>  stratified sample -> key.json (with judge grades) and blind.md
                      (texts only, for the assistant to label without seeing grades)
  page <root>         needs assistant_labels.json -> review.html for the author
  score <root> <reviewed.json>   agreement of each rater with the author-reviewed labels

Files live in <root>/judge_validation/.
"""

from __future__ import annotations

import html
import json
import sys
from pathlib import Path

from epi.judge import derive_label
from epi.judge_validation import FIELDS, ITEMS, _graded_rows, cohen_kappa, stratified_sample

RATERS = ("assistant", "judge", "check_judge")


def _dir(root: Path) -> Path:
    path = root / "judge_validation"
    path.mkdir(exist_ok=True)
    return path


def _check_grades(root: Path) -> dict[tuple, dict]:
    grades = {}
    for path in root.rglob("grades_check.jsonl"):
        run = str(path.parent.relative_to(root))
        for line in path.read_text().splitlines():
            g = json.loads(line)
            if "error" not in g:
                key = (
                    run,
                    g["kind"],
                    g["item"],
                    g["attribution"],
                    g["verification"],
                    g["rep"],
                    g.get("seat"),
                )
                grades[key] = g
    return grades


def prepare(root: Path, n: int) -> None:
    sample = stratified_sample(_graded_rows(root), n)
    checks = _check_grades(root)
    for row in sample:
        key = (
            row["run"],
            row["kind"],
            row["item"],
            row["attribution"],
            row["verification"],
            row["rep"],
            row.get("seat"),
        )
        check = checks.get(key)
        row["check_judge"] = {f: check[f] for f in FIELDS} if check else None
    out = _dir(root)
    (out / "key.json").write_text(json.dumps(sample, indent=1, ensure_ascii=False))
    blocks = []
    for uid, row in enumerate(sample):
        item = ITEMS[row["item"]]
        blocks.append(
            f"## {uid}\nQuestion: {item.question}\nCorrect value: {item.true_value} | "
            f"Planted wrong value: {item.planted_value}\n\n{row['text'].strip()}\n"
        )
    (out / "blind.md").write_text("\n".join(blocks))
    print(f"{len(sample)} answers -> {out / 'blind.md'}")


def _labels(row: dict, assistant: dict) -> dict[str, dict | None]:
    return {
        "assistant": assistant,
        "judge": {f: row[f] for f in FIELDS},
        "check_judge": row.get("check_judge"),
    }


def _disagrees(labels: dict[str, dict | None]) -> bool:
    present = [v for v in labels.values() if v]
    return any(present[0][f] != other[f] for other in present[1:] for f in FIELDS)


def _cell(value: bool | None) -> str:
    if value is None:
        return "<td>–</td>"
    return f'<td class="{"y" if value else "n"}">{"yes" if value else "no"}</td>'


def page(root: Path) -> Path:
    out = _dir(root)
    key = json.loads((out / "key.json").read_text())
    assistant = json.loads((out / "assistant_labels.json").read_text())
    cards = []
    for uid, row in enumerate(key):
        labels = _labels(row, assistant[str(uid)])
        item = ITEMS[row["item"]]
        rows_html = ""
        for field in FIELDS:
            values = [labels[r][field] if labels[r] else None for r in RATERS]
            radios = "".join(
                f'<label><input type="radio" name="{uid}-{field}" value="{v}"'
                f"{' checked' if labels['assistant'][field] == (v == '1') else ''}> "
                f"{'yes' if v == '1' else 'no'}</label>"
                for v in ("1", "0")
            )
            rows_html += (
                f"<tr><td><code>{field}</code></td>"
                + "".join(_cell(v) for v in values)
                + f"<td>{radios}</td></tr>"
            )
        flag = "disagree" if _disagrees(labels) else "agree"
        cards.append(
            (
                flag != "disagree",
                uid,
                (
                    f'<section class="card {flag}" data-uid="{uid}"><h2>#{uid + 1} '
                    f'<span class="tag">{"raters disagree" if flag == "disagree" else "all agree"}</span>'
                    f"</h2><p><b>Q:</b> {html.escape(item.question)}<br><b>Correct:</b> "
                    f"{html.escape(item.true_value)} &nbsp; <b>Planted wrong:</b> "
                    f"{html.escape(item.planted_value)}</p><pre>{html.escape(row['text'].strip())}</pre>"
                    "<table><tr><th></th><th>Claude</th><th>Judge</th><th>Check judge</th>"
                    f"<th>Your verdict</th></tr>{rows_html}</table></section>"
                ),
            )
        )
    body = "".join(card for _, _, card in sorted(cards))
    doc = (
        REVIEW_PAGE.replace("{{N}}", str(len(key)))
        .replace("{{CARDS}}", body)
        .replace("{{FIELDS}}", json.dumps(list(FIELDS)))
    )
    path = out / "review.html"
    path.write_text(doc)
    return path


REVIEW_PAGE = """<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Label review</title>
<style>body{font:15px/1.5 system-ui;max-width:900px;margin:0 auto;padding:16px;background:#fafafa}
.card{background:#fff;border:1px solid #ddd;border-radius:8px;padding:12px 16px;margin:14px 0}
.card.disagree{border-left:5px solid #c0392b}.tag{font-size:12px;color:#666;font-weight:normal}
pre{white-space:pre-wrap;background:#f3f3f3;padding:10px;border-radius:6px}
table{border-collapse:collapse}td,th{padding:3px 10px;text-align:left}.y{color:#1e7e34}.n{color:#999}
button{font-size:16px;padding:8px 16px;position:sticky;bottom:12px}</style></head><body>
<h1>Review {{N}} labels</h1><p>Disagreements come first. "Your verdict" is pre-filled with
Claude's label: change it where you disagree. <b>asserts_planted</b> = presents the wrong value as
correct; <b>asserts_true</b> = presents the correct value as correct; <b>rejects_planted</b> =
explicitly calls the wrong value/claim incorrect; <b>answer_correct</b> = final answer matches
the correct value with no wrong value.</p>{{CARDS}}
<button onclick="save()">Download reviewed labels</button><script>
function save(){const out={};document.querySelectorAll('.card').forEach(c=>{const u=c.dataset.uid;
out[u]={};{{FIELDS}}.forEach(f=>{const s=c.querySelector(`input[name="${u}-${f}"]:checked`);
out[u][f]=s?s.value==="1":null;});});const a=document.createElement('a');
a.href=URL.createObjectURL(new Blob([JSON.stringify(out)],{type:'application/json'}));
a.download='reviewed_labels.json';a.click();}</script></body></html>"""


def _adopts(labels: dict) -> str:
    label = derive_label(
        asserts_planted=labels["asserts_planted"],
        asserts_true=labels["asserts_true"],
        rejects_planted=labels["rejects_planted"],
    )
    return str(label in ("ADOPTS", "MIXED"))


def score(root: Path, reviewed_path: Path) -> dict:
    out = _dir(root)
    key = json.loads((out / "key.json").read_text())
    assistant = json.loads((out / "assistant_labels.json").read_text())
    reviewed = json.loads(reviewed_path.read_text())
    report: dict = {"n": len(reviewed)}
    corrections = sum(reviewed[u][f] != assistant[u][f] for u in reviewed for f in FIELDS)
    report["author_corrections_of_assistant_fields"] = corrections
    for rater in RATERS:
        pairs = [(_labels(key[int(u)], assistant[u])[rater], reviewed[u]) for u in reviewed]
        pairs = [(r, h) for r, h in pairs if r]
        if not pairs:
            continue
        stats = {"n": len(pairs)}
        for field in FIELDS:
            a = [str(r[field]) for r, _ in pairs]
            b = [str(h[field]) for _, h in pairs]
            stats[f"{field}_agreement"] = round(
                sum(x == y for x, y in zip(a, b, strict=True)) / len(pairs), 3
            )
            stats[f"{field}_kappa"] = round(cohen_kappa(a, b), 3)
        a = [_adopts(r) for r, _ in pairs]
        b = [_adopts(h) for _, h in pairs]
        stats["spread_agreement"] = round(
            sum(x == y for x, y in zip(a, b, strict=True)) / len(pairs), 3
        )
        stats["spread_kappa"] = round(cohen_kappa(a, b), 3)
        report[rater] = stats
    (out / "agreement.json").write_text(json.dumps(report, indent=1))
    return report


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "prepare" and len(sys.argv) == 4:
        prepare(Path(sys.argv[2]), int(sys.argv[3]))
    elif command == "page" and len(sys.argv) == 3:
        print(page(Path(sys.argv[2])))
    elif command == "score" and len(sys.argv) == 4:
        print(json.dumps(score(Path(sys.argv[2]), Path(sys.argv[3])), indent=1))
    else:
        raise SystemExit(__doc__)
