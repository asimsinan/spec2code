# Authentication Cherry-Picking Fix - Summary

## The Problem
AI skipped authentication during Phase 1/2 and claimed:
- "Focused on non-auth features first"
- "Treated NextAuth as later optimization"  
- "Left mock authentication in place"

## Root Causes Identified

### 1. ❌ No Explicit Cherry-Picking Prevention
**Problem**: Instructions didn't explicitly forbid re-prioritizing tasks
**Impact**: AI could cherry-pick "important" features and skip auth
**Fix**: Added Section 1A with explicit forbidden phrases

### 2. ❌ Missing SETUP vs REFACTOR Distinction
**Problem**: AI confused Phase 1-2 SETUP with Phase 4 REFACTOR
**Impact**: Treated Phase 4 security tasks as "the auth task"
**Fix**: Added clear explanation that SETUP is foundational, REFACTOR is enhancement

### 3. ❌ No Foundation Task Enforcement
**Problem**: SETUP tasks had no special "blocks all subsequent phases" rule
**Impact**: Could skip auth in Phase 1-2, think Phase 4 covers it
**Fix**: Added "BLOCKS Phase 2, 3, 4" language to all SETUP tasks

### 4. ❌ No Sequential Execution Explicit Definition
**Problem**: "Sequential" not defined - AI interpreted as "pick what seems important"
**Impact**: AI cherry-picked based on preference, not order
**Fix**: Added explicit definition: "Task 1 → Task 2 → Task 3... NO RE-ORDERING"

### 5. ❌ Missing Platform-Specific Gates
**Problem**: No check for "Is auth required for this platform?"
**Impact**: Authentication could be skipped even when critical for web apps
**Fix**: Added gate checks before Phase 1 completion and Phase 3 start

## Changes Made to SDDImplementTool.ts

### New Section: 1A. SEQUENTIAL EXECUTION - NO CHERRY-PICKING

#### 1A.1. FORBIDDEN - Task Re-Prioritization
Added explicit forbidden phrases:
- ❌ "I'll focus on X first" → CHERRY-PICKING FORBIDDEN
- ❌ "We can do Y later" → DEFERRAL FORBIDDEN
- ❌ "Task X is optional" → NO RE-CLASSIFICATION ALLOWED
- ❌ "Auth can be added later" → AUTH IN PHASE 1 IS REQUIRED

#### 1A.2. MANDATORY - Foundation Tasks
Clearly states SETUP/BUILD tasks in Phase 1-2:
- BLOCK subsequent phases if not done
- NOT optimizations - required infrastructure
- Examples given: SETUP auth blocks Phase 2-4

#### 1A.3. SETUP vs REFACTOR Distinction
**SETUP (Phase 1-2)**:
- Creates foundational feature from scratch
- MUST BE DONE before next phase
- PROOF REQUIRED: Feature works

**REFACTOR (Phase 4)**:
- Assumes feature ALREADY EXISTS
- Only enhances existing feature
- CANNOT replace missing SETUP work

#### 1A.4. Platform-Specific Mandatory Tasks
Added gate checks:
- Web platforms: Auth MANDATORY in Phase 1
- Before Phase 1 complete: Is auth SETUP done?
- Before Phase 3: Is Phase 1-2 auth done?
- BLOCK if missing

#### 1A.5. Real Violation Examples
Direct call-out of AI's exact excuses:
- "Focused on non-auth features first" → WRONG: Sequential, not by preference
- "Treated as later optimization" → WRONG: SETUP is foundational, not optimization
- "Left mock in place" → WRONG: SETUP requires real implementation

## Expected Impact

### Before Fix
```
AI: "I'll focus on core features first, auth can be added later as optimization"
Result: Authentication never implemented
```

### After Fix
```
AI: [Reads Section 1A]
AI: "OK, sequential means I do Task 1, then Task 2, then Task 3..."
AI: "SETUP auth in Phase 1 is foundational, not optimization"
AI: "Phase 4 REFACTOR requires Phase 1-2 SETUP to exist"
AI: [Implements auth in Phase 1-2 per instructions]
```

## What This Prevents

1. ✅ Cherry-picking tasks based on importance
2. ✅ Re-classifying SETUP as "optimization for later"
3. ✅ Confusing Phase 4 REFACTOR with Phase 1-2 SETUP
4. ✅ Deferring foundational features to later phases
5. ✅ Skipping authentication for web platforms

## Key Phrases Now Explicitly Forbidden

- "Focused on X first"
- "Can do Y later"
- "Prioritize Z"
- "Task X is optional"
- "Task X is optimization for later"
- "Skip to important parts"
- "Auth can be added later"

## Structural Changes

**Before**: Instructions assumed AI would follow sequential order
**After**: Structural requirements make it harder to skip:
- Explicit forbidden phrases
- Real violation examples from AI's own behavior
- Gate checks that block phase advancement
- Distinction between SETUP (foundational) and REFACTOR (enhancement)

These are structural requirements embedded in the prompt that the AI must read and follow - they're not suggestions, they're constraints.
