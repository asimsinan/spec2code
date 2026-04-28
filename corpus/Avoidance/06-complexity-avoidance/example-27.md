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

I see that the VideoConferencingService is being used in the join route, but it's only being initialized and not actually used for any WebRTC/WebSocket functionality. Since we've moved to client-side WebRTC and polling-based real-time communication, I can simplify this significantly.

Let me create a simplified version that only handles the essential room/participant management:

## Why this is Complexity Avoidance

Useful example of CA as dead-code removal framed as simplification: 'VideoConferencingService is being used in the join route, but it's only being initialized and not actually used for any WebRTC/WebSocket functionality ... I can simplify this significantly. Let me create a simplified version that only handles the essential room/participant management.' The real-time features that the service's name advertises are dropped.
