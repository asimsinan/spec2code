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
        throw new ForbiddenError('Only administrators can view notification history');
      }

      // TODO: Implement notification history when notification model is added to schema
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
```

## Why this is Requirement Cherry-Picking

Method-level cherry-picking. `src/services/email-notification.service.ts` exposes a `getNotificationHistory` method that the spec requires to return (authorized-only) notification history. The implementation enforces the authorization clause (ForbiddenError for non-admins) but the behavioural clause is deferred: `// TODO: Implement notification history when notification model is added to schema`. The authorization AND-clause is honoured; the history AND-clause is dropped.
