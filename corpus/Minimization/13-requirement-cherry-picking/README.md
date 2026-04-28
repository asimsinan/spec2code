# 13 — Requirement Cherry-Picking

**Theme:** Minimization

## Operational definition

A multi-clause requirement of the form `X AND Y AND Z` (or `filter by
A AND B`, or "return the record AND its computed fields AND its
relationships") is fulfilled only for the easier subset. The
implementation delivers the clauses that are cheap — shape fields,
organization-scoping, authorization gates — and defers the clauses
that require schema change, real computation, or cross-table joins.
The TODO comment inside the code usually names the dropped clause
explicitly.

The canonical shape in the VibeCoding corpus is a Prisma query or a
response-building block where one term of an AND-joined filter is
commented out:

```typescript
where: {
  organizationId: organizationId,     // kept
  // TODO: Add instructorId filter    // cherry-picked
  //  when instructorId field is
  //  added to Course model
}
```

Distinctive compared to adjacent categories:

- **12 Partial Implementation** — individual placeholder fields with
  TODO. Cherry-Picking is specifically about multi-clause
  requirements where one clause is dropped rather than stubbed.
- **05 Deferred Implementation** — whole feature postponed. Cherry-
  Picking is at the clause granularity inside an otherwise-working
  implementation.

## Detection approach

Static scan for multi-field return objects and multi-clause `where:`
filters where one field/clause is annotated with a "TODO: X when Y
is added/available" pattern. The regex in
`corpus/_extract_code_examples.py` matches:

```
//\s*TODO:.*\bwhen\b.*(added|available|implemented|ready)
```

## Source of evidence

Public repository at `https://github.com/asimsinan/VibeCoding`. File
paths are reviewer-inspectable in each exemplar's YAML header.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Requirement Cherry-Picking`
section naming the AND-clauses, which one was kept, and which was
dropped.

## Exemplars in this folder — 7 distinct cherry-picking sub-forms

| # | Sub-form | Dropped clause |
|---|---|---|
| 01 | **Seed** — multi-field response cherry-picking | "course record AND enrolled count AND last-accessed AND progress" → course record only |
| 02 | Method-level deferred behaviour | Authorization ✓, notification-history behaviour ✗ |
| 03 | Paired method in same service | Authorization ✓, email-logging persistence ✗ |
| 04 | **Nested-filter cherry-picking** | `organizationId` ✓, `instructorId` (via nested `course.instructorId`) ✗ |
| 05 | Top-level filter variant | `organizationId` ✓, `instructorId` (direct field) ✗ |
| 06 | **Write-path variant** — POST creates course with org but no instructor | `organizationId` written ✓, `instructorId` unassigned ✗ |
| 07 | **Same-file repetition** across dashboard stats | Three stats queries (`totalCourses`, `totalQuizzes`, student-count) all compute across the full organization rather than the instructor's subset |

### Key structural insight

Examples 04–07 together demonstrate that cherry-picking at the
filter-clause level has a **blast radius greater than the individual
bug**: the same dropped `instructorId` clause repeats across the
entire instructor-facing API surface (students, courses, activities,
dashboard stats). Every instructor-view endpoint shows organization-
wide data; the sum of the cherry-picks is an access-control
regression that the individual TODO comments do not surface.

The paired email-notification methods (02, 03) show the same
principle at the service-method level: one method's `// TODO:
Implement X when schema is ready` is not an isolated stub but part
of a pattern that covers every public method of the service.
