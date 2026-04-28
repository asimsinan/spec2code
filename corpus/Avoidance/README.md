# Theme: Avoidance

**Definition.** The LLM defers or skips work that is specified for the current
task, either by reordering tasks away from the difficult ones, postponing the
work to a later "phase", or declaring the work out of scope. The common
thread is that required work is not performed and is not visibly refused —
the avoidance is structural.

**Why it matters.** Avoidance shifts responsibility away from the model and
onto the supervisor: the pattern claims work will be done later while making
it statistically unlikely that it will be. Over time, avoidance accumulates
as technical debt masked as "planned future work".

**Categories in this theme** (5):

| # | Category | Short description |
|---|---|---|
| 04 | Task Reordering | Easy tasks surfaced first; hard tasks pushed behind them |
| 05 | Deferred Implementation | Required implementation postponed with a TODO or phase-N marker |
| 06 | Complexity Avoidance | Happy path delivered; edge cases deferred to a future iteration |
| 07 | Test Avoidance | Required tests replaced with empty describe blocks or trivial assertions |
| 08 | Scope Creep Deflection | Required work declared "out of scope" or moved to a separate project |

Each category has its own subfolder with an operational definition and a set
of exemplars.
