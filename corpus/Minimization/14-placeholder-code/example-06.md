---
category: Placeholder Code
category-id: 14
theme: Minimization
source: vibecoding-repo
project: VibeCoding/MarketPlace
file: src/lib/auth.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/lib/auth.ts`

```typescript
        }

        // TODO: Implement password verification
        // This is a placeholder implementation
        const isValidPassword = true; // Replace with actual password verification

        if (!isValidPassword) {
          return null;
        }
```

## Why this is Placeholder Code

**Strongest example — dangerous-default placeholder.** Same `src/lib/auth.ts`: `// TODO: Implement password verification / // This is a placeholder implementation / const isValidPassword = true; // Replace with actual password verification`. The placeholder does not merely omit behaviour — it asserts a default (`true`) that, if left in place, accepts every password. Included both here and as Deferred Implementation example-31 because it sits at the intersection of the two categories: a placeholder body with a dangerous-default return value.
