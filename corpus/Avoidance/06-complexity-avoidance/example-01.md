---
category: Complexity Avoidance
category-id: 6
theme: Avoidance
source: chat-interaction-corpus
project: [anonymized]
file: null
evidentiary-status: illustrative
audit-status: manual-verified
detector: getImplementationStandards
---

Specification requires input validation, error handling, and offline queue support; delivered implementation covers only the happy path with a comment "edge cases to be handled in a later iteration."

## Why this is Complexity Avoidance

Textbook fit. A named specification requirement (input validation + error
handling + offline queue) is explicitly reduced to a subset (happy path
only), with an in-code deferral comment that signals the remainder is not
intended to be implemented in this pass.
