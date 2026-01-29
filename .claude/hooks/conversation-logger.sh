#!/bin/bash
# .claude/hooks/conversation-logger.sh
# Logs conversation context to local conceptual heaps
#
# Creates a searchable archive of conversation snippets, tagged by topic.
# This builds up context over time that can inform future decisions.

LOG_DIR="$CLAUDE_PROJECT_DIR/.claude/memory"
HEAP_DIR="$LOG_DIR/heaps"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE=$(date +"%Y-%m-%d")

# Ensure directories exist
mkdir -p "$HEAP_DIR"

# Read the transcript/context from environment or stdin
TRANSCRIPT="${CLAUDE_TRANSCRIPT:-}"

# If no transcript in env, try reading from stdin with timeout
if [ -z "$TRANSCRIPT" ]; then
  TRANSCRIPT=$(timeout 1 cat 2>/dev/null || echo "")
fi

# Skip if no content
if [ -z "$TRANSCRIPT" ]; then
  exit 0
fi

# Log to daily file
DAILY_LOG="$LOG_DIR/daily/$DATE.md"
mkdir -p "$LOG_DIR/daily"

echo "---" >> "$DAILY_LOG"
echo "timestamp: $TIMESTAMP" >> "$DAILY_LOG"
echo "---" >> "$DAILY_LOG"
echo "$TRANSCRIPT" >> "$DAILY_LOG"
echo "" >> "$DAILY_LOG"

# Extract topics and save to conceptual heaps
# Look for key concepts mentioned in the transcript
CONCEPTS=(
  "Sorry:help desk|help agent|emo goth|zombie girl|sorry button"
  "Resonance:resonance|frequencies|mystical|vocabulary|score display"
  "Empathy:emotional safety|attachment|anxiety|shame|psychological"
  "Architecture:component|hook|api|database|schema|migration"
  "Character:personality|voice|attitude|aesthetic|vibe"
)

for concept_pattern in "${CONCEPTS[@]}"; do
  CONCEPT_NAME="${concept_pattern%%:*}"
  PATTERN="${concept_pattern#*:}"

  if echo "$TRANSCRIPT" | grep -qiE "$PATTERN"; then
    HEAP_FILE="$HEAP_DIR/${CONCEPT_NAME}.md"

    # Add to concept heap
    echo "## $TIMESTAMP" >> "$HEAP_FILE"
    echo "" >> "$HEAP_FILE"
    # Save a truncated version (first 2000 chars) to avoid bloat
    echo "$TRANSCRIPT" | head -c 2000 >> "$HEAP_FILE"
    echo "" >> "$HEAP_FILE"
    echo "---" >> "$HEAP_FILE"
    echo "" >> "$HEAP_FILE"
  fi
done

exit 0
