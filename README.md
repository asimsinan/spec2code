# AI-SDD-MCP-BETA: Turn Ideas Into Code Automatically 🚀

[![npm version](https://img.shields.io/npm/v/ai-sdd-mcp.svg)](https://www.npmjs.com/package/ai-sdd-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Transform any idea into a complete, working application using AI in Cursor - works with ANY LLM (Claude, GPT-4, Gemini, etc.). 

**Note: The tool will be open-sourced in the future. Github link is private for now.**

## 🌟 Key Features

- **AI-Driven Development** - Transform ideas into complete, working applications with TDD methodology
- **Task Breakdown** - Automatically creates tasks per phase
- **Anti-Evasion System** - Constitutional gates prevent AI from skipping tests or using time excuses
- **AI Honesty Contract** - Explicit truth-telling requirements with lie detection patterns and audit trails
- **Silent Execution** - AI completes all tasks per phase without stopping or asking permission
- **Automatic Sequential Chaining** - Tasks execute sequentially like SDDTasksTool (complete task N, automatically continue to task N+1)
- **Platform-Specific Commands** - Commands are filtered to match detected platform and language only
- **Strict Task Verification** - All tasks must be individually marked complete before phase completion
- **Code Snippet Requirements** - Must show actual working code, not just file creation
- **GREEN State Verification** - Requires terminal output with PASS/✓ before task completion
- **Platform Detection** - Automatically adapts to web (Next.js), mobile (React Native), desktop (Electron), backend (Node.js, Python), and AI platforms
- **Architecture-Aware Development** - Automatically detects backend architecture patterns (BaaS Firebase/Supabase, Traditional Backend, Serverless, Hybrid) and adapts task templates accordingly
- **Individual Task TODO Creation** - Each task creates only its own TODO item when called, ensuring focused task execution
- **Architecture-Aware Validation** - Phase-level architectural validation adapts rules based on detected architecture (e.g., doesn't flag missing API layer for BaaS architectures)
- **Real Environment Testing** - TestContainers, real databases, 85% coverage enforcement
- **Production-Ready** - Complete test suites, error handling, documentation, and deployment
- **Truth-Telling Enforcement** - AI honesty contracts, lie detection patterns, and audit trails prevent fabrication
- **Robust Prompting Strategies** - Chain-of-thought reasoning, evidence-based responses, constrained generation, and multi-turn verification

## 🏗️ Architecture-Aware Development

### Automatic Architecture Detection
The system automatically detects backend architecture patterns and adapts the development workflow:

- **BaaS (Firebase/Supabase/Amplify)**: Detects client-side SDK patterns, adapts tasks to use BaaS SDK, client-side services
- **Traditional Backend**: Detects Express/FastAPI patterns, uses server-side services, controllers, and REST APIs
- **Serverless**: Detects Lambda/Cloud Functions patterns
- **Hybrid**: Detects mixed patterns (e.g., Firebase + custom API endpoints)

### Architecture-Aware Task Generation
- **Phase 2 Task Adaptation**: Automatically transforms Phase 2 tasks based on detected architecture:
  - Firebase BaaS: `TASK-001` → Firebase SDK Integration (instead of Business Logic Layer)
  - Firebase BaaS: `TASK-002` → Client-Side Service Layer with Firebase SDK (instead of server-side)
  - Firebase BaaS: `TASK-003` → Client-Side Controllers (React Native components) with Firebase hooks
- **Architecture-Specific Validation**: Validation rules adapt to architecture (doesn't flag missing server-side API layer for BaaS)


### Architecture Validation
- **Phase-Level Validation**: Before progressing to next phase, validates architecture against specification
- **Architecture-Aware Gap Detection**: Only flags actual gaps (e.g., missing Firebase Security Rules for Firebase projects, not missing server-side API for BaaS)
- **Automatic Pattern Extraction**: Extracts architecture from spec metadata, architecture sections, and keywords

## 🧠 Advanced AI Safety Features

### Robust Prompting Strategies
Based on latest research in AI truthfulness and hallucination prevention:

- **Chain-of-Thought Reasoning**: AI must explain step-by-step reasoning before any action
- **Evidence-Based Responses**: Every claim backed by verifiable proof and terminal output
- **Constrained Generation**: Strict output formats prevent free-form fabrication
- **Multi-Turn Verification**: Complex tasks broken into atomic, individually verifiable steps
- **Self-Verification Checklists**: AI must check its own work against requirements
- **Truth-Seeking System Prompts**: Explicit commitments to honesty and accuracy

### AI Hallucination Prevention
- **Real Execution Only**: Commands must actually run, results must be real terminal output
- **Evidence Chains**: Command → Output → Verification → Completion must be unbroken
- **Structured Output**: Prevents generic responses and forces specific, verifiable claims
- **Audit Trails**: Every action logged with timestamp and verification details
- **Violation Detection**: Automated scanning for common lying patterns

### Sequential Task Execution
Automatic chaining approach:
- **Phase-Level Call**: `sdd_implement phase=2` starts sequential execution of ALL tasks in phase
- **Automatic Chaining**: Complete task N → immediately call task N+1 in same response
- **Individual Task TODOs**: Each task creates only its own TODO item when called (not all tasks at once), ensuring focused execution
- **Current Task Tracking**: `currentTask` properly increments to next task when tasks are completed
- **Violation Prevention**: Stopping without calling next task = methodology violation requiring reset
- **Complete Phase Enforcement**: Phase only "complete" when ALL tasks individually verified
- **No Manual Intervention**: AI must continue through all tasks without stopping or claiming completion

## 👥 Perfect For

- **Beginners**: Turn ideas into apps without coding knowledge
- **Developers**: Speed up development with AI assistance
- **Startups**: Rapidly prototype and build MVPs
- **Students**: Learn by seeing complete implementations
- **Teams**: Standardize development processes

## 📋 Requirements

- **Node.js 18+**
- **Cursor IDE** (with MCP enabled)
- **Any LLM** (Claude, GPT-4, Gemini, etc.)

## 🛠️ Commands

- **`/sdd_specify`** - Generate project specifications (standalone, creates specs/spec.md)
- **`/sdd_plan`** - Create implementation plan (standalone, creates specs/plan.md)
- **`/sdd_tasks`** - Generate 33 tasks across 4 phases (creates specs/phaseX-tasks.md files)
- **`/sdd_implement phase=X`** - Execute phase-by-phase implementation
- **`/sdd_workflow`** - Run complete automated workflow (specify → plan → tasks → implement)

## 🚀 Quick Start

### Installation

```bash
npm install -g ai-sdd-mcp
```

### Add to Cursor

Add the following configuration to your Cursor `mcp.json` file:

```json
{
  "mcpServers": {
    "sdd-mcp-server": {
    "command": "sdd-mcp",
    "args": [],
    "env": {
      "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

## 📖 Usage

### 1. Generate Specification
```bash
/sdd_specify "Build a crowdfunding platform with Next.js, TypeScript, and Tailwind"
```

### 2. Create Implementation Plan
```bash
/sdd_plan
```

### 3. Generate 33 Tasks (4 phases)
```bash
/sdd_tasks
```
Outputs: `specs/phase1-tasks.md`, `specs/phase2-tasks.md`, `specs/phase3-tasks.md`, `specs/phase4-tasks.md`

### 4. Execute Phase-by-Phase
```bash
/sdd_implement phase=1  # Setup & Foundations
/sdd_implement phase=2  # Core Implementation  
/sdd_implement phase=3  # UI Development
/sdd_implement phase=4  # Testing & Deployment
```

### Per-Task Invocation

Run one task at a time for shorter context and stricter sequencing:

```bash
# Run a specific task (01-09 for Phase 1, 01-08 for Phase 2, 01-09 for Phase 3, 01-07 for Phase 4)
/sdd_implement phase=1 task=1

# Proceed to the next call suggested in the output
/sdd_implement phase=1 task=2
```

### Automated Workflow (Not Tested Yet)

For complete automation, use the workflow tool that chains all steps:

```bash
/sdd_workflow  # Automatically runs: specify → plan → tasks → implement
```

## 🏆 Real-World Examples

See **[Complete applications](https://github.com/asimsinan/VibeCoding)** built with this tool, including:
- Recipe Finder (3 hours)
- Invoice Generator (5.5 hours)  
- Kanban Board (5.5 hours)
- Video Conferencing (6.5 hours)
- Learning Management System (5 hours)
- AR Home Decorator (8 hours)
- And more applications!

*Note: Some apps may have database connection issues due to Supabase auto-deletion.*

## 🏗️ How It Works

**Standalone Tool Architecture:**
- `/sdd_specify` - Creates `specs/spec.md` (standalone)
- `/sdd_plan` - Creates `specs/plan.md` (standalone)
- `/sdd_tasks` - Creates task files (standalone)
- `/sdd_implement` - Executes implementation (per-phase)
- `/sdd_workflow` - Complete automation (optional)

**Files Generated:**
- `specs/spec.md` - Project specification with functional requirements as numbered lists
- `specs/plan.md` - Implementation plan with AI-driven task breakdown
- `specs/phase1-tasks.md` through `phase4-tasks.md` - Tasks per phase (Phase 1: 9, Phase 2: 8, Phase 3: 9, Phase 4: 7) (33 total)
- `specs/phaseX-status.json` - Task completion status tracking
- All task commands are clean, executable, and platform-specific

**Platforms Supported:**
- **Frontend**: Web (Next.js, React), Mobile (React Native, Flutter), Desktop (Electron, Tauri)
- **Backend**: Node.js, Python, Java, .NET
- **BaaS**: Firebase, Supabase, AWS Amplify
- **Serverless**: AWS Lambda, Google Cloud Functions, Vercel Functions
- **AI**: TensorFlow, PyTorch

**Time Estimation:**
PERT-based estimates showing 40-50% time savings with AI assistance.

---

**Transform your development workflow with AI-powered specification-driven development!** 🎉