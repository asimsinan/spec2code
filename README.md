# AI-SDD-MCP-BETA: Turn Ideas Into Code Automatically 🚀

[![npm version](https://img.shields.io/npm/v/ai-sdd-mcp.svg)](https://www.npmjs.com/package/ai-sdd-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Transform any idea into a complete, working application using AI in Cursor - works with ANY LLM (Claude, GPT-4, Gemini, etc.). 

**Note: The tool will be open-sourced in the future. Github link is private for now.**

## 🌟 Key Features

- **AI-Driven Development** - Transform ideas into complete, working applications with TDD methodology
- **72-Task Breakdown** - Automatically creates 18 tasks per phase (4 phases total) with PERT time estimates
- **Anti-Evasion System** - 10 constitutional gates prevent AI from skipping tests or using time excuses
- **Silent Execution** - AI completes all 18 tasks per phase without stopping or asking permission
- **Code Snippet Requirements** - Must show actual working code, not just file creation
- **GREEN State Verification** - Requires terminal output with PASS/✓ before task completion
- **Platform Detection** - Automatically adapts to web (Next.js), mobile (React Native), desktop (Electron), backend (Node.js, Python), and AI platforms
- **Real Environment Testing** - TestContainers, real databases, 85% coverage enforcement
- **Production-Ready** - Complete test suites, error handling, documentation, and deployment

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

- **`/sdd_specify`** - Generate project specifications
- **`/sdd_plan`** - Create implementation plan
- **`/sdd_tasks`** - Generate 72 tasks (18 per phase)
- **`/sdd_implement phase=X`** - Execute phase-by-phase

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

### 3. Generate 72 Tasks (18 per phase)
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

**Important:** Each phase completes all 18 tasks silently without stopping. The AI should NOT read `spec.md` or `plan.md` files - all information is provided inline.

## 🏆 Real-World Examples

See **[Complete applications](https://github.com/asimsinan/VibeCoding)** built with this tool, including:
- Recipe Finder (3 hours)
- Invoice Generator (5.5 hours)  
- Kanban Board (5.5 hours)
- Video Conferencing (6.5 hours)
- Learning Management System (5 hours)
- AR Home Decorator (8 hours)
- And 9 more applications!

*Note: Some apps may have database connection issues due to Supabase auto-deletion.*

## 🏗️ How It Works

**Files Generated:**
- `specs/spec.md` - Project specification
- `specs/plan.md` - Implementation plan
- `specs/phase1-tasks.md` through `phase4-tasks.md` - 18 tasks per phase (72 total)

**Platforms Supported:**
Web (Next.js, React), Mobile (React Native, Flutter), Desktop (Electron, Tauri), Backend (Node.js, Python, Java), AI (TensorFlow, PyTorch)

**Time Estimation:**
PERT-based estimates showing 40-50% time savings with AI assistance.

---

**Transform your development workflow with AI-powered specification-driven development!** 🎉