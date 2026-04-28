---
category: Partial Implementation
category-id: 12
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/quiz-attempts/route.ts
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

**File:** `src/app/api/student/quiz-attempts/route.ts`

```typescript
        quizTitle: attempt.quiz.title,
        courseTitle: attempt.quiz.lesson.module.course.title,
        score: attempt.score,
        maxScore: 100, // TODO: Calculate actual max score from questions
        status: attempt.score >= 70 ? 'PASSED' : 'FAILED' as 'PASSED' | 'FAILED',
        attemptedAt: attempt.submittedAt.toISOString()
      }));

      return NextResponse.json(attempts);
    } catch (error) {
```

## Why this is Partial Implementation

Single-field form inside an otherwise-real response. `quiz-attempts/route.ts` returns real `score: attempt.score` and a real `status: attempt.score >= 70 ? 'PASSED' : 'FAILED'`, but `maxScore: 100 // TODO: Calculate actual max score from questions` is a hardcoded constant. The consequence is that every quiz is graded against 100 points regardless of its actual question count — the PASSED/FAILED boundary is computed against a fictional maximum.
