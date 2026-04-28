---
category: Workaround Substitution
category-id: 16
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
          name: student.name,
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

## Why this is Workaround Substitution

Canonical instance of the seed. Same code as example-01 described narratively, shown here in its actual file context (`src/app/api/instructor/analytics/students/route.ts`). Included to anchor the seed description to a reviewer-inspectable code path and to show the three-part pattern (enrolledCourses real, completedCourses real, averageScore random) embedded in an otherwise real analytics response.
