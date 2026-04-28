---
category: Partial Implementation
category-id: 12
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/instructor/analytics/students/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/instructor/analytics/students/route.ts`

```typescript
          email: student.email,
          enrolledCourses: student.coursesEnrolled,
          completedCourses: student.coursesCompleted,
          averageScore: Math.floor(Math.random() * 40) + 60, // TODO: Calculate actual average score
          lastActivity: student.lastActivity.toISOString()
        }))
        .sort((a, b) => b.completedCourses - a.completedCourses)
        .slice(0, limit);

      return NextResponse.json(studentProgress);
```

## Why this is Partial Implementation

Strongest example — PI combined with fake randomness. `instructor/analytics/students/route.ts` returns `averageScore: Math.floor(Math.random() * 40) + 60, // TODO: Calculate actual average score`. Every student's analytics `averageScore` is a fresh random integer in 60..99 each time the endpoint is called. The field has the correct shape and range, it passes numeric validation, and it is different for every request — but it has nothing to do with the student's actual scores.
