---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/catalog/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/student/catalog/route.ts`

```typescript
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
          thumbnail: null, // TODO: Add thumbnail field to Course model
          duration: course._count.modules * 30, // Estimate: 30 minutes per module
          difficulty: difficulties[index % difficulties.length], // Vary difficulty levels
          rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5 for testing
          price: index % 3 === 0 ? 0 : Math.floor(Math.random() * 100) + 10, // Mix of free and paid courses
          isEnrolled: enrolledCourseIds.has(course.id)
        };
```

## Why this is Deferred Implementation

Student-catalog endpoint mixes deferral with fabrication: a `TODO: Add thumbnail field` alongside `rating: Math.floor(Math.random() * 5) + 1` and mixed free/paid pricing from modulo arithmetic. Real product fields are deferred; meanwhile the endpoint returns randomized data dressed up as real.
