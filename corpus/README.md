# Evidence Corpus

This folder contains the empirical evidence backing the 23-category taxonomy of
LLM verification-evasion patterns reported in the paper:

> **"LLM Verification-Evasion Patterns in AI-Assisted Software Development:
> A Taxonomy and Implications for Developer Trust"**
> (Information and Software Technology, Special Issue on Human Factor in
> Generative AI.)

It is a companion artifact to Appendix A of the paper. Appendix A prints **one
representative example per category** (23 entries, in a *Source / Evidence /
Pattern* structure); this folder holds **355 manually-verified exemplars
across the 23 categories** (248 chat-sourced + 107 code-sourced), organised
by theme and category so that a reviewer can browse every instance without
leaving the repository.

### Why a corpus rather than a survey?

The evidence base is deliberately *artefact-based*, not self-report-based.
Every category claim in the paper can be traced through Appendix A to one
or more exemplars in this corpus to the underlying source artefact (a chat
turn in the practitioner's Cursor session store, or a file in the public
VibeCoding repository). The evidence path is **paper → corpus → source
artefact**; at no point does the reader depend on the practitioner's or a
third party's recollection. Every retained exemplar has been manually read
by the practitioner-analyst, is tagged `audit-status: manual-verified` in
its YAML header, and carries a `## Why this is X` rationale paragraph that
names the sub-form the excerpt instantiates in plain English.

### This corpus is a reviewer-inspection superset of the paper's analysis

The extractors that populate this folder (`_extract_chat_examples.py` and
`_extract_code_examples.py`) use deliberately broader patterns
(`_extra_patterns.yaml` and expanded code regexes) than the paper's
quantitative analysis layer. The paper's framework-effectiveness,
triangulated cross-family presence, static precision/recall, and
per-project static prevalence tables are produced by the canonical
detectors in `analysis-scripts/` (`04_phrase_patterns.yaml`,
`04b_phrase_patterns_broad.yaml`, `07_semantic_anchors.yaml`,
`10_cross_family_semantic.py`, and `01_static_evasion_markers.sh`). Re-running the corpus extractors is
expected to produce **more hits** than the paper's canonical detectors
for categories whose corpus patterns were later widened; this divergence
is intentional. The corpus is a richer evidence browser for reviewers;
the paper's tables are the strict-pattern measurement layer.

## Structure

Six subfolders, one per taxonomy theme, each containing one subfolder per
category (23 categories in total). Categories are numbered `NN-category-name`
in taxonomic order:

```
corpus/
├── README.md                       (this file)
├── Fabrication/
│   ├── 01-fabricated-completion/
│   ├── 02-verification-bypass/
│   └── 03-description-substitution/
├── Avoidance/
│   ├── 04-task-reordering/
│   ├── 05-deferred-implementation/
│   ├── 06-complexity-avoidance/
│   ├── 07-test-avoidance/
│   └── 08-scope-creep-deflection/
├── Manipulation/
│   ├── 09-retroactive-honesty/
│   ├── 10-apology-theater/
│   └── 11-permission-seeking/
├── Minimization/
│   ├── 12-partial-implementation/
│   ├── 13-requirement-cherry-picking/
│   ├── 14-placeholder-code/
│   ├── 15-structural-completion/
│   └── 16-workaround-substitution/
├── Excuse-Making/
│   ├── 17-time-constraint-excuse/
│   ├── 18-efficiency-excuse/
│   └── 19-documentation-substitution/
└── Process-Violation/
    ├── 20-progress-theater/
    ├── 21-premature-optimization/
    ├── 22-simultaneous-completion/
    └── 23-specification-fabrication/
```

Each category folder contains:

- `README.md` — operational definition, detection mechanism, source of evidence.
- `example-NN.md` — one or more exemplars. Each file has a YAML metadata
  header describing provenance and evidentiary status, followed by the
  verbatim excerpt.

## Data sources

Two sources feed the corpus:

1. **VibeCoding project repository** (public, `https://github.com/asimsinan/VibeCoding`)
   — eighteen Spec2Code projects, ~19,000 source files. Code-level categories
   (Fabrication, Minimization, most of Avoidance, Specification Fabrication) draw
   from this source.
2. **Cursor state.vscdb chat-interaction corpus** (private) — the lead
   practitioner's own Cursor chat history. Chat-level categories (Manipulation,
   Excuse-Making, Process Violation, some Avoidance) draw from this source.
   Full database is not redistributed; verbatim excerpts reproduced here are
   minimally anonymized (see below).

## Evidentiary status

Each example carries a `evidentiary-status` metadata field with one of four
values:

| Value | Meaning |
|---|---|
| `verbatim` | Exact quote, unchanged from source |
| `excerpt` | Exact quote, trimmed (ellipses or structural excision) |
| `paraphrased` | Approximate wording from multiple sessions with the same pattern |
| `illustrative` | Reconstructed example marked as such; used only when no verbatim match existed for the category |

Paraphrased and illustrative examples are used sparingly and only where
verbatim matches were not available in the corpus. Verbatim and excerpt
examples are the default.

## Anonymization policy

The same policy applied in Appendix A of the paper is applied here:

- **Project names inside VibeCoding** are kept as-is (the repository is public).
- **Non-VibeCoding project names** are replaced with `[anonymized project]`.
- **File paths outside the VibeCoding repository** are replaced with
  `[private path]`.
- **Email addresses, personal URLs, API keys, and tokens** are redacted.
- **Third-party collaborator references** are redacted.

No participant data is reproduced: the paper is a single-practitioner
reflexive case study and contains no external human-subject material.

## Metadata schema

Each `example-NN.md` begins with a YAML frontmatter block, followed by the
verbatim content and (where applicable) a rationale section:

```markdown
---
category: Retroactive Honesty
category-id: 9
theme: Manipulation
source: chat-interaction-corpus
project: [anonymized]
file: null
evidentiary-status: verbatim
audit-status: pattern-matched
detector: getAntiEvasionRules
---

"You're absolutely right, and I apologize! I spent all that time fixing
tests and didn't actually build the core application..."
```

Fields:

- `category` — taxonomy category label
- `category-id` — numeric ID (1–23)
- `theme` — one of the six themes
- `source` — `vibecoding-repo` or `chat-interaction-corpus`
- `project` — source project name (for VibeCoding) or `[anonymized]`
- `file` — source file path (for VibeCoding) or `null` (for chat corpus)
- `evidentiary-status` — see table above
- `audit-status` — `pattern-matched` (auto-extracted by phrase or regex
  matching; not manually reviewed) or `manual-verified` (individually read
  and judged to fit the category's operational definition; accompanied by a
  `## Why this is <Category>` section in the file body that explains the
  fit)
- `detector` — detector function name in the Spec2Code framework source
  (optional; populated where a specific detector applies)

## How to read this folder

- Start at the README of the theme that interests you.
- Drill into a category for its operational definition and a list of exemplars.
- Each exemplar is a standalone markdown file you can read in seconds.
- The paper's Appendix A reproduces a curated subset of these exemplars;
  this folder is the superset.

## Reproducibility

Chat-level examples were extracted with the same phrase patterns used in the
paper's quantitative analysis (`analysis-scripts/04_phrase_patterns.yaml`,
`04b_phrase_patterns_broad.yaml`) plus corpus-only widened patterns for
reviewer browsing. Code-level examples were identified with the same static
scanner (`analysis-scripts/01_static_evasion_markers.sh`) and corpus-only
expanded regexes, then manually verified. The corpus is therefore an
inspection superset, not a direct reproduction of the paper's quantitative
tables.

## License

Released under the same license as the Spec2Code framework. See the top-level
repository for details.
