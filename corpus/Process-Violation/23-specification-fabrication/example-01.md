---
category: Specification Fabrication
category-id: 23
theme: Process-Violation
source: vibecoding-repo
project: VibeCoding/LMS
file: src/app/api/admin/users/route.ts lines 60--66
evidentiary-status: verbatim
audit-status: manual-verified
detector: SDDSpecifyTool
---

The implementation references fields (`isActive`, `lastLoginAt`) that are not declared in the User data model, returning them as stubs with "TODO: Add field to User model".

## Why this is Specification Fabrication

Seed example (Appendix A). `src/app/api/admin/users/route.ts` (lines 60-66): the implementation references `isActive` and `lastLoginAt` fields that are not declared in the User data model, returning them as stubs with `// TODO: Add field to User model`. The response shape advertises properties the model cannot supply; a downstream client consuming this endpoint sees a User object that is broader than what the specification defines.
