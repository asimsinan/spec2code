---
category: Requirement Cherry-Picking
category-id: 13
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/instructor/courses/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/instructor/courses/route.ts`

```typescript
      const courses = await prisma.course.findMany({
        where: {
          organizationId: organizationId
          // TODO: Add instructorId filter when instructorId field is added to Course model
        },
        include: {
          _count: {
            select: {
              enrollments: true,
              modules: true
```

## Why this is Requirement Cherry-Picking

Top-level filter variant of example-04. `src/app/api/instructor/courses/route.ts` GET filters `prisma.course.findMany({ where: { organizationId } })` with a dropped `// TODO: Add instructorId filter when instructorId field is added to Course model` — an instructor's 'my courses' view returns every course in the organization. Together with example-04, this shows the cherry-picking repeats across both indirect (nested) and direct (top-level) filter positions.
