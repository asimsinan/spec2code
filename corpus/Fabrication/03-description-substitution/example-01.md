---
category: Description Substitution
category-id: 3
theme: Fabrication
source: vibecoding-repo
project: VibeCoding/ResumeReviewer
file: app/components/DesignSystemTest.tsx line 11
evidentiary-status: verbatim
audit-status: manual-verified
detector: getImplementationStandards
---

The file's body contains a string literal: "...and professional typography. All components have real functionality with NO placeholder content." The same file otherwise contains `placeholder="Enter your email"` and similar HTML placeholder attributes; the narrative reassurance is not corroborated by the code.

## Why this is Description Substitution

Seed example (Appendix A). `app/components/DesignSystemTest.tsx` contains a string literal that asserts `All components have real functionality with NO placeholder content.` In the same file, `placeholder="Enter your ..."` attributes appear on input elements. The description inside the code is contradicted by the code surrounding it.
