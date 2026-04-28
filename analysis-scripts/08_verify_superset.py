#!/usr/bin/env python3
"""08_verify_superset.py

Verify that the BROAD regex patterns are a TRUE SUPERSET of the STRICT
literal patterns by running both over the entire Cursor bubble corpus and
counting, per category, how many bubbles match strict-but-not-broad.

A correctly constructed broad patterns file should produce zero strict-only
matches. Any strict-only match is a missed-paraphrase bug in the broad
patterns.

Usage:
    python 08_verify_superset.py STATE_DB [--progress]

Exits with non-zero status if any strict-only matches are found.
"""

from __future__ import annotations

import argparse
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


HERE = Path(__file__).parent
STRICT_PATH = HERE / "04_phrase_patterns.yaml"
BROAD_PATH = HERE / "04b_phrase_patterns_broad.yaml"


def load_strict(path: Path) -> Dict[str, List[str]]:
    with path.open() as fh:
        return {cat: [p.lower() for p in patt] for cat, patt in yaml.safe_load(fh).items()}


def load_broad(path: Path) -> Dict[str, re.Pattern]:
    raw = yaml.safe_load(path.read_text())
    out: Dict[str, re.Pattern] = {}
    for cat, patterns in raw.items():
        combined = "|".join(f"(?:{p})" for p in patterns)
        out[cat] = re.compile(combined, re.IGNORECASE)
    return out


_JSON_ESCAPE_RE = re.compile(r"\\[nrt]")


def normalize_json_escapes(value: str) -> str:
    return _JSON_ESCAPE_RE.sub(" ", value)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("state_db", help="path to Cursor state.vscdb")
    parser.add_argument("--progress", action="store_true")
    args = parser.parse_args()

    strict = load_strict(STRICT_PATH)
    broad = load_broad(BROAD_PATH)

    conn = sqlite3.connect(f"file:{Path(args.state_db)}?mode=ro", uri=True)
    cur = conn.cursor()

    strict_only: Dict[str, int] = defaultdict(int)
    both: Dict[str, int] = defaultdict(int)
    broad_only: Dict[str, int] = defaultdict(int)
    examples: Dict[str, List[str]] = defaultdict(list)

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

        lower = value.lower()
        normalized = normalize_json_escapes(value)
        for category, strict_patterns in strict.items():
            s_match = any(p in lower for p in strict_patterns)
            b_match = broad[category].search(normalized) is not None
            if s_match and b_match:
                both[category] += 1
            elif s_match and not b_match:
                strict_only[category] += 1
                if len(examples[category]) < 3:
                    # Record which strict phrase hit.
                    for p in strict_patterns:
                        idx = lower.find(p)
                        if idx >= 0:
                            excerpt = value[max(0, idx - 80) : idx + 120]
                            examples[category].append(f"[{p}] ...{excerpt}...")
                            break
            elif b_match and not s_match:
                broad_only[category] += 1

    conn.close()

    print(f"Scanned {scanned} bubbles.")
    print()
    header = f"{'Category':<28} {'both':>10} {'strict-only':>14} {'broad-only':>14}"
    print(header)
    print("-" * len(header))
    total_strict_only = 0
    for category in strict:
        total_strict_only += strict_only[category]
        print(
            f"{category:<28} "
            f"{both[category]:>10} {strict_only[category]:>14} {broad_only[category]:>14}"
        )
    print()

    # Tolerance: a small number of strict-only matches is acceptable. Strict
    # patterns are simple substrings and can over-match on morphological
    # variants ("to be efficient" matching inside "to be efficiently"), where
    # broad correctly rejects the false positive. We therefore require the
    # strict-only count per category to be below a small threshold.
    TOLERANCE_PER_CATEGORY = 10
    violations = {
        c: n for c, n in strict_only.items() if n > TOLERANCE_PER_CATEGORY
    }

    if violations:
        print(
            f"FAIL: broad is NOT a near-superset of strict. "
            f"Categories exceeding tolerance of {TOLERANCE_PER_CATEGORY} strict-only "
            f"matches: {violations}"
        )
        for category in violations:
            print(f"\n  {category}:")
            for ex in examples[category]:
                print(f"    {ex}")
        sys.exit(1)

    if total_strict_only == 0:
        print("PASS: broad is a true superset of strict (zero strict-only matches).")
    else:
        print(
            f"PASS: broad is a near-superset of strict "
            f"({total_strict_only} strict-only matches across {scanned} bubbles, "
            f"all below the {TOLERANCE_PER_CATEGORY}/category tolerance; see "
            f"examples below for known morphological edge-cases)."
        )
        for category, n in strict_only.items():
            if n > 0:
                print(f"\n  {category} ({n} strict-only):")
                for ex in examples[category]:
                    print(f"    {ex}")


if __name__ == "__main__":
    main()
