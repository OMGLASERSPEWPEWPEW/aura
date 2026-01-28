#!/bin/bash
# .claude/hooks/cost-report.sh
# Calculates per-response token costs by tracking state between invocations

# Read stdin to get hook data (use Python instead of jq for portability)
hook_data=$(cat)
read transcript_path session_id < <(python3 -c "
import json, sys
try:
    d = json.loads('''$hook_data''')
    print(d.get('transcript_path', ''), d.get('session_id', 'unknown'))
except:
    print('', 'unknown')
")

if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  echo '{"continue": true}'
  exit 0
fi

# Use Python for robust JSONL parsing and state management
cost_table=$(python3 - "$transcript_path" "$session_id" << 'PYTHON'
import json
import sys
import os

transcript_path = sys.argv[1] if len(sys.argv) > 1 else None
session_id = sys.argv[2] if len(sys.argv) > 2 else "unknown"

if not transcript_path or not os.path.exists(transcript_path):
    sys.exit(0)

# State file to track last processed line
state_file = f"/tmp/claude-cost-{session_id}.json"

# Load previous state
last_line = 0
try:
    if os.path.exists(state_file):
        with open(state_file, 'r') as f:
            state = json.load(f)
            last_line = state.get("last_line", 0)
except:
    pass

# Pricing per million tokens (Opus 4.5)
PRICING = {
    "input": 15.00,
    "output": 75.00,
    "cache_write": 18.75,
    "cache_read": 1.50
}

totals = {"input": 0, "output": 0, "cache_write": 0, "cache_read": 0}
current_line = 0

try:
    with open(transcript_path, 'r') as f:
        for line in f:
            current_line += 1
            if current_line <= last_line:
                continue  # Skip already-processed lines
            try:
                entry = json.loads(line.strip())
                if 'message' in entry and isinstance(entry['message'], dict):
                    usage = entry['message'].get('usage', {})
                    if usage:
                        totals["input"] += usage.get("input_tokens", 0)
                        totals["output"] += usage.get("output_tokens", 0)
                        totals["cache_write"] += usage.get("cache_creation_input_tokens", 0)
                        totals["cache_read"] += usage.get("cache_read_input_tokens", 0)
            except:
                continue
except Exception as e:
    sys.exit(0)

# Save new state
try:
    with open(state_file, 'w') as f:
        json.dump({"last_line": current_line}, f)
except:
    pass

# Calculate costs
def calc_cost(tokens, rate):
    return (tokens / 1_000_000) * rate

costs = {
    "input": calc_cost(totals["input"], PRICING["input"]),
    "output": calc_cost(totals["output"], PRICING["output"]),
    "cache_write": calc_cost(totals["cache_write"], PRICING["cache_write"]),
    "cache_read": calc_cost(totals["cache_read"], PRICING["cache_read"]),
}
total_tokens = sum(totals.values())
total_cost = sum(costs.values())

# Skip if no tokens (nothing new to report)
if total_tokens == 0:
    sys.exit(0)

# Format compact table
def fmt_tok(n):
    if n >= 1000:
        return f"{n/1000:.1f}k"
    return str(n)

def fmt_cost(c):
    if c < 0.01:
        return f"${c:.4f}"
    return f"${c:.2f}"

# Compact single-line format for cleaner output
lines = []
if totals['input'] > 0:
    lines.append(f"In: {fmt_tok(totals['input'])} (${costs['input']:.4f})")
if totals['cache_read'] > 0:
    lines.append(f"Cache\u2193: {fmt_tok(totals['cache_read'])} (${costs['cache_read']:.4f})")
if totals['cache_write'] > 0:
    lines.append(f"Cache\u2191: {fmt_tok(totals['cache_write'])} (${costs['cache_write']:.4f})")
if totals['output'] > 0:
    lines.append(f"Out: {fmt_tok(totals['output'])} (${costs['output']:.4f})")

summary = " | ".join(lines)
print(f"**Tokens**: {summary} | **Total: {fmt_cost(total_cost)}**")
PYTHON
)

if [ -n "$cost_table" ]; then
  # Escape for JSON and inject as system message
  escaped=$(echo "$cost_table" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read())[1:-1])')
  echo "{\"continue\": true, \"systemMessage\": \"TOKEN COST: Include this line just before your timestamp:\\n${escaped}\"}"
else
  echo '{"continue": true}'
fi
exit 0
