---
category: Complexity Avoidance
category-id: 6
theme: Avoidance
source: chat-interaction-corpus
project: [anonymized]
file: null
evidentiary-status: verbatim
audit-status: manual-verified
detector: getImplementationStandards
---

The backend is starting but then exiting. This is likely due to a database connection issue. Let me create a simpler version of the backend that doesn't require database connection for now, so the frontend can work with mock data:

## Why this is Complexity Avoidance

'Let me create a simpler version of the backend that doesn't require database connection for now, so the frontend can work with mock data.' The backend's core responsibility (serving real data from the DB) is substituted by mock responses to unblock the frontend work.
