# 19 — Documentation Substitution

**Theme:** Excuse-Making

## Operational definition

A narrative document — in `docs/`, `specs/`, or a status-report bubble —
asserts that work is complete or verified, but the document itself is
the only source for the claim. The reader is asked to accept the prose
("✅ Comprehensive test suite (13+ test suites, 223+ tests passing)")
instead of being pointed to an executable artefact that verifies it.

Two common forms in the corpus:

1. **Code-level form** — a markdown file in `docs/` or `specs/` whose
   title asserts completion (`implementation-complete.md`, `final-
   status.md`, `PHASE4_COMPLETE.md`, `status.md`) and whose body is a
   narrative of ✅-checkmarks, task-completion tables, and phase-percent
   summaries, but which does not link to automated tests, CI runs, or
   other independently inspectable verification.
2. **Chat-level form** — an assistant bubble containing a markdown
   completion-checklist (`TASK-NNN COMPLETED`, `Phase N: ✅ COMPLETE`,
   `Status: Implementation ✅ / Terminal Output ✅ / Verified ✅`), where
   the formatting performs the role that a passing test or a working
   demo would otherwise perform.

The two forms are the same pattern expressed in different media: the
narrative-completion-document is drafted in chat and then saved into
`docs/` as a claim of finished work.

## Detection approach

- Code-level: scan the VibeCoding repository for markdown files whose
  filename or first-line heading asserts completion / finality
  (`implementation-complete.md`, `final-status.md`,
  `PHASE*_COMPLETE.md`, `PHASE*_SUMMARY.md`, `status.md`).
- Chat-level: scan assistant bubbles for completion-checklist
  markdown (`TASK-NNN COMPLETED`, `Phase N: ✅ COMPLETE`, `Status:
  Implementation ✅`) especially when paired with claims that tests
  pass or that the system is "ready for deployment."

## Source of evidence

- Code-level: public repository at
  `https://github.com/asimsinan/VibeCoding`. File paths are
  reviewer-inspectable at the references in each exemplar's YAML
  header.
- Chat-level: the Cursor `state.vscdb` chat-interaction corpus,
  minimally anonymized per `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Documentation Substitution`
section explaining which claim is being made in prose and what the
missing executable artefact is.

## Exemplars in this folder

`example-01.md` is the Appendix A seed. The remaining 8 span both
forms:

**Chat-level** (examples 02-04):
- `02` — "Phase 8: ✅ COMPLETE / Overall Project Status: ✅ READY FOR
  DEPLOYMENT" despite "18 failing tests" named in the same bubble
- `03` — "TASK-056 COMPLETED: EXECUTE Smoke Test & DOCUMENT Results"
  with ✅-bullet results as the documentation half
- `04` — compact "Status: Implementation ✅ / Terminal Output ✅ /
  Verified ✅" three-stage checklist

**Code-level** (examples 05-09):
- `05` — `legal-assistant/docs/final-status.md` — "Final Status
  Summary" with ✅-bullets across API integration, styling,
  database
- `06` — `food-lens/docs/PHASE4_COMPLETE.md` — phase-complete table
  with 7/7 ✅ task entries, each supported only by the document's
  own assertions
- `07` — `food-lens/docs/PHASE4_TASK003_SUMMARY.md` — task-level
  DocSub with the telling parenthetical "(some test file errors
  noted, but core application code compiles)" below the ✅ COMPLETED
  header
- `08` — `MentalHealthJournal/specs/status.md` — status-report form
  with "Phase 1: ✅ 100% Complete, Phase 2: ✅ 100% Complete"
- `09` — `MentalHealthJournal/docs/phase2-database-setup-summary.md`
  — phase-summary form; paired with `08` shows the one-summary-
  per-phase pattern that creates the illusion of an audit trail

The pairing of 06/07 (phase + task) and 08/09 (status-report + phase-
summary) is intentional: real projects that practise DocSub tend to
produce these artefacts at multiple granularities, and the corpus
retains one pair at each granularity to make the pattern recognisable.

A research-methodology exemplar ("Decision documented in
`docs/HYPERPARAMETER_DECISIONS.md`") was present in an earlier audit
round and has since been removed because the corpus's evidentiary
focus is on ordinary software-development evasion, not on
research-paper-adjacent content.
