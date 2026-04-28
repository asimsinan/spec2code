# 18 — Efficiency Excuse

**Theme:** Excuse-Making

## Operational definition

The LLM frames batched or collapsed work as "more efficient" to
substitute for per-task verification, per-call-site judgment, or
per-item review. The distinguishing feature is explicit efficiency
language (`for efficiency`, `more efficiently`, `more efficient
approach`, `batch these`) applied to a multi-item operation where the
bulk action replaces what would otherwise be independent work on each
item.

The framing is **rhetorical rather than mechanical**: there is no
actual constraint forcing the LLM to choose bulk-over-per-item, and
in many cases the bulk action is in fact correct refactoring (e.g.,
a pure rename via `replace_all`). What makes it Efficiency Excuse is
that the rhetorical frame imports a human productivity register ("let's
be efficient about this") that predisposes the reader to extend the
same indulgence to the LLM's skipped review.

Two common sub-forms emerge in the corpus:

1. **Bulk-refactor form.** The LLM identifies N similar call sites and
   collapses them with `replace_all`, a template, a helper function,
   or a generated script, framing the collapse as "more efficient."
2. **Delivery-framing form.** The LLM characterises a delivered
   feature or rendering path as "more efficient" (e.g., reduced
   animation delay, reduced polling frequency), using the word as a
   claim about the output rather than about the LLM's own work
   strategy.

## Detection approach

Chat-bubble scan for `for efficiency`, `to be efficient`, `more
efficient`, `streamline`, `batch these`, `combine these`, `together
for efficiency`. The category is highly productive — the practitioner
used "more efficient approach" as a rhetorical preamble to bulk
operations in dozens of refactoring sessions.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized per the policy in `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Efficiency Excuse` section naming
which form of the pattern the excerpt exhibits.


## Exemplars in this folder

`example-01.md` is the Appendix A seed. The remaining 13 verbatim
excerpts span:

**Bulk-refactor sub-forms** (11 exemplars):
- `02` — simplest: "update all of them"
- `03` — quirky contradiction: "one by one to be more efficient"
- `04` — search-and-replace for all response calls
- `05` — helper function introduced to batch the change
- `06` — comprehensive fix script for the "most common issues"
- `07` — `replace_all` form
- `08` — template-based systematic application across files
- `09` — batches framing for test fixes
- `10` — bulk-deletion of large blocks of unused methods
- `11` — cleanup-sweep removing all `console` statements
- `14` — script-based migration of all async-params call sites

**Delivery-framing sub-form** (1 exemplar):
- `12` — animation performance optimisation described as "making
  them more efficient"

**Multi-lever composite** (1 exemplar):
- `13` — time-pressure preamble stacked with efficiency framing and
  Task Reordering ("most critical services first" + "todo list first"
  as bookkeeping substitution)
