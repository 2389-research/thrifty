#!/usr/bin/env bash
# Atelier full pipeline, priced per phase: spec -> Sonnet writes (contract + sprints)
# -> one cached Haiku agent builds + self-fixes -> Sonnet patches ONLY if the gate is
# still red. Each cost is the total_cost_usd self-reported by `claude -p --output-format
# json` for that call (a local estimate on subscription plans). MCP is hard-disabled so
# agents can't wander off-task (e.g. social-media tools inherited from a global CLAUDE.md).
#
# Usage: run_atelier_flow.sh <outdir>     (writes <outdir>/<task>/ and results.csv)
# bash 3.2-safe: gate/spec lookups via case, not associative arrays.
set -o pipefail
ATELIER=$(cd "$(dirname "$0")/../.." && pwd)
DPY="$ATELIER/skills/atelier-dispatch/dispatch.py"
TASKS="$ATELIER/eval/tasks"
BASE="${1:-/tmp/atelier_flow}"
NOMCP=(--strict-mcp-config --mcp-config '{"mcpServers":{}}')
CSV="$BASE/results.csv"; mkdir -p "$BASE"
echo "task,plan_usd,haiku_usd,fix_usd,total_usd,gate" > "$CSV"

spec_for () { case "$1" in 01) echo 01-wordfreq;; 02) echo 02-taskstore;; 03) echo 03-jqlite;; 04) echo 04-pysummary;; 05) echo 05-comparison-brief;; 06) echo 06-ledger;; 07) echo 07-taskgraph;; esac; }
gate_for () { case "$1" in 01|02|03) echo "node --test";; 04|06) echo "python -m pytest";; 07) echo "go test ./...";; *) echo "";; esac; }
# cost prints the number, or ERR if the result file is missing/unparseable (a failed
# `claude` call) — so a failure shows as ERR in the CSV instead of a silent $0.
cost () { python3 -c "import json,sys;print(round(json.load(open(sys.argv[1]))['total_cost_usd'],4))" "$1" 2>/dev/null || echo ERR; }
sum3 () { python3 -c "import sys;v=sys.argv[1:];print('ERR' if any(not x.replace('.','',1).isdigit() for x in v) else round(sum(float(x) for x in v),4))" "$@"; }

# PHASE 1 — Sonnet writes contract + sprints (parallel)
for n in 01 02 03 04 05 06 07; do
  d="$BASE/$n"; rm -rf "$d"; mkdir -p "$d"; cp "$TASKS/$(spec_for "$n").md" "$d/spec.md"
  ( cd "$d" && python3 "$DPY" --plan >plan.log 2>&1 ) &
done; wait; echo "[phase1: Sonnet->sprints done]"

# PHASE 2 — one cached Haiku agent builds + self-fixes (parallel)
for n in 01 02 03 04 05 06 07; do
  d="$BASE/$n"; g=$(gate_for "$n")
  if [ -n "$g" ]; then
    P="Build the project from the plan below. Write EVERY file the sprints describe (one per sprint) to disk, honoring the CONTRACT exactly. Then run \`$g\` and fix failures with targeted edits until it passes cleanly. Work in dependency order. Use only file editing + running the gate. Stay strictly on this task.

=== CONTRACT ===
$(cat "$d/contract.md")

=== SPRINTS ===
$(cat "$d/sprints.jsonl")"
  else
    P="Write BRIEF.md per the plan below, satisfying every acceptance criterion in the CONTRACT. Re-read it and fix gaps. Use only file editing. Stay strictly on this task.

=== CONTRACT ===
$(cat "$d/contract.md")

=== SPRINTS ===
$(cat "$d/sprints.jsonl")"
  fi
  ( cd "$d" && { claude -p "$P" --output-format json --model haiku --permission-mode bypassPermissions \
      --disable-slash-commands --disallowedTools Task "${NOMCP[@]}" >haiku.json 2>haiku.err \
      || echo "[WARN] task $n: haiku call failed rc=$? (see $d/haiku.err)" >&2; } ) &
done; wait; echo "[phase2: Haiku exec done]"

# PHASE 3 — gate; Sonnet scoped fix only if still red
for n in 01 02 03 04 06 07; do
  d="$BASE/$n"; g=$(gate_for "$n"); fix=0; gate="PASS"
  ( cd "$d" && eval "$g" >gate1.log 2>&1 ) || {
    FP="The gate \`$g\` is failing here. Diagnose and fix with minimal targeted edits (fix the real bug, do not weaken tests). Re-run until it passes. Use only file editing + running the gate.

GATE OUTPUT:
$(cd "$d" && eval "$g" 2>&1 | tail -40)"
    ( cd "$d" && claude -p "$FP" --output-format json --model sonnet --permission-mode bypassPermissions \
        --disable-slash-commands --disallowedTools Task "${NOMCP[@]}" >fix.json 2>fix.err || true )
    fix=$(cost "$d/fix.json")
    ( cd "$d" && eval "$g" >gate2.log 2>&1 ) && gate="PASS(after fix)" || gate="FAIL"
  }
  plan=$(python3 -c "import json;print(round(json.load(open('$d/plan_manifest.json'))['plan_cost_usd'],4))" 2>/dev/null||echo ERR)
  haiku=$(cost "$d/haiku.json"); total=$(sum3 "$plan" "$haiku" "$fix")
  echo "$n,$plan,$haiku,$fix,$total,$gate" >> "$CSV"
done
# 05 (no runnable gate; judge BRIEF.md by hand)
d="$BASE/05"; plan=$(python3 -c "import json;print(round(json.load(open('$d/plan_manifest.json'))['plan_cost_usd'],4))" 2>/dev/null||echo ERR)
haiku=$(cost "$d/haiku.json"); total=$(sum3 "$plan" "$haiku")
echo "05,$plan,$haiku,0,$total,BRIEF(manual)" >> "$CSV"
echo "=== RESULTS ==="; cat "$CSV"
