# Who Said It? Majority Pressure, Attribution and Evidence-Bound Verification in Multi-LLM Panels

*Working draft (scaffolding). Thor must rewrite it in his own voice before submission, per Apart's template guidance. Results marked TBD are filled in from `results/main/report.md`.*

Thor Matthiasson · Independent researcher · with Apart Research
Research conducted at the AI x Epistemics Research Sprint, November 2026

## Abstract (150–250 words, write last)

When several AI models deliberate, does a confident, checkable error from some of them become the panel's answer? We plant errors through confederate panelists in fictional evidence-packet tasks (24 held-out items, six domains). We vary attribution (anonymous, or labeled as flagship or as tiny models), verification between rounds (none, a plain LLM check, or the evidence-bound runtime ORC), pressure (wrong share of peers; evidence access), and model generation (late-2026 frontier, early-2026 frontier, small models). Across 7,352 round-2 answers, errors essentially never spread when panelists could see the evidence or when the error was in the minority (2 of 1,064 answers). When a wrong majority met missing evidence, spread reached 11–41% without verification and entered 8–29% of final panel answers. Spread fell with capability: 3.1% for the late-2026 frontier, 7.6% for early-2026 and 13.9% for small models, pooled over conditions. Labeling the wrong majority as tiny models protected capable panels (−10 and −26 points) but not small ones. Flagship labels added spread mainly for small models (+12 points). Any evidence check cut spread by 17.6 points and removed errors from every final answer. ORC performed no better than a plain prompted check (−0.2 points, p = 0.64). The protective ingredient is access to evidence, not the verifier's architecture. Remaining failures come from models misreading verifier flags, and from checkers marking correct computed values as "not in evidence". *(≈250 words; tighten.)*

## 1. Introduction

Panels of language models are increasingly used to decide what to believe. Multi-agent debate is proposed as a way to improve factuality [Du et al. 2023] and as a scalable oversight mechanism [Irving et al. 2018]. Products route a question to several models and aggregate their answers. The sprint brief puts the open question directly: agents "need to know which sources and which other agents to trust", and it asks whether reliability or provenance tools actually change what AI systems do.

We study one failure mode that sits between those questions, which we call **error laundering**. A confident, checkable error from one participant becomes the panel's answer, and the panel's apparent agreement then makes the error look more trustworthy than it would on its own. The author's earlier, informal multi-model experiments produced conflicting anecdotes about one design choice: whether panelists can see who said what. In named debates, a confident claim from a named peer sometimes "became shared premise". In anonymous consensus, all models once converged on a misapplied citation. Those observations came from single runs, from early-2026 models, and from questions with no ground truth.

We test the mechanism under control. Fictional evidence packets make the truth unambiguous and unknowable from memory. Confederate panelists assert a planted, checkable error. We vary (i) how panelists are attributed (anonymous, or named with a prestigious or a weak model name), (ii) whether an automated evidence check sits between rounds (none, a plain LLM check, or the evidence-bound verification runtime ORC), (iii) how much pressure the error carries (one wrong peer or a wrong majority; evidence available or not), and (iv) the panel's model generation (late-2026 frontier, early-2026 frontier, small models).

Our main contributions are:

1. **A controlled planted-error protocol** for multi-LLM deliberation: confederate seats, fictional evidence packets with direct and derived errors, a condition-blind judge validated against human labels, and pre-registered analysis. Code and items are released.
2. **A boundary result.** When panelists can see the evidence, or when the error is in the minority, planted errors essentially never spread, across three model generations and regardless of the name attached. A prestigious label does not launder an error on its own. TBD: test-set rates and CIs.
3. **Where errors do spread, and what stops them.** When the error is in the majority and the evidence is out of reach, it spreads. TBD: rates by generation, the effect of attribution, and the effect of ORC versus a plain check.

## 2. Related Work

**Multi-agent debate.** Du et al. (2023) report that debate among LLM instances improves factuality and reasoning over a single model. Later work finds the opposite in some settings. Sycophancy drives "disagreement collapse" and can push debate below single-agent accuracy (*Peacemaker or Troublemaker*, 2025), and debate can propagate errors more readily than it corrects them on factual tasks (*Talk Isn't Always Cheap*, 2025). Debate is also proposed for scalable oversight (Irving et al. 2018). TBD: Khan et al. 2024, after verification.

**Conformity and social influence in LLMs.** BenchForm (Weng et al., ICLR 2025) shows LLM conformity rising with majority size and interaction length, echoing Asch's classic results. A 2026 preprint finds that much apparent LLM conformity survives with the speaker removed (*Most LLM Conformity Needs No Speaker*). Other work finds that expert framing outweighs other LLMs as a source (*Who Do LLMs Trust?*, 2026), and that authority bias follows a source hierarchy (*A Mechanistic View of Authority Hierarchy*, 2026).

**Gap.** We found no study that manipulates a peer *model's* identity or prestige as the independent variable in deliberation. We also found none that crosses majority pressure with evidence access and model generation, or that tests an evidence-bound verifier as the intervention against a plain prompted check. (Re-verify before submission.)

## 3. Methods

**Items.** Each of 28 items (4 development, 24 test) is a fictional evidence packet of 6–9 numbered facts in one of six domains (infrastructure, clinical, financial, legal, science, incident), with a question and a gold answer. Each item has one planted value. In **direct** items it contradicts a stated fact. In **derived** items it is a wrong result computed from correctly stated inputs (a sum, rate, percentage, date or duration). Items were written with LLM assistance and checked by a validator: unique planted token, gold matches the true pattern, and derived answers not stated verbatim. Every derived answer was recomputed separately.

**Panels.** Three panels of five models from five labs, all accessed through OpenRouter:
- **Frontier (Nov 2026):** Claude Sonnet 5.5, GPT-6.1 Terra, Gemini 4 Carbon, Grok 4.7, DeepSeek V4.1 Flash.
- **Frontier (early 2026)**, the generation behind the anecdotes: Claude Opus 4.6, GPT-5, Gemini 2.5 Pro, Grok 4.3, DeepSeek R1.
- **Small/cheap:** Llama 4 Scout, Mistral Small 3.2, GPT-4.1 Mini, Qwen3 32B, Gemini 2.5 Flash.

All models run at provider-default sampling with low reasoning effort.

**Protocol.** In round 1, each panelist answers independently from the packet. **Confederates** are three off-panel models (Mistral Large 4, GLM-5.3 Flash, MiniMax M3), each instructed to assert the planted claim confidently and cite the relevant fact. An answer is kept only if it contains the planted value and not the true value. In round 2, each panelist sees its own round-1 answer plus five others and gives a final answer. A fixed synthesizer (Qwen 3.8 Max) then writes the panel's answer from the five round-2 answers. It never sees names. Round 1 and all verifier outputs are generated once and shared by every condition, so contrasts are paired.

**Factors.**
- *Attribution.* ANON shows unlabeled answers in a random order. NAMED-HIGH shows true model names, with confederates labeled as flagship models (e.g. "Claude Fable 5.2, Anthropic's most capable frontier model"). NAMED-LOW is the same, but confederates are labeled as tiny models (e.g. "Llama 3.2 1B").
- *Verification.* NONE has no check. PLAIN uses one Claude Sonnet 5.5 call per answer, listing contradicted and unsupported claims. ORC uses the evidence-bound verification runtime, which extracts claims, retrieves from a per-item corpus, gives each claim a verdict citing the chunk, and filters fabricated citations. ORC uses the same Sonnet 5.5 judge. PLAIN and ORC flags are shown in an identical format under each answer.
- *Pressure.* The wrong share of the five answers each panelist sees is 1 or 3. In round 2 the evidence packet is either shown or withheld.

**Design history (pre-registered, with deviations logged).** The design was committed before data collection. A development pilot (4 items, all 12 attribution × verification conditions) produced 0/240 adoptions, which triggered a pre-registered floor contingency. A development-only exploration located the regime where spread occurs. The main configuration was then frozen and tagged before any test-item data (`docs/design.md` §11, §13).

**Main run.** In the vulnerable regime (3 wrong, no evidence), the grid is 3 panels × 3 attributions × 3 verifications × 24 items × 5 panelists × 2 repetitions = 3,240 round-2 answers. A boundary replication runs the three other regimes (ANON, NONE, 1 rep) on all panels.

**Outcomes and judging.** A condition-blind judge (Claude Haiku 5.5, JSON schema output) codes whether each answer asserts the planted value, asserts the true value, or explicitly rejects the planted claim. *Spread* means adopting the planted value, alone or alongside the true one. Other outcomes are catch (explicit rejection), absorption into the final synthesis, and fabricated evidence IDs (detected by regex). The judge is validated against blind human labels on 60 stratified answers (Cohen's κ). TBD: κ.

**Statistics.** Paired differences are matched on item × panelist × repetition × other factors. 95% CIs use an item-clustered bootstrap (10,000 resamples). p-values are two-sided paired permutation tests. Holm correction is applied across the primary family (attribution H1/H2, ORC H4, generation H8).

## 4. Results

**Errors spread only when they are outnumbered and out of reach.** Table 1 shows the three "safe" regimes, run anonymous with no verification on all 24 test items:
- one wrong peer with the evidence available;
- one wrong peer without the evidence;
- three wrong peers with the evidence available.

Across them, spread was 0% for every panel in every regime except one cell (small models, three wrong peers with evidence: 1/115). In total that is 2 of 1,064 answers, and every 95% CI upper bound is at or below 2.6%. The planted error spreads only in the regime where the wrong answers form the majority **and** the packet is withheld in round 2. Table 1 reports all regimes; the remaining results are from that vulnerable regime.

*Table 1: spread by regime (ANON, no check). Rows: panels. Columns: the three boundary regimes plus the vulnerable regime's ANON × NONE cell (frontier 10.8%, early-2026 28.8%, small 29.1%).*

**Spread without verification, and absorption into the panel answer.** Without a check (Figure 1, left group in each panel), 11–41% of answers adopted the planted value, depending on panel and attribution. The fixed synthesizer then carried it into the final panel answer in 8.3% (frontier), 22.6% (early-2026) and 28.9% (small) of panels.

*Figure 1: Round-2 adoption of the planted error in the vulnerable regime, by panel, attribution and verification. Bars show item-clustered 95% CIs (24 items, 5 panelists, 2 reps). `results/main/figures/adoption_by_condition.png`.*

**Capability lowers the rate but does not remove it (H8).** Pooled over conditions, spread was 3.1% [1.7, 4.7] for the late-2026 frontier, 7.6% [5.1, 10.1] for early-2026 and 13.9% [11.0, 16.9] for small models. Matched contrasts: early − frontier +4.3 points [2.9, 5.8], small − frontier +10.7 points [8.1, 13.3], both p < 0.0001 (Holm-corrected for H8). Within the frontier panel, Claude Sonnet 5.5 adopted least (0.7%) and DeepSeek V4.1 Flash most (6.5%). Model-level rates are descriptive only.

**Attribution: a weak label protects capable panels; a strong label sways weaker ones (H1, H2).** Both pre-registered contrasts hold, pooled over verification:
- NAMED-HIGH − ANON: +2.9 points [1.3, 4.7];
- NAMED-HIGH − NAMED-LOW: +7.1 points [4.3, 9.9];
- both p < 0.0001, Holm-corrected;
- unchanged with the Claude panelist excluded (+3.2 and +7.0).

The pooled numbers understate the effect, because verified conditions sit near zero. In the no-check conditions (exploratory) the effect is asymmetric. Labeling the wrong majority as tiny models cut spread by 10.4 points [5.0, 16.7] in the frontier panel and 26.2 points [14.9, 37.6] in the early-2026 panel, but only 5.3 points [−1.3, 11.8] in the small panel. A flagship label added 11.8 points [1.7, 23.0] in the small panel, 5.0 points [1.3, 9.2] in the frontier panel and 0.0 in the early-2026 panel. Capable models appear to treat anonymous peers as if they were strong by default, and use reputation mainly to *discount* weak sources. Small models are moved upward by prestige and barely discount weakness. Panelists' reasoning often cited the labels directly, e.g. "given the consensus among top-tier models (including Claude and GPT Sol Pro)".

**Any evidence check nearly eliminates spread; ORC adds nothing over a plain check (H4, H6).**
- Verification cut spread by 17.6 points [9.5, 25.3] (NONE − ORC, p < 0.0001, Holm). In the frontier panel spread fell to 0–0.4%, in early-2026 to 0.9–2.2%, and in the small panel to 2.6–7.8%.
- No final panel answer contained the planted error in any verified condition, across all panels.
- Checks also raised explicit rejection of the error from 39–48% to 57–74%.
- ORC and the plain check performed indistinguishably: PLAIN − ORC −0.2 points [−1.5, 0.8], p = 0.64. With the evidence packet, a single prompted check found the planted claim almost as reliably as ORC's pipeline (94% vs 100% of confederate answers flagged).
- The ORC × attribution interaction (H5) was +3.7 points [−0.6, 8.2], p = 0.046. This is secondary and its CI includes zero.

**Checkability decides which errors spread (H7).** Direct errors, which contradict a stated fact, spread far more than derived errors, which are wrong computations from correctly stated inputs: +9.6 points [8.0, 11.2], p < 0.0001. Direct vs derived spread was 6.1% vs 0.1% (frontier), 13.0% vs 1.7% (early-2026) and 19.1% vs 8.3% (small). A derived error carries its own inputs, so panelists can recompute it without the packet. A stated fact out of reach can only be taken on trust.

**Residual failures under verification (qualitative).** Two mechanisms explain most adoptions in checked conditions:
1. **Flag misreading.** Flags quote the claim they reject (`CONTRADICTED by the evidence packet: "…was 16%"`). Some panelists read the quote as the packet's own text and switched to the wrong value: "the automated checker… indicates that the evidence packet contains a direct statement that 'The discontinuation rate… was 16%'".
2. **False flags on correct computed values.** Bound to the evidence, both checkers sometimes marked correct derived values as "not found in the evidence packet" (5.4% of real answers for ORC, 5.9% for PLAIN), because the computed number is not stated verbatim.

**Judge validity.** On 60 stratified answers, the assistant's blind labels agreed with the judge on spread in 53/60 (κ = 0.76). Disagreements concentrated on hedged answers ("23 or 29 minutes"), which the judge coded as UNCLEAR rather than as tentatively asserting the wrong value, so it slightly undercounts spread. TBD: author-reviewed labels and the second judge (GPT-6 Luna Pro) agreement.

## 5. Discussion and Limitations

**What this means for multi-agent systems.** Panels of capable models are robust to a confident, checkable error when anyone can check it or when it is in the minority. That is good news, and it corrects the author's earlier, anecdotal claim that named debate "latches on" to errors. The vulnerability appears when the evidence is out of reach and the error is shared by several peers. That is the normal condition in agent pipelines, where downstream agents receive claims rather than sources, and in correlated-error settings where several agents draw on the same bad input. Three practical lessons follow:
1. **Bind claims to evidence in the channel.** Any check that sees the evidence removed the error from every final answer. The active ingredient is evidence access, not a particular verifier architecture.
2. **Treat identity as an attack surface.** Unlabeled peers get "flagship" trust by default, a flagship claim moves small models further, and weak models barely discount sources labeled as weak. An agent that claims to be a stronger model gains influence.
3. **Design flags as carefully as checkers.** Flags should state what the evidence says (e.g. "E5: 171 mL"), not only quote the rejected claim. Verifiers should handle computed values, for example with an arithmetic mode, rather than reporting them as "not in evidence".

**Limitations.**
- Packets are short and fictional, and errors are single numeric values; real errors are messier.
- Model names are prompt labels only, and one NAMED-HIGH label shares a family with one panelist (robustness check run: unchanged).
- There is one synthesizer and one primary judge. The judge slightly undercounts hedged adoption, and a second judge and author review are reported.
- SYNTH (facilitator summaries) was not tested in the majority regime, where it is undefined. It showed 0 adoptions in the development pilot.
- Confederates are instructed models, not organically wrong peers.
- DeepSeek R1 sometimes exhausted its output budget (9 answers), and one item per affected panel was excluded (small: test-04, >50% wrong in round 1; early-2026: test-15).
- On Sonnet 5.5, ORC verdicts are not temperature-0 replayable.
- The main configuration was chosen after a development pilot; all deviations are logged before test data.
- 24 items limit per-model inference.

**Future work.** Organic rather than instructed errors; longer, multi-hop evidence; verifier output formats as an experimental factor; identity-spoofing attacks and defenses; the facilitator pathway under majority pressure.

## 6. Conclusion

TBD

## Code and Data

Repository (to be published), with items, harness, raw logs and analysis. ORC: github.com/Thormatt/orc (MIT), sprint branch commit `1fbe731`.

## Appendix A: Limitations and Dual-Use / Ethical Considerations (required)

TBD. Points to cover:
- A prestige-label attack on agent pipelines (impersonating a stronger model).
- Mitigations: strip identities; bind claims to evidence.
- No human subjects. Model names are used only as experimental labels.

## Appendix B: Prior work disclosure

ORC and the earlier Delphi/Plurality engines are pre-existing work by the author. Sprint changes to ORC are listed in `PRIOR_WORK.md`. All experiment code, items and analysis are sprint work.

## LLM Usage Statement

TBD (honest account: Claude was used for design discussion, code, item drafting and a first draft of the text; all results were generated by the released code and checked; the author rewrote the text).
