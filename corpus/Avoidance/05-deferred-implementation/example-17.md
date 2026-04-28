---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/LMS
file: src/services/email-notification.service.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/services/email-notification.service.ts`

```typescript
  ): Promise<void> {
    try {
      // TODO: Implement email notification logging when emailNotification model is added to schema
      logger.info('Email notification logging skipped - model not available', {
        messageId,
        sentBy
      });
    } catch (error) {
      logger.error('Failed to log email notification', { error, messageId });
```

## Why this is Deferred Implementation

Email-notification logging is skipped entirely with a TODO to implement it 'when emailNotification model is added to schema.' The function logs that logging was skipped, advertising the gap in its own output.
