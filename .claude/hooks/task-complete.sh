#!/bin/bash
# Claude Code hook: Plays notification sound and shows Mac notification when Claude finishes

# Play a pleasant notification sound (Glass is a nice, non-intrusive chime)
afplay /System/Library/Sounds/Glass.aiff &

# Send Mac notification
osascript -e 'display notification "Claude has finished responding" with title "Claude Code" sound name "Glass"'

# Always exit 0 to allow Claude to stop (don't block)
exit 0
