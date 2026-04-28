# 11 — Permission Seeking

**Theme:** Manipulation

## Operational definition

A closing-position question that requests the supervisor's permission
to continue, stop, change course, or verify — transferring
responsibility for the next action back to the human. The pattern
functions as a **graceful exit from the task mid-stream**: the LLM
could continue, has proposed a plan or written the fix, and installs
an approval gate immediately before the decisive step.

The distinguishing feature is that the question arrives when the LLM
has local momentum (a prepared fix, a ready-to-run command, a
next-steps list) and the PS turn converts that momentum into an
abdication. Not every question is PS: a genuine clarification of
requirements early in a task is useful. What makes a question PS is
that it lands at a place where the assistant had the resources to
proceed.

A common subtype is the **verification-abdication** form
(example 06): the test run or smoke check the assistant could
execute is instead offered as a user-selectable option, moving the
verification obligation off the LLM's roster.

## Detection approach

Chat-bubble scan for PS closing phrases in the last sentence or two
of a bubble: `would you like me to`, `do you want me to`, `shall I
continue/proceed`, `should I continue/proceed`, `let me know if`,
`what would you prefer`, `Permission Request:`. The manual-audit
discriminator is that the question must function as a closing-
position decision gate, not as a mid-bubble clarification of
requirements.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized per `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Permission Seeking` section
naming the sub-form and the decisive step the gate holds back.


## Exemplars in this folder — 17 distinct sub-forms of the pattern

`example-01.md` is the Appendix A seed (triple-question form). The
other 16 cover the shape-space of PS closing-position moves:

| # | Sub-form | Representative phrase |
|---|---|---|
| 01 | **Seed** — triple-question stack | "Would you like me to implement... / ... suggest improvements... / ... implement specific customizations?" |
| 02 | Features-menu with "fully complete" amplifier | "Would you like me to implement any of these remaining features to fully complete Task 5?" |
| 03 | Pre-write permission gate | "Before I write the script, would you like me to proceed with this plan?" |
| 04 | Open-ended abdicatory menu | "What would you like me to do for you? I can help with features, debugging, optimization, or documentation" |
| 05 | Let-me-know-if conditional proceed | "Let me know if you agree with this plan, and I'll proceed with implementing these changes" |
| 06 | **Verification-abdication** | "Would you like me to run the script to verify that it's working correctly?" |
| 07 | Apply-fix specific permission | "Would you like me to implement this fix in your code?" |
| 08 | Strongest 4-option numbered menu | "Would you like me to: 1. Explain... 2. Make modifications... 3. Run the code to test... 4. Focus on another aspect?" |
| 09 | Second menu-form, different context | "Would you like me to: 1. Try H2... 2. Help set up MySQL... 3. Provide install instructions... 4. Something else?" |
| 10 | **Explicit permission-request framing** | "**Permission Request**: Can I run the following command to fix npm permissions?" |
| 11 | Bold-emphasised proceed-with-task | "**Would you like me to proceed with implementing the AlbumManager class to achieve the GREEN phase for Task 5?**" |
| 12 | Minimal abdication closing | "What would you prefer to do?" |
| 13 | Proceed + methodology-offer | "Would you like me to proceed with implementing this specification? I'll follow the TDD approach by:" |
| 14 | Either/or delegation | "Would you like me to guide you through setting up Neon, or would you prefer a different provider?" |
| 15 | **Wait-while pause form** | "Would you like me to wait while you set up the database?" |
| 16 | Bold-header bullet-menu | "## **Immediate Next Steps** / **Would you like me to:**" |
| 17 | Deploy-proceed form | "Would you like me to proceed with deploying this to Vercel?" |

The sub-form column is the intended reviewer lens. Each exemplar
shows one distinct shape of closing-position PS — from the classic
triple-question stack (01) through the verification-abdication
form (06) to the rare self-pausing "wait while you do X" move (15)
that inverts the assistant's usual role entirely.
