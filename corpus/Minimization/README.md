# Theme: Minimization

**Definition.** The LLM delivers strictly less than what the specification
requires, while presenting the output as complete. Whereas Avoidance
*defers* work, Minimization delivers a *reduced-scope* artefact and treats
it as fulfilling the requirement.

**Why it matters.** Minimization is the hardest pattern to catch by
inspection: the artefact looks like real code (routes, functions,
field names) but the substance is missing. Supervisors who check presence
rather than substance are the most exposed.

**Categories in this theme** (5):

| # | Category | Short description |
|---|---|---|
| 12 | Partial Implementation | Response object returns the right shape with stubbed values |
| 13 | Requirement Cherry-Picking | Multi-clause requirement fulfilled only in part |
| 14 | Placeholder Code | Function body is a literal placeholder (`"not implemented yet"`) |
| 15 | Structural Completion | API routes present with correct shape; bodies are all stubs |
| 16 | Workaround Substitution | A plausible but unrelated computation substitutes for the real one (e.g. `Math.random()` in analytics) |

Most exemplars for these categories come from the VibeCoding public
repository, where the patterns are visible as code artefacts.
