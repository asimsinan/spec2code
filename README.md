# Spec2Code: Turn Ideas Into Code Automatically 🚀

[![npm version](https://img.shields.io/npm/v/ai-sdd-mcp.svg)](https://www.npmjs.com/package/ai-sdd-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Transform any idea into a complete, working application using AI in Cursor - works with ANY LLM (Claude, GPT-4, Gemini, etc.).

**Note: The tool will be open-sourced in the future. Github link is private for now.**

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

### Basic Usage

```bash
# 1. Generate specification
/sdd_specify "Build a crowdfunding platform with Next.js, TypeScript, and Tailwind"

# 2. Create implementation plan
/sdd_plan

# 3. Generate tasks (33 tasks across 4 phases)
/sdd_tasks

# 4. Execute phase-by-phase
/sdd_implement phase=1  # Setup & Foundations
/sdd_implement phase=2  # Core Implementation
/sdd_implement phase=3  # UI Development
/sdd_implement phase=4  # Testing & Deployment
```

## 🛠️ Commands

- **`/sdd_specify`** - Generate project specifications (creates `specs/spec.md`)
- **`/sdd_plan`** - Create implementation plan (creates `specs/plan.md`)
- **`/sdd_tasks`** - Generate 33 tasks across 4 phases (creates `specs/phaseX-tasks.md`)
- **`/sdd_implement phase=X`** - Execute phase-by-phase implementation
- **`/sdd_implement phase=X task=Y`** - Execute a specific task
- **`/sdd_workflow`** - Run complete automated workflow (specify → plan → tasks → implement)

## 🌟 Key Features

- **Complete Task Execution** - AI completes all tasks fully, including verification, before proceeding to next task
- **AI-Driven TODO Creation** - Each task generates its own TODO list by analyzing requirements
- **Platform Detection** - Automatically adapts to web, mobile, desktop, backend, and AI platforms
- **Architecture-Aware** - Detects BaaS (Firebase/Supabase), Traditional Backend, Serverless, and Hybrid patterns, adapting tasks accordingly
- **Task Verification** - All tasks must be individually verified with proof (terminal output, code snippets) before completion
- **Time Estimation** - Use Case Points (UCP) and PERT-based estimates with AI speedup factors (50x faster)
- **Production-Ready** - Complete test suites, error handling, documentation, and deployment

## 🏗️ How It Works

**Workflow:**
1. `/sdd_specify` → Creates `specs/spec.md` with functional requirements
2. `/sdd_plan` → Creates `specs/plan.md` with implementation strategy
3. `/sdd_tasks` → Creates `specs/phase1-tasks.md` through `phase4-tasks.md` (33 tasks total)
4. `/sdd_implement phase=X` → Executes tasks sequentially with verification

**Files Generated:**
- `specs/spec.md` - Project specification
- `specs/plan.md` - Implementation plan
- `specs/phase1-tasks.md` to `phase4-tasks.md` - Task breakdowns (9 + 8 + 9 + 7 = 33 tasks)
- `specs/phaseX-status.json` - Task completion tracking

**Platforms Supported:**
- **Frontend**: Web (Next.js, React), Mobile (React Native, Flutter), Desktop (Electron, Tauri)
- **Backend**: Node.js, Python, Java, .NET
- **BaaS**: Firebase, Supabase, AWS Amplify
- **Serverless**: AWS Lambda, Google Cloud Functions, Vercel Functions
- **AI**: TensorFlow, PyTorch

## 🏆 Real-World Examples

See **[Complete applications]([https://github.com/asimsinan/VibeCoding](https://anonymous.4open.science/r/VibeCoding-F4D0/))** built with this tool:
- Recipe Finder (3 hours)
- Invoice Generator (5.5 hours)
- Kanban Board (5.5 hours)
- Video Conferencing (6.5 hours)
- Learning Management System (5 hours)
- AR Home Decorator (8 hours)

*Note: Some apps may have database connection issues due to Supabase auto-deletion.*

## 📋 Requirements

- **Node.js 18+**
- **Cursor IDE** (with MCP enabled)
- **Any LLM** (Claude, GPT-4, Gemini, etc.)

## 👥 Perfect For

- **Beginners**: Turn ideas into apps without coding knowledge
- **Developers**: Speed up development with AI assistance
- **Startups**: Rapidly prototype and build MVPs
- **Students**: Learn by seeing complete implementations
- **Teams**: Standardize development processes

---

**Transform your development workflow with AI-powered specification-driven development!** 🎉
