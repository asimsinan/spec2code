# AI-SDD-MCP: Turn Ideas Into Code Automatically 🚀

[![npm version](https://badge.fury.io/js/ai-sdd-mcp.svg)](https://badge.fury.io/js/ai-sdd-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Transform any idea into a complete, working application using AI in Cursor - works with ANY LLM (Claude, GPT-4, Gemini, etc.)

## 🌟 What Makes This Special

### 🛡️ Anti-Hallucination System
- **AI must provide proof for every feature** - No guessing or assumptions
- **No "fake" implementations or placeholders** - Everything works out of the box
- **Continuous verification at each step** - Validates each component before proceeding

### 🏗️ Production-Ready Code
- **Real databases** Production-grade data persistence
- **Complete test suites** - Comprehensive testing coverage
- **Proper error handling** - Robust error management and recovery
- **Documentation and deployment** - Ready-to-deploy applications

### ⚡ Continuous Execution
- **AI completes entire phases without stopping** - No manual intervention needed
- **Builds complete features, not just snippets** - End-to-end functionality
- **No manual intervention needed** - Fully automated development process

### 🎯 Works With Any LLM
- **Claude, GPT-4, Gemini, etc.** - No special AI model required
- **Uses Cursor's built-in AI capabilities** - Leverages your existing setup
- **No special AI model required** - Works with any language model

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

## ✨ Features

### 🎯 **Core Capabilities**
- **AI-Driven Specification Generation** - Create detailed project specifications from natural language descriptions
- **Intelligent Implementation Planning** - Generate comprehensive implementation plans with technical context
- **72-Task Atomic Breakdown** - Automatically create detailed task lists following TDD methodology
- **Platform-Aware Implementation** - Detect and adapt to web, mobile, desktop, backend, and AI platforms
- **Template-Based Architecture** - Consistent, maintainable development patterns

### 🛠️ **Development Tools**
- **`/sdd_specify`** - Generate project specifications from requirements
- **`/sdd_plan`** - Create detailed implementation plans
- **`/sdd_tasks`** - Generate 72-task atomic breakdown
- **`/sdd_implement`** - Execute implementation with full auto or phase-by-phase modes

### 🔧 **Technical Features**
- **Platform Detection Engine** - Automatically detect web (Next.js, React), mobile (React Native), desktop (Electron), backend (Node.js, Python), and AI platforms
- **Constitutional Compliance Gates** - Ensure code quality and architectural compliance
- **TDD Enforcement** - RED-GREEN-REFACTOR-SMOKE methodology
- **Database Integration** - SQLite-based data persistence with robust error handling
- **Template System** - Reusable templates for consistent project structure

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

1. **Create a new project specification:**
```bash
/sdd_specify "Build a crowdfunding platform with user authentication, campaign management, and payment processing using Next.js, TypeScript, and Tailwind CSS"
```

2. **Generate implementation plan:**
```bash
/sdd_plan
```

3. **Create task breakdown:**
```bash
/sdd_tasks
```

4. **Execute implementation:**
```bash
/sdd_implement
```

## 📋 Detailed Usage

### Specification Generation (`/sdd_specify`)

Generate comprehensive project specifications from natural language descriptions:

```bash
# Web Application
/sdd_specify "Create an e-commerce platform with product catalog, shopping cart, and payment integration using Next.js and TypeScript"

# Mobile Application  
/sdd_specify "Build a task management mobile app with offline sync, push notifications, and team collaboration using React Native"

# Backend API
/sdd_specify "Develop a REST API for a social media platform with user management, posts, comments, and real-time notifications using Node.js and Express"

# AI Application
/sdd_specify "Create an AI-powered content generation tool with natural language processing, text analysis, and automated content creation using Python and TensorFlow"
```

**Output:** Creates `specs/spec.md` with detailed functional requirements, user stories, technical specifications, and acceptance criteria.

### Implementation Planning (`/sdd_plan`)

Generate detailed implementation plans based on specifications:

```bash
/sdd_plan
```

**Features:**
- **Platform Detection** - Automatically detects technology stack and platform
- **Technical Context** - Detailed implementation decisions and architecture
- **Database Strategy** - Data modeling and persistence approach
- **API Design** - RESTful API specifications and endpoints
- **Project Structure** - Directory organization and file structure
- **Implementation Phases** - 4-phase development approach

**Output:** Creates `specs/plan.md` with comprehensive implementation guidance.

### Task Breakdown (`/sdd_tasks`)

Generate 72-task atomic breakdown following TDD methodology:

```bash
/sdd_tasks
```

**Task Structure:**
- **Phase 1: Project Setup & Foundations** (18 tasks)
- **Phase 2: Core Implementation** (18 tasks)
- **Phase 3: UI Development** (18 tasks)
- **Phase 4: Testing, Documentation & Deployment** (18 tasks)

**Each Task Includes:**
- Detailed description and acceptance criteria
- TDD phase (RED-GREEN-REFACTOR-SMOKE)
- Duration and LOC estimates
- Dependencies and constitutional compliance gates
- Platform-specific verification requirements

**Output:** Creates `specs/tasks.md` with complete task breakdown.

### Implementation Execution (`/sdd_implement`)

Execute implementation with intelligent AI-driven code generation:

#### Full Auto Mode (All Phases)
```bash
/sdd_implement
```

#### Phase-by-Phase Mode
```bash
/sdd_implement phase=1  # Project Setup & Foundations
/sdd_implement phase=2  # Core Implementation
/sdd_implement phase=3  # UI Development
/sdd_implement phase=4  # Testing & Deployment
```

#### Dry Run Mode
```bash
/sdd_implement dryrun=true           # Preview all phases
/sdd_implement phase=1 dryrun=true  # Preview specific phase
```

**Features:**
- **AI-Driven Code Generation** - Intelligent, context-aware code creation
- **Platform-Specific Implementation** - Adapts to detected technology stack
- **TDD Enforcement** - Follows RED-GREEN-REFACTOR-SMOKE methodology
- **Constitutional Compliance** - Ensures code quality and architectural standards
- **Continuous Execution** - Completes entire phases without interruption

## 🏗️ Architecture

### Platform Detection Engine

Automatically detects and adapts to different platforms:

- **Web Platforms**: Next.js, React, Vue.js, Angular
- **Mobile Platforms**: React Native, Flutter
- **Desktop Platforms**: Electron, Tauri
- **Backend Platforms**: Node.js, Python, Java, Go
- **AI Platforms**: TensorFlow, PyTorch, OpenAI APIs

### Template System

Consistent, reusable templates for:
- Project specifications
- Implementation plans
- Task breakdowns
- Code generation patterns

### Database Schema

SQLite-based persistence with:
- Feature management
- Specification storage
- Plan tracking
- Task progress monitoring
- Implementation history

## 🏆 Real-World Examples

### VibeCoding Challenge Repository

See SDD MCP Server in action with **15 complete applications** built using this tool:

**[🔗 View VibeCoding Repository](https://github.com/asimsinan/VibeCoding)**

### Challenge Showcase

**Challenge 1: Recipe Finder** (Built in 3 hours)
- Prompt: "Build a recipe finder app where users input ingredients and get matching recipes, using HTML, CSS, and vanilla JavaScript"

**Challenge 2: Invoice Generator** (Built in 5.5 hours)
- Prompt: "Build an invoice generator that lets users enter client details and items and download as PDF, using React, CSS, and jsPDF"

**Challenge 3: Appointment Scheduler** (Built in 3.5 hours)
- Prompt: "Build a personal finance dashboard to track spending categories and visualize with charts using React, TypeScript, Tailwind, Chartjs"

**Challenge 4: Personal Finance Dashboard** (Built in 3 hours)
- Prompt: "Create an appointment scheduler with a calendar view and booking slots, using React, Tailwind CSS, and date-handling library like date-fns"

**Challenge 5: Mental Health Journal** (Built in 3.5 hours)
- Prompt: "Create a mental health journal app where users log mood daily and view trend charts, using Next.js, TypeScript, Tailwind"

**Challenge 6: Personal Shopping Assistant** (Built in 4.5 hours)
- Prompt: "Create a virtual personal shopping assistant that suggests products based on user preferences, using React, TypeScript, Node.js backend, PostgreSQL, and a simple recommendation algorithm"

**Challenge 7: Marketplace** (Built in 4.5 hours)
- Prompt: "Create a marketplace app where users list items and allow browsing/purchase, using Next.js, TypeScript, Tailwind, Node.js backend, Stripe, and PostgreSQL or MongoDB"

**Challenge 8: Event Organizer** (Built in 5.5 hours)
- Prompt: "Build a virtual event organizer app managing attendees, schedule, notifications, and networking, using Next.js, TypeScript, Tailwind, Supabase (Auth, real-time DB, storage), WebSockets for real-time features"

**Challenge 9: Collaborative Whiteboard** (Built in 6 hours)
- Prompt: "Build a collaborative whiteboard app where multiple users can draw and add sticky notes in real time, using Next.js, TypeScript, Tailwind, Supabase Realtime and deploy on Vercel"

**Challenge 10: Kanban** (Built in 5.5 hours)
- Prompt: "Build a kanban project management app with drag-and-drop tasks, user authentication, and team workspaces, using Next.js, TypeScript, Tailwind, Supabase"

**Challenge 11: Video Conference** (Built in 6.5 hours)
- Prompt: "Build a video conferencing web app with room creation, screen sharing, and chat, using Next.js, TypeScript, Tailwind, socket.io"

**Challenge 12: Learning Management System** (Built in 5 hours)
- Prompt: "Create a multi-tenant LMS (learning management system) where different organizations host courses, quizzes, student progress, and admin dashboards, using Next.js, TypeScript, Tailwind, Prisma, PostgreSQL, NextAuth"

**Challenge 13: AR Decorator** (Built in 8 hours)
- Prompt: "Develop a web-based AR home decorator where users upload room photos and virtually place furniture/décor items and preview in augmented reality, using React, three.js or WebGL, backend image processing APIs."

**Challenge 14: Resume Reviewer** (Built in 3 hours)
- Prompt: "Create an AI-powered résumé reviewer app where users upload resumes and receive AI feedback, using Next.js, TypeScript, Tailwind, Google Gemini API, file upload via Vercel Blob, and deploy on Vercel."

**Challenge 15: Crowdfunding Platform** (Built in 3.5 hours)
- Prompt: "Develop a crowdfunding / campaign platform where users can create campaigns, manage donations, comment, and track goals, using Next.js, TypeScript, Tailwind."

## 📊 Example Workflow

### 1. Project Initialization
```bash
# Initialize SDD
/sdd_specify "Build a crowdfunding platform where users can create campaigns, manage donations, comment, and track goals, using Next.js, TypeScript, Tailwind"
```

### 2. Planning Phase
```bash
# Generate implementation plan
/sdd_plan

# Create task breakdown
/sdd_tasks
```

### 3. Implementation Phase
```bash
# Preview what will be implemented
/sdd_implement dryrun=true

# Execute full implementation
/sdd_implement
```

### 4. Implementation Complete
```bash
# Your project is now fully implemented!
# Check the generated files and run your application
```

## 🔧 Configuration

### Custom Templates

SDD MCP Server supports custom templates for:
- Specification formats
- Implementation plans
- Task structures
- Code generation patterns

## 📈 Supported Platforms

| Platform | Frameworks | Languages | Status |
|----------|------------|-----------|--------|
| **Web** | Next.js, React, Vue.js, Angular | TypeScript, JavaScript | ✅ Full Support |
| **Mobile** | React Native, Flutter | TypeScript, Dart | ✅ Full Support |
| **Desktop** | Electron, Tauri | TypeScript, JavaScript, Rust | ✅ Full Support |
| **Backend** | Node.js, Express, FastAPI, Spring | TypeScript, Python, Java | ✅ Full Support |
| **AI** | TensorFlow, PyTorch, OpenAI | Python, TypeScript | ✅ Full Support |

---

**Transform your development workflow with AI-powered specification-driven development!** 🎉