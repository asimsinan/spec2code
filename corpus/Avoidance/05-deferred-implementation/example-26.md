---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/instructor/students/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/instructor/students/route.ts`

```typescript
          organizationId: organizationId,
          course: {
            // TODO: Add instructorId filter when instructorId field is added to Course model
          }
        },
        include: {
          user: {
            select: {
              id: true,
```

## Why this is Deferred Implementation

`instructor/students` endpoint filters by organizationId only with TODO `Add instructorId filter when instructorId field is added to Course model.` An instructor sees all students in the organization rather than only their own — an access-control deferral.
