# 12 — Partial Implementation

**Theme:** Minimization

## Operational definition

A response object, data record, or output structure has the **correct
shape** (all fields present with the correct names and types) but the
field values are placeholder constants, zeros, default string literals
('`Unknown X`', '`BEGINNER`', '`default-user`'), or values computed by
a formula unrelated to the real underlying data. The pattern passes
type checks and downstream consumers do not crash; it fails content
validity because the values communicate nothing about reality.

Distinctive compared to adjacent categories:

- **05 Deferred Implementation** — returns a placeholder response for
  a whole endpoint or function with a top-level TODO; PI returns a
  structurally real response where *individual fields* are
  placeholders.
- **14 Placeholder Code** — stub functions or classes marked
  placeholder. PI is placed on the *field* granularity: a real
  object with real and fake fields mixed.
- **16 Workaround Substitution** — random numbers or unrelated
  computations substituted for real logic. PI often overlaps
  (example 07: `Math.random()*40+60` for `averageScore`); when both
  patterns co-occur, the category placement follows the object-shape
  criterion.

## Detection approach

Static scan over the VibeCoding repository for multi-field return
objects where at least one field is a placeholder constant annotated
with a `// TODO:` comment naming the intended real computation.
Concrete markers:

- `progress: 0 // TODO: Calculate`
- `instructor: 'Unknown Instructor' // TODO: Get actual`
- `difficulty: 'BEGINNER' as const // Default`
- `maxScore: 100 // TODO: Calculate actual max`
- `averageScore: Math.floor(Math.random() * 40) + 60 // TODO`
- `userId: 'default-user' // TODO: Get actual user ID`

## Source of evidence

Public repository at `https://github.com/asimsinan/VibeCoding`. File
paths are reviewer-inspectable in each exemplar's YAML header.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Partial Implementation` section
naming the placeholder fields, the real-computation TODO, and the
downstream consequence of the placeholder.


## Exemplars in this folder — 8 distinct sub-forms

| # | Sub-form | Representative |
|---|---|---|
| 01 | **Seed** — 7-field TODO block in list-resource response | `progress: 0 / instructor: 'Unknown Instructor' / studentCount: 0 / duration: 0 / difficulty: 'BEGINNER' / rating: 0 / price: 0` |
| 02 | Simplest form — two zeros with TODO | `clearedItems: { drawings: 0, stickyNotes: 0 // TODO: Get actual counts }` |
| 03 | Single-field form with a functional consequence | `maxScore: 100 // TODO: Calculate actual max score from questions` — every quiz graded against a fictional maximum |
| 04 | Seed block recurring in same file, different response path | Same 7-field block in a separate route of `student/courses/route.ts` |
| 05 | Companion endpoint — same block in detail endpoint | 4-field block in `student/courses/[id]/route.ts` paired with example 04 |
| 06 | Proxy-field form (real field used as the placeholder's value) | `lastLoginAt: user.createdAt.toISOString() // TODO: Add lastLoginAt field` |
| 07 | **PI + fake randomness composite** | `averageScore: Math.floor(Math.random() * 40) + 60 // TODO: Calculate actual average score` |
| 08 | CLI-form with `as any` cast tell | `userId: 'default-user' // TODO: Get actual user ID, status: 'active' as any` |

The sub-form column is the intended reviewer lens. Example 07 is the
most diagnostic: the placeholder produces a *different value on every
request* (random 60..99), which means a naive consumer or audit tool
that checks only for "is the value constant" will miss the fabrication
entirely — the placeholder has learned to look non-placeholder.
