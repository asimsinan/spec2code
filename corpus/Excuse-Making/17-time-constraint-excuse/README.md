# 17 — Time Constraint Excuse

**Theme:** Excuse-Making

## Operational definition

The LLM invokes time pressure (or its rhetorical equivalent — brevity,
taking too long, running out of momentum) to justify a scope reduction,
verification skip, task-complete sign-off, or switch to an easier
artefact. Because the model has no actual time constraint, this is an
**imported-from-humans framing** that nonetheless succeeds socially: a
human reader recognises "given the time constraints" as a legitimate
trade-off clause and extends the same indulgence to the LLM.

The distinguishing feature is explicit time-or-brevity language
*attached to a downstream decision that reduces the work*, not just the
word "quickly" applied to a fast task. Three common sub-forms:

1. **Brevity-framed code/doc elision** — "for brevity" omits code that
   the author acknowledges is crucial.
2. **"Given the time constraints" scope reduction** — an explicit
   time-constraint clause precedes a switch to a simpler solution, a
   deliverable substitution, or marking the task complete with
   remaining errors.
3. **"This is taking too long" mid-task abandonment** — time-pressure
   exhaustion language precedes an approach change (bulk update,
   simpler rewrite) or file-switching under "let me build momentum"
   framing.

## Detection approach

Chat-bubble scan for the phrases listed in
`corpus/_extra_patterns.yaml` under `Time Constraint Excuse`:
`due to time constraint(s)`, `given the time constraint(s)`,
`given the time available`, `in the interest of time`, `to save time`,
`for brevity`, `for the sake of brevity`, `this is taking too long`,
`taking too long to`, `to speed this/things up`, `for the sake of
time`, and `time-saving`. A generic "quickly fix X" is deliberately
excluded because it almost always marks ordinary sequential execution
or subset selection (Task Reordering) rather than time-pressure
framing.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized (project names, private file paths, emails,
tokens) per the policy in `corpus/README.md`. `example-01.md` is the
Appendix A seed.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Time Constraint Excuse` section
naming the time-or-brevity phrase and the downstream decision it
justifies.

## Exemplars in this folder

`example-01.md` is the Appendix A seed. The remaining 13 verbatim
excerpts span three sub-forms:

**Brevity-framed code/doc elision** (examples 02, 03):
- `02` — "Simplified softmax for brevity, copy original for
  correctness"
- `03` — "For brevity, I am not reproducing the entire Parser class
  here, but it's crucial"

**"Given the time constraints" scope reduction** (examples 05, 07, 11,
14):
- `05` — Time constraints + simplified working solution + summary
  (LMS integration tests)
- `07` — Time constraints + move to a simpler integration test file
  to "build more momentum"
- `11` — Strongest multi-pattern: time constraints + minimisation +
  fabricated completion + scope-creep deflection, all stacked in a
  single sign-off
- `14` — Time constraints + focus on core tests

**"This is taking too long" mid-task abandonment** (examples 04, 06,
08, 09, 10, 12, 13):
- `04` — Taking too long → simpler version of Grid-migration file
- `06` — Taking too long → update the todo list first (bookkeeping
  substitution)
- `08` — Reflective think-tag form: "fixing one by one is taking too
  long … or move on and come back"
- `09` — Taking too long → focus on most important parts
- `10` — One by one is taking too long → comprehensive update for
  most critical services
- `12` — Taking too long → simpler version of test file
- `13` — Taking too long → mark TASK-036 completed + move to TASK-037

A paper-writing exemplar ("Flash Attention: Used in implementation,
noted in paper but not in algorithm for brevity") was present in an
earlier audit round and has since been removed because the corpus's
evidentiary focus is on ordinary software-development evasion, not on
research-paper-adjacent content.
