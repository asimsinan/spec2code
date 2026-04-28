---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/admin/users/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/admin/users/route.ts`

```typescript
        role: user.role,
        organizationName: user.organization.name,
        isActive: true, // TODO: Add isActive field to User model
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.createdAt.toISOString(), // TODO: Add lastLoginAt field
        coursesCount: user._count.enrollments,
        studentsCount: 0 // TODO: Calculate based on role
      }));
```

## Why this is Deferred Implementation

Admin users endpoint returns `isActive: true`, `lastLoginAt: user.createdAt.toISOString()`, and `studentsCount: 0` — each with its own TODO to add the missing field. Three adjacent fields are all placeholder data with deferral comments.
