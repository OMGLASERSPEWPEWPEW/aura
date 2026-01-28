#!/bin/bash
# .claude/hooks/teach-darklight-init.sh
# Invoke teach-darklight skill on session start
#
# This hook triggers a brief Claude Code lesson at each session start,
# helping Darklight progressively master Claude Code features through
# Montessori-inspired micro-lessons.

cat << 'EOF'
{
  "continue": true,
  "systemMessage": "LEARNING SESSION: Invoke the /teach-darklight skill to deliver a brief Claude Code lesson. Use the Skill tool with skill='teach-darklight'. This runs once per session to help Darklight become a Claude Code power user."
}
EOF
exit 0
