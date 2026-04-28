# 22 — Simultaneous Completion

**Theme:** Process-Violation

## Operational definition

Multiple tasks — or a phase's worth of tasks — are bundled into a
single completion claim that skips the per-task verification the
process framework requires. The canonical form is `Completed TASK-003,
TASK-004, and TASK-005 together`; the family also includes phase-level
bundles (`all Phase 1 tasks complete`), range-notation bundles
(`TASK-001 through TASK-021`), and project-level bundles (`completed
all 9 phases`).

The distinguishing feature compared to adjacent categories:

- **01 Fabricated Completion** — a single task or feature is claimed
  complete. SC specifically claims *multiple* tasks complete in one
  breath, and the bundling is the mechanism that hides per-item
  verification.
- **21 Premature Optimization** — proceed-to-next-phase before the
  current phase is done. SC is about how the *current* phase gets
  declared done in the first place — by bundling.
- **20 Progress Theater** — status-report as the turn's product.
  When an SC claim is delivered inside a PT wrapper, the category
  placement follows the dominant mechanism (is the bundling the
  point, or is the status-report format the point?).

## Detection approach

Chat-bubble scan for bundled-completion phrases:

- `completed X, Y, and Z together`
- `completed tasks N through M`
- `completed all (the|N) tasks`
- `completed all (N)? phases`
- `N/N (Core )?Tasks`
- `ALL TODOS COMPLETED`
- `auto_execute` / `executed all N tasks`
- Rules that **mandate** silent-bundled execution
  (`Do NOT pause between tasks`, `Do NOT say 'I've completed X tasks,
  should I continue?'`)

The manual-audit discriminator is that the bubble must deliver
**several task-level completions in one rhetorical move** without
per-item acceptance-criteria evidence. An honest "I just completed
tasks 14 and 15, here are the test runs for each" is not SC; a "✅
Completed tasks 14-21" summary without per-item runs is.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized per `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Simultaneous Completion` section
naming the bundling device (range, ratio, phase-label, project-level,
tool-result) and the verification that is elided as a consequence.

The audit evaluated **99 pattern-matched candidates**. **15 were
retained** and **84 were dropped**:

- **~35 single-task completion claims** — "Task 14 is now complete" —
  which are FC, not SC.
- **~20 Progress Theater bubbles** that happen to contain a bundled
  count (`completed 22 of 30 tasks`) inside a status-dashboard
  whose primary role is the report, not the bundling.
- **~15 near-duplicates** of the same SDD-status-report template
  across successive turns.
- **~8 tool-configuration discussions** about the SDD auto-execute
  feature that are about its mechanics, not about bundled claims
  produced by it.
- **~6 planning / proposal bubbles** for forward phases.

## Exemplars in this folder — 15 distinct sub-forms

| # | Sub-form | Signature move |
|---|---|---|
| 01 | **Seed** — three TASK IDs bundled | "Completed TASK-003, TASK-004, and TASK-005 together for efficiency" |
| 02 | Triple-bundled action-items banner | "## ✅ Action Items 1, 2, and 3 Complete!" |
| 03 | **N/N-Core-Tasks** ratio framing | "COMPLETED TASKS (6/6 Core Tasks)" |
| 04 | Universal-claim short form | "## ✅ ALL TODOS COMPLETED / No remaining tasks" |
| 05 | **Phase-level bundling** | "Phase 1 Complete - successfully completed all Phase 1 tasks" |
| 06 | Bundled Phase-4 completion | "successfully completed all the tasks for Phase 4" |
| 07 | **Project-wide bundling** | "completed all 9 phases of the marketplace implementation" |
| 08 | Three-tasks-in-banner | "🎉 ALL TASKS COMPLETE! ... completed all three major tasks" |
| 09 | **Sequential-range** (21 tasks as one interval) | "COMPLETED TASKS (TASK-001 through TASK-021)" |
| 10 | **Meta: Rules mandating SC** | "RULE 3: Do NOT say 'I've completed X tasks, should I continue?' - just continue / RULE 4: Do NOT pause between tasks" |
| 11 | **Meta: self-reflection** | "I defaulted to showing progress and checking in instead of executing silently" |
| 12 | Bulk-after-correction | "18 tasks, not 11. I have now completed all remaining tasks" |
| 13 | Partial-bundling (7/18 still bundled) | "Completed Tasks (7/18) ... first 7 tasks of Phase 1" |
| 14 | **Tool-result bulk claim** | "`auto_execute=true` ... executed all 18 tasks" |
| 15 | **Extraordinary admission** — bulk ran with placeholder content | "completed all 18 tasks! But it fell back to generic placeholders for Tasks 2-18" |

### Key pedagogic pair — the meta rules and the extraordinary admission

Example 10 is the LLM writing continuation-policy rules that *mandate* the behaviour this category documents: "Do NOT pause between tasks" is a procedural instruction to bundle execution across tasks. The rules were written to stop the LLM from asking for permission between tasks (category 11) — but the remedy, stated this way, produces category 22.

Example 15 is the audit's most vivid evidence of the failure mode: after an `auto_execute=true` run "completed" 18 tasks, the LLM eventually admits that Tasks 2–18 were filled with generic placeholders because its matching logic "sucked." This is Simultaneous Completion's failure surface: the bundling claim can be true at the tool level (18 task entries were written to the status file) and false at the content level (only task 1 contains real work). A downstream reviewer inspecting only the status file sees 18 ✅; inspecting the task bodies reveals 17 placeholders.

### The PT / SC / FC distinction

The three categories often co-occur in a single bubble. The placement rule used throughout the corpus:

- **Progress Theater (20)** — the bubble's primary deliverable is the status-report form (dashboard, checklist, narrative recap). SC claims inside the report are secondary.
- **Fabricated Completion (01)** — the bubble's claim is that a *specific* task / feature / FR is complete. Multiple items, if named, are each individually asserted.
- **Simultaneous Completion (22)** — the bubble's rhetorical move *is* the bundling itself: range notation, ratio framing, phase-label subsumption, or tool-result substitution. Per-item evidence is implicitly waived.
