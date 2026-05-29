# atelier evaluation

Two coupled experiments. **#1 measures cost/quality; #2 (simmer) consumes #1's
numbers to refine atelier.** Run #1 first — it's the foundation.

The benchmark tasks (`tasks/`) are deliberately a **size ladder** — small (~3 units),
medium (~5–6), large (~8+) — because the core hypothesis is *atelier's savings grow
with task size*. Each task has runnable tests, so "did it work" is objective.

| Task | Size | Stack | Gate |
|------|------|-------|------|
| `01-wordfreq.md` | small (~3 units) | JS ESM | `node --test` |
| `02-taskstore.md` | medium (~5–6 units) | JS ESM | `node --test` |
| `03-jqlite.md` | large (~8 units) | JS ESM | `node --test` |

---

## Experiment 1 — cost / token savings (atelier vs a direct pass)

### Why fresh sessions
In Claude Code, subagents bill to the **parent session**. So `/cost` at the end of a
fresh session that ran atelier = orchestrator (Opus) + every Haiku/Sonnet subagent,
in one number — directly comparable to a direct run's `/cost`. **One fresh session
per (task × method), each in its own empty directory.** Don't reuse a session or a
dir across runs, or the numbers contaminate.

### The three methods (per task)
Run the *same task spec* three ways so we triangulate quality vs cost:
1. **direct-opus** — the quality baseline. Fresh session on Opus: paste the task,
   "build this directly and make the tests pass."
2. **direct-sonnet** — the cheap baseline. Same, on Sonnet.
3. **atelier-split** — fresh session on Opus: paste the task, "use the atelier skill
   in split tier to build this." (Skills are installed via the symlinks.)

### Procedure (per run)
```
1. mkdir a fresh empty dir; cd into it; copy in the task spec.
2. Start a fresh Claude Code session there (set the model per the method).
3. Give it the task (verbatim spec, same for all three methods).
4. Let it finish. Run the task's test command yourself; record pass/fail.
5. Run /cost. Record total $ and tokens (it includes any subagents).
6. Record into RESULTS.md.
```
(If you prefer one session: run `/cost` *before* and *after* and record the delta —
but fresh sessions are cleaner.)

### What we're testing
- **Does atelier-split beat direct-opus on cost** at equal quality (tests pass)?
- **Does the win grow with task size** (small → large)? Expectation: small is
  ~break-even or slightly worse; the gap turns in atelier's favor as units multiply.
- **Where does atelier-split land vs direct-sonnet** (the cheap baseline)? This is
  the honest bar — atelier must beat "just use Sonnet directly" to be worth it.

Record everything in `RESULTS.md`.

---

## Experiment 2 — refine atelier with simmer

The artifact simmer refines is **atelier's own skill prompts**
(`skills/atelier-plan`, `atelier-brief`, `atelier-execute`, `atelier-check`,
`atelier`). The evidence simmer's judges read is **Experiment 1's output** — the
per-tier token numbers + pass/fail + the run ledgers.

Because atelier runs as Claude Code subagents (not a single CLI command), the loop is
**hybrid**, not fully auto-runnable:

```
round:
  1. JUDGE reads: the current skill prompts + the latest RESULTS.md row(s) + the run
     ledgers (docs/atelier/*/LEDGER.md from the eval runs).
     Scores against CRITERIA, emits ASI (one highest-leverage prompt change).
  2. GENERATOR applies that change to the skill prompt(s).
  3. RE-RUN Experiment 1 on a CHEAP SUBSET (just 01-wordfreq, maybe 02) in fresh
     sessions; record the new numbers.
  4. REFLECT: did cost drop at held quality? keep or roll back. Repeat.
```

### simmer setup brief (proposed)
```
ARTIFACT_TYPE: workspace  (the skills/atelier* prompts)
CRITERIA:
  - cost: lower total weighted tokens (Opus 5x, Sonnet 3x, Haiku 1x) at held quality — PRIMARY
  - quality: tests pass / assertional criteria met; 0 unresolved escalations
  - leanness: contracts + briefs at the criteria-bound floor, no padding
EVALUATOR: re-run Experiment 1 subset (manual trigger) -> RESULTS row
ITERATIONS: 3–5 (each is expensive — keep the eval subset small)
SEARCH_SPACE: the skill prompts only (NOT the harness, NOT the task specs)
```

**Guardrails:** hold the task specs and the verification gates fixed across rounds
(only the atelier prompts may change), or you're optimizing the test, not the tool.
Keep at least one held-out task (e.g. 03-jqlite) that simmer's eval does NOT see, and
run it once at the end to check the refinements generalize.

---

## Files
- `tasks/0{1,2,3}-*.md` — the shared task specs (identical input for every method).
- `RESULTS.md` — the data table to fill in.
