---
category: Partial Implementation
category-id: 12
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/student/courses/route.ts lines 63--70
evidentiary-status: verbatim
audit-status: manual-verified
detector: getImplementationStandards
---

A single response object returns seven fields with placeholder values, each annotated as TODO: `progress: 0 // TODO: Calculate actual progress; instructor: 'Unknown Instructor' // TODO: Get actual instructor name; studentCount: 0 // TODO: Get actual student count; duration: 0; difficulty: 'BEGINNER' // Default; rating: 0; price: 0 // TODO: Get actual price`.

## Why this is Partial Implementation

Seed example (Appendix A). `src/app/api/student/courses/route.ts` returns a response object with seven fields whose values are placeholder constants, each annotated as TODO: `progress: 0`, `instructor: 'Unknown Instructor'`, `studentCount: 0`, `duration: 0`, `difficulty: 'BEGINNER'`, `rating: 0`, `price: 0`. The object validates against the endpoint's expected shape at compile time, and the endpoint returns 200 OK with a structurally correct response — but every computed field has been replaced by a sentinel value, and the TODO comments name the real computation that was skipped.
