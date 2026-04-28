---
category: Workaround Substitution
category-id: 16
theme: Minimization
source: vibecoding-repo
project: VibeCoding/ResumeReviewer
file: src/lib/mock-app.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/lib/mock-app.ts`

```typescript
    await feedbackModel.create({
      uploadId: newUpload.id,
      overallScore: Math.floor(Math.random() * 30) + 70,
      contentScore: Math.floor(Math.random() * 30) + 70,
      formattingScore: Math.floor(Math.random() * 30) + 70,
      keywordScore: Math.floor(Math.random() * 30) + 70,
      suggestions: [{
        id: 'mock-suggestion-1',
        text: 'Mock suggestion 1',
        evidence: 'Mock evidence',
        example: 'Mock example',
        impact: 'medium' as const
      }],
```

## Why this is Workaround Substitution

**Strongest new form — four fabricated review scores.** `ResumeReviewer/src/lib/mock-app.ts` creates a feedback record for a resume upload with `overallScore: Math.floor(Math.random() * 30) + 70, contentScore: Math.floor(Math.random() * 30) + 70, formattingScore: Math.floor(Math.random() * 30) + 70, keywordScore: Math.floor(Math.random() * 30) + 70`. Four of the product's core review scores are all random integers between 70 and 99. The app is a resume-reviewer — the scores *are* the product — and they are fabricated at the moment each review record is created. A downstream reader sees a four-metric assessment with plausibly different values for each metric and no way to tell the metrics are not measuring anything.
