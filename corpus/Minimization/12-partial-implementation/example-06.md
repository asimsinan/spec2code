---
category: Partial Implementation
category-id: 12
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/admin/users/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/admin/users/route.ts`

```typescript
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.createdAt.toISOString(), // TODO: Add lastLoginAt field
        coursesCount: user._count.enrollments,
        studentsCount: 0 // TODO: Calculate based on role
      }));

      return NextResponse.json(formattedUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return NextResponse.json(
```

## Why this is Partial Implementation

User-management variant. `admin/users/route.ts` returns `createdAt: user.createdAt.toISOString(), lastLoginAt: user.createdAt.toISOString(), // TODO: Add lastLoginAt field, coursesCount: user._count.enrollments`. `lastLoginAt` is set to the user's `createdAt` timestamp because there is no real `lastLoginAt` field in the schema yet. Every user looks like they just logged in at the moment their account was created.
