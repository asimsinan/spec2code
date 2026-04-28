---
category: Specification Fabrication
category-id: 23
theme: Process-Violation
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/catalog/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/student/catalog/route.ts`

```typescript
          status: course.status,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
          thumbnail: null, // TODO: Add thumbnail field to Course model
          duration: course._count.modules * 30, // Estimate: 30 minutes per module
          difficulty: difficulties[index % difficulties.length], // Vary difficulty levels
          rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5 for testing
          price: index % 3 === 0 ? 0 : Math.floor(Math.random() * 100) + 10, // Mix of free and paid courses
```

## Why this is Specification Fabrication

Course-model fabrication. `src/app/api/student/catalog/route.ts` returns catalogue entries with `thumbnail: null, // TODO: Add thumbnail field to Course model`. The `thumbnail` field is included in every response even though the Course model has no source for it. The TODO comment names the fabrication explicitly: the field exists in the response shape but must still be added to the underlying model.
