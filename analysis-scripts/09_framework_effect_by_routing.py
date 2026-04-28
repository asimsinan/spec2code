#!/usr/bin/env python3
"""09_framework_effect_by_routing.py

Split the framework-effectiveness analysis by composer routing. This answers
the question: "Are the lower observed Spec2Code evasion-pattern rates
consistent across both Cursor Auto-routed sessions and explicit-model
sessions?"

Reports Spec2Code vs. unrestricted rates per subgroup. If the direction and
magnitude of the observed context difference are similar in both subgroups,
the pooled framework-effectiveness result is robust to routing mix.

Usage:
    python 09_framework_effect_by_routing.py STATE_DB
        [--patterns PATTERNS]
        [--projects PROJECTS]
        [--progress]

Inputs follow the same conventions as 02_bubble_corpus_split.py.
"""

from __future__ import annotations

import argparse
import json
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


DEFAULT_PATTERNS = "04_phrase_patterns.yaml"
DEFAULT_PROJECTS = "05_projects.yaml"


def load_strict_patterns(path: Path) -> Dict[str, List[str]]:
    if not path.exists():
        sys.exit(f"error: patterns file not found: {path}")
    with path.open() as fh:
        data = yaml.safe_load(fh)
    return {cat: [p.lower() for p in patt] for cat, patt in data.items()}


def load_projects(projects_path: Path) -> Tuple[List[str], List[str]]:
    if not projects_path.exists():
        sys.exit(f"error: projects file not found: {projects_path}")
    with projects_path.open() as fh:
        data = yaml.safe_load(fh)
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


def ratio_str(s_pct: float, n_pct: float) -> str:
    if s_pct > 0.02:
        return f"{n_pct / s_pct:>7.1f}x"
    if n_pct > 0:
        return "  >400x"
    return "     --"


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("state_db", help="path to Cursor state.vscdb")
    parser.add_argument(
        "--patterns",
        default=str(Path(__file__).parent / DEFAULT_PATTERNS),
        help=f"phrase-patterns YAML (default: {DEFAULT_PATTERNS})",
    )
    parser.add_argument(
        "--projects",
        default=str(Path(__file__).parent / DEFAULT_PROJECTS),
        help=f"project-list YAML (default: {DEFAULT_PROJECTS})",
    )
    parser.add_argument(
        "--progress", action="store_true",
        help="print progress updates while scanning",
    )
    args = parser.parse_args()

    patterns = load_strict_patterns(Path(args.patterns))
    spec2code_own, nonspec_own = load_projects(Path(args.projects))
    conn = open_state_db(args.state_db)
    cur = conn.cursor()

    # composer_id -> 'auto' | 'explicit'
    cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'composerData:%'")
    comp_routing: Dict[str, str] = {}
    for key, value in cur:
        try:
            composer_id = key.split(":", 1)[1]
            if isinstance(value, (bytes, bytearray)):
                value = value.decode("utf-8", "ignore")
            data = json.loads(value)
            model = (data.get("modelConfig") or {}).get("modelName")
            if model and model not in ("default", "unknown"):
                comp_routing[composer_id] = "explicit"
            else:
                comp_routing[composer_id] = "auto"
        except Exception:
            continue

    # Counters: [routing][context][category] and totals[routing][context]
    # routing in {auto, explicit}, context in {spec2code, nonspec}
    counts: Dict[str, Dict[str, Dict[str, int]]] = {
        "auto": {"spec2code": defaultdict(int), "nonspec": defaultdict(int)},
        "explicit": {"spec2code": defaultdict(int), "nonspec": defaultdict(int)},
    }
    totals: Dict[str, Dict[str, int]] = {
        "auto": {"spec2code": 0, "nonspec": 0},
        "explicit": {"spec2code": 0, "nonspec": 0},
    }

    cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    scanned = 0
    for key, value in cur:
        scanned += 1
        if args.progress and scanned % 20000 == 0:
            print(f"  scanned {scanned}...", file=sys.stderr)

        parts = key.split(":")
        if len(parts) < 3:
            continue
        composer_id = parts[1]
        routing = comp_routing.get(composer_id)
        if routing is None:
            continue

        if isinstance(value, (bytes, bytearray)):
            value = value.decode("utf-8", "ignore")
        if not isinstance(value, str):
            continue
        if '"type":2' not in value[:200]:
            continue

        context = classify_bubble(value, spec2code_own, nonspec_own)
        if context is None:
            continue

        totals[routing][context] += 1
        lower = value.lower()
        for category, phrase_list in patterns.items():
            if any(p in lower for p in phrase_list):
                counts[routing][context][category] += 1

    conn.close()

    print()
    print("Assistant-bubble totals per subgroup")
    print("------------------------------------")
    for routing in ("auto", "explicit"):
        for context in ("spec2code", "nonspec"):
            print(f"  {routing:<8} {context:<10} : {totals[routing][context]}")
    print()

    categories = list(patterns.keys())

    # Print two tables: one for Auto-routed, one for Explicit-model.
    for routing in ("auto", "explicit"):
        header_routing = "Auto-routed subgroup" if routing == "auto" else "Explicit-model subgroup"
        print(header_routing)
        print("=" * len(header_routing))
        s_total = totals[routing]["spec2code"]
        n_total = totals[routing]["nonspec"]
        print(f"  Spec2Code bubbles    : {s_total}")
        print(f"  Unrestricted bubbles : {n_total}")
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
            s = counts[routing]["spec2code"][category]
            n = counts[routing]["nonspec"][category]
            s_pct = 100.0 * s / s_total if s_total else 0.0
            n_pct = 100.0 * n / n_total if n_total else 0.0
            print(f"{category:<28} {s_pct:>13.2f}  {n_pct:>17.2f}  {ratio_str(s_pct, n_pct)}")
        print()

    # Combined (pooled) for comparison with the framework-effectiveness table.
    print("Pooled (routing-agnostic, matches framework-effectiveness table)")
    print("===========================================")
    s_total = totals["auto"]["spec2code"] + totals["explicit"]["spec2code"]
    n_total = totals["auto"]["nonspec"] + totals["explicit"]["nonspec"]
    print(f"  Spec2Code bubbles    : {s_total}")
    print(f"  Unrestricted bubbles : {n_total}")
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
        s = counts["auto"]["spec2code"][category] + counts["explicit"]["spec2code"][category]
        n = counts["auto"]["nonspec"][category] + counts["explicit"]["nonspec"][category]
        s_pct = 100.0 * s / s_total if s_total else 0.0
        n_pct = 100.0 * n / n_total if n_total else 0.0
        print(f"{category:<28} {s_pct:>13.2f}  {n_pct:>17.2f}  {ratio_str(s_pct, n_pct)}")


if __name__ == "__main__":
    main()
