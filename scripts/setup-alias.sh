#!/bin/bash
# SDD MCP Server - Alias Setup Script
# Adds convenient aliases to your shell profile

echo "🔧 Setting up SDD MCP Server aliases..."

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
    SHELL_NAME="bash"
else
    echo "❌ Unsupported shell. Please add aliases manually."
    exit 1
fi

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Create aliases
echo "" >> "$SHELL_RC"
echo "# SDD MCP Server Aliases" >> "$SHELL_RC"
echo "alias sdd-update='cd $PROJECT_DIR && npm run update:global'" >> "$SHELL_RC"
echo "alias sdd-build='cd $PROJECT_DIR && npm run build:complete'" >> "$SHELL_RC"
echo "alias sdd-dev='cd $PROJECT_DIR && npm run dev:lib'" >> "$SHELL_RC"

echo "✅ Aliases added to $SHELL_RC"
echo ""
echo "🎉 Setup complete! Please run:"
echo "   source $SHELL_RC"
echo ""
echo "📋 Available aliases:"
echo "   sdd-update  - Build and install globally"
echo "   sdd-build   - Just build the project"
echo "   sdd-dev     - Start development mode"
echo ""
echo "💡 Usage:"
echo "   sdd-update  # Instead of: npm run build:complete && sudo npm run reinstall:global"
