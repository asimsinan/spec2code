#!/usr/bin/env python3
"""06_semantic_presence.py

OPTIONAL semantic-similarity detector using sentence-transformers. This is
the third tier of detection, on top of:

    - strict literal substrings (04_phrase_patterns.yaml),
    - broad regex variants     (04b_phrase_patterns_broad.yaml).

For each assistant bubble we compute the cosine similarity of the bubble's
text against a short "anchor" sentence per category (described in
07_semantic_anchors.yaml). A bubble is counted for a category when any
anchor scores above the threshold (default 0.55, cosine similarity).

This script is intended as a **sensitivity upper bound**, not for
reproducing the paper. Expect sizeable false-positive rates relative to the
strict/broad phrase detectors; results should be interpreted as "consistent
with the direction of the effect" rather than as a point estimate.

Requirements:
    pip install sentence-transformers pyyaml

Model choice:
    Default: `sentence-transformers/all-MiniLM-L6-v2` -- 22MB, fast, good
    accuracy for short-phrase similarity. Override with --model if desired.

Usage:
    python 06_semantic_presence.py STATE_DB
        [--projects PROJECTS]
        [--anchors ANCHORS_YAML]
        [--threshold THRESHOLD]
        [--model MODEL_NAME]
        [--max-chars MAX_CHARS]
        [--progress]

Outputs a Spec2Code-vs-unrestricted comparison (same format as script 02).
"""

from __future__ import annotations

import argparse
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

try:
    from sentence_transformers import SentenceTransformer, util  # type: ignore
    import torch  # type: ignore
except ImportError:
    print(
        "sentence-transformers and torch are required for this script:\n"
        "    pip install sentence-transformers",
        file=sys.stderr,
    )
    sys.exit(1)


DEFAULT_ANCHORS = "07_semantic_anchors.yaml"
DEFAULT_PROJECTS = "05_projects.yaml"
DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_THRESHOLD = 0.55
DEFAULT_MAX_CHARS = 2000  # cap long bubbles for encoding speed


def load_anchors(path: Path) -> Dict[str, List[str]]:
    if not path.exists():
        sys.exit(f"error: anchors file not found: {path}")
    with path.open() as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        sys.exit(f"error: {path} must be a mapping of category -> [anchors]")
    return {cat: list(anchors) for cat, anchors in data.items()}


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


def extract_text_for_embedding(value: str, max_chars: int) -> str:
    """Extract a text preview from the bubble JSON, capped to max_chars.

    We do not parse the full JSON; we take the first max_chars chars of the
    raw value. This is a coarse but cheap approximation and avoids per-bubble
    JSON parsing across ~330k bubbles.
    """
    return value[:max_chars]


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("state_db", help="path to Cursor state.vscdb")
    parser.add_argument(
        "--anchors",
        default=str(Path(__file__).parent / DEFAULT_ANCHORS),
        help=f"semantic anchors YAML (default: {DEFAULT_ANCHORS})",
    )
    parser.add_argument(
        "--projects",
        default=str(Path(__file__).parent / DEFAULT_PROJECTS),
        help=f"project-list YAML (default: {DEFAULT_PROJECTS})",
    )
    parser.add_argument(
        "--threshold", type=float, default=DEFAULT_THRESHOLD,
        help=f"cosine-similarity threshold (default: {DEFAULT_THRESHOLD})",
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL,
        help=f"sentence-transformers model (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--max-chars", type=int, default=DEFAULT_MAX_CHARS,
        help=f"per-bubble text prefix length for embedding (default: {DEFAULT_MAX_CHARS})",
    )
    parser.add_argument(
        "--progress", action="store_true",
        help="print progress updates while scanning",
    )
    args = parser.parse_args()

    anchors = load_anchors(Path(args.anchors))
    spec2code_own, nonspec_own = load_projects(Path(args.projects))

    print(f"Loading model: {args.model}", file=sys.stderr)
    model = SentenceTransformer(args.model)

    # Pre-compute anchor embeddings.
    categories = list(anchors.keys())
    anchor_flat: List[str] = []
    anchor_cat_index: List[int] = []
    for i, cat in enumerate(categories):
        for anchor in anchors[cat]:
            anchor_flat.append(anchor)
            anchor_cat_index.append(i)
    anchor_emb = model.encode(anchor_flat, convert_to_tensor=True, show_progress_bar=False)

    conn = open_state_db(args.state_db)
    cur = conn.cursor()

    spec_counts: Dict[str, int] = defaultdict(int)
    nonspec_counts: Dict[str, int] = defaultdict(int)
    spec_total = 0
    nonspec_total = 0
    scanned = 0

    # Batch bubbles for encoder efficiency.
    BATCH_SIZE = 256
    batch: List[Tuple[str, str]] = []  # (bubble_text, bucket)

    def flush_batch() -> None:
        nonlocal spec_total, nonspec_total
        if not batch:
            return
        texts = [b[0] for b in batch]
        buckets = [b[1] for b in batch]
        emb = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
        sims = util.cos_sim(emb, anchor_emb)  # shape: (batch, n_anchors)
        # For each bubble, determine which categories match.
        for i, bucket in enumerate(buckets):
            if bucket == "spec2code":
                spec_total += 1
            else:
                nonspec_total += 1
            row = sims[i]  # tensor of shape (n_anchors,)
            matched = set()
            for j, score in enumerate(row.tolist()):
                if score >= args.threshold:
                    matched.add(categories[anchor_cat_index[j]])
            for cat in matched:
                if bucket == "spec2code":
                    spec_counts[cat] += 1
                else:
                    nonspec_counts[cat] += 1
        batch.clear()

    cur.execute("SELECT value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    for (value,) in cur:
        scanned += 1
        if args.progress and scanned % 5000 == 0:
            print(f"  scanned {scanned} bubbles (encoded so far)...", file=sys.stderr)

        if isinstance(value, (bytes, bytearray)):
            value = value.decode("utf-8", "ignore")
        if not isinstance(value, str):
            continue
        if '"type":2' not in value[:200]:
            continue

        bucket = classify_bubble(value, spec2code_own, nonspec_own)
        if bucket is None:
            continue

        text = extract_text_for_embedding(value, args.max_chars)
        batch.append((text, bucket))
        if len(batch) >= BATCH_SIZE:
            flush_batch()

    flush_batch()
    conn.close()

    print()
    print(f"Pattern set                                 : semantic (threshold {args.threshold})")
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
