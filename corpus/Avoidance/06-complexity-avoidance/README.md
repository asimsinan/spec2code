# 06 — Complexity Avoidance

**Theme:** Avoidance

## Operational definition

The LLM explicitly reduces the scope or difficulty of an implementation
when confronted with genuine complexity. The distinguishing pattern is a
statement that names or implies the fuller/ideal approach and then
selects a narrower alternative, typically signalled by phrases such as
`for simplicity`, `simpler version`, `let's simplify`, `without the
complexity`, `to keep it simple`, `skip validation for`, `handles only
the happy path`. The edge case, abstraction, dependency, or feature
required by the specification is not merely deferred — it is removed
from the delivered surface.

## Detection approach

The extractor scans assistant chat bubbles for the phrases listed in
`corpus/_extra_patterns.yaml` under `Complexity Avoidance`. Candidates
are then filtered for meta-discussion (taxonomy turns, audit notes),
template tutorialisation, and ASCII-art diagrams before being written
here.

Purely descriptive labels for existing code (`simpler approach`,
`minimal implementation`, `basic implementation`) are deliberately
excluded because they overlap heavily with ordinary minimal-code
discussion and with TDD terminology (`minimal implementation to pass
tests`). The key manual-audit discriminator is that the bubble must
either (a) name or imply the fuller alternative and then choose the
simpler path, or (b) explicitly identify a concern (validation, edge
cases, error handling, a dependency) and drop it.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized (project names, private file paths, emails, tokens)
per the policy in `corpus/README.md`. `example-01.md` is illustrative
and mirrors Appendix A of the paper; all other examples are verbatim
assistant turns from development sessions.

## Manual audit

All exemplars in this folder have been manually reviewed and are marked
with `audit-status: manual-verified` in their YAML metadata. Each file
includes a `## Why this is Complexity Avoidance` section explaining
which ideal alternative was named, which simpler path was selected, and
what in the wording makes it scope reduction rather than ordinary
design-time trade-off.

## Exemplars in this folder

`example-01.md` is the illustrative Appendix A example. `example-02.md`
through `example-34.md` are verbatim chat excerpts covering the
diversity of Complexity Avoidance sub-forms:

- **Module-integration avoidance** (04, 05 — Parser class stubs;
  02 — mock benchmark without real backend modules; 21 — query client
  without React Query; 22 — payment API without PaymentManager;
  27 — WebRTCService simplification)
- **Configuration / dependency avoidance** (03 — OpenCV direct, no SNPE;
  19 — separate `tsconfig.json` + exclude instead of monorepo;
  20 — backend with mock data instead of DB; 30 — avoid full SAM 2 model;
  31 — Python 3.12 without NeRF libraries)
- **Multi-input / option collapse** (06, 07 — single image for two
  inputs; 09 — enumerate Options A/B/C, pick simpler B; 11 — truncate
  longer lane in center-path averaging)
- **Explicit-bypass framings** (08 — bypassing manual homography
  calibration)
- **UI / feature removal** (10 — skip hide/re-create trackbar; 12 —
  static text instead of i18n provider; 25 — remove OAuth providers;
  26 — remove colour-mode system; 32 — basic lighting, no PBR)
- **Edge-case skips** (14 — skip URL validation for empty strings;
  29 — empty-data path instead of the failing real path)
- **Time-pressure rewrites** (13, 34 — "this is taking too long" framings)
- **Test scope reductions** (15 — refresh-token test simplification;
  16 — CLI test "without actually running the CLI"; 33 — test without
  JSX rendering)
- **Security-control downgrades** (24 — XSS protection replaced with
  simpler implementation)
- **Refactor-as-scope-reduction** (17 — acknowledges deployed API is
  simplified; 18 — hardcoded time slots; 23 — "rather than fixing them
  one by one" rewrite; 28 — File-model-or-simplified-version choice)
