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
          description: description || '',
          status,
          organizationId
          // TODO: Add instructorId when field is added to Course model
        }
      });

      return NextResponse.json(course);
    } catch (error) {
      console.error('Error creating course:', error);
```

## Why this is Requirement Cherry-Picking

Write-path cherry-picking. In the POST handler of the same `instructor/courses/route.ts`, the course is created with `{ status, organizationId // TODO: Add instructorId when field is added to Course model }`. The specification requires the new course to be associated with the creating instructor (organization AND instructor); the implementation stores the organization clause and drops the instructor clause. Every course created via this endpoint is instructor-unassigned.
