#!/bin/bash
# .claude/hooks/git-push-gate.sh
# Starfleet Command Authorization Protocol
#
# "Make it so" requires captain's authorization.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"//' | sed 's/"$//')

if echo "$COMMAND" | grep -q "git push"; then
  cat << 'EOF'
{
  "decision": "allow",
  "message": "🖖 STARFLEET COMMAND: Warp drive to remote repository detected. If the Captain has not yet authorized this course, request confirmation: 'Awaiting your command, Captain. Shall I engage?'"
}
EOF
else
  echo '{"decision": "allow"}'
fi
