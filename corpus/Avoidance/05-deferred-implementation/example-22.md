---
category: Deferred Implementation
category-id: 5
theme: Avoidance
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
        averageQuizScore,
```

## Why this is Deferred Implementation

Student progress response hardcodes `instructor: 'Course Instructor'` and `thumbnail: null` with TODOs to add the relationship and the field. The response shape is preserved but the listed instructor is a string literal rather than a real relationship lookup.
