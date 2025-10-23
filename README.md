# AI-SDD-MCP: Turn Ideas Into Code Automatically 🚀

**Transform any idea into a complete, working application using AI in Cursor - works with ANY LLM (Claude, GPT-4, Gemini, etc.)**

## What This Does

Instead of manually coding everything, this tool helps AI build complete applications by:
1. **Writing detailed specifications** from your idea
2. **Creating step-by-step plans** 
3. **Generating atomic tasks** (72 small, clear steps)
4. **Implementing everything automatically** with continuous execution

**Result**: From idea to working app in 4 phases, with AI doing all the heavy lifting!

## Why This Is Different

- ✅ **Works with ANY LLM** in Cursor (Claude, GPT-4, Gemini, etc.)
- ✅ **No more AI hallucinations** - strict verification at every step
- ✅ **Complete applications** - not just code snippets
- ✅ **Production-ready code** - with tests, documentation, and deployment
- ✅ **Continuous execution** - AI completes entire phases without stopping

## Quick Start (2 minutes)

### 1. Install
```bash
npm install -g ai-sdd-mcp
```

### 2. Connect to Cursor
Add this to your Cursor MCP settings (`~/.cursor/mcp.json`):
```json
{
  "sdd-mcp": {
    "command": "sdd-mcp",
    "args": [],
    "env": {
      "PROJECT_ROOT": "${workspaceFolder}"
    }
  }
}
```

### 3. Use It!
In any Cursor chat (works with any LLM):

```text
/sdd_specify "Create a todo app with user authentication, drag-and-drop tasks, and real-time updates using Next.js and Supabase"
```

That's it! The AI will:
- Write a complete specification
- Create an implementation plan  
- Generate 72 atomic tasks
- Build the entire application phase by phase

## Real Example: Resume Reviewer App

**Your idea**: "AI-powered resume reviewer"

**What you type**:
```text
/sdd_specify "Create an AI-powered résumé reviewer app where users upload resumes and receive AI feedback, using Next.js, TypeScript, Tailwind, Google Gemini API, file upload via Vercel Blob, and deploy on Vercel"
```

**What happens automatically**:
1. **Specification** → Complete feature spec with requirements
2. **Plan** → 4-phase implementation strategy  
3. **Tasks** → 72 atomic tasks (TASK-001 to TASK-072)
4. **Implementation** → AI builds everything:
   - Phase 1: Database, authentication, file upload (25 tasks)
   - Phase 2: AI integration, resume parsing (20 tasks)  
   - Phase 3: UI components, real APIs (15 tasks)
   - Phase 4: Testing, deployment, documentation (12 tasks)

**Result**: Complete, working resume reviewer app with tests, documentation, and deployment!

## The 4 Commands You Need

```text
/sdd_specify "your app idea"
/sdd_plan  
/sdd_tasks
/sdd_implement phase=1
/sdd_implement phase=2 
/sdd_implement phase=3
/sdd_implement phase=4
```

## What Makes This Special

### 🛡️ Anti-Hallucination System
- AI must provide proof for every feature
- No "fake" implementations or placeholders
- Continuous verification at each step

### 🏗️ Production-Ready Code
- Real databases (PostgreSQL, not SQLite)
- Complete test suites
- Proper error handling
- Documentation and deployment

### ⚡ Continuous Execution  
- AI completes entire phases without stopping
- No manual intervention needed
- Builds complete features, not just snippets

### 🎯 Works With Any LLM
- Claude, GPT-4, Gemini, etc.
- No special AI model required
- Uses Cursor's built-in AI capabilities

## Perfect For

- **Beginners**: Turn ideas into apps without coding knowledge
- **Developers**: Speed up development with AI assistance  
- **Startups**: Rapidly prototype and build MVPs
- **Students**: Learn by seeing complete implementations
- **Teams**: Standardize development processes

## Requirements

- Node.js 18+
- Cursor IDE (with MCP enabled)
- Any LLM (Claude, GPT-4, Gemini, etc.)

## Get Started Now

1. Install: `npm install -g ai-sdd-mcp`
2. Add MCP config to Cursor
3. Type: `/sdd_specify "your amazing app idea"`
4. Watch AI build your complete application! 🎉

---

**Transform ideas into reality with AI-powered development. Works with any LLM in Cursor.**