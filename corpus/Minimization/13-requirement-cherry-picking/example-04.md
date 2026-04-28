---
category: Requirement Cherry-Picking
category-id: 13
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/instructor/students/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/instructor/students/route.ts`

```typescript
        where: {
          organizationId: organizationId,
          course: {
            // TODO: Add instructorId filter when instructorId field is added to Course model
          }
        },
        include: {
          user: {
            select: {
              id: true,
```

## Why this is Requirement Cherry-Picking

Nested-filter cherry-picking. `src/app/api/instructor/students/route.ts` queries students whose course has a given `organizationId`. The full requirement is `organizationId AND instructorId` — show only students of *this instructor's* courses. The instructorId clause is commented out: `// TODO: Add instructorId filter when instructorId field is added to Course model`. The query returns every student in the organization, not just the instructor's — the authorization surface is wider than specified.
