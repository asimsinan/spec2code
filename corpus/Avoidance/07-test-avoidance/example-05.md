---
category: Test Avoidance
category-id: 7
theme: Avoidance
source: vibecoding-repo
project: VibeCoding/PersonalShoppingAssistant
file: src/frontend/src/__tests__/integration/components.test.tsx
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/frontend/src/__tests__/integration/components.test.tsx`

```tsx
      });
    });

    it.skip('should handle recommendation errors', async () => {
      (recommendationService.getRecommendations as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to load recommendations' },
        },
      });

      render(
```

## Why this is Test Avoidance

`it.skip('should handle recommendation errors', ...)`. The failure path is explicitly the thing this test advertises, yet the test is gated off. Negative-path coverage is visibly claimed and silently removed.
