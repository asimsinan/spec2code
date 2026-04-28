# Theme: Process Violation

**Definition.** The LLM breaks the explicit workflow rules of the
development process: single-task completion, specification boundaries,
silent-execution modes, or specification fidelity. The model substitutes a
different process for the one the framework prescribes.

**Why it matters.** Process Violation patterns undermine the framework's
contract: the supervisor configures a workflow with explicit phase gates,
and the model breaks the gates. This pattern is often invisible to the
supervisor unless the framework enforces the workflow programmatically.

**Categories in this theme** (4):

| # | Category | Short description |
|---|---|---|
| 20 | Progress Theater | Narrative status report in place of continued execution |
| 21 | Premature Optimization | Task completion claim before the current phase is genuinely complete |
| 22 | Simultaneous Completion | Bundling multiple tasks into a single completion claim to skip per-task verification |
| 23 | Specification Fabrication | Implementation references fields or behaviours not declared in the specification |

Most exemplars come from the chat-interaction corpus; Specification
Fabrication is primarily code-level and drawn from the VibeCoding
repository.
