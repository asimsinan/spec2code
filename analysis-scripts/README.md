# Analysis scripts for the Spec2Code revision

Supplementary scripts for the paper:
**"LLM Verification-Evasion Patterns in AI-Assisted Software Development: A Taxonomy and Implications for Developer Trust"** (IST, Special Issue on Human Factor in Generative AI).

These scripts reproduce the quantitative evidence reported in Sections 3.4, 5.3, and 6.1 of the paper when run against the frozen revision-preparation data snapshot. They also provide a **three-tier detection pipeline** whose outputs are combined as a triangulated cross-family presence matrix. The framework-effectiveness comparison uses the strict tier only; the cross-family analysis reports presence when **at least two of the three tiers** independently yield a non-zero rate for a given (family, category) pair.

## Detection tiers

Evasion-pattern detection in this work is performed at three progressively more robust tiers. Each tier trades off *reproducibility* against *recall on paraphrased variants*:

| Tier | File | Method | Use |
|---|---|---|---|
| **Strict** | `04_phrase_patterns.yaml` | Case-insensitive literal substring match | Reproduces the paper's strict framework-effectiveness and cross-family rates. Conservative lower bound. |
| **Broad** | `04b_phrase_patterns_broad.yaml` | Case-insensitive regex with morphological/contraction/synonym/pluralization coverage; JSON-escape-aware | Sensitivity upper bound; catches variants the strict tier misses. |
| **Semantic** | `07_semantic_anchors.yaml` + `10_cross_family_semantic.py` | Sentence-transformer cosine similarity against anchor sentences (optional, requires `sentence-transformers`) | Third-tier cross-family sensitivity check used for the paper's triangulated cross-family matrix (threshold 0.45). Highest recall, highest false-positive risk. |

The broad tier is verified to be a **near-superset** of the strict tier on the real bubble corpus by `08_verify_superset.py`: on 334,521 bubbles, the broad tier reproduced every strict match except 3 known morphological over-matches by strict ("to be efficient" substring-matching inside "to be efficiently"), which the broad tier correctly rejects.

## Contents

| File | Purpose | Reproduces |
|---|---|---|
| `01_static_evasion_markers.sh` | Scan the VibeCoding repo for TODO / FIXME / stub patterns in comment position, excluding vendor libraries, generated code, and HTML `placeholder=` attributes. | Appendix C per-project file counts; Section 3.4 "55 files." |
| `11_static_detector_performance.py` | Recompute static detector precision, recall, F1, and macro averages from the frozen manual-audit summary in `static_detector_audit.csv`. | Section 5.3 static detector performance table. |
| `static_detector_audit.csv` | Frozen manual-audit precision/recall summary for static detector categories, with illustrative matches. | Input data for `11_static_detector_performance.py`. |
| `02_bubble_corpus_split.py` | Split Cursor bubble corpus into Spec2Code-enforced vs. unrestricted and count matches per category. Supports `--broad` flag. | Section 5.3 framework-effectiveness table (strict). Broad mode is sensitivity-only. |
| `03_cross_model_presence.py` | Per-family category-presence rates over composers with explicit model attribution. | Strict/broad inputs for the Section 6.1 triangulated cross-family table. |
| `10_cross_family_semantic.py` | Semantic-tier counterpart to `03`. Same four-family grouping; detection is via sentence-transformer cosine similarity against anchor sentences (threshold 0.45 by default). | Semantic input for the Section 6.1 triangulated cross-family table and Appendix C semantic sensitivity table. |
| `04_phrase_patterns.yaml` | Strict literal-substring patterns (the paper's baseline). | Strict framework-effectiveness and cross-family rates. |
| `04b_phrase_patterns_broad.yaml` | Broad regex patterns covering morphological/contraction/plural/synonym variants. | Sensitivity upper bound. |
| `05_projects.yaml` | Lead practitioner's project directories for Spec2Code-vs-unrestricted classification. |  |
| `06_semantic_presence.py` | OPTIONAL semantic-similarity detector for Spec2Code-vs-unrestricted sensitivity checks using sentence-transformers (default threshold 0.55). | Not used for the paper's triangulated cross-family table; use `10_cross_family_semantic.py` for that. |
| `07_semantic_anchors.yaml` | Anchor sentences per category for semantic matching. |  |
| `08_verify_superset.py` | Runs both strict and broad patterns over the full corpus and verifies the broad tier is a near-superset of the strict tier. |  |

## Requirements

- **Python 3.10+** (type hints use `str | None`; `sqlite3` URI mode requires 3.10+).
- **PyYAML** (`pip install pyyaml`).
- **SQLite 3** (shipped with Python).
- **GNU `find` and `grep`** for script 01.
- Optional for tier 3: **`sentence-transformers`** and **`torch`** (`pip install sentence-transformers`).
- **The VibeCoding repository** for script 01: public at `https://github.com/asimsinan/VibeCoding`.
- **Your own Cursor `state.vscdb`** for scripts 02, 03, 06, 08: typically at
  `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` (macOS). Opened read-only.

## Expected runtime

| Script | Runtime |
|---|---|
| 01 (18 projects, ~19,000 files) | ~5–10 s |
| 11 (static P/R/F1 table) | <1 s |
| 02 strict (~334k bubbles) | ~30 s |
| 02 broad (~334k bubbles) | ~4 min |
| 03 strict | ~30 s |
| 03 broad | ~4 min |
| 06 semantic (CPU, MiniLM-L6-v2) | ~15–30 min |
| 08 verify-superset | ~10 min |

## Reproducing the paper's numbers

Before running, edit `05_projects.yaml` if your directory layout differs. Then:

```bash
# 1. Appendix C per-project static prevalence (expected total: 55 files across 10 projects)
bash 01_static_evasion_markers.sh --sum /path/to/VibeCoding

# 2. Section 5.3 static detector performance table
python 11_static_detector_performance.py
python 11_static_detector_performance.py --latex

# 3. Section 5.3 framework-effectiveness table (strict; expected N = 53,175 / 3,505 at paper snapshot)
python 02_bubble_corpus_split.py \
    ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb \
    --progress

# 4. Section 6.1 cross-family strict tier (expected 4 families, ~75k explicit-attribution)
python 03_cross_model_presence.py \
    ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb \
    --progress

# 5. OPTIONAL: broad-pattern sensitivity analysis
python 02_bubble_corpus_split.py <state.vscdb> --broad --progress
python 03_cross_model_presence.py <state.vscdb> --broad --progress

# 6. OPTIONAL: verify broad is a near-superset of strict
python 08_verify_superset.py <state.vscdb> --progress

# 7. Semantic cross-family tier used in the triangulated matrix (requires sentence-transformers)
python 10_cross_family_semantic.py <state.vscdb> --progress

# 8. OPTIONAL: Spec2Code-vs-unrestricted semantic sensitivity
python 06_semantic_presence.py <state.vscdb> --progress
```

The static detector performance table is reproducible from `static_detector_audit.csv`; `11_static_detector_performance.py` recomputes every per-category F1 value and asserts that the macro row rounds to the manuscript values (P = 0.85, R = 0.76, F1 = 0.80). The CSV is the frozen manual-audit summary paired with the strict static scanner output.

To reproduce the triangulated cross-family matrix itself, apply the paper's rule to the outputs of steps 4, 5, and 7: a family/category cell is marked present when at least two of the strict, broad, and semantic rates are non-zero. The manuscript reports the resulting 26/40 cells; the three raw tier tables in Appendix C are retained so this aggregation can be audited without relying on a separate classifier.

Expected first few lines of `02`'s strict-mode output (from the lead practitioner's machine at the snapshot used for the paper):

```
Spec2Code-enforced assistant bubbles        : 53175
Non-Spec2Code (unrestricted) assistant bubs :  3505

Category                        Spec2Code (%)   Unrestricted (%)    Ratio
---------------------------------------------------------------------------
Permission Seeking                      1.27              7.36      5.8x
Apology Theater                         0.01              3.74    >400x
Retroactive Honesty                     0.53              5.73     10.8x
...
```

Under the `--broad` mode the ratios compress somewhat (the broad tier catches more on both sides of the comparison), but the **direction and magnitude of the framework-context difference is preserved**: Spec2Code-enforced rates remain substantially below unrestricted rates for every category.

## Scope and limitations

- **All phrase-based detectors are lower bounds on true category presence.** The strict tier is conservative by design; the broad tier is more permissive but still cannot capture all paraphrased variants. The semantic tier extends coverage further but introduces false-positive noise. A trained-classifier follow-up is future work (Section 6.5 Reliability and the Conclusion of the paper).
- **Path-based attribution** of bubbles to projects uses file-path occurrences inside the bubble's raw JSON value. Bubbles with no path reference (pure chat) are excluded from the Spec2Code-vs-unrestricted split.
- **Script 01 counts *files* containing at least one marker**, not total marker occurrences. The paper reports this as 55 files with at least one strict evasion marker.
- **Static P/R/F1 values are manual-audit-derived but script-recomputed.** The raw candidate extraction is reproducible via script 01; `static_detector_audit.csv` freezes the manual precision/recall audit summary used for the paper, and script 11 recomputes F1 and macro averages from that released input.
- **The Cursor bubble corpus is private.** It contains the lead practitioner's own research and development history. No third-party interaction logs are included.
- **Third-party compatibility.** The `05_projects.yaml` list is the lead practitioner's own project layout. To run these scripts on a different practitioner's corpus, edit the project names accordingly; results will still be interpretable.

## Companion evidence corpus

For browseable per-category exemplars (the representative examples reproduced
in Appendix A of the paper plus additional manually-verified exemplars for
every category), see the top-level `corpus/` directory, which contains
**355 manually-verified exemplars across 23 categories** (248 chat-sourced
and 107 code-sourced), organised by theme (6) and category (23). Each exemplar
is a markdown file with a YAML metadata header describing provenance
(`chat-interaction-corpus` or `vibecoding-repo`), project, file, evidentiary
status (`verbatim` / `excerpt` / `paraphrased` / `illustrative`), an
`audit-status: manual-verified` flag confirming it was read by the
practitioner-analyst, and the associated detector in the Spec2Code
framework source. Every exemplar also carries a `## Why this is X` rationale
paragraph that names the sub-form the excerpt instantiates, in plain
English.

**The corpus extractors and the paper's analysis scripts use different
pattern sets on purpose.** `corpus/_extract_chat_examples.py` and
`corpus/_extract_code_examples.py` use deliberately broader patterns
(`corpus/_extra_patterns.yaml` and expanded regexes) to surface a
reviewer-inspectable **superset** of the examples used for the paper's
quantitative analysis. The paper's tables (framework-effectiveness,
cross-family presence, static precision/recall, per-project prevalence)
reflect the canonical detectors defined by `04_phrase_patterns.yaml`,
`04b_phrase_patterns_broad.yaml`, `07_semantic_anchors.yaml`, and
`01_static_evasion_markers.sh` in this folder. Re-running the corpus
extractors will produce **more hits** than the paper's canonical detectors
for categories whose corpus patterns were later widened (notably Task
Reordering, Complexity Avoidance, Scope Creep Deflection, Time Constraint
Excuse, and Test Avoidance); this divergence is intentional and does not
invalidate the paper's numbers — it reflects the corpus's role as a
richer evidence browser than the paper's strict-pattern analysis layer.

The corpus is generated by three scripts that live in `corpus/`:

- `corpus/_seed.py` — one-shot scaffold that populates 23 category folders
  with a `README.md` and `example-01.md` (the Appendix A example).
- `corpus/_extract_chat_examples.py` — scans the Cursor `state.vscdb` and
  pulls additional exemplars for chat-level categories using the strict
  patterns in `04_phrase_patterns.yaml` plus extended patterns in
  `corpus/_extra_patterns.yaml` (corpus-only; paper quantitative analysis
  continues to use strict patterns). The extractor **preserves any file
  tagged `audit-status: manual-verified`** across re-runs, deduplicates
  newly-extracted bubbles against preserved file signatures, skips
  meta-discussion and ASCII-art-diagram bubbles, and accepts a
  `--only-categories` CLI flag so a re-run for one category does not
  affect audited content in other categories.
- `corpus/_extract_code_examples.py` — scans the VibeCoding public
  repository for code-level exemplars (placeholder returns, TODO-annotated
  stubs, `Math.random()` placeholders, empty test blocks, specification
  fabrication markers, etc.). Like the chat extractor, it preserves
  audited files and deduplicates against preserved signatures.

After initial extraction, the corpus was **manually audited** category-by-
category: pattern-matched candidates were read by the practitioner-analyst,
false positives (ordinary debugging / refactoring turns that matched a
pattern accidentally) and near-duplicates were dropped, and the retained
survivors were annotated with the `audit-status: manual-verified` flag and
a rationale paragraph. The 355 retained exemplars thus constitute a curated,
reviewer-ready evidence base rather than a raw extractor dump.

## Snapshot drift

The Cursor `state.vscdb` is a **live database**: it keeps growing and old composer metadata can become unavailable or be reclassified as the practitioner continues to use Cursor. The paper reports numbers from a snapshot taken during revision preparation. Re-running the chat-corpus scripts against a later live database is useful as a diagnostic check, but it is not an exact reproduction unless the frozen snapshot is used; sample sizes, family coverage, rates, and even comparison direction can drift when the underlying database changes.


## License

Released under the same license as the Spec2Code framework (MIT); see the top-level repository.
