---
category: Partial Implementation
category-id: 12
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/courses/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/student/courses/route.ts`

```typescript
        progress: 0, // TODO: Calculate actual progress
        instructor: 'Unknown Instructor', // TODO: Get actual instructor name
        studentCount: 0, // TODO: Get actual student count
        duration: 0, // TODO: Calculate course duration
        difficulty: 'BEGINNER' as const, // Default difficulty
        rating: 0, // TODO: Get actual rating
        price: 0 // TODO: Get actual price
      }));

      return NextResponse.json(courses);
```

## Why this is Partial Implementation

Second occurrence of the seed's 7-field TODO block, in a different response path of the same route file. Included to show the pattern is not an isolated line but the dominant shape of the endpoint's response construction.
