#!/bin/bash

# Timeout Helper Script for SDD MCP Server
# Provides robust timeout functionality with better error handling

TIMEOUT_DURATION=$1
COMMAND=$2

if [ -z "$TIMEOUT_DURATION" ] || [ -z "$COMMAND" ]; then
    echo "Usage: timeout-helper.sh <duration> <command>"
    echo "Example: timeout-helper.sh 60s 'npm test'"
    exit 1
fi

# Try different timeout methods
if command -v timeout >/dev/null 2>&1; then
    # Use system timeout command
    timeout $TIMEOUT_DURATION bash -c "$COMMAND"
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo "Command timed out after $TIMEOUT_DURATION"
        exit 124
    fi
    exit $EXIT_CODE
elif command -v gtimeout >/dev/null 2>&1; then
    # Use GNU timeout (if available via brew)
    gtimeout $TIMEOUT_DURATION bash -c "$COMMAND"
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo "Command timed out after $TIMEOUT_DURATION"
        exit 124
    fi
    exit $EXIT_CODE
else
    # Fallback: run command in background and kill after timeout
    echo "Warning: No timeout command available, using fallback method"
    bash -c "$COMMAND" &
    PID=$!
    
    # Convert timeout duration to seconds
    DURATION_SEC=$(echo $TIMEOUT_DURATION | sed 's/s$//')
    
    # Sleep for the timeout duration
    sleep $DURATION_SEC
    
    # Kill the process if it's still running
    if kill -0 $PID 2>/dev/null; then
        echo "Command timed out after $TIMEOUT_DURATION"
        kill -TERM $PID 2>/dev/null
        sleep 2
        kill -KILL $PID 2>/dev/null
        exit 124
    fi
    
    # Wait for the process to complete
    wait $PID
    exit $?
fi
