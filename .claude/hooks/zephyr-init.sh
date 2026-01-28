#!/bin/bash
# .claude/hooks/zephyr-init.sh
# Inject Zephyr orchestration protocol on session start
#
# This hook fires once when a Claude Code session begins, establishing
# the Zephyr-first orchestration pattern for the entire session.

cat << 'EOF'
{
  "continue": true,
  "systemMessage": "ZEPHYR ORCHESTRATION PROTOCOL ACTIVE: For any non-trivial task (features, architecture, implementation, refactoring, bug fixes, multi-step work), you MUST invoke Zephyr (master-product-manager) FIRST via Task tool with subagent_type=zephyr. Zephyr analyzes scope, checks roadmap fit, and delegates to specialists. Only skip for trivial tasks (typos, simple questions, single file reads)."
}
EOF
exit 0
