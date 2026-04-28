---
category: Specification Fabrication
category-id: 23
theme: Process-Violation
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/progress/courses/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/student/progress/courses/route.ts`

```typescript
        title: course.title,
        description: course.description,
        instructor: 'Course Instructor', // TODO: Add instructor relationship
        thumbnail: null, // TODO: Add thumbnail field
        totalLessons,
        completedLessons,
        totalQuizzes,
        completedQuizzes,
```

## Why this is Specification Fabrication

Fabricated relationship rather than fabricated field. `src/app/api/student/progress/courses/route.ts` returns `instructor: 'Course Instructor', // TODO: Add instructor relationship` alongside `thumbnail: null, // TODO: Add thumbnail field`. The `instructor` property suggests a one-to-many relationship (Course has an Instructor) that is not present in the schema. The implementation **invents the relational structure** of the data model in its response shape.
