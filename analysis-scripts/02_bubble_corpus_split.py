#!/usr/bin/env python3
"""02_bubble_corpus_split.py

Split the lead practitioner's Cursor bubble corpus into Spec2Code-enforced
versus unrestricted contexts by file-path attribution, and count pattern
matches per evasion category.

Reproduces the Section 5.3 framework-effectiveness table when run with the
default (strict) patterns file.

Usage:
    python 02_bubble_corpus_split.py STATE_DB
        [--patterns PATTERNS]
        [--projects PROJECTS]
        [--broad]
        [--progress]

Inputs:
    STATE_DB     Path to Cursor's state.vscdb SQLite file.
    --patterns   Phrase-patterns YAML (default: 04_phrase_patterns.yaml).
    --projects   Project-list YAML (default: 05_projects.yaml).
    --broad      Use the broad (regex) patterns file 04b_phrase_patterns_broad.yaml
                 instead of the strict patterns file. Reports a sensitivity
                 upper bound rather than the paper's numbers.
    --progress   Print a progress indicator while scanning.

Pattern interpretation:
    - The strict patterns YAML contains lowercased literal substrings that are
      matched case-insensitively via `in` test against the lowercased raw JSON
      value of each bubble.
    - The broad patterns YAML contains Python regular expressions, matched
      case-insensitively against the raw JSON value. This catches morphological
      variants, contractions, and common synonyms.
    - A bubble is counted once per category if ANY of its patterns match.

Bubble filter:
    A bubble is counted only if (i) it has `"type":2` in the first 200 bytes
    of its JSON value (assistant-role) and (ii) its value contains at least
    one file path referencing a Spec2Code-enforced or non-Spec2Code own
    project directory. Bubbles without any path reference (pure chat) are
    excluded from this split comparison.
"""

from __future__ import annotations

import argparse
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import yaml  # type: ignore
except ImportError:
    print("PyYAML is required: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


DEFAULT_PATTERNS_STRICT = "04_phrase_patterns.yaml"
DEFAULT_PATTERNS_BROAD = "04b_phrase_patterns_broad.yaml"
DEFAULT_PROJECTS = "05_projects.yaml"


# Cursor stores bubble text in JSON form; newlines and tabs appear as the
# two-character sequences "\\n", "\\r", "\\t", and the regex `\b` assertion
# treats "n", "r", "t" as word characters, breaking boundary matching just
# before or after a sentence. We normalize these escapes to real whitespace
# before running the broad regexes.
_JSON_ESCAPE_RE = re.compile(r"\\[nrt]")


def normalize_json_escapes(value: str) -> str:
    """Replace JSON-escaped whitespace (``\\n``, ``\\r``, ``\\t``) with actual
    whitespace so that regex word-boundaries (``\\b``) behave correctly.
    """
    return _JSON_ESCAPE_RE.sub(" ", value)


def load_strict_patterns(path: Path) -> Dict[str, List[str]]:
    """Load lowercased literal-substring patterns."""
    if not path.exists():
        sys.exit(f"error: patterns file not found: {path}")
    with path.open() as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        sys.exit(f"error: {path} must be a mapping of category -> [patterns]")
    return {cat: [p.lower() for p in patt] for cat, patt in data.items()}


def load_broad_patterns(path: Path) -> Dict[str, re.Pattern]:
    """Load one combined regex per category (case-insensitive).

    Combining all patterns of a category with `|` lets us run a single
    `search()` per category per bubble, dramatically faster than looping.
    """
    if not path.exists():
        sys.exit(f"error: broad-patterns file not found: {path}")
    with path.open() as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        sys.exit(f"error: {path} must be a mapping of category -> [regexes]")
    compiled: Dict[str, re.Pattern] = {}
    for category, patterns in data.items():
        if not patterns:
            continue
        # Wrap each pattern in a non-capturing group before joining.
        try:
            combined = "|".join(f"(?:{raw})" for raw in patterns)
            compiled[category] = re.compile(combined, re.IGNORECASE)
        except re.error as exc:
            sys.exit(f"error: invalid regex for {category!r}: {exc}")
    return compiled


def load_projects(projects_path: Path) -> Tuple[List[str], List[str]]:
    if not projects_path.exists():
        sys.exit(f"error: projects file not found: {projects_path}")
    with projects_path.open() as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict) or "spec2code_own" not in data or "nonspec_own" not in data:
        sys.exit(
            f"error: {projects_path} must define both "
            "'spec2code_own' and 'nonspec_own' keys"
        )
    return list(data["spec2code_own"]), list(data["nonspec_own"])


def open_state_db(path: str) -> sqlite3.Connection:
    db_path = Path(path)
    if not db_path.exists():
        sys.exit(f"error: state.vscdb not found at: {path}")
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        conn.execute("SELECT 1 FROM cursorDiskKV LIMIT 1")
    except sqlite3.DatabaseError as exc:
        sys.exit(f"error: {path} does not look like a Cursor state.vscdb: {exc}")
    return conn


def classify_bubble(
    value: str, spec2code_own: List[str], nonspec_own: List[str]
) -> Optional[str]:
    if not isinstance(value, str):
        return None
    for proj in spec2code_own:
        if f"Desktop/{proj}/" in value:
            return "spec2code"
    for proj in nonspec_own:
        if f"Desktop/{proj}/" in value:
            return "nonspec"
    return None


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("state_db", help="path to Cursor state.vscdb")
    parser.add_argument(
        "--patterns", default=None,
        help="phrase-patterns YAML; default depends on --broad flag",
    )
    parser.add_argument(
        "--projects",
        default=str(Path(__file__).parent / DEFAULT_PROJECTS),
        help=f"project-list YAML (default: {DEFAULT_PROJECTS})",
    )
    parser.add_argument(
        "--broad", action="store_true",
        help="use broad regex patterns (04b_phrase_patterns_broad.yaml) "
             "for sensitivity analysis; NOT the paper's reported numbers.",
    )
    parser.add_argument(
        "--progress", action="store_true",
        help="print progress updates while scanning",
    )
    args = parser.parse_args()

    default_patterns = (
        DEFAULT_PATTERNS_BROAD if args.broad else DEFAULT_PATTERNS_STRICT
    )
    patterns_path = Path(
        args.patterns if args.patterns else Path(__file__).parent / default_patterns
    )

    if args.broad:
        broad_patterns = load_broad_patterns(patterns_path)
        strict_patterns: Optional[Dict[str, List[str]]] = None
        categories = list(broad_patterns.keys())
    else:
        strict_patterns = load_strict_patterns(patterns_path)
        broad_patterns: Dict[str, re.Pattern] = {}
        categories = list(strict_patterns.keys())

    spec2code_own, nonspec_own = load_projects(Path(args.projects))
    conn = open_state_db(args.state_db)
    cur = conn.cursor()

    spec_counts: Dict[str, int] = defaultdict(int)
    nonspec_counts: Dict[str, int] = defaultdict(int)
    spec_total = 0
    nonspec_total = 0
    scanned = 0

    cur.execute("SELECT value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    for (value,) in cur:
        scanned += 1
        if args.progress and scanned % 20000 == 0:
            print(f"  scanned {scanned} bubbles...", file=sys.stderr)

        if isinstance(value, (bytes, bytearray)):
            value = value.decode("utf-8", "ignore")
        if not isinstance(value, str):
            continue

        if '"type":2' not in value[:200]:
            continue

        bucket = classify_bubble(value, spec2code_own, nonspec_own)
        if bucket is None:
            continue

        if bucket == "spec2code":
            spec_total += 1
        else:
            nonspec_total += 1

        if args.broad:
            # One combined regex per category; single search() per category.
            # Normalize JSON-escaped whitespace so \b behaves correctly.
            normalized = normalize_json_escapes(value)
            for category, combined in broad_patterns.items():
                if combined.search(normalized):
                    if bucket == "spec2code":
                        spec_counts[category] += 1
                    else:
                        nonspec_counts[category] += 1
        else:
            # Fast lowercase substring check.
            lower = value.lower()
            assert strict_patterns is not None
            for category, phrase_list in strict_patterns.items():
                if any(p in lower for p in phrase_list):
                    if bucket == "spec2code":
                        spec_counts[category] += 1
                    else:
                        nonspec_counts[category] += 1

    conn.close()

    mode = "broad" if args.broad else "strict"
    print()
    print(f"Pattern set                                 : {mode} ({patterns_path.name})")
    print(f"Scanned bubbles total                       : {scanned}")
    print(f"Spec2Code-enforced assistant bubbles        : {spec_total}")
    print(f"Non-Spec2Code (unrestricted) assistant bubs : {nonspec_total}")
    print()
    header = (
        f"{'Category':<28} "
        f"{'Spec2Code (%)':>14} "
        f"{'Unrestricted (%)':>18} "
        f"{'Ratio':>8}"
    )
    print(header)
    print("-" * len(header))
    for category in categories:
        s = spec_counts[category]
        n = nonspec_counts[category]
        s_pct = (100.0 * s / spec_total) if spec_total else 0.0
        n_pct = (100.0 * n / nonspec_total) if nonspec_total else 0.0
        if s_pct > 0.02:
            ratio_str = f"{n_pct / s_pct:>7.1f}x"
        elif n_pct > 0:
            ratio_str = "  >400x"
        else:
            ratio_str = "     --"
        print(f"{category:<28} {s_pct:>13.2f}  {n_pct:>17.2f}  {ratio_str}")


if __name__ == "__main__":
    main()
