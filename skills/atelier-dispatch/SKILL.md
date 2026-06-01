---
name: atelier-dispatch
description: >
  Lean tiered-build orchestrator (JSONL-dispatch architecture). Use for "atelier
  fast / lean / dispatch", or a multi-sprint build where cost matters. The architect
  (Sonnet) writes a contract + a sprints.jsonl and calls a dispatch SCRIPT that loops
  cheap bare model calls (claude -p --bare, subscription, no API key) to write each
  sprint to disk — NO subagents. The orchestrator never ingests sprint outputs, only a
  manifest, so its context stays tiny. Then it runs the gate and surgical-fixes.
---

# atelier-dispatch — write JSONL, dispatch, verify (the lean architecture)

This is atelier rebuilt on the speed-run / `local_code_gen` substrate: **the LLM
writes a spec; a deterministic script runs the per-sprint model calls.** It exists
because the subagent version is dominated by orchestrator cost — each subagent
carries ~40k of harness context and its report lands back in the orchestrator's
context, which then gets re-read every turn (measured: 1.2M cache-read, $1.86 on a
3-sprint task). This architecture avoids both: bare calls (~$0.02–0.05 each) and
outputs go to disk, not into your context.

## Why it's cheap (the two fixes)
1. **Bare calls.** Each sprint runs `claude -p "<prompt>" --model {haiku|sonnet} --bare`
   — `--bare` strips hooks/plugins/system-prompt, so a Haiku sprint call is ~$0.002–0.05
   instead of ~$0.05 + 40k harness. Uses your subscription OAuth — **no API key.**
2. **You never ingest outputs.** The script writes files to disk and returns a
   `manifest.json`. You read the manifest (tiny), not the generated code. No
   context compounding, no re-read tax.

## Your flow (you are the architect; keep YOUR turns + context lean)
1. **Frame** — read the spec / explore context. Choose a `<slug>`; work in a clean dir.
2. **Write `contract.md`** — the cross-sprint surface ONLY (shared interfaces/seam,
   conventions, ownership, dep graph). Lean — pin what crosses a boundary, trust the
   executor for interiors (Haiku is strong; this is not byte-pinning for a local model).
3. **Write `sprints.jsonl`** — one JSON object per line:
   ```json
   {"id":"SPRINT-001","tier":"haiku","kind":"generate","deps":[],"brief":"...terse brief + acceptance criteria..."}
   ```
   - `tier`: `haiku` (execution / pattern-heavy codegen) or `sonnet` (reasoning-heavy).
   - `kind`: `generate` (model emits `<FILE path="...">...</FILE>` blocks → script writes
     them) or `brief` (model emits markdown → saved to `briefs/<id>.md`).
   - `deps`: sprint ids that must finish first (script runs in dependency waves, parallel
     within a wave).
   - For a split-planning pass, first emit `kind:"brief"` sprints (tier sonnet) to write
     briefs, then `kind:"generate"` sprints (tier haiku) that consume them. For small
     jobs, just write the briefs inline here and skip the brief pass.
4. **Dispatch** — run the script ONCE via Bash:
   ```bash
   python3 <this-skill-dir>/dispatch.py
   ```
   It loops the sprints, makes the bare calls (parallel within a dep wave), writes files
   to disk, and emits `manifest.json` + a cost line. **Do not read the generated files
   into your context** — read `manifest.json`.
5. **Verify (gate)** — run the task's gate yourself with Bash (`node --test`, `pytest`,
   a CLI smoke). This is the independent check; cheap, no model.
6. **Surgical-fix loop** — for each failure, read ONLY the failing test + the relevant
   code, diagnose (code bug vs the executor's own bad test), and fix in place — or
   re-dispatch that one sprint with a corrective note appended to its brief. Re-run the
   gate. Bound it: a couple of fix passes, then surface to the human.
7. **Report** — what was built, gate result, and total cost (your orchestrator session
   `/status` + `manifest.json`'s `dispatch_cost_usd`).

## Verified (task 01, wordfreq, 3 sprints)
Dispatch tier cost **$0.078** (3 Haiku bare calls), one-shot **18/19** tests, **19/19**
after one surgical fix — vs the subagent atelier's **$1.86** for the same task. The
one failure was the executor writing a test that contradicted the contract's tokenizer
(`word0` collapses to `word` under "split on non-letters") — caught by the gate, fixed
in one edit. That is the loop working as designed.

## Rules / gotchas
- **Executors emit text, not tool use.** `--bare` strips tools; the model outputs
  `<FILE>` blocks and the script writes them. Don't expect the sprint call to run tests
  or read files — that's the orchestrator's job at the gate.
- **Confirm model routing** in a new environment once: `claude -p "hi" --model haiku
  --bare --output-format json` should cost ~$0.002 (Haiku rate), not ~$0.05+ (a fallback
  to a bigger model). Verified working as of this writing.
- **Keep the contract lean and your own turns few** — the orchestrator's context ×
  turns is the cost that this architecture exists to minimize. Write the two files,
  call the script, read the manifest, gate, fix. Don't re-read artifacts.
