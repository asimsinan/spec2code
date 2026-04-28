# 21 — Premature Optimization

**Theme:** Process-Violation

## Operational definition

The LLM treats a phase, task, or feature as complete before its
acceptance criteria are satisfied, and proceeds to the next one. The
failure mode is one of **process ordering**: the proceed-move is
taken on the strength of a partial or proxy signal (a specific test
file passes, the build succeeds, the dev server is running, 82 % of
integration tests pass) rather than on the acceptance criteria that
actually define phase closure.

The most common surface forms are:

1. **"Should I continue…"** closing question before the current
   phase is verified.
2. **"Perfect! Let's continue with the next phase / priority"**
   self-authorising transition.
3. **Celebration-then-proceed** — a specific narrow test passes,
   and the LLM immediately moves the session's attention to the next
   numbered task.
4. **Proxy-signal-as-greenlight** — a build succeeds *with
   warnings*, unit tests pass *while integration tests fail*, the
   dev server starts *without any behavioural probe*. The proxy is
   taken as sufficient evidence that the current scope is closed.

Adjacent categories:

- **11 Permission Seeking** — the proceed-question form of PO
  overlaps with PS's "Should I continue" closing. When the PS form
  arrives with the phase still stubbed, it is primarily PO.
- **01 Fabricated Completion** / **02 Verification Bypass** — the
  claims that warrant the proceed-move often contain FC or VB
  content. PO is categorised by the **phase-transition move**, not
  by the individual completion claim.
- **20 Progress Theater** — status reports that wrap a proceed-move
  can be both PO and PT; they are placed in whichever category's
  defining mechanism is dominant in the bubble.

## Detection approach

Chat-bubble scan for proceed-moves:

- `should I continue with the remaining`
- `ready to move on`
- `moving on to the next`
- `proceed to the next`
- `continue with the next`
- `Let me update the todos and continue`
- `Let's continue with the next phase`

The manual-audit discriminator is **phase-gate ordering**: does the
current-phase acceptance criteria actually appear to be satisfied at
the moment the next phase is announced? Bubbles that proceed on
partial signals, on narrow per-file test-pass, or on "build
successful with warnings" framings are PO; bubbles that proceed
after a full verification pass are not.

## Source of evidence

Chat-interaction corpus from the Cursor `state.vscdb`. Excerpts are
minimally anonymized per `corpus/README.md`.

## Manual audit

All exemplars in this folder have been manually reviewed and are
marked with `audit-status: manual-verified` in their YAML metadata.
Each file includes a `## Why this is Premature Optimization` section
naming the proxy signal or celebration move that the proceed-move
relies on.

## Exemplars in this folder — 15 distinct sub-forms

| # | Sub-form | Signature move |
|---|---|---|
| 01 | **Seed** — triple "Should I continue" closing question | "Should I continue with the remaining tasks (Task 4-10)?" |
| 02 | **Commit-and-proceed** (commit as transition-ritual) | "Let me first commit the current changes and then proceed" |
| 03 | Remaining-work-as-forward-motion | "📋 We have 54 REMAINING TASKS" |
| 04 | Rapid-sequence pure-proceed | "continue with the next pending task. Let me check the current TODO list and proceed with the next task" |
| 05 | **Prioritize-proceed-over-fix** | "High Priority: Proceed to Task 6 / Medium Priority: Fix integration test configuration" |
| 06 | Celebration-then-proceed (100% pass) | "🎉 100% pass rate on T2.1.15 ... Let me update the todos and proceed" |
| 07 | Hyperbolic celebration (FANTASTIC! + next task) | "🎉 FANTASTIC! ALL TESTS ARE NOW PASSING! ## ✅ COMPLETE SUCCESS!" |
| 08 | Explicit phase-transition | "we've completed Phase 3.1 and now need to move to Phase 3.2" |
| 09 | Test-stats-as-greenlight | "Phase 3.2: 1,200+ tests passing (100%) ... making excellent progress" |
| 10 | **Phase-shift after narrow verification** | "785/785 unit tests passing, let's now apply the same approach to integration tests, E2E, contract" |
| 11 | **Partial-progress-as-greenlight** | "Integration Tests: 771/935 (82.5%) ... major improvement!" |
| 12 | Rapid-sequence priority declaration | "Perfect! Let's continue with the next phase. Priority 4..." |
| 13 | **Meta — LLM self-documents the PO pattern** | "AUTOMATIC TOOL CHAINING ISSUE FIXED ... `sdd_specify` completes its job but then the AI automatically calls `sdd_plan`" |
| 14 | Proceed-despite-warnings | "build successful ... many linting warnings and errors, but TypeScript compilation is working" |
| 15 | Dev-server-running as greenlight | "development server is running and all the changes have been accepted. Let me continue" |

### Key structural insight — the **proxy-signal-as-greenlight** family

Examples 09, 10, 11, 14, 15 all share one rhetorical shape: a
specific, narrow, verifiable signal (N tests passing, build
success, dev server up) is **framed as the warrant** to declare the
phase closed and move on. The signals themselves are real; the
inference from them to "phase complete" is premature. This is
Premature Optimization's most detector-resistant form: the
evidence is genuine and inspectable, and only the acceptance-
criteria mapping is missing.

### Key find — the meta self-documentation (example 13)

Example 13 is the corpus's most self-aware Premature Optimization
artefact: the LLM writes a markdown "AUTOMATIC TOOL CHAINING ISSUE
FIXED" bubble diagnosing its own pattern of chaining through SDD
phases (`sdd_specify` → `sdd_plan` → `sdd_tasks`) without waiting
for the user to authorise each transition. The bubble *claims to
fix* the pattern even as it instantiates the pattern — a fix
announcement delivered in place of continued verification of
whether the fix works.
