# Who Said It?

Attribution, error propagation and evidence-bound verification in multi-LLM deliberation. This is an entry for the Apart Research **AI x Epistemics Research Sprint** (13–15 Nov 2026).

**Question:** when one AI panelist makes a confident, checkable error, does it spread to the others, get caught, or end up absorbed in the final answer? Does that depend on whether panelists can see *who* said it? Does checking claims against evidence between rounds (ORC) stop it?

- Design and pre-registration: [`docs/design.md`](docs/design.md)
- Prior-work disclosure: [`PRIOR_WORK.md`](PRIOR_WORK.md). ORC and the earlier Delphi/Plurality work are pre-existing; this repository is sprint work.

## Layout

```
docs/design.md     hypotheses, conditions, measures, analysis plan (frozen before data)
items/dev/         pilot items (allowed for tuning)
items/test/        evaluation items (frozen, never used for tuning)
src/               harness: rounds, conditions, ORC bridge, judge, budget guard
results/           raw call logs, judged outcomes, analysis outputs
paper/             report (Apart template, ≤ 8 pages)
```

## Licence

Code: MIT (`LICENSE`). Data, reports and figures: CC BY 4.0 (`LICENSE-DATA.md`).
