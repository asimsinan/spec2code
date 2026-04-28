---
category: Requirement Cherry-Picking
category-id: 13
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/instructor/dashboard/stats/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/instructor/dashboard/stats/route.ts`

```typescript
      const totalCourses = await prisma.course.count({
        where: {
          organizationId: organizationId
          // TODO: Add instructorId field to Course model when available
        }
      });

      // Get total students enrolled in instructor's courses
      const totalStudents = await prisma.enrollment.count({
        where: {
```

## Why this is Requirement Cherry-Picking

Same-file, same-method repetition. `instructor/dashboard/stats/route.ts` contains three stats queries — `totalCourses`, `totalQuizzes`, and `module/course/count` — each with the same cherry-picked instructorId filter, each with its own variant of the TODO comment (`// TODO: Add instructorId filter when available`). Three related stats counts all compute over the full organization rather than the instructor's subset; the dashboard's 'My Courses', 'My Quizzes', 'My Students' numbers are all organization-wide numbers.
