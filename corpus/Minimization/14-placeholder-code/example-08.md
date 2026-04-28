---
category: Placeholder Code
category-id: 14
theme: Minimization
source: vibecoding-repo
project: VibeCoding/Kanban
file: src/lib/api/services/apiService.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/lib/api/services/apiService.ts`

```typescript
  // Workspace endpoints
  workspaces = {
    list: async (params?: PaginationParams) => {
      throw new Error('Workspace endpoints not implemented yet');
    },

    get: async (id: string) => {
      throw new Error('Workspace endpoints not implemented yet');
    },
```

## Why this is Placeholder Code

Throw-form placeholder. `src/lib/api/services/apiService.ts` has a block of API method stubs that each throw: `workspaces = { list: async (params) => { throw new Error('Workspace endpoints not implemented yet'); }, ... }`. Unlike the Next.js-route form that returns 200 OK, the throw-form surfaces the stub at runtime — callers get an exception rather than a lie. One representative is kept; the apiService file contains 17 near-identical throws across workspace / board / task / user endpoints.
