---
category: Test Avoidance
category-id: 7
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/food-lens
file: tests/integration/system-integration.test.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `tests/integration/system-integration.test.ts`

```typescript
        language: 'en',
      };
      expect(scanData).toBeDefined();
      // TODO: Implement complete flow:
      // 1. Upload image to Firebase Storage
      // 2. Create scan record in Firestore
      // 3. Queue for AI processing
      // 4. Process with Vercel AI Gateway
      // 5. Update scan with nutrition data
      // 6. Return nutrition card
    });
```

## Why this is Test Avoidance

Strongest `toBeDefined()` form in the corpus. The body asserts `expect(scanData).toBeDefined();` and the TODO comment enumerates a **six-step** real flow (upload to Firebase Storage, create scan record, queue for AI processing, process with Vercel AI Gateway, update scan with nutrition data, return nutrition card). All six steps are uncovered; the test passes because the local object literal is defined.
