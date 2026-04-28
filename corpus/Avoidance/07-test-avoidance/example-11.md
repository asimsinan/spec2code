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
        displayName: 'New User',
      };
      expect(userData).toBeDefined();
      // TODO: Implement registration flow
      // 1. Call /auth/register
      // 2. Create user in Firestore
      // 3. Return auth response
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'existing@example.com',
```

## Why this is Test Avoidance

Classic Appendix-A form. `const userData = {...}; expect(userData).toBeDefined(); // TODO: Implement registration flow / 1. Call /auth/register / 2. Create user in Firestore / 3. Return auth response`. The assertion trivially passes on a literal object while the real flow is enumerated as comments.
