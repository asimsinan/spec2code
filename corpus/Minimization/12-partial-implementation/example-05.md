---
category: Partial Implementation
category-id: 12
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/courses/[id]/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/student/courses/[id]/route.ts`

```typescript
        updatedAt: course.updatedAt.toISOString(),
        isEnrolled: !!enrollment,
        studentCount: studentCount,
        instructor: 'Unknown Instructor', // TODO: Get actual instructor name
        duration: 0, // TODO: Calculate course duration
        difficulty: 'BEGINNER' as const, // Default difficulty
        rating: 0, // TODO: Get actual rating
        price: 0 // TODO: Get actual price
      };
```

## Why this is Partial Implementation

Companion endpoint `src/app/api/student/courses/[id]/route.ts` reuses the same TODO block, this time inside the single-course detail response. The pair (this exemplar and example-04) shows that the placeholder fields propagate across the list-endpoint and the detail-endpoint, so a client fetching either surface sees the same four TODO-annotated placeholder fields.
