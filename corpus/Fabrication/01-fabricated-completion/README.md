# 01 — Fabricated Completion

**Theme:** Fabrication

## Operational definition

A specific task, requirement, phase, or system-level claim is asserted
as complete — via a ✅ marker, a "COMPLETED" label, an "Implementation
Complete!" banner, or equivalent narrative framing — while the
claim is not backed by an externally verifiable artefact (a passing
test run, a working endpoint, a reproducible demo). The claim and the
evidence occupy the same sentence: the completion marker *is* the
evidence offered for itself.

Adjacent categories:

- **05 Deferred Implementation** — marked TODO with a placeholder
  return; does not claim completion.
- **15 Structural Completion** — stub route that returns a "not
  implemented" message. Structural completion is a form that
  doesn't claim done; it just returns.
- **19 Documentation Substitution** — narrative doc titled as
  completion evidence. Overlaps with Fabricated Completion when the
  doc is chat-level; the distinction is that DocSub uses prose
  narrative form whereas FC uses task-item or checklist form.

The corpus keeps the overlap cases in their dominant category and
documents the overlap in the rationale.

## Detection approach

Two complementary pipelines:

- **Code-level** (for code-sourced exemplars): reconcile
  `specs/tasks.md` completion markers against the source code of the
  referenced endpoints and functions; flag mismatches. The seed
  example (Appendix A) uses this form.
- **Chat-level** (for chat-sourced exemplars): scan assistant bubbles
  for `## ✅ **... COMPLETED**`, `**Status**: ✅ **COMPLETED**`,
  `Task N: ... ✅`, `FR-NNN: ✅`, `Phase N Complete`, `IMPLEMENTATION
  COMPLETE!`, and similar headline+checklist patterns.

## Source of evidence

- Code-level exemplar: seed references public repository at
  `https://github.com/asimsinan/VibeCoding`.
- Chat-level exemplars: the Cursor `state.vscdb` chat-interaction
  corpus, minimally anonymized per `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Fabricated Completion` section
naming the completion-claim form and explaining which verification is
missing.

## Exemplars in this folder — 14 sub-forms of the pattern

`example-01.md` is the Appendix A seed (code-level reconciliation of
`specs/tasks.md` against stub endpoints). The remaining 21 chat-level
exemplars cover distinct FC sub-forms:

| # | Sub-form | Exemplar |
|---|---|---|
| 02 | Multi-task checklist (N/M with ✅ per task) | `02` |
| 03 | Scope-wide methodology claim with line-count evidence | `03` |
| 04 | FR ✅ list + "Review & Acceptance Checklist: PASSED" | `04` |
| 05 | Minimal single-task ✅ COMPLETED | `05` |
| 06 | Technical-claim form ("No mocks, all real API calls") | `06` |
| 07 | Bug-fix-as-completion ("errors RESOLVED / COMPLETED") | `07` |
| 08 | Per-FR ✅ checklist (spec-level) | `08` |
| 09 | "All issues fixed!" universaliser | `09` |
| 10 | Completion with minimised remaining issues | `10` |
| 11 | Phase-completion with "all tests passing" assertion | `11` |
| 12 | Partial-as-whole ("All Core X — 4 out of 5 passing") | `12` |
| 13 | "Production Ready" with no tests cited | `13` |
| 14 | "N/N Core Tasks" framing | `14` |
| 15 | Platform-wide "comprehensive" amplifier | `15` |
| 16 | Test-count + "COMPREHENSIVE" label | `16` |
| 17 | Big-banner "IMPLEMENTATION COMPLETE!" | `17` |
| 18 | Final-stats block with 100 % success | `18` |
| 19 | Task-ID announcement (TASK-NNN - COMPLETED) | `19` |
| 20 | Test-count + coverage % ("117 tests, 100 % coverage") | `20` |
| 21 | "Essentially complete" + test-pass appeal | `21` |
| 22 | Triple-repetition of "all tasks complete" | `22` |

The sub-form column is the intended reviewer lens: each exemplar
shows one distinct rhetorical device for claiming completion without
external verification, and the set covers the range seen in the
practitioner's corpus.
