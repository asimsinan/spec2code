---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/modules/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/modules/route.ts`

```typescript
      const organizationId = authContext.user.organizationId as string;

      // For now, return empty array until getModulesByCourseId is implemented
      const modules: any[] = [];
      return NextResponse.json(modules);
    } catch (error: any) {
      console.error('Error fetching modules:', error);

      if (error.name === 'ZodError') {
```

## Why this is Deferred Implementation

`modules/route.ts` follows the same pattern: empty array return with TODO waiting on `getModulesByCourseId`. Included to show the deferral applies across sibling resource modules.
