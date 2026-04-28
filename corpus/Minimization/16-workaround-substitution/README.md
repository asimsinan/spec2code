# 16 — Workaround Substitution

**Theme:** Minimization

## Operational definition

A computed value required by the specification — an analytics
aggregate, a review score, a conflict-detection signal, a CPU
telemetry number — is substituted with a **plausible but unrelated
function of inputs**. The substitute most commonly takes the form of
`Math.random()` scaled into a sensible range, but other variants
include a round-robin index (`index % N`), a multiplication of a
real count by a fixed constant (`modules * 30 min`), or a constant
threshold (`70% success rate`).

The distinguishing feature compared to adjacent categories:

- **12 Partial Implementation** — placeholder *constants* (zeros,
  'Unknown X', 'BEGINNER'). Workaround Substitution uses values
  that vary across calls, which defeats naive constant-detection.
- **14 Placeholder Code** — whole-function stubs. Workaround
  Substitution slots a substitute *inside* an otherwise-real
  function body.
- **03 Description Substitution** — an adjective claim without
  evidence. Workaround Substitution is a *value* claim backed by
  mathematics that looks related but isn't.

The most diagnostic property is the **detector-resistance**: a
Workaround Substitution produces a value for every request, in the
right range, with variation between requests. Constant-detection
passes. Shape-validation passes. Integration tests pass. Only
ground-truth comparison against real underlying data reveals that
the numbers are manufactured.

## Detection approach

Scan production code paths (excluding test files, seed scripts,
password generators, UUID generators, retry jitter, analytics
sampling) for `Math.random()` calls. The key manual-audit
distinction is context:

- `Math.random()` in ID generation → legitimate
- `Math.random()` as retry-jitter → legitimate
- `Math.random()` as sampling threshold for analytics → legitimate
- `Math.random()` to generate password characters → legitimate
- `Math.random()` **in a response field that the spec defines as
  computed from real data** → Workaround Substitution

Round-robin and fixed-factor workarounds (`index % N`, `count * K`)
are also kept when they substitute for real computation.

## Source of evidence

Public repository at `https://github.com/asimsinan/VibeCoding`.
File paths are reviewer-inspectable in each exemplar's YAML header.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Workaround Substitution`
section naming the real computation and the substitute function.


## Exemplars in this folder — 6 distinct sub-forms

| # | Sub-form | Representative |
|---|---|---|
| 01 | **Seed** — single-field analytics substitute | `averageScore: Math.floor(Math.random() * 40) + 60 // TODO` |
| 02 | **Four-field composite** | Catalog entry where `duration`, `difficulty`, `rating`, `price` are all fabricated from index or `Math.random()` |
| 03 | Canonical code instance of the seed | `instructor/analytics/students/route.ts` — real/real/random three-field pattern |
| 04 | **Fabricated product-core scores** | ResumeReviewer `mock-app.ts` — four review scores (overall, content, formatting, keyword) all `Math.random()` |
| 05 | Randomised telemetry | health-controller.ts — CPU usage returned as `Math.random() * 100` |
| 06 | Simulated-decision form | sync-manager.ts — `const hasConflict = Math.random() < 0.1` (10 % chance of conflict) |
| 07 | Simulated-outcome form | error-handler.ts retry — `if (Math.random() < 0.7) return; else throw Error('Retry failed')` |

### Key structural insight

Examples 04–07 show that Workaround Substitution is not confined to
the "fake a metric" form. It also appears as:

- **Fake product functionality** (04 — the resume reviewer's
  entire scoring system is `Math.random()`)
- **Fake telemetry** (05 — a CPU metric that looks real and
  isn't)
- **Fake system behaviour** (06, 07 — decisions about conflict
  detection and retry success/failure made by random draw)

In every case the substitute preserves the output's *type and range*
so downstream code paths run, and removes the output's *relation to
reality*. The gap between the two is the category's core failure
mode.
