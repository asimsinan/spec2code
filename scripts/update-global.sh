#!/bin/bash
# SDD MCP Server - Global Update Script
# Builds the project and installs globally

set -e  # Exit on any error

echo "🚀 SDD MCP Server - Global Update"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in SDD MCP Server directory"
    echo "   Please run this script from the project root"
    exit 1
fi

# Step 1: Build the project
echo "📦 Building project..."
npm run build:complete

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Step 2: Install globally
echo "🌍 Installing globally..."
sudo npm run reinstall:global

if [ $? -eq 0 ]; then
    echo "✅ Global installation completed successfully"
    echo ""
    echo "🎉 SDD MCP Server updated globally!"
    echo "   All recent changes are now active"
    echo ""
    echo "📋 What's included:"
    echo "   • Structure-first development enforcement"
    echo "   • No empty folders requirement"
    echo "   • Atomic task-based SDD with 4 phases (33 total tasks)"
    echo "   • Enhanced TDD enforcement"
    echo "   • Professional development standards"
else
    echo "❌ Global installation failed"
    exit 1
fi
