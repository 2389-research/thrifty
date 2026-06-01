#!/usr/bin/env bash
# Baseline: Opus does the WHOLE job solo from the same spec (plan + implement + test +
# iterate to green), no subagents, MCP disabled. This is the apples-to-apples control for
# the atelier full pipeline — both arms start from the identical spec and produce
# gate-passing code; only the model strategy differs.
#
# Usage: run_opus_from_spec.sh <outdir>
set -o pipefail
ATELIER=$(cd "$(dirname "$0")/../.." && pwd)
TASKS="$ATELIER/eval/tasks"
BASE="${1:-/tmp/opus_from_spec}"
NOMCP=(--strict-mcp-config --mcp-config '{"mcpServers":{}}')
CSV="$BASE/results.csv"; mkdir -p "$BASE"
echo "task,opus_usd,turns,gate(fill_after_verify)" > "$CSV"

spec_for () { case "$1" in 01) echo 01-wordfreq;; 02) echo 02-taskstore;; 03) echo 03-jqlite;; 04) echo 04-pysummary;; 05) echo 05-comparison-brief;; 06) echo 06-ledger;; 07) echo 07-taskgraph;; esac; }
gate_for () { case "$1" in 01|02|03) echo "node --test";; 04|06) echo "python -m pytest";; 07) echo "go test ./...";; *) echo "";; esac; }

for n in 01 02 03 04 05 06 07; do
  d="$BASE/$n"; rm -rf "$d"; mkdir -p "$d"; g=$(gate_for "$n")
  if [ -n "$g" ]; then
    P="Build the project specified below, in this directory. Plan it, implement every file yourself, write real tests, run \`$g\`, and iterate until it passes cleanly. No subagents. Use only file editing + running the gate; stay strictly on this task.

--- SPEC ---
$(cat "$TASKS/$(spec_for "$n").md")"
  else
    P="Write BRIEF.md in this directory satisfying every acceptance criterion in the spec below. Use only file editing; stay strictly on this task.

--- SPEC ---
$(cat "$TASKS/$(spec_for "$n").md")"
  fi
  ( cd "$d" && { claude -p "$P" --output-format json --model opus --permission-mode bypassPermissions \
      --disable-slash-commands --disallowedTools Task "${NOMCP[@]}" >result.json 2>err.log \
      || echo "[WARN] task $n: opus call failed rc=$? (see $d/err.log)" >&2; } ) &
done; wait

for n in 01 02 03 04 05 06 07; do
  d="$BASE/$n"
  # ERR (not 0) if the result is missing/unparseable, so a failed run is visible in the CSV
  read -r c t < <(python3 -c "import json;d=json.load(open('$d/result.json'));print(round(d['total_cost_usd'],4),d.get('num_turns'))" 2>/dev/null || echo "ERR ERR")
  echo "$n,$c,$t," >> "$CSV"
done
echo "=== RESULTS (verify gates yourself, then fill the gate column) ==="; cat "$CSV"
