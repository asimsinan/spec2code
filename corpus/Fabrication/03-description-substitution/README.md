# 03 — Description Substitution

**Theme:** Fabrication

## Operational definition

A description of the system — a string literal in code, a comment, a
markdown block, or a status bullet in chat — asserts a completion
property that the surrounding code or the adjacent description
contradicts. The description *is* the evidence offered, and the
contradiction is either internal to the same bubble/file (a ✅ row
next to a ⚠️ row that subsumes it) or external (the claim "no
placeholders" next to an unremoved `placeholder="..."` attribute).

The distinguishing feature is that the **description's adjective or
qualifier does the verification work**: "fully functional", "complete",
"100 %", "zero errors", "no placeholders", "production ready",
"comprehensive", "well-organized". Removing the adjective leaves a
claim that could be checked; keeping the adjective makes the check
unnecessary.

Adjacent categories:

- **01 Fabricated Completion** — claims a task/feature is complete
  via headlines and banners. FC is about *task-level* claims; DescSub
  is about *property-level* adjectives.
- **02 Verification Bypass** — claims what a test run produced. VB
  is narrower: it describes a command outcome. DescSub covers a
  broader set of properties (coverage claims, placeholder absence,
  "well-organized", "type-safe", etc.).
- **19 Documentation Substitution** — a narrative doc is offered as
  completion evidence. DocSub overlaps with DescSub when the doc's
  prose contains descriptive claims; the distinction is that DocSub
  focuses on the narrative-as-artefact role, DescSub on the
  specific contradiction between the description and the code/doc
  around it.

Where an exemplar fits more than one category, it is placed where the
dominant rhetorical device lives. The rationale section names the
adjacent categories where relevant.

## Detection approach

- **Code-level**: scan for string literals and markdown asserting
  completion properties (`"no placeholder content"`, `"All components
  have real functionality"`, `"fully implemented"`, `"production
  ready"`). Cross-reference against the surrounding file for
  contradicting artefacts (`placeholder=`, `TODO`, stub returns,
  `Math.random()`, failing-test counts elsewhere in the file).
- **Chat-level**: scan assistant bubbles for adjective-loaded
  per-category bullets (`✅ **Complete X** ...`, `✅ **Type-safe
  ...** `, `✅ **Zero Y** ...`) where the adjective does the
  verification work.

## Source of evidence

- Code-level: public repository at
  `https://github.com/asimsinan/VibeCoding`. File paths are
  reviewer-inspectable in each exemplar's YAML header.
- Chat-level: Cursor `state.vscdb`, minimally anonymized per
  `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Description Substitution`
section naming the adjective or qualifier that performs the
substitution and the artefact, contradicting line, or caveat that
defeats it.

## Exemplars in this folder — 18 sub-forms of the pattern

`example-01.md` is the Appendix A seed (code-level: TSX component
with the string "No placeholder content" next to `placeholder=`
attributes). The remaining 19 span both code-level and chat-level
sub-forms:

### Code-level (6 exemplars)

| # | Sub-form | Representative |
|---|---|---|
| 01 | In-file literal vs. code contradiction | TSX string "NO placeholder content" + placeholder= attrs |
| 02 | Doc-level specific claim about placeholders | final-status.md "Fully functional API endpoints (no placeholders)" |
| 03 | Internal contradiction in same doc | actual-test-execution-results.md — 70 % pass + "Production Ready: YES" + "Complete: NO" |
| 04 | Canonical "placeholders removed" doc | implementation-complete.md "All placeholder implementations have been removed" |
| 05 | ✅-per-category verification-doc | design-system-verification.md every-bullet-✅ |
| 06 | Summary-doc "fully implemented" form | pages-implementation-summary.md "8 pages fully implemented" |

### Chat-level (14 exemplars)

| # | Sub-form | Representative phrase |
|---|---|---|
| 07 | Enumerated "fully functional" UI | "The YiBot mobile app now has a fully functional UI with: 1. ..." |
| 08 | Pipeline-completion "fully functional" | "Domain API fully functional: Created schema / Applied migrations / Populated data" |
| 09 | Short "fully functional" + inventory count | "SDD-MCP server is fully functional and provides 6 tools" |
| 10 | Big-banner **FULLY FUNCTIONAL!** | "## 🎉 Project Status: FULLY FUNCTIONAL!" |
| 11 | Comprehensive + fully-functional chained | blog app "comprehensive language support is now fully functional" |
| 12 | ✅ success with caveat in same bubble | "Current Status ✅ / Frontend: Successfully making API requests / Backend: falling back to empty data" |
| 13 | "Perfectly" header with partial-passing inside | "What's Working Perfectly / Search & Filtering - Most tests passing" |
| 14 | Stacked perfection claims | "100% complete / Zero Critical Issues / Production ready" |
| 15 | ✅ claim adjacent to ⚠️ caveats | "API Structure ✅ Well-organized ... / Authentication ⚠️ Working but no users exist" |
| 16 | System-of-record override (ACTUAL vs SDD) | "SDD System Status ❌ / ACTUAL Data Model Status ✅" |
| 17 | Every-bullet ✅ with adjective doing the work | "✅ Complete API coverage / ✅ Type-safe TypeScript / ✅ Automatic authentication" |
| 18 | Integration-complete assembled from subsystems | "UI Integration Complete! ✅ React Router ✅ Material-UI ✅ Auth context" |
| 19 | Features-plus-minimiser | "60+ features working / 6575+ linting warnings can be addressed later" |
| 20 | Multi-zero claim | "Zero TypeScript / Zero syntax / Zero import / 246 files clean" |

The sub-form table is the intended reviewer lens. Each exemplar
shows one distinct rhetorical shape in which an adjective, a
qualifier, or a structural device (✅-table, banner, system-of-record
override) substitutes for the verification that the adjective
claims. The set covers the range observed in the practitioner's
corpus.
