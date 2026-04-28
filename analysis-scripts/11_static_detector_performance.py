#!/usr/bin/env python3
"""Reproduce the static detector performance table from manual audit inputs.

This script computes per-category F1 and macro averages from the frozen
manual-audit precision/recall summary in ``static_detector_audit.csv``.
It complements ``01_static_evasion_markers.sh``, which reproduces candidate
extraction and per-project static prevalence from the VibeCoding repository.

Usage:
    python 11_static_detector_performance.py
    python 11_static_detector_performance.py --csv static_detector_audit.csv
    python 11_static_detector_performance.py --latex
"""

from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


DEFAULT_CSV = Path(__file__).with_name("static_detector_audit.csv")
EXPECTED_MACRO = (0.85, 0.76, 0.80)


@dataclass(frozen=True)
class AuditRow:
    category: str
    precision: float
    recall: float
    illustrative_match: str

    @property
    def f1(self) -> float:
        if self.precision + self.recall == 0:
            return 0.0
        return 2 * self.precision * self.recall / (self.precision + self.recall)


def load_rows(path: Path) -> list[AuditRow]:
    if not path.exists():
        sys.exit(f"error: audit CSV not found: {path}")

    with path.open(newline="") as fh:
        reader = csv.DictReader(fh)
        required = {"category", "precision", "recall", "illustrative_match"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            sys.exit(f"error: {path} missing columns: {', '.join(sorted(missing))}")

        rows: list[AuditRow] = []
        for line_no, row in enumerate(reader, start=2):
            try:
                precision = float(row["precision"])
                recall = float(row["recall"])
            except (TypeError, ValueError) as exc:
                sys.exit(f"error: invalid numeric value on line {line_no}: {exc}")
            if not (0 <= precision <= 1 and 0 <= recall <= 1):
                sys.exit(f"error: precision/recall out of range on line {line_no}")
            rows.append(
                AuditRow(
                    category=row["category"],
                    precision=precision,
                    recall=recall,
                    illustrative_match=row["illustrative_match"],
                )
            )

    if not rows:
        sys.exit(f"error: no audit rows found in {path}")
    return rows


def macro(rows: Iterable[AuditRow]) -> tuple[float, float, float]:
    row_list = list(rows)
    n = len(row_list)
    return (
        sum(row.precision for row in row_list) / n,
        sum(row.recall for row in row_list) / n,
        sum(row.f1 for row in row_list) / n,
    )


def fmt(value: float) -> str:
    return f"{value:.2f}"


def print_plain(rows: list[AuditRow]) -> None:
    print("Static detector performance on the VibeCoding corpus")
    print("====================================================")
    print(f"{'Category':30s} {'P':>5s} {'R':>5s} {'F1':>5s}")
    print("-" * 50)
    for row in rows:
        print(f"{row.category:30s} {fmt(row.precision):>5s} {fmt(row.recall):>5s} {fmt(row.f1):>5s}")

    p, r, f1 = macro(rows)
    print("-" * 50)
    print(f"{'Macro average':30s} {fmt(p):>5s} {fmt(r):>5s} {fmt(f1):>5s}")


def print_latex(rows: list[AuditRow]) -> None:
    for row in rows:
        print(
            f"{row.category:<28s} & {fmt(row.precision)} & {fmt(row.recall)} "
            f"& {fmt(row.f1)} & {row.illustrative_match} \\\\"
        )
    p, r, f1 = macro(rows)
    print(r"\midrule")
    print(
        rf"\textbf{{Macro average}}    & \textbf{{{fmt(p)}}} "
        rf"& \textbf{{{fmt(r)}}} & \textbf{{{fmt(f1)}}} & \\"
    )


def check_expected(rows: list[AuditRow]) -> None:
    observed = tuple(round(value, 2) for value in macro(rows))
    if observed != EXPECTED_MACRO:
        expected = ", ".join(fmt(v) for v in EXPECTED_MACRO)
        actual = ", ".join(fmt(v) for v in observed)
        sys.exit(f"error: macro row mismatch: expected ({expected}), got ({actual})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="manual-audit summary CSV")
    parser.add_argument("--latex", action="store_true", help="print LaTeX table rows")
    parser.add_argument(
        "--no-check",
        action="store_true",
        help="do not assert that the macro row matches the manuscript",
    )
    args = parser.parse_args()

    rows = load_rows(args.csv)
    if not args.no_check:
        check_expected(rows)

    if args.latex:
        print_latex(rows)
    else:
        print_plain(rows)


if __name__ == "__main__":
    main()
