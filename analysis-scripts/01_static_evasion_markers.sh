#!/usr/bin/env bash
# 01_static_evasion_markers.sh
#
# Scan a VibeCoding-style project repository for strict evasion-marker
# patterns and count, for each project, the number of **files containing at
# least one marker**.
#
# Patterns matched (case-sensitive, line-anchored where applicable):
#   - TODO / FIXME / XXX / HACK in comment position (// # /*)
#   - "not implemented" / "not yet implemented"
#   - "placeholder implementation" / "stub implementation"
#
# Excludes: HTML placeholder= attributes, vendor libraries, generated code,
# build outputs, and test-artifact directories.
#
# Reproduces the per-project file counts in Appendix C of the paper. The
# paper reports this as files containing at least one strict evasion marker.
#
# Usage:
#   bash 01_static_evasion_markers.sh [--sum] /path/to/VibeCoding
#
# Options:
#   --sum   also print the total across all projects (expected: 55)

set -euo pipefail

print_sum=0
if [[ "${1:-}" == "--sum" ]]; then
  print_sum=1
  shift
fi

ROOT="${1:-}"
if [[ -z "$ROOT" ]]; then
  echo "usage: $0 [--sum] /path/to/VibeCoding" >&2
  exit 2
fi
if [[ ! -d "$ROOT" ]]; then
  echo "error: $ROOT is not a directory" >&2
  exit 2
fi

cd "$ROOT"

# Portable grep regex (BRE/ERE compatible with GNU grep and BSD grep).
PATTERN='^[[:space:]]*(//|#|/\*)[[:space:]]*(TODO|FIXME|XXX|HACK)\b|not[[:space:]]implemented|placeholder[[:space:]]implementation|stub[[:space:]]implementation|not[[:space:]]yet[[:space:]]implemented'

echo "Strict evasion-marker file counts per project (excluding vendor/generated)"
echo "================================================================="
printf "%-32s %s\n" "project" "files_with_marker"
printf "%-32s %s\n" "--------" "-----------------"

total=0
for d in */; do
  count=$(
    find "$d" -type f \( \
         -name "*.ts"  -o -name "*.tsx" \
      -o -name "*.js"  -o -name "*.jsx" \
      -o -name "*.swift" \) \
      ! -path "*/node_modules/*" \
      ! -path "*/.next/*"        \
      ! -path "*/dist/*"         \
      ! -path "*/build/*"        \
      ! -path "*/coverage/*"     \
      ! -path "*/Pods/*"         \
      ! -path "*/DerivedData/*"  \
      ! -path "*/generated/*"    \
      ! -path "*/.build/*"       \
      ! -path "*/test-results/*" \
      ! -path "*/playwright-report/*" \
      -exec grep -lE "$PATTERN" {} \; 2>/dev/null \
      | wc -l | tr -d ' '
  )
  printf "%-32s %s\n" "${d%/}" "$count"
  total=$(( total + count ))
done

if (( print_sum )); then
  echo "-----------------------------------------------------------------"
  printf "%-32s %s\n" "TOTAL" "$total"
fi
