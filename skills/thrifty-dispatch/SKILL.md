---
name: thrifty-dispatch
description: >
  Lean tiered-build orchestrator (JSONL-dispatch architecture). Use for "thrifty
  fast / lean / dispatch", or a multi-sprint build where cost matters. The architect
  (Sonnet) writes a contract + a sprints.jsonl and calls a dispatch SCRIPT that loops
  cheap bare model calls (claude -p --bare, subscription, no API key) to write each
  sprint to disk — NO subagents. The orchestrator never ingests sprint outputs, only a
  manifest, so its context stays tiny. Then it runs the gate and surgical-fixes.
---

# thrifty-dispatch — write JSONL, dispatch, verify (the lean architecture)

This is thrifty rebuilt on the speed-run / `local_code_gen` substrate: **the LLM
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
   - `tier`: `generate` sprints **always run on Haiku** (the script forces it) — codegen
     never escalates. If a unit feels too hard for Haiku, **split it into smaller sprints**;
     do not reach for a stronger executor. Sonnet is used only for planning and the fix loop.
   - `kind`: `generate` (model emits `<FILE path="...">...</FILE>` blocks → script writes
     them) or `brief` (model emits markdown → saved to `briefs/<id>.md`).
   - `deps`: sprint ids that must finish first (script runs in dependency waves, parallel
     within a wave).
   - For a split-planning pass, first emit `kind:"brief"` sprints (tier sonnet) to write
     briefs, then `kind:"generate"` sprints (tier haiku) that consume them. For small
     jobs, just write the briefs inline here and skip the brief pass.
4. **Dispatch** — run the script via Bash. Prefer `--run "<gate>"` (full pipeline:
   plan → execute → gate → bounded fix), or bare for execute-only:
   ```bash
   python3 <this-skill-dir>/dispatch.py --run "node --test"
   ```
   It loops the sprints, makes the bare calls (parallel within a dep wave), writes files
   to disk, and emits `manifest.json` + `run_manifest.json`. **Do not read the generated
   files into your context** — read the manifests.

   **Run it in the BACKGROUND and narrate progress to the user** — a multi-minute silent
   Bash call is a bad UX. The script streams flushed milestones you should relay as they
   appear, e.g. `[plan] done: … N sprints` → `[execute] ok SPRINT-003 → … (3/N)` →
   `[gate] PASS` → `[done] … = $X`. The manifests are the durable checkpoints
   (`plan_manifest.json` after planning, `manifest.json` after execute, `run_manifest.json`
   at the end), so poll/tail and report: "✅ Planned N sprints → ⏳ executing 3/N →
   ✅ gate passed, $X." Keep these summaries lean — relay the milestones, not the file contents.
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
after one surgical fix — vs the subagent thrifty's **$1.86** for the same task. The
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
