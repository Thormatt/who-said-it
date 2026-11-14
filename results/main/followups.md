# Post-hoc follow-ups (exploratory)

## Confederate-only labels

**frontier-2026-11** rates: {'ANON': 0.1083, 'CONF-HIGH': 0.1667, 'CONF-LOW': 0.0125, 'NAMED-HIGH': 0.1583, 'NAMED-LOW': 0.0042}
- CONF-HIGH − ANON: +5.8 pts [+2.1, +10.0], p=0.0041
- ANON − CONF-LOW: +9.6 pts [+5.0, +15.0], p=0.0000
- NAMED-HIGH − CONF-HIGH: -0.8 pts [-5.4, +3.8], p=0.8705
- NAMED-LOW − CONF-LOW: -0.8 pts [-2.5, +0.8], p=0.6268

**frontier-2026-early** rates: {'ANON': 0.2882, 'CONF-HIGH': 0.3375, 'CONF-LOW': 0.0875, 'NAMED-HIGH': 0.287, 'NAMED-LOW': 0.0261}
- CONF-HIGH − ANON: +6.6 pts [+1.3, +12.2], p=0.0133
- ANON − CONF-LOW: +19.7 pts [+10.9, +28.7], p=0.0000
- NAMED-HIGH − CONF-HIGH: -6.5 pts [-10.4, -2.6], p=0.0139
- NAMED-LOW − CONF-LOW: -6.5 pts [-10.4, -3.0], p=0.0005

**small** rates: {'ANON': 0.2913, 'CONF-HIGH': 0.413, 'CONF-LOW': 0.2739, 'NAMED-HIGH': 0.4105, 'NAMED-LOW': 0.2325}
- CONF-HIGH − ANON: +12.2 pts [+4.8, +20.0], p=0.0002
- ANON − CONF-LOW: +1.7 pts [-5.2, +9.1], p=0.6693
- NAMED-HIGH − CONF-HIGH: -0.4 pts [-6.1, +5.2], p=1.0000
- NAMED-LOW − CONF-LOW: -3.9 pts [-10.6, +3.1], p=0.2513

## Evidence-stating flags

- pooled quote − evidence: +1.9 pts [+1.0, +2.9], p=0.0000
- frontier-2026-11: +0.1 pts [+0.0, +0.3], p=0.4911; rates {'ORC': {'evidence': 0.0, 'quote': 0.0014}, 'PLAIN': {'evidence': 0.0, 'quote': 0.0014}}
- frontier-2026-early: +1.2 pts [+0.4, +2.3], p=0.0003; rates {'ORC': {'evidence': 0.0, 'quote': 0.0131}, 'PLAIN': {'evidence': 0.0028, 'quote': 0.0145}}
- small: +4.5 pts [+2.1, +7.1], p=0.0000; rates {'ORC': {'evidence': 0.0087, 'quote': 0.058}, 'PLAIN': {'evidence': 0.0087, 'quote': 0.0493}}
- final answers with the error under evidence flags: {'n': 851, 'adopted': 0}

## Second judge (GPT-6 Luna Pro) vs primary judge, spread

- {'n': 15848, 'agreement': 0.9969081272084805, 'kappa': 0.9740801073655896}

## Spread by run and attribution

| panel               | run            | attribution   | verification   |   n |   items |   adopts |   ci_low |   ci_high |
|:--------------------|:---------------|:--------------|:---------------|----:|--------:|---------:|---------:|----------:|
| frontier-2026-11    | conf-labels    | CONF-HIGH     | NONE           | 240 |      24 |    0.167 |    0.096 |     0.242 |
| frontier-2026-11    | conf-labels    | CONF-LOW      | NONE           | 240 |      24 |    0.012 |    0     |     0.025 |
| frontier-2026-11    | evidence-flags | ANON          | ORC-EV         | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | evidence-flags | ANON          | PLAIN-EV       | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | evidence-flags | NAMED-HIGH    | ORC-EV         | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | evidence-flags | NAMED-HIGH    | PLAIN-EV       | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | evidence-flags | NAMED-LOW     | ORC-EV         | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | evidence-flags | NAMED-LOW     | PLAIN-EV       | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-early | conf-labels    | CONF-HIGH     | NONE           | 240 |      24 |    0.338 |    0.2   |     0.475 |
| frontier-2026-early | conf-labels    | CONF-LOW      | NONE           | 240 |      24 |    0.088 |    0.042 |     0.138 |
| frontier-2026-early | evidence-flags | ANON          | ORC-EV         | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-early | evidence-flags | ANON          | PLAIN-EV       | 240 |      24 |    0.004 |    0     |     0.012 |
| frontier-2026-early | evidence-flags | NAMED-HIGH    | ORC-EV         | 239 |      24 |    0     |    0     |     0     |
| frontier-2026-early | evidence-flags | NAMED-HIGH    | PLAIN-EV       | 240 |      24 |    0.004 |    0     |     0.012 |
| frontier-2026-early | evidence-flags | NAMED-LOW     | ORC-EV         | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-early | evidence-flags | NAMED-LOW     | PLAIN-EV       | 240 |      24 |    0     |    0     |     0     |
| small               | conf-labels    | CONF-HIGH     | NONE           | 230 |      23 |    0.413 |    0.278 |     0.548 |
| small               | conf-labels    | CONF-LOW      | NONE           | 230 |      23 |    0.274 |    0.174 |     0.383 |
| small               | evidence-flags | ANON          | ORC-EV         | 230 |      23 |    0.009 |    0     |     0.022 |
| small               | evidence-flags | ANON          | PLAIN-EV       | 230 |      23 |    0.009 |    0     |     0.026 |
| small               | evidence-flags | NAMED-HIGH    | ORC-EV         | 230 |      23 |    0.013 |    0     |     0.035 |
| small               | evidence-flags | NAMED-HIGH    | PLAIN-EV       | 230 |      23 |    0.009 |    0     |     0.022 |
| small               | evidence-flags | NAMED-LOW     | ORC-EV         | 230 |      23 |    0.004 |    0     |     0.013 |
| small               | evidence-flags | NAMED-LOW     | PLAIN-EV       | 230 |      23 |    0.009 |    0     |     0.022 |
