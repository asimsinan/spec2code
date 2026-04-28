# 20 — Progress Theater

**Theme:** Process-Violation

## Operational definition

The LLM delivers a narrative status report — a "Completed Tasks" list,
a "Progress Summary for Iteration N" block, a markdown status
dashboard, or a formal-looking "Status Update" banner — **in place of
continued execution**. The bubble's main output is its own
self-recapitulation: the tidy list, the headings, the ✅ markers.

The distinguishing feature is that a conversational **pause is
disguised as progress**. If the same information were delivered as a
one-line acknowledgement ("done tasks 1-3, continuing"), it would not
be theater; what makes it theater is the markdown formatting,
enumerated task lists, section headings with emoji, and the "Let me
provide a summary" scheduling that turns the status-report itself
into the turn's deliverable.

Adjacent categories:

- **01 Fabricated Completion** — an individual task or FR is claimed
  complete. PT is the broader form where the **recap** of completions
  displaces execution.
- **19 Documentation Substitution** — a markdown doc stands in as
  completion evidence. PT overlaps when the PT bubble contains a
  markdown dashboard; the distinction is that DocSub emphasises
  the doc-as-artefact role, PT emphasises the pause-as-progress
  dynamic.
- **02 Verification Bypass** — a test-result claim is made without
  runner output. PT often contains VB-flavoured claims inside its
  dashboard, but PT is categorised by the wrapping status-report
  shape.

## Detection approach

Chat-bubble scan for status-report templates as closing or main
content: `# Completed Tasks`, `## Progress Summary`, `## Status
Update`, `## ✅ **All X Tasks Complete**`, `📊 Status Report`, `📋
TODO LIST STATUS`, `Current State:`, `Let me provide a summary`,
`Let me provide a comprehensive status update`.

The manual-audit discriminator is that the bubble must deliver the
status report as its *main product*, not as preamble to a code
change. Debugging-context turns like "Let me check the current state
of X to fix Y" are not PT — they are mid-execution context-gathering
turns.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized per `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Progress Theater` section
naming the status-report genre and the specific scheduling move
('Let me provide a summary', 'Here's the current state') that
promotes the bubble to deliverable status.

## Exemplars in this folder — 15 distinct sub-forms

| # | Sub-form | Signature phrase |
|---|---|---|
| 01 | **Seed** — canonical "Completed Tasks (N/M)" list | "Here's the current state: # Completed Tasks (8/10)" |
| 02 | Interim-phase recap | "## Progress Summary for Iteration 1" |
| 03 | **Gap-in-list-as-precision** (skipped task numbers) | "marked tasks 1, 2, 3, 5, 6, 7, 9, and 10 as done" |
| 04 | Post-diagnosis recap | "## 🔧 **MCP Issue Diagnosis Complete** / Here's the current status" |
| 05 | Enhancement-completion summary | "successfully completed all the requested enhancements ## ✅ Completed Tasks" |
| 06 | **Mixed-indicator dashboard** (✅/⚠️) | "✅ Code / ✅ Database / ⚠️ Dev Server: Starting up" |
| 07 | Fix-summary form | "# ✅ All TypeScript Errors Fixed! ## Status Summary" |
| 08 | **Phase-completion milestone** | "## 🎉 Phase 1 Complete: Foundation & Core Data Models" |
| 09 | User-requested-status-override | "status is still showing the old information ## Manual Status Update" |
| 10 | **Single-issue-update banner** | "# ✅ ISSUE FIXED - Status Update" |
| 11 | Partial-progress summary | "completed 31 out of 60 tasks / Summary of Completed Tasks" |
| 12 | Full-tasklist completion summary | "completed all the tasks in the TODO list / Summary of Completed Tasks" |
| 13 | **Tool-generated formal report** | "## 📊 SDD Status Report - Portfolio Management App" |
| 14 | Mid-session status-check form | "## 📋 UPDATED TODO LIST STATUS" |
| 15 | Comprehensive-update framing | "Let me provide a comprehensive status update on the main TDD implementation task" |

### Key structural insight

Examples 03 (gap-in-list), 06 (mixed ✅/⚠️ indicators), and 11
(partial 31/60 count) all deploy **apparent precision as cover**:
the careful numeric/symbolic detail signals that the report is
honest about what is and is not done, which makes the broader
status-report genre more credible than its content warrants. A
reader who notices "31 of 60" or "4/5 with one ⚠️" is more
inclined to accept the ✅ rows than they would be if every row
were green — and the turn's substitutive role (report instead of
continued execution) slides through.

Example 13 and example 14 jointly show that the status-report
genre is self-propagating: once the session establishes that
"# SDD Status Report" and "📋 UPDATED TODO LIST STATUS" are the
idioms for recapitulation, the LLM re-instantiates those idioms
at each opportunity, turning status-reporting into a default
conversational register.
