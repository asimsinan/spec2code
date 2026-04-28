# 07 — Test Avoidance

**Theme:** Avoidance

## Operational definition

Test files are present at the specified locations with the specified
names, and their `describe` / `it` titles advertise the coverage
required by the specification, but the test bodies do not actually
exercise the production behaviour they claim to cover. The net effect is
that the test suite looks populated to downstream readers (the test
file exists, the runner reports it as passing or skipped) while the
specified behaviour has no real coverage.

In practice this takes three sub-forms, all of which we treat as
Test Avoidance:

1. **Trivial-assertion form.** The test body asserts against local
   literal data only (e.g., `const userData = {...};
   expect(userData).toBeDefined();`) usually with a TODO comment
   enumerating the real flow that would be tested "later."
2. **Pseudo-assertion form.** The test body ends with a tautology
   (`expect(true).toBe(true)`, `expect(1).toBe(1)`) often marked
   `// Placeholder` or `// Placeholder test`. The runner reports the
   test as passing under all circumstances.
3. **Gated-skip form.** The test is fully written but gated with
   `.skip` (`describe.skip`, `it.skip`, `test.skip`, `xit`,
   `xdescribe`, `test.todo`) so that the runner marks it as skipped
   rather than failing. The specified behaviour is claimed in the test
   tree but never executed.

Legitimate conditional skips (e.g., `test.skip(browserName !== 'chromium',
'Chrome-specific test')` in a Playwright test that uses dynamic skip to
restrict a test to one browser) are **not** Test Avoidance and are
excluded during manual audit.

## Detection approach

Static scan over test files (`.test.*`, `.spec.*`, and files under
`__tests__/`, `tests/`, or `test/` directories) in the public
VibeCoding repository. The regex in `corpus/_extract_code_examples.py`
matches:

- `toBeDefined()` followed by a `// TODO` comment
- `// TODO: Implement … flow`
- Empty `describe(...)` and `it(...)` bodies
- `describe.skip(`, `it.skip(`, `test.skip(`, `test.todo(`, `xit(`,
  `xdescribe(`
- `expect(true).toBe(true)` (placeholder pseudo-assertion)

## Source of evidence

Public repository at `https://github.com/asimsinan/VibeCoding`. All 22
exemplars come from code artefacts in that repository and are
reviewer-inspectable at the referenced file paths (project name and
test file specified in each exemplar's YAML header).

## Manual audit

All exemplars in this folder have been manually reviewed and are marked
with `audit-status: manual-verified` in their YAML metadata. Each file
includes a `## Why this is Test Avoidance` section identifying which of
the three sub-forms the excerpt exemplifies and what the test advertises
versus what it actually checks.

## Exemplars in this folder

`example-01.md` is the Appendix A seed. The remaining 21 verbatim
excerpts span:

- **Trivial-assertion sub-form** (`11, 12, 13`) — all from
  `food-lens/tests/integration/system-integration.test.ts`, with
  example-12 being the strongest (six-step TODO comment enumerating the
  real flow).
- **Pseudo-assertion sub-form** (`07, 08, 09, 10, 14, 15, 16, 17, 18,
  19, 20, 21, 22`) — thirteen examples spanning eight distinct
  codebases and illustrating the common rationalisations: minimal
  "should be created" test (07), Test-X-logic comments (08-09),
  "we test the concept" (10), "tested indirectly" (14), named coverage
  without body (15-16), "in a real implementation, you'd test..." (17),
  contract-tests that don't test the contract (18-19), "passes if the
  above pass" (20), delegation to a different service (21-22).
- **Gated-skip sub-form** (`02, 03, 04, 05, 06`) — `describe.skip` for
  whole suites (02, 06) and `it.skip` for render, API-integration, and
  error-handling tests (03, 04, 05).
