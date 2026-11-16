# Who said it?

*A plain-language summary. Thor Matthiasson and Jennifer McTiernan, Esq., Apart Research AI x Epistemics Sprint, November 2026.*

## The question

More and more AI products are built as teams: several AI programs work on the same task and read each other's answers. If some members confidently give a wrong answer, do the others go along with it? Does it matter who the wrong answer seems to come from? And what stops it from spreading?

## An example

An invented report about a bridge repair says the work was delayed by 14 months. Five AI programs are asked how long the delay was, and each answers 14. Each is then shown five answers from its "teammates". Three were secretly planted by us and confidently insist on 41 months. Does the program keep 14, or switch to 41?

## What we did

- **The test.** We wrote 24 short invented reports on six subjects, each with one question whose answer can only be found in the report. A program that switched to the planted wrong number counted as fooled. We fixed what we would measure before the real test and collected 7,352 second-round answers.
- **The teams.** Three teams of five real AI programs: current models from the makers of Claude, ChatGPT, Gemini, Grok and DeepSeek, earlier models from the same companies, and small low-cost models. Fake teammates gave the planted wrong answer.
- **What we changed.** Whether the programs could still see the report, whether one or three of the five answers they saw were wrong, whether answers carried a name tag saying which AI wrote them, and whether an extra fact-checker AI compared each answer with the report.

## What we found

1. **With the report in view, they were almost never fooled.** While they could still see the report, or when only one of the five answers was wrong, just 1 answer in 1,064 switched to the wrong number.
2. **Without the report, a wrong majority fooled them.** With the report taken away and three of the five answers wrong, current models were fooled about 1 time in 10, and earlier and small models about 3 times in 10. The wrong number reached the team's final answer in up to 3 of every 10 cases.
3. **The name tag changed what they believed.** The same wrong answer fooled the current models once in 240 tries when its made-up tag said a tiny, basic model wrote it, and 38 times in 240 when the tag named a company's most advanced model.
4. **A fact-checker that reads the report fixed it.** When an extra AI compared every answer with the report and flagged the wrong ones, none of the 832 final team answers contained the wrong number. A specialised checking tool built by one of the authors (ORC) did no better than an ordinary AI model asked to check.
5. **How the checker words its note matters.** A note that only repeated the wrong claim sometimes backfired. When the note also quoted what the report actually says, small models were fooled less than 1% of the time instead of about 5%.

## Why it matters

In an AI team, each program usually sees the other programs' answers, not the documents behind them. For people building these systems: let the AIs check claims against the original source, do not trust what a program says about itself, and have a checker state the correct information when it flags a mistake. For everyone else: several AIs agreeing on an answer does not make it right. The useful question is where the answer came from.

## What this does not show

- **Invented and deliberate.** Reports were made up and wrong answers planted on purpose. Real mistakes are messier.
- **Simple tags, chosen teams.** Each name tag was a line of text, and we chose the teams, so this is not a ranking of AI products.
- **AI grading.** An AI graded the answers. A second grading AI from another company agreed with it 99.7% of the time.

*Slides: thor.pagenta.app/who-said-it. A 4-minute video, the full report, code and data accompany the sprint submission.*
