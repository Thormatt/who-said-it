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
| _(pending)_ | Model precedence: `ORC_VERIFY_MODEL` / `ORC_EXTRACT_MODEL` are ignored because the skill manifest pins `claude-sonnet-4-6` / `claude-haiku-4-5` | Found in the 13 Nov smoke test; needed to run current judge models |
