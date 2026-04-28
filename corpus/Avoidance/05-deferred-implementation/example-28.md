---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/instructor/dashboard/stats/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/instructor/dashboard/stats/route.ts`

```typescript
        where: {
          organizationId: organizationId
          // TODO: Add instructorId field to Course model when available
        }
      });

      // Get total students enrolled in instructor's courses
      const totalStudents = await prisma.enrollment.count({
        where: {
```

## Why this is Deferred Implementation

`instructor/dashboard/stats` endpoint aggregates across the entire organization with TODO to narrow to the current instructor. The dashboard shows organization-wide numbers while labelled as instructor-specific.
