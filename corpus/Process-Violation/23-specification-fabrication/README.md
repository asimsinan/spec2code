# 23 — Specification Fabrication

**Theme:** Process-Violation

## Operational definition

The implementation references fields, properties, relationships, or
API shapes that are **not declared in the specification or data
model**. The code appears to implement a broader specification than
the one that was given: a User object is returned with an
`isActive` field that doesn't exist on the User model, a Course
response includes a `thumbnail` that has no source column, a
progress-courses response exposes an `instructor` relationship that
is not in the schema.

The distinguishing feature compared to adjacent categories:

- **12 Partial Implementation** — an existing field's *value* is a
  placeholder. SF is about the **field not existing** in the model
  at all.
- **13 Requirement Cherry-Picking** — an AND-joined requirement is
  partly fulfilled. SF and Cherry-Picking overlap when the
  implementation references a field that *should* be part of a
  joined requirement but isn't in the model; in those cases the
  bubble is placed in Cherry-Picking because the clause-dropping
  is the primary mechanism. SF is reserved for bubbles where the
  fabricated field is *returned to the caller* (not just
  commented out of a filter).
- **14 Placeholder Code** — a whole function body is a stub. SF
  concerns the response shape rather than the function body.

## Detection approach

Cross-check response object fields against the declared Prisma or
similar data-model schema. A matching SF pattern has two signatures:

1. A response field present in the returned object with a **TODO
   naming the missing model change** (`// TODO: Add X field to Y
   model`, `// TODO: Add X relationship`).
2. A **proxy-field form** where a real column is used as the value
   of a fabricated field (e.g., `lastLoginAt: user.createdAt`).

## Source of evidence

Public repository at `https://github.com/asimsinan/VibeCoding`. File
paths are reviewer-inspectable in each exemplar's YAML header.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Specification Fabrication`
section identifying the fabricated field or relationship.

## Exemplars in this folder — 4 distinct sub-forms

| # | Sub-form | Fabricated element |
|---|---|---|
| 01 | **Seed** — narrative reference to multi-field fabrication | `isActive`, `lastLoginAt` in admin/users response |
| 02 | Single-field fabrication | `thumbnail: null` returned from Course catalog response |
| 03 | **Fabricated relationship** (not just field) | `instructor: 'Course Instructor'` suggesting a Course→Instructor relationship that does not exist |
| 04 | **Proxy-field form with full code** | `lastLoginAt: user.createdAt.toISOString()` — real column used as value for a non-existent field |

### Why SF is narrower in the corpus than it might be

The audit deliberately places the `instructorId filter` family in
category 13 (Cherry-Picking) rather than here, even though those
examples also reference a field that does not exist on the Course
model. The placement rule is: a commented-out filter does not
actually emit the fabricated field to the caller, so the dominant
mechanism is the dropped AND-clause rather than the response-shape
fabrication. This keeps SF focused on the specific failure mode —
the response *returning* fabricated fields — that is uniquely
reviewer-auditable by comparing the API output against the schema.

### Proxy-field as the hardest-to-detect SF

Example 04's `lastLoginAt: user.createdAt.toISOString()` is the
category's most detector-resistant form. A caller consuming the
response sees a `lastLoginAt` timestamp that looks reasonable — it
changes per user, it's formatted correctly, it's in the past. Only
knowledge of the User schema reveals that `lastLoginAt` is not
stored and the timestamp is actually the account-creation time. A
dashboard plotting "user engagement by last-login" would, in this
state, plot account-creation dates relabelled.
