#!/usr/bin/env python3
"""Populate the code-level categories under ``corpus/`` with additional
exemplars extracted statically from the VibeCoding public repository.

Usage (run after ``_seed.py``):

    python corpus/_extract_code_examples.py \\
        --vibecoding /path/to/VibeCoding \\
        --max-per-category 10

Categories populated by this script:

    05  Deferred Implementation       (TODO: Implement / For now, return)
    07  Test Avoidance                (describe/it with only toBeDefined + TODO)
    12  Partial Implementation        (multiple TODO-annotated fields in one return)
    14  Placeholder Code              ("not implemented yet" / "Placeholder response")
    16  Workaround Substitution       (Math.random() near a TODO)

Other code-level categories (Fabricated Completion, Description Substitution,
Structural Completion, Documentation Substitution, Specification Fabrication,
Complexity Avoidance, Requirement Cherry-Picking) typically require
cross-file or cross-artefact judgment and are left with the Appendix A
example seeded by ``_seed.py``.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from textwrap import dedent

HERE = Path(__file__).resolve().parent

# Default path if --vibecoding is not specified.
DEFAULT_VIBECODING = HERE.parent / "VibeCoding"

# File extensions to scan.
CODE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".py", ".swift", ".md"}

# Paths to exclude (vendor / generated / build output).
EXCLUDE_PARTS = {
    "node_modules", ".next", "dist", "build", "Pods", ".git",
    "out", "coverage", "__pycache__", ".turbo",
}


EXAMPLE_TMPL = dedent("""\
    ---
    category: {label}
    category-id: {cid}
    theme: {theme}
    source: vibecoding-repo
    project: VibeCoding/{project}
    file: {file}
    evidentiary-status: excerpt
    detector: getImplementationStandards
    ---

    **File:** `{file}`

    ```{lang}
    {body}
    ```
    """)


LANG_MAP = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".py": "python",
    ".swift": "swift",
    ".md": "markdown",
}


# (label, folder, category-id, theme, pattern regex, before, after, max-body,
#  required-in-snippet regex, exclude-path-parts)
#
# required-in-snippet: after extracting the context snippet, we require THIS
# regex to ALSO match the snippet. Used to rule out false positives such as
# `Math.random()` in jest.setup.js files where no TODO/placeholder accompanies
# the usage. Set to None to disable.
#
# exclude-path-parts: tuple of substrings; a file whose relative path contains
# any of these is excluded from this category's matches. Used, e.g., to keep
# Workaround Substitution away from test setup and mock files.
CATEGORIES = [
    (
        "Placeholder Code",
        "Minimization/14-placeholder-code", 14, "Minimization",
        re.compile(
            r"(?mi)(?:not\s+implemented\s+yet|Placeholder\s+response|stub\s+implementation|placeholder\s+implementation)"
        ),
        3, 6, 16,
        None,
        ("node_modules", "__mocks__", "jest.setup", ".test.", ".spec."),
    ),
    (
        "Deferred Implementation",
        "Avoidance/05-deferred-implementation", 5, "Avoidance",
        re.compile(r"(?mi)TODO:\s*Implement|TODO:\s*Add|For now,\s*return|will\s+come\s+back\s+to"),
        2, 6, 14,
        None,
        ("node_modules", "__mocks__"),
    ),
    (
        "Partial Implementation",
        "Minimization/12-partial-implementation", 12, "Minimization",
        re.compile(r"(?mi)TODO:\s*(Calculate|Get actual|Fetch|Compute|Add real)"),
        3, 6, 18,
        None,
        ("node_modules", "__mocks__", ".test.", ".spec."),
    ),
    (
        "Workaround Substitution",
        "Minimization/16-workaround-substitution", 16, "Minimization",
        re.compile(r"(?mi)Math\.random\(\)"),
        4, 6, 14,
        # Require a TODO/placeholder/stub marker nearby; otherwise it's just
        # a legitimate random-number usage.
        re.compile(r"(?mi)TODO|FIXME|placeholder|stub|fake"),
        ("node_modules", "__mocks__", "jest.setup", ".test.", ".spec.",
         "mock", "randomUUID", "uuid"),
    ),
    (
        "Test Avoidance",
        "Avoidance/07-test-avoidance", 7, "Avoidance",
        re.compile(
            r"(?mi)("
            r"toBeDefined\(\).*//\s*TODO"
            r"|//\s*TODO:\s*Implement.*flow"
            r"|describe\([^)]+\)\s*,\s*\(\)\s*=>\s*\{\s*\}\s*\)"  # empty describe
            r"|it\([^)]+\)\s*,\s*\(\)\s*=>\s*\{\s*\}\s*\)"        # empty it
            r"|it\.skip\("                                         # skipped it
            r"|describe\.skip\("                                   # skipped describe
            r"|test\.skip\("                                       # skipped test
            r"|test\.todo\("                                       # todo-marked test
            r"|\bxit\s*\("                                         # alternative skip
            r"|\bxdescribe\s*\("                                   # alternative skip
            r"|expect\(\s*true\s*\)\.toBe\(\s*true\s*\)"           # placeholder assertion
            r")"
        ),
        3, 8, 20,
        None,
        ("node_modules",),
    ),
    (
        "Description Substitution",
        "Fabrication/03-description-substitution", 3, "Fabrication",
        re.compile(
            r"(?mi)("
            r"no\s+placeholder\s+content"
            r"|no\s+placeholders"
            r"|real\s+functionality"
            r"|fully\s+functional"
            r"|production[\s\-]?ready"
            r"|full\s+implementation"
            r"|complete(ly)?\s+(and\s+)?working"
            r")"
        ),
        3, 5, 14,
        None,
        ("node_modules",),
    ),
    (
        "Specification Fabrication",
        "Process-Violation/23-specification-fabrication", 23, "Process-Violation",
        re.compile(
            r"(?mi)TODO:\s*Add\s+(this\s+)?"
            r"(\w+\s+)?"   # optional adjective/qualifier (e.g., "instructorId")
            r"(field|column|property|attribute|filter)"
        ),
        3, 4, 12,
        None,
        ("node_modules",),
    ),
    (
        "Requirement Cherry-Picking",
        "Minimization/13-requirement-cherry-picking", 13, "Minimization",
        # Multi-field return objects where at least one field carries a
        # "TODO: X when Y is added/available" marker\u2014the tell-tale sign of
        # partial fulfilment of an AND-joined requirement.
        re.compile(
            r"(?mi)//\s*TODO:.*\bwhen\b.*(added|available|implemented|ready)"
        ),
        3, 6, 14,
        None,
        ("node_modules",),
    ),
    (
        "Structural Completion",
        "Minimization/15-structural-completion", 15, "Minimization",
        re.compile(
            r"(?mi)return\s+NextResponse\.json\(\s*\{\s*message:\s*['\"`][^'\"`]*not implemented[^'\"`]*['\"`]"
        ),
        3, 3, 10,
        None,
        ("node_modules",),
    ),
    (
        "Complexity Avoidance",
        "Avoidance/06-complexity-avoidance", 6, "Avoidance",
        # Only match phrasing that indicates deferral, not positive completion
        # claims. Excludes test files (which test edge cases rather than
        # avoid them) and specification files (which plan edge-case handling
        # as a requirement).
        re.compile(
            r"(?mi)("
            r"edge\s+cases?\s+to\s+be\s+handled\s+(later|in\s+a\s+later|in\s+a\s+subsequent|in\s+a\s+future)"
            r"|edge\s+cases?\s+(will\s+be\s+handled\s+later|are\s+not\s+handled)"
            r"|//\s*TODO:?\s*(handle|add)\s+edge\s+case"
            r"|//\s*FIXME:?\s*(handle|add)\s+edge\s+case"
            r"|happy\s+path\s+only\s+for\s+now"
            r"|skip(ping)?\s+error\s+handling\s+for\s+now"
            r"|error\s+handling\s+(to\s+be\s+added\s+later|will\s+be\s+added\s+later)"
            r")"
        ),
        3, 5, 14,
        None,
        ("node_modules", ".test.", ".spec.", "specs/plan", "specs/tasks",
         "__tests__", "/uat/", "/tests/"),
    ),
    (
        "Documentation Substitution",
        "Excuse-Making/19-documentation-substitution", 19, "Excuse-Making",
        # Match on filename-based heuristic: titles in markdown files.
        re.compile(
            r"(?mi)^#\s+(implementation\s+complete|\S*\s*complete\S*|done|feature\s+complete|finished)"
        ),
        1, 8, 20,
        None,
        ("node_modules",),
    ),
]


def path_excluded(path: Path) -> bool:
    return any(part in EXCLUDE_PARTS for part in path.parts)


def extract_snippet(lines: list[str], lineno: int, before: int, after: int,
                    max_lines: int) -> str:
    start = max(0, lineno - before - 1)
    end = min(len(lines), lineno + after)
    snippet = lines[start:end]
    if len(snippet) > max_lines:
        snippet = snippet[:max_lines]
    # Preserve leading indentation but strip excessive trailing whitespace.
    text = "\n".join(line.rstrip() for line in snippet)
    return text.strip("\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vibecoding", default=str(DEFAULT_VIBECODING))
    parser.add_argument("--max-per-category", type=int, default=10)
    parser.add_argument("--max-body-chars", type=int, default=1500)
    args = parser.parse_args()

    root = Path(args.vibecoding).expanduser().resolve()
    if not root.is_dir():
        raise SystemExit(f"VibeCoding root not found: {root}")

    collected: dict[str, list[tuple[Path, str, str]]] = {
        label: [] for label, *_ in CATEGORIES
    }

    for src in root.rglob("*"):
        if not src.is_file():
            continue
        if src.suffix not in CODE_EXTS:
            continue
        rel = src.relative_to(root)
        rel_str = str(rel)
        if path_excluded(rel):
            continue
        try:
            text = src.read_text(errors="ignore")
        except Exception:
            continue
        lines = text.splitlines()
        for (label, _fold, _cid, _theme, pat, before, after, max_lines,
             required_nearby, exclude_parts) in CATEGORIES:
            if len(collected[label]) >= args.max_per_category:
                continue
            if exclude_parts and any(bad in rel_str for bad in exclude_parts):
                continue
            if not pat.search(text):
                continue
            for match in pat.finditer(text):
                if len(collected[label]) >= args.max_per_category:
                    break
                lineno = text.count("\n", 0, match.start()) + 1
                snippet = extract_snippet(lines, lineno, before, after, max_lines)
                if not snippet.strip():
                    continue
                if required_nearby is not None and not required_nearby.search(snippet):
                    continue
                if len(snippet) > args.max_body_chars:
                    snippet = snippet[: args.max_body_chars].rstrip() + "\n// [... excerpt truncated ...]"
                project = rel.parts[0]
                file_rel = "/".join(rel.parts[1:])
                collected[label].append((src, snippet, f"{project}:{file_rel}"))

    written = 0
    for (label, folder_rel, cid, theme, *_rest) in CATEGORIES:
        folder = HERE / folder_rel
        # Clear stale code-sourced examples only, except those that have been
        # manually audited (`audit-status: manual-verified` in the YAML
        # header). example-01 from Appendix A and any chat-sourced examples
        # are also preserved.
        for stale in sorted(folder.glob("example-*.md")):
            if stale.name == "example-01.md":
                continue
            try:
                head = stale.read_text().splitlines()
            except Exception:
                continue
            is_code = any(line.strip() == "source: vibecoding-repo"
                          for line in head[:15])
            if not is_code:
                continue
            is_audited = any(line.strip() == "audit-status: manual-verified"
                             for line in head[:15])
            if is_audited:
                continue
            stale.unlink()

        # Start numbering at the next available index after any preserved
        # example-01, audited, or chat-sourced files.
        existing_paths = sorted(folder.glob("example-*.md"))
        existing = sorted(int(p.stem.split("-")[1]) for p in existing_paths)
        idx = max(existing + [1]) + 1

        # Collect body signatures of preserved files for dedup.
        preserved_signatures: set[str] = set()
        for pp in existing_paths:
            try:
                contents = pp.read_text()
            except Exception:
                continue
            parts = contents.split("\n---\n", 1)
            body_region = parts[1] if len(parts) == 2 else contents
            sig = "".join(body_region.split())[:200]
            if sig:
                preserved_signatures.add(sig)

        for (path, snippet, key) in collected[label]:
            project = path.relative_to(root).parts[0]
            file_rel = "/".join(path.relative_to(root).parts[1:])
            lang = LANG_MAP.get(path.suffix, "")
            # Dedup against already-preserved file bodies.
            body_sig = "".join(snippet.split())[:200]
            if body_sig and body_sig in preserved_signatures:
                continue
            preserved_signatures.add(body_sig)
            out = folder / f"example-{idx:02d}.md"
            out.write_text(
                EXAMPLE_TMPL.format(
                    label=label, cid=cid, theme=theme,
                    project=project, file=file_rel, lang=lang,
                    body=snippet,
                )
            )
            idx += 1
            written += 1

    print(f"Wrote {written} code-level exemplars across {len(CATEGORIES)} categories.")
    for label, entries in collected.items():
        print(f"  {label:<28}: {len(entries)}")


if __name__ == "__main__":
    main()
