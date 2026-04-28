---
category: Test Avoidance
category-id: 7
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/PersonalShoppingAssistant
file: src/frontend/src/__tests__/integration/errorHandling.test.tsx
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/frontend/src/__tests__/integration/errorHandling.test.tsx`

```tsx
// Import the mocked API services
import { authService, productService, recommendationService, interactionService } from '../../api';

describe.skip('Error Handling Integration Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('API Error Handling', () => {
    it('should handle 500 Internal Server Error', async () => {
      (productService.getProducts as jest.Mock).mockRejectedValue({
```

## Why this is Test Avoidance

A whole test suite is gated with `describe.skip('Error Handling Integration Tests', ...)`. The suite appears in the test file and is discoverable by name (it advertises error-handling coverage), but every test inside it is gated off and never executes. The specified error-handling behaviour has zero real coverage despite the file asserting otherwise.
