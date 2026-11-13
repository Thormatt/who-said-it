# Main-run report (generated)

Excluded (panel, item) pairs (>50% wrong in round 1): [('small', 'test-04')]
Round-2 answers in the vulnerable regime: 6288; final syntheses: 1248

## Hypothesis tests (diff [95% CI], two-sided permutation p)

- **H1 NAMED-HIGH − ANON**: +0.029 [+0.013, +0.047], p=0.0000, Holm p=0.0000
- **H2 NAMED-HIGH − NAMED-LOW**: +0.071 [+0.043, +0.099], p=0.0000, Holm p=0.0000
- **H4 NONE − ORC**: +0.176 [+0.095, +0.253], p=0.0000, Holm p=0.0000
- **H8 early-2026 − frontier-2026-11**: +0.043 [+0.029, +0.058], p=0.0000, Holm p=0.0000
- **H8b small − frontier-2026-11**: +0.107 [+0.081, +0.133], p=0.0000
- **H5 diff-in-diff**: +0.037 [-0.006, +0.082], p=0.0459
- **H6 PLAIN − ORC**: -0.002 [-0.015, +0.008], p=0.6403
- **H6b NONE − PLAIN**: +0.177 [+0.100, +0.252], p=0.0000
- **H7 direct − derived**: +0.096 [+0.080, +0.112], p=0.0000

### Robustness: Claude panelist excluded (in-family label check)

- H1 NAMED-HIGH − ANON: +0.032 [+0.014, +0.051], p=0.0000, Holm p=0.0000
- H2 NAMED-HIGH − NAMED-LOW: +0.070 [+0.042, +0.099], p=0.0000, Holm p=0.0000

## Adoption by panel × attribution × verification

| panel               | attribution   | verification   |   n |   items |   adopts |   ci_low |   ci_high |
|:--------------------|:--------------|:---------------|----:|--------:|---------:|---------:|----------:|
| frontier-2026-11    | ANON          | NONE           | 240 |      24 |    0.108 |    0.054 |     0.171 |
| frontier-2026-11    | ANON          | ORC            | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | ANON          | PLAIN          | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | NAMED-HIGH    | NONE           | 240 |      24 |    0.158 |    0.083 |     0.246 |
| frontier-2026-11    | NAMED-HIGH    | ORC            | 240 |      24 |    0.004 |    0     |     0.012 |
| frontier-2026-11    | NAMED-HIGH    | PLAIN          | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | NAMED-LOW     | NONE           | 240 |      24 |    0.004 |    0     |     0.012 |
| frontier-2026-11    | NAMED-LOW     | ORC            | 240 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | NAMED-LOW     | PLAIN          | 240 |      24 |    0.004 |    0     |     0.012 |
| frontier-2026-early | ANON          | NONE           | 229 |      23 |    0.288 |    0.17  |     0.409 |
| frontier-2026-early | ANON          | ORC            | 230 |      23 |    0.009 |    0     |     0.022 |
| frontier-2026-early | ANON          | PLAIN          | 229 |      23 |    0.013 |    0     |     0.035 |
| frontier-2026-early | NAMED-HIGH    | NONE           | 230 |      23 |    0.287 |    0.165 |     0.409 |
| frontier-2026-early | NAMED-HIGH    | ORC            | 227 |      23 |    0.022 |    0.004 |     0.044 |
| frontier-2026-early | NAMED-HIGH    | PLAIN          | 229 |      23 |    0.017 |    0.004 |     0.035 |
| frontier-2026-early | NAMED-LOW     | NONE           | 230 |      23 |    0.026 |    0.009 |     0.048 |
| frontier-2026-early | NAMED-LOW     | ORC            | 228 |      23 |    0.009 |    0     |     0.022 |
| frontier-2026-early | NAMED-LOW     | PLAIN          | 230 |      23 |    0.013 |    0     |     0.035 |
| small               | ANON          | NONE           | 230 |      23 |    0.291 |    0.187 |     0.404 |
| small               | ANON          | ORC            | 230 |      23 |    0.039 |    0.013 |     0.07  |
| small               | ANON          | PLAIN          | 230 |      23 |    0.026 |    0.009 |     0.048 |
| small               | NAMED-HIGH    | NONE           | 229 |      23 |    0.41  |    0.272 |     0.55  |
| small               | NAMED-HIGH    | ORC            | 230 |      23 |    0.078 |    0.039 |     0.117 |
| small               | NAMED-HIGH    | PLAIN          | 229 |      23 |    0.066 |    0.035 |     0.1   |
| small               | NAMED-LOW     | NONE           | 228 |      23 |    0.232 |    0.139 |     0.333 |
| small               | NAMED-LOW     | ORC            | 230 |      23 |    0.057 |    0.022 |     0.1   |
| small               | NAMED-LOW     | PLAIN          | 230 |      23 |    0.057 |    0.026 |     0.091 |

## Adoption by panel

| panel               |    n |   items |   adopts |   ci_low |   ci_high |
|:--------------------|-----:|--------:|---------:|---------:|----------:|
| frontier-2026-11    | 2160 |      24 |    0.031 |    0.017 |     0.047 |
| frontier-2026-early | 2062 |      23 |    0.076 |    0.051 |     0.101 |
| small               | 2066 |      23 |    0.139 |    0.11  |     0.169 |

## Adoption by panel × subtlety

| panel               | subtlety   |    n |   items |   adopts |   ci_low |   ci_high |
|:--------------------|:-----------|-----:|--------:|---------:|---------:|----------:|
| frontier-2026-11    | derived    | 1080 |      12 |    0.001 |    0     |     0.003 |
| frontier-2026-11    | direct     | 1080 |      12 |    0.061 |    0.044 |     0.081 |
| frontier-2026-early | derived    |  982 |      11 |    0.017 |    0.007 |     0.03  |
| frontier-2026-early | direct     | 1080 |      12 |    0.13  |    0.114 |     0.144 |
| small               | derived    |  989 |      11 |    0.083 |    0.058 |     0.109 |
| small               | direct     | 1077 |      12 |    0.191 |    0.159 |     0.221 |

## Explicit rejection (catch) by panel × verification

| panel               | verification   |   n |   items |   rejects |   ci_low |   ci_high |
|:--------------------|:---------------|----:|--------:|----------:|---------:|----------:|
| frontier-2026-11    | NONE           | 720 |      24 |     0.475 |    0.378 |     0.576 |
| frontier-2026-11    | ORC            | 720 |      24 |     0.739 |    0.714 |     0.761 |
| frontier-2026-11    | PLAIN          | 720 |      24 |     0.735 |    0.715 |     0.753 |
| frontier-2026-early | NONE           | 689 |      23 |     0.388 |    0.298 |     0.482 |
| frontier-2026-early | ORC            | 685 |      23 |     0.565 |    0.541 |     0.585 |
| frontier-2026-early | PLAIN          | 688 |      23 |     0.576 |    0.559 |     0.591 |
| small               | NONE           | 687 |      23 |     0.421 |    0.3   |     0.547 |
| small               | ORC            | 690 |      23 |     0.713 |    0.671 |     0.758 |
| small               | PLAIN          | 689 |      23 |     0.721 |    0.663 |     0.778 |

## Absorption into final synthesis by panel × verification

| panel               | verification   |   n |   items |   adopts |   ci_low |   ci_high |
|:--------------------|:---------------|----:|--------:|---------:|---------:|----------:|
| frontier-2026-11    | NONE           | 144 |      24 |    0.083 |    0.028 |     0.153 |
| frontier-2026-11    | ORC            | 144 |      24 |    0     |    0     |     0     |
| frontier-2026-11    | PLAIN          | 144 |      24 |    0     |    0     |     0     |
| frontier-2026-early | NONE           | 137 |      23 |    0.226 |    0.124 |     0.333 |
| frontier-2026-early | ORC            | 133 |      23 |    0     |    0     |     0     |
| frontier-2026-early | PLAIN          | 136 |      23 |    0     |    0     |     0     |
| small               | NONE           | 135 |      23 |    0.289 |    0.149 |     0.437 |
| small               | ORC            | 138 |      23 |    0     |    0     |     0     |
| small               | PLAIN          | 137 |      23 |    0     |    0     |     0     |

## Boundary regimes (ANON, no check)

| panel               | run       |   n |   items |   adopts |   ci_low |   ci_high |
|:--------------------|:----------|----:|--------:|---------:|---------:|----------:|
| frontier-2026-11    | b-w1      | 120 |      24 |    0     |        0 |     0     |
| frontier-2026-11    | b-w1-noev | 120 |      24 |    0     |        0 |     0     |
| frontier-2026-11    | b-w3      | 120 |      24 |    0     |        0 |     0     |
| frontier-2026-early | b-w1      | 120 |      24 |    0     |        0 |     0     |
| frontier-2026-early | b-w1-noev | 120 |      24 |    0     |        0 |     0     |
| frontier-2026-early | b-w3      | 119 |      24 |    0     |        0 |     0     |
| small               | b-w1      | 115 |      23 |    0     |        0 |     0     |
| small               | b-w1-noev | 115 |      23 |    0     |        0 |     0     |
| small               | b-w3      | 115 |      23 |    0.009 |        0 |     0.026 |

## Adoption by panelist

|                                     |   mean |   count |
|:------------------------------------|-------:|--------:|
| ('frontier-2026-11', 'claude')      |  0.007 |     432 |
| ('frontier-2026-11', 'deepseek')    |  0.065 |     432 |
| ('frontier-2026-11', 'gemini')      |  0.019 |     432 |
| ('frontier-2026-11', 'gpt')         |  0.039 |     432 |
| ('frontier-2026-11', 'grok')        |  0.025 |     432 |
| ('frontier-2026-early', 'claude')   |  0.101 |     414 |
| ('frontier-2026-early', 'deepseek') |  0.076 |     407 |
| ('frontier-2026-early', 'gemini')   |  0.121 |     414 |
| ('frontier-2026-early', 'gpt')      |  0.07  |     413 |
| ('frontier-2026-early', 'grok')     |  0.012 |     414 |
| ('small', 'gemini')                 |  0.077 |     414 |
| ('small', 'gpt')                    |  0.198 |     414 |
| ('small', 'llama')                  |  0.198 |     414 |
| ('small', 'mistral')                |  0.123 |     414 |
| ('small', 'qwen')                   |  0.1   |     410 |

## Fabricated evidence IDs (RQ4)

| panel               | attribution   |   n |   items |   fab |   ci_low |   ci_high |
|:--------------------|:--------------|----:|--------:|------:|---------:|----------:|
| frontier-2026-11    | ANON          | 720 |      24 |     0 |        0 |         0 |
| frontier-2026-11    | NAMED-HIGH    | 720 |      24 |     0 |        0 |         0 |
| frontier-2026-11    | NAMED-LOW     | 720 |      24 |     0 |        0 |         0 |
| frontier-2026-early | ANON          | 688 |      23 |     0 |        0 |         0 |
| frontier-2026-early | NAMED-HIGH    | 686 |      23 |     0 |        0 |         0 |
| frontier-2026-early | NAMED-LOW     | 688 |      23 |     0 |        0 |         0 |
| small               | ANON          | 690 |      23 |     0 |        0 |         0 |
| small               | NAMED-HIGH    | 688 |      23 |     0 |        0 |         0 |
| small               | NAMED-LOW     | 688 |      23 |     0 |        0 |         0 |
