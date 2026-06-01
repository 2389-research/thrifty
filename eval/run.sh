#!/usr/bin/env bash
# Run one benchmark task headless and capture its total cost (subagents included).
#
#   ./run.sh <task-file> <atelier|dispatch|subagents|direct> <opus|sonnet>
#
# Each run executes in its own throwaway dir under runs/. The cost printed is
# total_cost_usd from the headless JSON result, which INCLUDES subagent cost
# (verified). After it finishes, RE-RUN the gate yourself to confirm quality —
# don't trust the run's self-report.
set -eo pipefail

EVAL_DIR="$(cd "$(dirname "$0")" && pwd)"
TASK="$1"; METHOD="$2"; MODEL="$3"
SPEC_FILE="$EVAL_DIR/tasks/$(basename "$TASK")"
[ -f "$SPEC_FILE" ] || { echo "task not found: $SPEC_FILE" >&2; exit 1; }
# MODEL feeds RUN_DIR and `rm -rf`; constrain it so a malformed value can't escape the run dir.
case "$MODEL" in opus|sonnet|haiku) ;; *) echo "unknown model: '$MODEL' (expected opus | sonnet | haiku)" >&2; exit 2 ;; esac

slug="$(basename "$TASK" .md)"
RUN_DIR="$EVAL_DIR/runs/${slug}__${METHOD}__${MODEL}"
rm -rf "$RUN_DIR"; mkdir -p "$RUN_DIR"

# Both arms are held to the SAME done-bar (write real tests, iterate to green) so the
# cost comparison is at equal quality. Final scoring uses an EXTERNAL held-out gate
# the experimenter runs (see README) — not the arm's self-report.
DONE_BAR="Definition of done (mandatory): write tests that genuinely exercise the
behaviors in the spec (NOT trivial/always-true tests), run them, and iterate until
they actually pass. Do not stop with failing tests or with tests that don't assert
the real expected values."

case "$METHOD" in
  atelier)
    # the tuned protocol: atelier skill, split tier (subagent substrate)
    INSTR="Use the atelier skill in split tier to build the task specified below. Decompose, write the contract + briefs, dispatch executors, verify. $DONE_BAR"
    FLAGS=() ;;
  dispatch)
    # lean JSONL-dispatch substrate: atelier-dispatch skill, no subagents
    DPY="$EVAL_DIR/../skills/atelier-dispatch/dispatch.py"
    INSTR="Use the atelier-dispatch skill to build the task below in this directory. The dispatch engine is at $DPY — after you write contract.md and units.jsonl here, run: python3 $DPY . Decompose into units (tier haiku, kind generate, terse inline briefs + acceptance criteria). After dispatch, run the gate yourself and surgically fix any failures, then report. $DONE_BAR"
    FLAGS=() ;;
  subagents)
    # ad-hoc delegation, NO atelier: skills off, but Task tool allowed. Controls for
    # "delegation" — does naive subagent use get the win without atelier's structure?
    INSTR="First plan your approach to the task below, then implement it. You MAY delegate parts of the work to subagents via the Task tool if you judge it helpful, and you may run those subagents on cheaper models (e.g. haiku) for simpler parts — there is no required structure, organize it however you see fit. No skills or slash commands are available. $DONE_BAR"
    FLAGS=(--disable-slash-commands) ;;
  direct)
    # clean baseline: single-agent Opus, NO skills, NO subagents (deterministic).
    INSTR="First plan your approach to the task below, then implement it directly yourself, in this one session. No skills, plugins, slash commands, or subagents are available — do not attempt to use any. $DONE_BAR"
    FLAGS=(--disable-slash-commands --disallowedTools Task) ;;
  *)
    # reject unknown methods rather than silently running the baseline (a typo'd
    # <method> would otherwise invalidate the experiment row and cost comparison).
    echo "unknown method: '$METHOD' (expected: atelier | dispatch | subagents | direct)" >&2; exit 2 ;;
esac

PROMPT="$INSTR

--- TASK SPEC ---
$(cat "$SPEC_FILE")"

cd "$RUN_DIR"
claude -p "$PROMPT" --output-format json --model "$MODEL" \
  --permission-mode bypassPermissions "${FLAGS[@]}" > result.json 2> err.log || true

# orchestrator cost (result.json) + dispatch cost (manifest.json, if present — those
# bare calls are separate sessions, NOT in the orchestrator's total).
COST="$(python3 -c "
import json,os
oc=json.load(open('result.json')).get('total_cost_usd',0) or 0
dc=json.load(open('manifest.json')).get('dispatch_cost_usd',0) if os.path.exists('manifest.json') else 0
print('%.5f'%(oc+dc))" 2>/dev/null || echo "PARSE_ERR")"
TURNS="$(python3 -c "import json;print(json.load(open('result.json')).get('num_turns',''))" 2>/dev/null || echo "")"
# durable record (gate result filled in by the experimenter after verifying)
RESULTS_CSV="$EVAL_DIR/runs/results.csv"
[ -f "$RESULTS_CSV" ] || echo "task,method,model,cost_usd,num_turns,gate(fill_in),dir" > "$RESULTS_CSV"
echo "${slug},${METHOD},${MODEL},${COST},${TURNS},,${RUN_DIR}" >> "$RESULTS_CSV"
echo "${slug} | ${METHOD} | ${MODEL} | \$${COST} | turns=${TURNS} | dir=${RUN_DIR}"
echo "  -> now VERIFY: cd '${RUN_DIR}' && <gate: node --test | python -m pytest>  (then fill the gate column in runs/results.csv)"
