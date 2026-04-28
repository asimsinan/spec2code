---
category: Test Avoidance
category-id: 7
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/PersonalShoppingAssistant
file: src/frontend/src/__tests__/integration/dataFlow.test.tsx
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/frontend/src/__tests__/integration/dataFlow.test.tsx`

```tsx
// Import the mocked API services
import { authService, productService, recommendationService, interactionService } from '../../api';

describe.skip('Data Flow Integration Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Authentication Data Flow', () => {
    it('should handle login flow with API integration', async () => {
      const mockUser = createMockUser();
```

## Why this is Test Avoidance

Whole-suite skip: `describe.skip('Data Flow Integration Tests', ...)`. A second data-flow integration suite is named in the file tree and reported as skipped by the runner. The authentication data-flow tests inside are fully written but never execute.
