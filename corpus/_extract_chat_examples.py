#!/usr/bin/env python3
"""Populate the chat-level categories under ``corpus/`` with additional
exemplars extracted from the Cursor ``state.vscdb`` chat-interaction corpus.

For each chat-level category we:
  1. Read the strict phrase patterns from ``analysis-scripts/04_phrase_patterns.yaml``.
  2. Scan assistant bubbles in the Cursor database.
  3. Collect up to ``--max-per-category`` distinct matches (de-duplicated by
     the first 200 characters of the assistant ``text`` field).
  4. Anonymize (strip file paths, redact project names outside VibeCoding,
     mask emails/URLs/tokens).
  5. Write ``example-NN.md`` files starting at ``example-02.md`` (example-01
     was seeded from Appendix A by ``_seed.py``).

Run after ``_seed.py``:

    python corpus/_extract_chat_examples.py \\
        "~/Library/Application Support/Cursor/User/globalStorage/state.vscdb" \\
        --max-per-category 10

Only the twelve categories listed in ``CHAT_CATEGORIES`` are touched; code-level
categories are left for ``_extract_code_examples.py``.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path
from typing import Dict, List, Optional

try:
    import yaml  # type: ignore
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
STRICT_PATTERNS_PATH = ROOT / "analysis-scripts" / "04_phrase_patterns.yaml"
EXTRA_PATTERNS_PATH = HERE / "_extra_patterns.yaml"


# All chat-level (and chat-visible code-level) categories we populate here.
# Values: (corpus folder relative path, start index for example-NN.md).
# Chat extractor uses both strict (04_phrase_patterns.yaml) and extended
# (_extra_patterns.yaml) pattern sets to maximise exemplar coverage; the
# paper's quantitative analysis continues to use strict patterns only.
CHAT_CATEGORIES: Dict[str, tuple[str, int]] = {
    "Permission Seeking":       ("Manipulation/11-permission-seeking", 2),
    "Apology Theater":          ("Manipulation/10-apology-theater", 2),
    "Retroactive Honesty":      ("Manipulation/09-retroactive-honesty", 2),
    "Time Constraint Excuse":   ("Excuse-Making/17-time-constraint-excuse", 2),
    "Progress Theater":         ("Process-Violation/20-progress-theater", 2),
    "Efficiency Excuse":        ("Excuse-Making/18-efficiency-excuse", 2),
    "Deferred Implementation":  ("Avoidance/05-deferred-implementation", 2),
    "Task Reordering":          ("Avoidance/04-task-reordering", 2),
    "Scope Creep Deflection":   ("Avoidance/08-scope-creep-deflection", 2),
    "Premature Optimization":   ("Process-Violation/21-premature-optimization", 2),
    "Simultaneous Completion":  ("Process-Violation/22-simultaneous-completion", 2),
    # Additional categories surfaced via chat excerpts (extra patterns only):
    "Complexity Avoidance":     ("Avoidance/06-complexity-avoidance", 2),
    "Verification Bypass":      ("Fabrication/02-verification-bypass", 2),
    "Description Substitution": ("Fabrication/03-description-substitution", 2),
    "Fabricated Completion":    ("Fabrication/01-fabricated-completion", 2),
    "Documentation Substitution": ("Excuse-Making/19-documentation-substitution", 2),
}

CATEGORY_IDS: Dict[str, int] = {
    "Fabricated Completion": 1,
    "Verification Bypass": 2,
    "Description Substitution": 3,
    "Task Reordering": 4,
    "Deferred Implementation": 5,
    "Complexity Avoidance": 6,
    "Scope Creep Deflection": 8,
    "Retroactive Honesty": 9,
    "Apology Theater": 10,
    "Permission Seeking": 11,
    "Time Constraint Excuse": 17,
    "Efficiency Excuse": 18,
    "Documentation Substitution": 19,
    "Progress Theater": 20,
    "Premature Optimization": 21,
    "Simultaneous Completion": 22,
}

CATEGORY_THEMES: Dict[str, str] = {
    "Fabricated Completion": "Fabrication",
    "Verification Bypass": "Fabrication",
    "Description Substitution": "Fabrication",
    "Task Reordering": "Avoidance",
    "Deferred Implementation": "Avoidance",
    "Complexity Avoidance": "Avoidance",
    "Scope Creep Deflection": "Avoidance",
    "Retroactive Honesty": "Manipulation",
    "Apology Theater": "Manipulation",
    "Permission Seeking": "Manipulation",
    "Time Constraint Excuse": "Excuse-Making",
    "Efficiency Excuse": "Excuse-Making",
    "Documentation Substitution": "Excuse-Making",
    "Progress Theater": "Process-Violation",
    "Premature Optimization": "Process-Violation",
    "Simultaneous Completion": "Process-Violation",
}

CATEGORY_DETECTORS: Dict[str, str] = {
    "Fabricated Completion": "verifyTaskCompletion",
    "Verification Bypass": "verifyTaskCompletion",
    "Description Substitution": "getImplementationStandards",
    "Task Reordering": "getAntiEvasionRules",
    "Deferred Implementation": "getAntiEvasionRules",
    "Complexity Avoidance": "getImplementationStandards",
    "Scope Creep Deflection": "getAntiEvasionRules",
    "Retroactive Honesty": "getAntiEvasionRules",
    "Apology Theater": "getAntiEvasionRules",
    "Permission Seeking": "getAntiEvasionRules",
    "Time Constraint Excuse": "getAntiEvasionRules",
    "Efficiency Excuse": "getAntiEvasionRules",
    "Documentation Substitution": "getAntiEvasionRules",
    "Progress Theater": "getAntiEvasionRules",
    "Premature Optimization": "getAntiEvasionRules",
    "Simultaneous Completion": "getAntiEvasionRules",
}


# VibeCoding project names that do NOT need anonymization.
VIBECODING_PROJECTS = {
    "VibeCoding", "MarketPlace", "LMS", "MentalHealthJournal", "WhiteBoard",
    "Kanban", "VideoConference", "food-lens", "PersonalShoppingAssistant",
    "uncle-taxim", "PersonalFinanceDashBoard", "ARDecorator",
    "AppointmentScheduler", "CrowdFunding", "EventOrganizer",
    "InvoiceGenerator", "RecipeFinder", "ResumeReviewer", "legal-assistant",
}

# Patterns the anonymizer redacts.
EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-.]+")
URL_RE = re.compile(r"https?://\S+")
TOKEN_RE = re.compile(r"(?i)(api[_-]?key|token|secret|bearer)[\"'\s:=]+[A-Za-z0-9_\-]{10,}")
DESKTOP_PATH_RE = re.compile(r"/Users/[^/\s\"']+/Desktop/([^/\s\"'`]+)(/[^\s\"'`]*)?")
HOME_PATH_RE = re.compile(r"/Users/[^/\s\"']+(/[^\s\"'`]*)?")


# Tokens that indicate a bubble is discussing the paper / taxonomy / scripts
# itself rather than exhibiting an evasion pattern during development work.
_META_TOKENS = (
    # Taxonomy / paper jargon
    "taxonomy",
    "evasion",
    "verification-evasion",
    "verification evasion",
    "manuscript",
    "appendix a",
    "appendix b",
    "appendix c",
    "table 6",
    "table 7",
    "table 8",
    "cross-family",
    "triangulated",
    "practitioner awareness",
    # Reviewer-response artifacts
    "reviewer 1",
    "reviewer 2",
    "reviewer 3",
    "editor's comments",
    "editor preamble",
    "r1-1", "r1-2", "r1-3", "r1-4", "r1-5", "r1-6", "r1-7", "r1-8", "r1-9",
    "r2-1", "r2-2", "r2-3", "r2-4", "r2-5",
    "r3-1", "r3-2", "r3-3",
    "e-1.", "e-2.", "e-3.", "e-4.", "e-5.", "e-6.", "e-7.", "e-8.", "e-9.", "e-10.",
    "cohen's kappa",
    "cohen kappa",
    # Revision plan / status
    "revision plan",
    "revision-plan",
    "tracked pdf",
    "tracked version",
    "clean pdf",
    "clean version",
    # Spec2Code analysis artefacts
    "04_phrase_patterns",
    "02_bubble_corpus_split",
    "03_cross_model_presence",
    "01_static_evasion_markers",
    "phrase patterns",
    "phrase-pattern",
    "broad pattern",
    "strict pattern",
    "semantic pattern",
    "spec2code framework",
    "anonymous.4open",
    # Paper-structure references (high-specificity)
    "source~1",
    "source 1 --- vibecoding",
    "source 2 --- llm",
    "corpus/ folder",
    "corpus/ directory",
    # Audit / review self-referential artefacts (catches cases where the
    # assistant's own audit tables or per-example verdicts get captured back
    # into the corpus via the chat database).
    "genuine** |",
    "false positive** |",
    "audit results",
    "audit status",
    "audit-status:",
    "i've now read all",
    "per-example verdict",
    "here's my audit",
    "manually-verified",
    "manual-verified",
    "why this is complexity avoidance",
    "why this is task reordering",
    "why this is deferred implementation",
    "why this is scope creep",
    "why this is workaround",
)

# Tokens that indicate a bubble is tutorialising the SDD / Spec2Code spec
# template itself (and therefore listing phrases like "Out of Scope" or
# "Functional Requirements" as section names rather than enacting them).
_TEMPLATE_TOKENS = (
    "specification template",
    "spec template",
    "specification includes",
    "sections you need to fill",
    "spec.md",
    "tasks.md",
    "sdd tool",
    "sdd rules",
    "sdd-rules",
    "functional requirements",
    "acceptance criteria",
    "user stories",
    "non-functional",
)


_BOX_DRAWING_CHARS = set("│─┌┐└┘├┤┬┴┼▼▲►◄╭╮╯╰━┃┏┓┗┛┣┫┳┻╋")


def _is_meta_discussion(text_lower: str) -> bool:
    """Return True when a bubble should be skipped because it does not
    represent a development turn that exhibits an evasion pattern.

    The filter fires for three reasons:

      (a) Two or more paper-meta / taxonomy-discussion tokens are present.
      (b) Two or more SDD/Spec2Code template-tutorialisation tokens are
          present (so the bubble is describing a template rather than
          enacting one).
      (c) Audit-table / audit-note self-reference tokens are present, which
          catches previous assistant turns that reviewed other corpus
          examples leaking back into the corpus via the chat database.
    """
    meta_hits = sum(1 for tok in _META_TOKENS if tok in text_lower)
    if meta_hits >= 2:
        return True
    template_hits = sum(1 for tok in _TEMPLATE_TOKENS if tok in text_lower)
    if template_hits >= 2:
        return True
    return False


def _is_ascii_diagram(text: str) -> bool:
    """Return True when the bubble is mostly ASCII box-drawing art (an
    architecture diagram) rather than prose. Flowcharts visualise design
    decisions but do not themselves enact them, so they should not be
    collected as evasion exemplars.

    Heuristic: more than 8% of the non-whitespace characters are box-drawing
    characters.
    """
    non_ws = [c for c in text if not c.isspace()]
    if not non_ws:
        return False
    box_count = sum(1 for c in non_ws if c in _BOX_DRAWING_CHARS)
    return box_count / len(non_ws) > 0.08


def anonymize(text: str) -> str:
    """Apply the anonymization policy described in corpus/README.md."""

    def _sub_desktop(match: re.Match) -> str:
        project = match.group(1)
        tail = match.group(2) or ""
        if project in VIBECODING_PROJECTS:
            return f"VibeCoding/{project}{tail}"
        return "[private path]"

    text = DESKTOP_PATH_RE.sub(_sub_desktop, text)
    text = HOME_PATH_RE.sub("[private path]", text)
    text = EMAIL_RE.sub("[redacted-email]", text)
    text = TOKEN_RE.sub(r"\1=[redacted-token]", text)
    text = URL_RE.sub("[redacted-url]", text)
    return text


def truncate_excerpt(text: str, max_chars: int = 1200,
                      match_offset: int | None = None) -> str:
    """Return a sentence-aware excerpt of ``text`` at approximately
    ``max_chars``. When ``match_offset`` is provided, the excerpt is
    centred on a window around that character offset so the matched
    phrase is visible in the saved exemplar. When it is not provided,
    falls back to prefix-truncation from the start of the bubble.
    """
    text = text.strip()
    if len(text) <= max_chars:
        return text

    if match_offset is None:
        # Prefix truncation (original behaviour).
        cut = text[:max_chars]
        for sep in (". ", "! ", "? ", "\n"):
            last = cut.rfind(sep)
            if last > max_chars * 0.6:
                return cut[: last + 1].rstrip() + " [... excerpt truncated ...]"
        return cut.rstrip() + " [... excerpt truncated ...]"

    # Window around the match. Place the match roughly one-third into the
    # excerpt so context before and after is visible.
    window_before = max_chars // 3
    start = max(0, match_offset - window_before)
    end = min(len(text), start + max_chars)
    # Snap start to a sentence/paragraph boundary if one exists nearby.
    if start > 0:
        for sep in ("\n\n", ". ", "! ", "? ", "\n"):
            idx = text.rfind(sep, start, match_offset)
            if idx != -1 and idx - start < window_before // 2:
                start = idx + len(sep)
                break
    # Snap end to a sentence/paragraph boundary.
    for sep in ("\n\n", ". ", "! ", "? ", "\n"):
        idx = text.find(sep, match_offset, end)
        if idx != -1:
            end = idx + len(sep)
            break
    prefix = "[... excerpt truncated ...] " if start > 0 else ""
    suffix = " [... excerpt truncated ...]" if end < len(text) else ""
    return (prefix + text[start:end].rstrip() + suffix).strip()


def open_db(path: str) -> sqlite3.Connection:
    db_path = Path(path).expanduser()
    if not db_path.exists():
        sys.exit(f"error: state.vscdb not found: {db_path}")
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        conn.execute("SELECT 1 FROM cursorDiskKV LIMIT 1")
    except sqlite3.DatabaseError as exc:
        sys.exit(f"error: {db_path} is not a Cursor state.vscdb: {exc}")
    return conn


def load_patterns() -> Dict[str, List[str]]:
    """Load corpus-extraction patterns. The policy is:

      * Categories that appear in ``_extra_patterns.yaml`` use ONLY the
        extra-patterns list for corpus extraction. The extra list is
        hand-curated to be narrower and more false-positive-resistant than
        the strict patterns used for the paper's quantitative analysis.
      * Categories that do NOT appear in ``_extra_patterns.yaml`` fall back
        to the strict patterns in ``04_phrase_patterns.yaml``.

    This deliberate override (instead of a union) lets us tighten corpus
    extraction for categories like Scope Creep Deflection whose strict
    pattern (\"out of scope\") is too broad when encountered in code or
    template contexts, without touching the paper's strict pattern file.
    """
    strict: Dict[str, List[str]] = {}
    extra: Dict[str, List[str]] = {}
    if STRICT_PATTERNS_PATH.exists():
        with STRICT_PATTERNS_PATH.open() as fh:
            strict = yaml.safe_load(fh) or {}
    if EXTRA_PATTERNS_PATH.exists():
        with EXTRA_PATTERNS_PATH.open() as fh:
            extra = yaml.safe_load(fh) or {}
    merged: Dict[str, List[str]] = {}
    for cat, patterns in strict.items():
        merged[cat] = [p.lower() for p in patterns]
    # Extra patterns replace strict ones for any category that appears in
    # the extra file.
    for cat, patterns in extra.items():
        merged[cat] = [p.lower() for p in patterns]
    return merged


EXAMPLE_TMPL = """---
category: {label}
category-id: {cid}
theme: {theme}
source: chat-interaction-corpus
project: [anonymized]
file: null
evidentiary-status: verbatim
detector: {detector}
---

{body}
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("state_db")
    parser.add_argument("--max-per-category", type=int, default=10)
    parser.add_argument("--min-text-chars", type=int, default=80,
                        help="skip bubbles whose text field is shorter than this")
    parser.add_argument("--progress", action="store_true")
    parser.add_argument("--only-categories", default="",
                        help="comma-separated list of category names to "
                             "process; all others are left untouched.")
    args = parser.parse_args()

    only_cats: set[str] | None = None
    if args.only_categories.strip():
        only_cats = {c.strip() for c in args.only_categories.split(",") if c.strip()}
        unknown = only_cats - set(CHAT_CATEGORIES)
        if unknown:
            raise SystemExit(f"unknown categories: {sorted(unknown)}")

    patterns = load_patterns()
    conn = open_db(args.state_db)
    cur = conn.cursor()

    collected: Dict[str, List[str]] = {c: [] for c in CHAT_CATEGORIES}
    seen_prefixes: Dict[str, set[str]] = {c: set() for c in CHAT_CATEGORIES}

    # Iterate over assistant bubbles.
    cur.execute("SELECT value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    scanned = 0
    for (value,) in cur:
        scanned += 1
        if args.progress and scanned % 20000 == 0:
            print(f"  scanned {scanned}...", file=sys.stderr)

        if isinstance(value, (bytes, bytearray)):
            value = value.decode("utf-8", "ignore")
        if not isinstance(value, str):
            continue
        if '"type":2' not in value[:200]:
            continue
        try:
            data = json.loads(value)
        except Exception:
            continue

        text = data.get("text") or ""
        if not isinstance(text, str):
            continue
        text = text.strip()
        if len(text) < args.min_text_chars:
            continue

        lower = text.lower()
        # Meta-reference filter: bubbles discussing the paper itself often
        # mention category names verbatim (e.g. "Task Reordering") or the
        # phrase-patterns YAML file. Skip those bubbles since they reflect
        # meta-discussion rather than actual evasion patterns.
        if _is_meta_discussion(lower):
            continue
        if _is_ascii_diagram(text):
            continue
        for category, phrase_list in patterns.items():
            if category not in CHAT_CATEGORIES:
                continue
            if only_cats is not None and category not in only_cats:
                continue
            if len(collected[category]) >= args.max_per_category:
                continue
            match_offset = -1
            for p in phrase_list:
                idx = lower.find(p)
                if idx != -1:
                    match_offset = idx
                    break
            if match_offset < 0:
                continue
            # Per-category meta-reference filter: bubble contains the
            # category name itself (case-insensitive) in a way that suggests
            # discussion of the taxonomy rather than enactment of the pattern.
            if category.lower() in lower:
                continue
            prefix = text[:200]
            if prefix in seen_prefixes[category]:
                continue
            seen_prefixes[category].add(prefix)
            collected[category].append((text, match_offset))

        # Early exit when every chat-level category is full.
        if all(len(v) >= args.max_per_category for v in collected.values()):
            break

    conn.close()

    written = 0
    for category, texts in collected.items():
        if only_cats is not None and category not in only_cats:
            continue
        folder_rel, start_n = CHAT_CATEGORIES[category]
        folder = HERE / folder_rel
        theme = CATEGORY_THEMES[category]
        cid = CATEGORY_IDS[category]
        detector = CATEGORY_DETECTORS[category]

        # Clear stale chat-source examples only, except those that have been
        # manually audited (`audit-status: manual-verified` in the YAML
        # header). example-01 from Appendix A and any code-sourced examples
        # are also preserved. This lets us re-extract with updated patterns
        # without destroying previously curated rationales.
        for stale in sorted(folder.glob("example-*.md")):
            if stale.name == "example-01.md":
                continue
            try:
                head = stale.read_text().splitlines()
            except Exception:
                continue
            is_chat = any(line.strip() == "source: chat-interaction-corpus"
                          for line in head[:15])
            if not is_chat:
                continue
            is_audited = any(line.strip() == "audit-status: manual-verified"
                             for line in head[:15])
            if is_audited:
                continue
            stale.unlink()

        # Start numbering at the next available index after example-01 and any
        # already-present (preserved or code-sourced) examples.
        existing_paths = sorted(folder.glob("example-*.md"))
        existing = sorted(int(p.stem.split("-")[1]) for p in existing_paths)
        idx = max(existing + [1]) + 1

        # Collect a lightweight signature of each preserved file's body so we
        # can skip re-writing a bubble that was already captured and audited
        # under a different example number.
        preserved_signatures: set[str] = set()
        for pp in existing_paths:
            try:
                contents = pp.read_text()
            except Exception:
                continue
            # Body is everything after the closing '---' of the YAML front
            # matter. Take the first 150 non-whitespace chars as a signature.
            parts = contents.split("\n---\n", 1)
            body_region = parts[1] if len(parts) == 2 else contents
            sig = "".join(body_region.split())[:150]
            if sig:
                preserved_signatures.add(sig)

        for raw, match_offset in texts:
            anonymised = anonymize(raw)
            # Anonymisation can shift character offsets; find the matching
            # phrase again in the anonymised text to keep the excerpt window
            # correctly centred.
            anon_lower = anonymised.lower()
            adjusted_offset = match_offset
            for p in patterns.get(category, []):
                idx_in_anon = anon_lower.find(p)
                if idx_in_anon != -1:
                    adjusted_offset = idx_in_anon
                    break
            body = truncate_excerpt(anonymised, match_offset=adjusted_offset)
            # Skip bubbles whose body signature already appears in a preserved
            # (audited or code-sourced) file to avoid re-emitting duplicates.
            sig = "".join(body.split())[:150]
            if sig and sig in preserved_signatures:
                continue
            preserved_signatures.add(sig)
            path = folder / f"example-{idx:02d}.md"
            path.write_text(
                EXAMPLE_TMPL.format(
                    label=category, cid=cid, theme=theme,
                    detector=detector, body=body,
                )
            )
            idx += 1
            written += 1

    print(f"Wrote {written} chat-level exemplars across {len(CHAT_CATEGORIES)} categories.")
    for cat, texts in sorted(collected.items()):
        print(f"  {cat:<28}: {len(texts)}")


if __name__ == "__main__":
    main()
