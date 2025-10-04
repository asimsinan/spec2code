# SDD MCP Server — Specification‑Driven Development • Ultimate Edition (v1.2.6)
*Purpose: AI-powered MCP server that implements Specification-Driven Development workflow through intelligent tools. This server provides `/specify`, `/clarify`, `/plan`, `/tasks`, `/implement`, and `/status` commands to guide development from specification to implementation.*

---

## Core Philosophy (Single Source of Truth)
Specification‑Driven Development flips the usual hierarchy: **specifications are executable** and generate the implementation; code serves specs, not the other way around. This rule enforces that inversion in Cursor by codifying commands, constitutional gates, and strict test‑first execution.

**Key ideas**  
- Intent before mechanism: *what* and *why* precede *how*.  
- Multi‑step refinement over one‑shot code gen.  
- Library‑first and integration‑first testing.  
- Every developer/system tool capability has a CLI‑style interface (stdin/stdout, JSON option).

---

## MCP Tools (Available Commands)
*These tools are available through the MCP server and can be called from Cursor or any MCP-compatible client.*

### **sdd_specify** — Create a feature specification
**Input**: Free‑form feature description (single paragraph is fine).  
**Output**: AI instructions to create specification template and save to database.

**Execution Flow**
1. **Initialize database** if needed (creates `sdd.db` in project root)
2. **Generate specification template** using AI-driven approach
3. **Create feature branch** and switch to it
4. **Save template to database** for future reference
5. **Provide AI instructions** for Cursor to create `spec.md` file

**Key Features**
- Auto-detects existing specifications to avoid conflicts
- Creates timestamped feature branches (`feat/feature-name-{timestamp}`)
- Saves both filled and unfilled templates to database
- Provides comprehensive AI instructions for specification creation

---

### **sdd_clarify** — Resolve ambiguities before planning
**Input**: None (reads from database).  
**Output**: AI instructions to resolve specification ambiguities.

**Execution Flow**
1. **Retrieve latest specification** from database
2. **Parse clarification markers** (`[NEEDS CLARIFICATION: ...]`)
3. **Generate AI instructions** for resolving ambiguities
4. **Provide structured Q&A format** with proposed defaults
5. **Update specification** once clarifications are resolved

**Key Features**
- Works with database-stored specifications
- Provides AI-driven clarification suggestions
- Maintains specification history and versioning
- Ensures all ambiguities are resolved before planning

---

### **sdd_plan** — Produce a concrete implementation plan
**Prereq**: No `[NEEDS CLARIFICATION]` in specification.  
**Output**: AI instructions to create implementation plan and save to database.

**Execution Flow**
1. **Retrieve specification** from database
2. **Apply Constitutional Gates** (fail‑fast if violated):
   - *Simplicity Gate*: ≤ **5 projects** for initial scope
   - *Library‑First*: every feature starts as a standalone library (desktop/backend) or modular component (web/mobile/embedded)
   - *CLI Interface Mandate*: plan a CLI entry point per developer/system tool library
   - *Test‑First*: contract → integration → E2E → unit → implementation
   - *Integration‑First Testing*: prefer real DB/services over mocks
   - *Anti‑Abstraction*: single domain model

3. **Generate AI instructions** for creating implementation plan
4. **Save plan template** to database
5. **Provide comprehensive planning guidance** for Cursor AI

**Key Features**
- Database-driven plan generation
- Constitutional gate enforcement
- AI-powered planning assistance
- Template-based plan structure
- Integration with Git workflow

---

### **sdd_tasks** — Derive strict TDD tasks
**Prereq**: Implementation plan exists in database.  
**Output**: AI instructions to create task breakdown and save to database.

**Execution Flow**
1. **Retrieve implementation plan** from database
2. **Generate TDD-ordered tasks** using AI-driven approach:
   - Contract → Integration → E2E → Unit → Implementation
3. **Cap task size** (~200 LOC per task)
4. **Mark parallelizable tasks** with `[P]`
5. **Ensure test-first approach** for every implementation task
6. **Save task template** to database

**Key Features**
- Database-driven task generation
- Strict TDD ordering enforcement
- AI-powered task breakdown
- Parallel task identification
- Integration with implementation tracking

---

### **sdd_status** — Summarize active feature and implementation progress
**Input**: Optional phase/task parameters for detailed status.  
**Output**: Comprehensive status report with implementation tracking.

**Execution Flow**
1. **Detect active feature** by current branch or latest database entry
2. **Retrieve all templates** (spec, plan, tasks, status) from database
3. **Generate comprehensive status report** including:
   - Specification completeness
   - Plan status and constitutional compliance
   - Task coverage and progress
   - Implementation tracking data
   - Quality metrics and analytics
4. **Provide AI instructions** for status updates

**Key Features**
- Database-driven status reporting
- Implementation progress tracking
- Quality metrics and analytics
- Constitutional compliance checking
- Integration with all SDD phases

---

### **sdd_implement** — AI-driven implementation execution
**Input**: Optional phase/task parameters for targeted implementation.  
**Output**: Comprehensive AI instructions for implementation with quality checks.

**Execution Flow**
1. **Retrieve implementation context** from database (spec, plan, tasks)
2. **Generate AI implementation plan** with detailed instructions
3. **Include quality check sequences** (compilation, linting, testing)
4. **Provide dependency installation guidance**
5. **Track implementation progress** in database
6. **Generate next step instructions** for Cursor AI

**Key Features**
- AI-driven implementation planning
- Comprehensive quality check integration
- Dependency management guidance
- Implementation progress tracking
- Task-level and phase-level execution
- Quality score calculation and analytics

---

### **sdd_db_filler** — Generic database operations
**Input**: Table name, operation type, and data.  
**Output**: Database operation results.

**Execution Flow**
1. **Validate table and operation** parameters
2. **Execute database operation** (insert, update, select, delete)
3. **Return operation results** with success/error status
4. **Maintain data integrity** and validation

**Key Features**
- Generic database operations
- Data validation and integrity
- Error handling and reporting
- Support for all SDD tables
- Template data management

---

## Constitution (Non‑Negotiable)
These are guardrails you must enforce; **abort commands** on violations unless explicitly justified in *Complexity Tracking* (in `plan.md`).

1. **Library‑First Principle** — Start as a standalone library (desktop/backend) or modular component (web/mobile/embedded). UI/app layers are thin veneers over core functionality.  
2. **CLI Interface Mandate** — Each developer/system tool library exposes a CLI with `--json` mode using stdin/stdout; errors go to stderr.  
3. **Test‑First Imperative** — No implementation before tests; sequence is **Contract → Integration → E2E → Unit → Implementation**.  
4. **Integration‑First Testing** — Prefer real dependencies (DBs/services). Mocks require written justification.  
5. **Simplicity Constraints** — ≤ 5 projects at start; use framework features directly; document any complexity in *Complexity Tracking*.  
6. **Anti‑Abstraction** — One domain model (avoid DTO/Repository/Unit‑of‑Work unless truly necessary).  
7. **Traceability** — Every line of code must trace back to a numbered requirement (FR‑XXX) in the spec.

**Governance & Amendments**  
- The Constitution supersedes other practices. Changes require updating spec/plan/tasks templates and documenting impact (see *Constitution Update Checklist*).

---

## Embedded Templates
*These are the authoritative templates the assistant must use when generating files.*

### **SPEC TEMPLATE**
```markdown
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[{###-feature-slug}]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "[ORIGINAL USER INPUT]"

## User Scenarios & Testing (mandatory)

### Primary User Story
[Describe the main user journey in plain language]

### Acceptance Scenarios
1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

### Edge Cases
- What happens when [boundary condition]?
- How does the system handle [error scenario]?

## Requirements (mandatory)

### Functional Requirements
- **FR‑001**: System MUST [specific capability]
- **FR‑002**: System MUST [specific capability]
- **FR‑003**: Users MUST be able to [key interaction]
- **FR‑004**: System MUST [data requirement]
- **FR‑005**: System MUST [behavior requirement]

_Mark unclear requirements with **[NEEDS CLARIFICATION: …]**_

### Key Entities (if the feature involves data)
- **[Entity 1]** — [What it represents, key attributes]
- **[Entity 2]** — [What it represents, relationships]

## Review & Acceptance Checklist
### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non‑technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No **[NEEDS CLARIFICATION]** markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded

---
## Execution Status (auto‑maintained during /specify)
- [ ] Description parsed
- [ ] Concepts extracted
- [ ] Ambiguities marked
- [ ] Scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed
```
---

### **PLAN TEMPLATE**
```markdown
# Implementation Plan: [FEATURE]

**Branch**: `[{###-feature-slug}]` | **Date**: [DATE] | **Spec**: [path to spec.md]

## Summary
[Extract from feature spec: primary requirement + technical approach]

## Technical Context
**Language/Version**: [e.g., TypeScript 5.2, Python 3.11]  
**Primary Dependencies**: [e.g., React 18, FastAPI, SQLAlchemy]  
**Storage**: [e.g., PostgreSQL, SQLite, files, or N/A]  
**Testing**: [e.g., Jest, pytest, Playwright]  
**Target Platform**: [e.g., Web, Node.js, Mobile]  
**Performance Goals**: [e.g., <100ms response, 60fps, or N/A]

## Constitution Check
**Simplicity Gate**  
- Projects: [count] (max 5)  
- Using framework directly? [yes/no]  
- Single data model? [yes/no]

**Architecture Gate**  
- Every feature as library? [yes/no]  
- CLI per library planned? [yes/no]  
- Libraries: [list with purposes]

**Testing Gate (NON‑NEGOTIABLE)**  
- TDD order enforced? [yes/no]  
- Real dependencies used? [yes/no]  
- Contract tests planned? [yes/no]

## Project Structure
```
src/
├── lib/[feature-name]/          # Library implementation
│   ├── models/                  # Data models
│   ├── services/                # Business logic
│   └── cli.(ts|py|rs|go)        # Command interface
├── contracts/                   # API specifications
└── tests/
    ├── contract/                # Contract tests
    ├── integration/             # Integration tests
    └── unit/                    # Unit tests
```

## Implementation Phases
### Phase 1: Contracts & Tests
1. Define API contracts in `contracts/`
2. Create contract tests (must fail initially)
3. Create integration test scenarios
4. Generate data models from requirements

### Phase 2: Library Implementation
1. Implement core library following TDD
2. Create CLI interface for library
3. Ensure all tests pass
4. Add error handling and validation

### Phase 3: Integration & Validation
1. Integrate with existing systems
2. Performance validation
3. Security review
4. Documentation updates

## Complexity Tracking (use only when a gate is intentionally broken)
| Violation | Justification | Simpler Alternative Rejected |
|-----------|---------------|------------------------------|
| [if any]  | [reasoning]   | [why simpler won’t work]     |
```
---

### **TASKS TEMPLATE**
```markdown
# Implementation Tasks: [FEATURE]

**Generated from**: `specs/[{###-feature-slug}]/plan.md`  
**TDD Order**: Contract → Integration → E2E → Unit → Implementation

## Task List

### Phase 1: Contract & Test Setup
1. **Create API Contracts** [P]  
   - Define OpenAPI/GraphQL schemas in `contracts/`  
   - Specify all endpoints from functional requirements  
   - Include error response schemas

2. **Create Contract Tests** [P]  
   - Test each endpoint schema  
   - Validate request/response formats  
   - Tests must FAIL initially (no implementation yet)

3. **Create Integration Test Scenarios**  
   - Each user story → integration test  
   - Test data setup and teardown  
   - End‑to‑end user journey validation

### Phase 2: Data Models
4. **Create Data Models** [P]  
   - Entity definitions from spec  
   - Validation rules  
   - Relationships and constraints

5. **Create Model Tests** [P]  
   - Validation testing  
   - Relationship integrity  
   - Edge case handling

### Phase 3: Library Implementation
6. **Implement Core Library**  
   - Business logic implementation  
   - Make contract tests pass  
   - Follow TDD: test → implement → refactor

7. **Create CLI Interface**  
   - Command‑line access to all library functions  
   - JSON input/output support  
   - Help and version commands

8. **Library Integration Tests**  
   - Test library functions work together  
   - Error handling and edge cases  
   - Performance validation

### Phase 4: Application Integration
9. **Application Layer** (if needed)  
   - Thin layer over library  
   - Configuration management  
   - Logging and monitoring

10. **End‑to‑End Validation**  
    - All user scenarios pass  
    - Performance requirements met  
    - Security validation complete

## Task Dependencies
- Tasks 1‑3 can run in parallel [P]  
- Task 4‑5 depend on Task 1 completion  
- Task 6 depends on Tasks 2,4,5 completion  
- Task 7 depends on Task 6 completion  
- Tasks 8‑10 are sequential

## Definition of Done
Each task is complete when:  
- [ ] Code written and reviewed  
- [ ] All tests pass  
- [ ] Documentation updated  
- [ ] No linting errors  
- [ ] Constitutional compliance verified
```
---

## Path Conventions (by project type)
- **Single‑project library/app**: `src/`, `tests/` at repo root.  
- **Web app**: `backend/src/`, `frontend/src/`.  
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`.  
Use these as defaults unless `plan.md` specifies otherwise.

---

## Enforcement Rules (Runtime)
**Before ANY Implementation**
1. **Spec must exist** (`spec.md`).  
2. **Plan must exist** (`plan.md`).  
3. **Tests must be written first** (contract/integration/E2E/unit).  
4. **Constitutional gates must pass** or be justified in *Complexity Tracking*.

**During Implementation**  
- Strict Red → Green → Refactor.  
- Library‑first; app code stays thin.  
- Prefer real dependencies; justify mocks.  
- Fail early on violations; fix before proceeding.

**Quality Gates**  
- No `[NEEDS CLARIFICATION]` remains before `/plan`.  
- Full traceability from FR‑XXX → tests → code.  
- Public APIs fully tested.  
- Docs (README/API) updated alongside changes.

---

## Self‑Update Instructions (Optional)
If this rule is stored in‑repo, after `/plan` and `/tasks` the assistant may:  
1. Update “Active Technologies” and “Architecture Patterns” in a local context section.  
2. Keep a rolling list of “Recent Features” (last 3).  
3. Log architectural decisions and best practices surfaced during implementation.

---

## Current Implementation Status

**Version**: SDD‑MCP‑Server‑1.2.6 • **Updated**: 2025-09-23

### **Architecture**
- **MCP Server**: TypeScript-based Model Context Protocol server
- **Database**: SQLite with comprehensive schema for SDD workflow
- **Templates**: JSON-based templates for all SDD phases
- **AI Integration**: Cursor AI-driven implementation with quality checks
- **Git Integration**: Centralized Git operations via GitService

### **Database Schema**
- **specifications**: Feature specifications and templates
- **plans**: Implementation plans and constitutional compliance
- **tasks**: TDD-ordered task breakdowns
- **status**: Status reports and progress tracking
- **implementations**: Implementation progress and quality metrics
- **implementation_tasks**: Task-level progress tracking
- **implementation_phases**: Phase-level progress tracking
- **implementation_analytics**: Quality scores and metrics

### **Quality Features**
- **Comprehensive linting**: ESLint with TypeScript support
- **Type safety**: Full TypeScript implementation
- **Error handling**: Robust error handling and validation
- **Testing**: TDD-first approach with comprehensive test coverage
- **Documentation**: Self-documenting code with comprehensive comments

### **Deployment**
- **Package**: `@asimsinan/sdd-mcp-server` (private npm package)
- **Installation**: `npm install @asimsinan/sdd-mcp-server`
- **Global CLI**: `npm install -g @asimsinan/sdd-mcp-server`
- **MCP Integration**: Compatible with Cursor and other MCP clients

### **Recent Updates**
- ✅ All linting errors resolved (0 errors)
- ✅ Database schema optimized and cleaned
- ✅ Implementation tracking fully functional
- ✅ Git operations centralized and standardized
- ✅ Quality checks integrated into implementation workflow
- ✅ Private publishing configured
- ✅ Documentation updated to reflect current implementation
