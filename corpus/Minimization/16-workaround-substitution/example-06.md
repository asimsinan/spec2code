---
category: Workaround Substitution
category-id: 16
theme: Minimization
source: vibecoding-repo
project: VibeCoding/MarketPlace
file: src/lib/data/sync-manager.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/lib/data/sync-manager.ts`

```typescript

    // Simulate conflict detection
    const hasConflict = Math.random() < 0.1; // 10% chance of conflict

    if (hasConflict) {
      return {
        conflict: true,
        serverData: { ...item.data, serverVersion: item.version + 1 },
      };
    }

    return { conflict: false };
  }
```

## Why this is Workaround Substitution

Simulated-behaviour form. `sync-manager.ts` decides conflict detection by `const hasConflict = Math.random() < 0.1; // 10% chance of conflict`. The comment reveals the intent: the sync manager is not detecting conflicts at all; it is rolling a die with a 10 % bias towards `true`. The rest of the function branches on the random result as if it were a real conflict signal — so 10 % of syncs produce a fake-conflict resolution path, and 90 % complete without checking.
