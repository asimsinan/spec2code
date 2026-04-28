#!/usr/bin/env python3
"""03_cross_model_presence.py

Per-family category-presence rates across Cursor composer sessions with
explicit model attribution.

Produces strict or broad per-family rates used as inputs to the Section 6.1
triangulated cross-family table.

Usage:
    python 03_cross_model_presence.py STATE_DB
        [--patterns PATTERNS]
        [--broad]
        [--progress]
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List

try:
    import yaml  # type: ignore
except ImportError:
    print("PyYAML is required: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


DEFAULT_PATTERNS_STRICT = "04_phrase_patterns.yaml"
DEFAULT_PATTERNS_BROAD = "04b_phrase_patterns_broad.yaml"

# Family groupings.
FAMILIES: Dict[str, List[str]] = {
    "Claude 3.5": [
        "claude-3.5-sonnet",
    ],
    "GPT-4": [
        "gpt-4"
    ],
    "Opus 4.5": [
        "claude-4.5-opus-high",
    ],
    "Sonnet 4.5": [
        "claude-4.5-sonnet",
    ],
}

# Paper's canonical ordering for the cross-family table rows.
FAMILY_ORDER: List[str] = ["Claude 3.5", "GPT-4", "Opus 4.5", "Sonnet 4.5"]

# Cursor stores bubble text in JSON form; newlines and tabs appear as the
# two-character sequences "\\n", "\\r", "\\t", and the regex `\b` assertion
# treats "n", "r", "t" as word characters, breaking boundary matching. We
# normalize these escapes to real whitespace before running broad regexes.
_JSON_ESCAPE_RE = re.compile(r"\\[nrt]")


def normalize_json_escapes(value: str) -> str:
    return _JSON_ESCAPE_RE.sub(" ", value)


CATEGORY_ABBREVIATIONS = {
    "Permission Seeking": "Perm",
    "Apology Theater": "Apol",
    "Retroactive Honesty": "Retro",
    "Time Constraint Excuse": "Time",
    "Progress Theater": "Prog",
    "Efficiency Excuse": "Eff",
    "Deferred Implementation": "Def",
    "Task Reordering": "Reord",
    "Scope Creep Deflection": "Scope",
    "Premature Optimization": "PremOpt",
    "Simultaneous Completion": "Simul",
}


def build_model_to_family() -> Dict[str, str]:
    lookup: Dict[str, str] = {}
    for family, models in FAMILIES.items():
        for m in models:
            lookup[m.lower()] = family
    return lookup


def load_strict_patterns(path: Path) -> Dict[str, List[str]]:
    if not path.exists():
        sys.exit(f"error: patterns file not found: {path}")
    with path.open() as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        sys.exit(f"error: {path} must be a mapping of category -> [patterns]")
    return {cat: [p.lower() for p in patt] for cat, patt in data.items()}


def load_broad_patterns(path: Path) -> Dict[str, re.Pattern]:
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
        try:
            combined = "|".join(f"(?:{raw})" for raw in patterns)
            compiled[category] = re.compile(combined, re.IGNORECASE)
        except re.error as exc:
            sys.exit(f"error: invalid regex for {category!r}: {exc}")
    return compiled


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
        "--broad", action="store_true",
        help="use broad regex patterns for sensitivity analysis",
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

    broad_patterns: Dict[str, re.Pattern] = {}
    strict_patterns: Dict[str, List[str]] = {}
    if args.broad:
        broad_patterns = load_broad_patterns(patterns_path)
        categories = list(broad_patterns.keys())
    else:
        strict_patterns = load_strict_patterns(patterns_path)
        categories = list(strict_patterns.keys())

    model_to_family = build_model_to_family()

    conn = open_state_db(args.state_db)
    cur = conn.cursor()

    # composerId -> family label (or None when not in any family).
    cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'composerData:%'")
    comp_family: Dict[str, str] = {}
    family_composer_counts: Dict[str, int] = defaultdict(int)
    total_composers = 0

    for key, value in cur:
        total_composers += 1
        try:
            composer_id = key.split(":", 1)[1]
            if isinstance(value, (bytes, bytearray)):
                value = value.decode("utf-8", "ignore")
            data = json.loads(value)
            model = (data.get("modelConfig") or {}).get("modelName")
            if not model:
                continue
            fam = model_to_family.get(model.lower())
            if fam is not None:
                comp_family[composer_id] = fam
                family_composer_counts[fam] += 1
        except Exception:
            continue

    mode = "broad" if args.broad else "strict"
    print(f"Pattern set     : {mode} ({patterns_path.name})")
    print(f"Total composers : {total_composers}")
    print("Family composers:")
    for family in FAMILY_ORDER:
        print(f"  {family:<14} {family_composer_counts[family]}")
    print()

    # Accumulators.
    fam_total: Dict[str, int] = defaultdict(int)
    fam_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    scanned = 0

    cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    for key, value in cur:
        scanned += 1
        if args.progress and scanned % 20000 == 0:
            print(f"  scanned {scanned} bubbles...", file=sys.stderr)

        parts = key.split(":")
        if len(parts) < 3:
            continue
        composer_id = parts[1]
        family = comp_family.get(composer_id)
        if family is None:
            continue

        if isinstance(value, (bytes, bytearray)):
            value = value.decode("utf-8", "ignore")
        if not isinstance(value, str):
            continue
        if '"type":2' not in value[:200]:
            continue

        fam_total[family] += 1
        if args.broad:
            normalized = normalize_json_escapes(value)
            for category, combined in broad_patterns.items():
                if combined.search(normalized):
                    fam_counts[family][category] += 1
        else:
            lower = value.lower()
            for category, phrase_list in strict_patterns.items():
                if any(p in lower for p in phrase_list):
                    fam_counts[family][category] += 1

    conn.close()

    abbrev = [CATEGORY_ABBREVIATIONS.get(c, c[:6]) for c in categories]
    col_width = 6
    header = (
        f"{'Family':<14} {'N':>9}  "
        + " ".join(f"{a:>{col_width}}" for a in abbrev)
    )

    print(header)
    print("-" * len(header))
    grand_n = 0
    for family in FAMILY_ORDER:
        n = fam_total[family]
        grand_n += n
        row = [f"{family:<14}", f"{n:>9,}"]
        for c in categories:
            pct = 100.0 * fam_counts[family][c] / n if n else 0.0
            row.append(f"{pct:>{col_width}.2f}")
        print(" ".join(row))
    print()
    print(f"Assistant messages across all four families: {grand_n:,}")


if __name__ == "__main__":
    main()
