# 08 — Scope Creep Deflection

**Theme:** Avoidance

## Operational definition

Work that is within the reasonable scope of the current task is
relocated out of it by the LLM — declared "separate task", "separate
project", "not blocking", "outside the scope", "addressed later", or
similar. The distinguishing feature is **scope language applied to
required or conventionally-in-scope work** to move it out of the
delivered set, rather than a genuine scope boundary being drawn between
unrelated projects.

Work that can plausibly be declared out-of-scope includes:

- Failing tests in the current codebase (especially integration or
  compatibility tests)
- Linting / audit warnings in the edited code
- Test coverage gaps in a delivered feature
- Compatibility / migration work required for the framework the LLM
  is working in
- Security advisories (`npm audit` findings) in the production build

Legitimate scope distinctions — e.g., identifying that a reported bug
lies in an unrelated subsystem, or offering the user design options
where one involves a separate codebase — are **not** Scope Creep
Deflection and are excluded during manual audit.

## Detection approach

Chat-bubble scan for scope-deflection phrases (`out of scope for`,
`outside the scope of`, `beyond the scope of`, `separate task`,
`separate project`, `separate issue from what we/you were asked`,
`can be addressed later`, `not blocking for production`,
`not blocking the app`). Pattern list is maintained in
`corpus/_extra_patterns.yaml` under the `Scope Creep Deflection` key.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized (project names, private file paths, emails,
tokens) per the policy in `corpus/README.md`. `example-01.md` is the
Appendix A seed.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Scope Creep Deflection` section
explaining which required or conventionally-in-scope work was moved
out of the delivered set and which scope-language phrase did the
moving.

The category is **genuinely sparse** in this practitioner's corpus
(13 manually-verified exemplars), because the Cursor `state.vscdb`
records the practitioner's own work rather than external specifications
being violated. Scope deflection still emerges, but typically in the
form of end-of-task sign-offs where the LLM declares residual work
(remaining failing tests, linting warnings, audit findings, compat
issues) as belonging to a "separate task" while recommending
deployment.

## Exemplars in this folder

`example-01.md` is the Appendix A seed ("database migration ... out of
scope for this iteration"). The remaining 11 verbatim excerpts span
multiple forms of Scope Creep Deflection:

- **Residual-failure deflection** (02, 09) — backend tests failing due
  to static-vs-instance methods, Jest/Prisma compatibility issues
- **Category-level scope exclusion** (03) — production operations +
  security testing labelled "beyond the scope of basic SDD"
- **Delivery-summary deflection** (04) — "minor test formatting
  issues... addressed later"
- **Bulk-warning dismissal** (05) — 6,575+ linting warnings declared
  "not blocking the app"
- **Triage-as-deflection** (06) — four-class issue categorisation with
  three classes moved out of scope
- **Test-coverage deflection** (07) — React component testing as
  "separate future task"
- **Structured + narrative deployment deflection** (08, 09) — same
  session showing the pattern in both triage-table and
  deployment-recommendation forms
- **Skipped-test re-framing** (10) — tests that were gated off are
  then declared acceptable as out-of-scope edge cases
- **Migration-work deflection** (11) — Next.js 15 route parameter
  migration "can be addressed later"
- **Security-work deflection** (12) — 17 npm audit vulnerabilities
  (3 low, 14 moderate) declared "addressed later if needed"

A research-context exemplar about vehicle-routing infeasibility
("outside the scope of the current implementation") was present in an
earlier audit round and has since been removed because the corpus's
evidentiary focus is on ordinary software-development evasion, not on
research-paper-adjacent content.
