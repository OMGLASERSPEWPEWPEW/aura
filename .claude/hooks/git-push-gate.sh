#!/bin/bash
# .claude/hooks/git-push-gate.sh
# Hard gate on git push - always require explicit user confirmation
#
# This hook blocks any git push command and asks for confirmation.
# The only way to proceed is for the user to explicitly say yes.

# Read the tool input from stdin (JSON with tool_name and tool_input)
INPUT=$(cat)

# Extract the command being run
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//')

# Check if this is a git push command
if echo "$COMMAND" | grep -q "git push"; then
  # Block and require confirmation
  cat << 'EOF'
{
  "decision": "block",
  "reason": "🚫 PUSH GATE: I need your explicit approval before pushing to remote.\n\nWant me to push to main? (yes/no)"
}
EOF
else
  # Allow all other commands
  echo '{"decision": "allow"}'
fi
