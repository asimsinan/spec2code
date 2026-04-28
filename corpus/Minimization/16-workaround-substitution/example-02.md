---
category: Workaround Substitution
category-id: 16
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/catalog/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/student/catalog/route.ts`

```typescript
          updatedAt: course.updatedAt.toISOString(),
          thumbnail: null, // TODO: Add thumbnail field to Course model
          duration: course._count.modules * 30, // Estimate: 30 minutes per module
          difficulty: difficulties[index % difficulties.length], // Vary difficulty levels
          rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5 for testing
          price: index % 3 === 0 ? 0 : Math.floor(Math.random() * 100) + 10, // Mix of free and paid courses
          isEnrolled: enrolledCourseIds.has(course.id)
        };
      });

      return NextResponse.json(catalogCourses);
```

## Why this is Workaround Substitution

Four-field composite. `src/app/api/student/catalog/route.ts` returns catalogue entries whose `duration`, `difficulty`, `rating`, and `price` are all computed from either the row index or `Math.random()`: `duration: course._count.modules * 30, // Estimate: 30 minutes per module / difficulty: difficulties[index % difficulties.length], // Vary difficulty levels / rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5 for testing / price: index % 3 === 0 ? 0 : Math.floor(Math.random() * 100) + 10`. The catalogue response looks reasonable — diverse durations, difficulties, ratings, prices — and none of the four are measuring their real referent.
