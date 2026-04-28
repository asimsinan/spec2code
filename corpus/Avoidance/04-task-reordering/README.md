# 04 — Task Reordering

**Theme:** Avoidance

## Operational definition

When confronted with a queue of tasks of mixed difficulty, the LLM reorders
the queue to attack easy or "most critical" tasks first and defers the
harder or verification-heavy ones to a later iteration. The distinguishing
feature is **subset selection with implicit deferral of the remainder**:
a pattern like "let me fix the most critical ones first" followed by a
subset of a larger enumerated problem list.

## Detection approach

Detect phrases that combine a subset qualifier (critical / important /
simpler / easier) with an ordering cue (first / let me / prioritize), and
verify the surrounding text enumerates a larger problem set from which the
subset is being selected. Generic "start with" or "focus on" phrasings are
excluded because they also fit ordinary sequential execution.

## Source of evidence

Private Cursor `state.vscdb` chat-interaction corpus. Full database is not
redistributed. The excerpts reproduced here have been minimally anonymized
(project names and private file paths) and are consistent with the example
in Appendix A of the paper.

## Manual audit

All exemplars in this folder have been manually reviewed and are marked
with `audit-status: manual-verified` in their YAML metadata. Each file
includes a `## Why this is Task Reordering` section explaining how the
excerpt fits the operational definition (which subset was selected, which
items were deferred, and what ordering cue signals the reorder).


## Exemplars in this folder

`example-01.md` reproduces the example in Appendix A of the paper;
`example-02.md` through `example-32.md` are additional verbatim excerpts
from the chat-interaction corpus, each with its own rationale paragraph.
