---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/instructor/courses/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/instructor/courses/route.ts`

```typescript
        where: {
          organizationId: organizationId
          // TODO: Add instructorId filter when instructorId field is added to Course model
        },
        include: {
          _count: {
            select: {
              enrollments: true,
              modules: true
```

## Why this is Deferred Implementation

`instructor/courses` endpoint applies the same deferred filter: all courses in the organization are returned rather than only the ones the instructor owns. Included to show the deferral repeats across endpoints with consistent access-control implications.
