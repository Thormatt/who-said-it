# Prior work disclosure

Apart rules: *"Building on existing work is allowed and encouraged, but you must clearly identify what is new work done during the sprint."* Everything below existed before the sprint started (13 Nov 2026, 18:00 CET). All of it is the author's own.

## Pre-existing (not sprint work)

| Item | What | State at sprint start |
|---|---|---|
| **ORC** — github.com/Thormatt/orc (MIT) | Evidence-bound claim verification runtime (CLI + MCP). Used **unmodified in behavior** as the verification intervention, apart from fixes listed below. | Branch `demo/orc-vs-raw` @ `14040a5` (2026-06-17), plus one uncommitted change last edited 2026-07-10 (verdict schema puts reasoning before label). `origin/main` @ `43bc0ec`. |
| **Delphi / Plurality** — `thor_mcp/Delphi`, `delphi-frontend` | Multi-model deliberation engines (consensus, codename, debate). **Not used as code.** The informal observations motivate the hypotheses (see `docs/design.md` §1). | Jan–Oct 2026 |
| **Computed Targets and the Middleman Protocol** (arXiv preprint, 2026) | Prior paper by the author on LLM negotiators and channel effects. Cited as related work. | Submitted Nov 2026 |

## New work done during the sprint

- Everything in this repository: experiment design, item set, deliberation harness, analysis, report.
- Any ORC change made during the sprint is listed here with its commit hash:

| ORC commit | Change | Why |
|---|---|---|
| `9ba3ef0` | Commits the pre-existing 2026-07-10 change unchanged. **Not sprint work**; it only pins the baseline. | Exact pre-sprint baseline |
| `fe61666` | Model precedence: `ORC_*_MODEL` env vars were ignored because the skill manifest pinned `claude-sonnet-4-6` / `claude-haiku-4-5` | Found in the 13 Nov smoke test; needed to run current judge models |
| `1fbe731` | Claude 5.5-generation compatibility: forced `tool_choice` is downgraded to auto + instruction (one re-prompt), and `temperature` is dropped where the model rejects sampling params | Every ORC skill returned 400 on Sonnet 5.5 / Haiku 5.5 |

All ORC sprint work is on branch `sprint/epistemics` in a separate worktree. The author's main checkout and `main` are untouched. **Consequence for the study:** on Sonnet 5.5, ORC verdicts are not sampled at temperature 0, so they are not bit-for-bit replayable. Verdicts are cached once per item and reused across conditions, so every condition sees identical flags.
