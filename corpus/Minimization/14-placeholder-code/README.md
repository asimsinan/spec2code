# 14 — Placeholder Code

**Theme:** Minimization

## Operational definition

A function body is an explicit placeholder instead of the required
behaviour. The distinguishing feature is that the body is structurally
present — signature, return type, route wiring — and **self-declares**
as a placeholder via a comment (`// Placeholder response`, `// This is
a placeholder implementation`), a narrative return payload (`'X
endpoint - not implemented yet'`), or a runtime error (`throw new
Error('X not implemented yet')`).

Three common sub-forms appear in the corpus:

1. **Return-not-implemented** — the function returns a 200 OK with a
   narrative message naming the endpoint as not implemented. The HTTP
   contract is satisfied; the semantic contract is not.
2. **Comment-simulated** — `// This would typically do X / // For now,
   we'll simulate Y`. The real intent and the substitute are both named
   in comments above a simulation-only body.
3. **Throw-stub** — `throw new Error('X endpoints not implemented yet')`
   surfaces the stub at runtime to the caller.

Adjacent categories:

- **12 Partial Implementation** — object with some real and some
  placeholder fields. PC is for whole-function placeholders.
- **05 Deferred Implementation** — TODO markers on individual lines.
  PC is the function-body form of the same pattern.
- **15 Structural Completion** — stub route returns a success-looking
  response. PC overlaps; the distinction is that Structural Completion
  focuses on **the response looking valid** while PC focuses on **the
  body self-declaring as placeholder**.

## Detection approach

Static scan for:

- `"not implemented yet"` string literals in `return` payloads
- `"Placeholder response"` / `"This is a placeholder implementation"`
  comment markers above function bodies
- `throw new Error('...not implemented yet')` stubs
- `"For now, we'll simulate"` / `"This would typically"` comment
  diptychs

## Source of evidence

Public repository at `https://github.com/asimsinan/VibeCoding`. File
paths are reviewer-inspectable in each exemplar's YAML header.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Placeholder Code` section
naming the sub-form and the specific self-declaration.


## Exemplars in this folder — 8 distinct sub-forms

| # | Sub-form | Representative |
|---|---|---|
| 01 | **Seed** — Next.js route returns `'endpoint - not implemented yet'` with 200 OK | `api/v1/auth/login/route.ts` |
| 02 | **Comment-simulated** (`This would typically X / For now, simulate Y`) | `tests/performance/monitor.js` |
| 03 | Docstring-annotated placeholder implementation | `authMiddleware.ts` — "This is a placeholder implementation - in a real app..." |
| 04 | **Batch-annotated** placeholder for a whole route group | `src/app/api/server.ts` — `// API routes (placeholder implementations for testing)` |
| 05 | Auth-logic placeholder | `src/lib/auth.ts` — user-lookup with `// TODO: Implement user authentication logic` |
| 06 | **Dangerous-default placeholder** | Same `auth.ts` — `const isValidPassword = true;` (accepts every password) |
| 07 | Canonical route-placeholder (cluster rep) | `api/notifications/route.ts` GET — one of ~28 similar route files |
| 08 | Throw-stub form | `apiService.ts` — `throw new Error('Workspace endpoints not implemented yet')` |

### Key structural insight

Example 06 (`isValidPassword = true`) is the most consequential
placeholder in the corpus: the body self-declares as a placeholder
(`// This is a placeholder implementation / // Replace with actual
password verification`) but the *return value* it picks is the one
that defeats the surrounding check (`if (!isValidPassword) return
null`). The placeholder does more than omit behaviour — it asserts a
default that inverts the authentication outcome. If the TODO is not
replaced before deployment, every login attempt succeeds.

The cluster structure of example 07 (one representative of ~28
near-identical route files) illustrates that Placeholder Code can be
a **project-wide scaffolding template** rather than a handful of
isolated stubs: the practitioner used the same placeholder-response
shape across the entire API surface during early development, and
each stub relies on the template being replaced individually.
