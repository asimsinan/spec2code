#!/usr/bin/env python3
"""10_cross_family_semantic.py

Cross-family category-presence rates under the **semantic** (sentence-
transformer) tier. 

A bubble is counted for a category when any anchor sentence for that
category scores above the cosine-similarity threshold (default 0.45).
Reported rates are percentages of assistant messages per family matching
at least one anchor for the category.

This is the semantic-tier input for the paper's triangulated cross-family
table. Expect higher rates than the strict tier because the anchor sentences
trigger on paraphrased variants the literal patterns miss (and on some
incidental text).

Requirements:
    pip install sentence-transformers pyyaml

Usage:
    python 10_cross_family_semantic.py STATE_DB
        [--anchors ANCHORS]
        [--threshold THRESHOLD]
        [--model MODEL]
        [--max-chars MAX_CHARS]
        [--batch-size BATCH]
        [--progress]
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

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
        "sentence-transformers and torch are required:\n"
        "    pip install sentence-transformers",
        file=sys.stderr,
    )
    sys.exit(1)


DEFAULT_ANCHORS = "07_semantic_anchors.yaml"
DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_THRESHOLD = 0.45
DEFAULT_MAX_CHARS = 2000
DEFAULT_BATCH_SIZE = 256


FAMILIES: Dict[str, List[str]] = {
    "Claude 3.5": [
        "claude-3.5-sonnet"
    ],
    "GPT-4": [
        "gpt-4"
    ],
    "Opus 4.5": [
        "claude-4.5-opus-high",
    ],
    "Sonnet 4.5": [
        "claude-4.5-sonnet"
    ],
}

FAMILY_ORDER: List[str] = ["Claude 3.5", "GPT-4", "Opus 4.5", "Sonnet 4.5"]


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


def load_anchors(path: Path) -> Dict[str, List[str]]:
    if not path.exists():
        sys.exit(f"error: anchors file not found: {path}")
    with path.open() as fh:
        data = yaml.safe_load(fh)
    return {cat: list(anchors) for cat, anchors in data.items()}


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


def extract_text(value: str, max_chars: int) -> str:
    """Extract the assistant's natural-language text from the bubble JSON.

    Bubble values are JSON objects with many fields; the natural-language
    content we want is in the top-level ``text`` field. Code blocks live in
    ``codeBlocks``; we do not embed those (they pull similarity toward code-
    shaped tokens rather than the conversational language that anchor
    sentences represent). Returns the first ``max_chars`` characters of the
    ``text`` field, or an empty string when absent.
    """
    try:
        data = json.loads(value)
    except Exception:
        return value[:max_chars]
    text = data.get("text") or ""
    if not isinstance(text, str):
        return ""
    return text[:max_chars]


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
        "--threshold", type=float, default=DEFAULT_THRESHOLD,
        help=f"cosine-similarity threshold (default: {DEFAULT_THRESHOLD})",
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL,
        help=f"sentence-transformers model (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--max-chars", type=int, default=DEFAULT_MAX_CHARS,
        help=f"per-bubble text prefix length (default: {DEFAULT_MAX_CHARS})",
    )
    parser.add_argument(
        "--batch-size", type=int, default=DEFAULT_BATCH_SIZE,
        help=f"encoder batch size (default: {DEFAULT_BATCH_SIZE})",
    )
    parser.add_argument(
        "--progress", action="store_true",
        help="print progress updates while scanning",
    )
    args = parser.parse_args()

    anchors = load_anchors(Path(args.anchors))
    categories = list(anchors.keys())
    model_to_family = build_model_to_family()

    print(f"Loading model: {args.model}", file=sys.stderr)
    model = SentenceTransformer(args.model)

    # Flatten anchors and encode once.
    anchor_flat: List[str] = []
    anchor_cat_index: List[int] = []
    for i, cat in enumerate(categories):
        for anchor in anchors[cat]:
            anchor_flat.append(anchor)
            anchor_cat_index.append(i)
    anchor_emb = model.encode(anchor_flat, convert_to_tensor=True, show_progress_bar=False)

    conn = open_state_db(args.state_db)
    cur = conn.cursor()

    # composerId -> family label (or None when not in any family).
    cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'composerData:%'")
    comp_family: Dict[str, str] = {}
    for key, value in cur:
        try:
            composer_id = key.split(":", 1)[1]
            if isinstance(value, (bytes, bytearray)):
                value = value.decode("utf-8", "ignore")
            data = json.loads(value)
            model_name = (data.get("modelConfig") or {}).get("modelName")
            if not model_name:
                continue
            fam = model_to_family.get(model_name.lower())
            if fam is not None:
                comp_family[composer_id] = fam
        except Exception:
            continue

    fam_total: Dict[str, int] = defaultdict(int)
    fam_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    batch: List[Tuple[str, str]] = []  # (text, family_label)

    def flush_batch() -> None:
        if not batch:
            return
        texts = [b[0] for b in batch]
        labels = [b[1] for b in batch]
        emb = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
        sims = util.cos_sim(emb, anchor_emb)  # (batch_size, n_anchors)
        for i, label in enumerate(labels):
            fam_total[label] += 1
            row = sims[i]
            matched = set()
            for j, score in enumerate(row.tolist()):
                if score >= args.threshold:
                    matched.add(categories[anchor_cat_index[j]])
            for cat in matched:
                fam_counts[label][cat] += 1
        batch.clear()

    scanned = 0
    cur.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
    for key, value in cur:
        scanned += 1
        if args.progress and scanned % 5000 == 0:
            print(f"  scanned {scanned} bubbles (encoded so far)...", file=sys.stderr)

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

        text = extract_text(value, args.max_chars)
        if not text:
            continue
        batch.append((text, family))
        if len(batch) >= args.batch_size:
            flush_batch()

    flush_batch()
    conn.close()

    abbrev = [CATEGORY_ABBREVIATIONS.get(c, c[:6]) for c in categories]
    col_width = 6
    header = (
        f"{'Family':<14} {'N':>9}  "
        + " ".join(f"{a:>{col_width}}" for a in abbrev)
    )

    print()
    print(f"Pattern set : semantic (threshold {args.threshold}; model {args.model})")
    print(f"Scanned bubbles total : {scanned}")
    print()
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
