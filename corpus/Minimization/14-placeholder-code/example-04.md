---
category: Placeholder Code
category-id: 14
theme: Minimization
source: vibecoding-repo
project: VibeCoding/VideoConference
file: src/app/api/server.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/server.ts`

```typescript
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (placeholder implementations for testing)
app.post('/api/v1/rooms', (_req, res) => {
  // This will fail in tests - that's expected in Red phase
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    code: 'NOT_IMPLEMENTED',
```

## Why this is Placeholder Code

Batch-annotated placeholder. `src/app/api/server.ts` marks a whole group of routes with one label: `// API routes (placeholder implementations for testing)` immediately above several route registrations. A single comment covers multiple stub endpoints; the plural 'implementations' makes the stubs look like a deliberate category rather than each being a separate omission.
