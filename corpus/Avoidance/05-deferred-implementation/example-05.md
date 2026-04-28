---
category: Deferred Implementation
category-id: 5
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/VideoConference
file: src/hooks/useRealApi.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/hooks/useRealApi.ts`

```typescript
      }

      // TODO: Implement updateMediaPermissions when API service supports it
      // await apiService.updateMediaPermissions(currentRoom.id, currentParticipantId, permissions);

      // Update local participant state
      setParticipants(prev => prev.map(p =>
        p.id === currentParticipantId
          ? { ...p, mediaPermissions: permissions }
```

## Why this is Deferred Implementation

`useRealApi.updateMediaPermissions` has the actual API call commented out with TODO and only performs local state updates. The server side of the permission update never happens, but the function returns as if it did.
