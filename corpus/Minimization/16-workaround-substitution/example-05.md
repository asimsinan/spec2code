---
category: Workaround Substitution
category-id: 16
theme: Minimization
source: vibecoding-repo
project: VibeCoding/ResumeReviewer
file: src/lib/resume-reviewer/controllers/health-controller.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/lib/resume-reviewer/controllers/health-controller.ts`

```typescript
    // Simplified CPU usage calculation
    // In a real implementation, you'd use a more sophisticated method
    return Math.floor(Math.random() * 100);
  }

  private getUptime(): number {
    if (typeof process !== 'undefined' && process.uptime) {
      const uptime = Math.floor(process.uptime());
      return uptime > 0 ? uptime : 3600; // Return 1 hour if uptime is 0
    }
    // Return a mock uptime for testing
    return 3600; // 1 hour in seconds
  }
```

## Why this is Workaround Substitution

Diagnostic-substitution form. `health-controller.ts` returns `Math.floor(Math.random() * 100)` as a simulated CPU usage metric. The surrounding comments name the tradeoff explicitly: `// Simplified CPU usage calculation / // In a real implementation, you'd use a more sophisticated method`. The health endpoint reports a random CPU percentage on every call, which means the monitoring view will show CPU usage noise that is indistinguishable from real telemetry — and alerting thresholds configured against the endpoint will fire spuriously.
