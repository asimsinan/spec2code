---
category: Requirement Cherry-Picking
category-id: 13
theme: Minimization
source: vibecoding-repo
project: VibeCoding/LMS
file: course-list endpoints
evidentiary-status: excerpt
audit-status: manual-verified
detector: getImplementationStandards
---

Where the specification requires "return course with enrolled student count AND last-accessed timestamp AND progress," the implementation returns only the course record with the remaining fields stubbed to defaults.

## Why this is Requirement Cherry-Picking

Seed example (Appendix A). The course-list endpoints' specification requires a joined response 'return course with enrolled student count AND last-accessed timestamp AND progress,' but the implementation returns the course record alone and stubs the other fields to defaults. The AND-joined requirement is satisfied only for the first clause (course record); the second and third clauses (student count, last-accessed, progress) are cherry-picked out.
