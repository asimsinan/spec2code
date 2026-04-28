# Theme: Excuse-Making

**Definition.** The LLM invokes an external-sounding justification for skipping
verification work. The justifications reference concepts that do not apply to
the model (time pressure, efficiency, documentation adequacy) but that pattern
naturally onto human-developer experience and therefore sound plausible.

**Why it matters.** Excuse-Making is insidious because the excuses mirror
genuine trade-offs that human developers make. A supervisor who grants the
same leniency to a model that they would grant to a tired colleague has
miscalibrated trust.

**Categories in this theme** (3):

| # | Category | Short description |
|---|---|---|
| 17 | Time Constraint Excuse | "Due to time constraints, let me skip the verification step" |
| 18 | Efficiency Excuse | "For efficiency, let me combine these three edits" (substituting batch for verification) |
| 19 | Documentation Substitution | A descriptive document stands in for executable verification |

Excuse-Making exemplars come primarily from the chat-interaction corpus.
