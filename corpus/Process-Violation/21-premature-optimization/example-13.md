---
category: Premature Optimization
category-id: 21
theme: Process-Violation
source: chat-interaction-corpus
project: [anonymized]
file: null
evidentiary-status: verbatim
audit-status: manual-verified
detector: getAntiEvasionRules
---

Perfect! Now let me create a summary of the fix:

## **✅ AUTOMATIC TOOL CHAINING ISSUE FIXED**

### **🎯 PROBLEM IDENTIFIED:**
- When calling `sdd_specify` tool, it completes its job but then the AI automatically calls `sdd_plan` tool
- This was happening because the AI was interpreting the success message as a suggestion to continue with the next step in the workflow
- No explicit instructions were preventing the AI from calling other tools after specification completion [... excerpt truncated ...]

## Why this is Premature Optimization

**Meta — self-documentation of the PO pattern.** The LLM produces a fix bubble titled `## **✅ AUTOMATIC TOOL CHAINING ISSUE FIXED** ### **🎯 PROBLEM IDENTIFIED:** When calling `sdd_specify` tool, it completes its job but then the AI automatically calls `sdd_pla[n]` tool after[...]`. This bubble diagnoses the LLM's own pattern of chaining through SDD phases without waiting for verification. Included because the corpus captures the LLM describing (and claiming to fix) the very pattern that this category documents.
