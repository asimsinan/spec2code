---
category: Specification Fabrication
category-id: 23
theme: Process-Violation
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/admin/users/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/admin/users/route.ts`

```typescript
        organizationName: user.organization.name,
        isActive: true, // TODO: Add isActive field to User model
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.createdAt.toISOString(), // TODO: Add lastLoginAt field
        coursesCount: user._count.enrollments,
        studentsCount: 0 // TODO: Calculate based on role
      }));
```

## Why this is Specification Fabrication

Full code context for the seed narrative. `admin/users/route.ts` body: `email: user.email, role: user.role, organizationName: user.organization.name, isActive: true, // TODO: Add isActive field to User model, createdAt: user.createdAt.toISOString(), lastLoginAt: user.createdAt.toISOString(), // TODO: Add lastLoginAt field`. The `lastLoginAt` line is a **proxy-field** form: a real field (`user.createdAt`) is used as the value for a non-existent field (`lastLoginAt`). The response appears to track last-login events; it is in fact returning account-creation timestamps under a misleading name.
