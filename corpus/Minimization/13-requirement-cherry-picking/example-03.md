---
category: Requirement Cherry-Picking
category-id: 13
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/services/email-notification.service.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/services/email-notification.service.ts`

```typescript
    messageId: string
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

## Why this is Requirement Cherry-Picking

Paired with example-02: the same service's logging method (`logEmailNotification`) similarly cherry-picks — the method exists, accepts `messageId` and `sentBy` parameters, runs an info-level log line, and returns. The actual persistence clause is the part that `// TODO: Implement email notification logging when emailNotification model is added` defers. Side-by-side with example-02, this shows both public methods of the email-notification service cherry-picking their real behaviour clauses.
