# atelier evaluation

Two coupled experiments. **#1 measures cost/quality; #2 (simmer) consumes #1's
numbers to refine atelier.** Run #1 first — it's the foundation.

The tasks split into two groups, deliberately:

**A. Size ladder (stack held constant = JS ESM).** Isolates the core hypothesis —
*atelier's savings grow with task size* — by varying ONLY size. Stack is held fixed
because if you varied language and size together you couldn't tell which drove a
trend. All have `node --test` gates so quality is objective.

| Task | Size | Stack | Gate |
|------|------|-------|------|
| `01-wordfreq.md` | small (~3 units) | JS ESM | `node --test` |
| `02-taskstore.md` | medium (~5–6 units) | JS ESM | `node --test` |
| `03-jqlite.md` | large (~8 units) | JS ESM | `node --test` |

**B. Generality probes (vary stack + type).** Guard against the ladder's blind spot —
all-JS, all-pattern-heavy code is Haiku's *best* case and would flatter atelier. These
check it isn't language-specific and that the **non-code path** (assertional checker,
not a gate) actually works. Run once each; not part of the size curve.

| Task | Type | Stack | Gate |
|------|------|-------|------|
| `04-pysummary.md` | code | Python | `pytest` (runnable) |
| `05-comparison-brief.md` | non-code prose | — | assertional checklist (read) |

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
2. Start a fresh Claude Code session there. Set the model for this arm:
     /model opus    -> direct-opus, and atelier (Opus is the orchestrator)
     /model sonnet  -> direct-sonnet
3. Give it the task (verbatim spec, same text for every method):
     direct:   "Build this. Run the tests and make them pass."
     atelier:  "Use the atelier skill in split tier to build this."
4. Let it finish. Run/confirm the task's gate yourself (node --test / pytest) -> pass/fail.
5. Run /status. From the SESSION block, record:
     - Total cost ($)                         <- the headline
     - Usage by model (each row): input / output / cache read / cache write / $
       (atelier shows opus+sonnet+haiku rows = the tier split; direct = one row)
     - Total duration (wall + API)            <- optional; speed axis
6. Write the row into RESULTS.md. Discard the session.
```
**Fresh session = no "before" snapshot needed** — it starts at $0, so the session
totals ARE the run's totals. Claude can't read its own `/status` (user command), so
you record it; Claude *can* run the tests itself.

**Notes:** `Total cost` already nets out cache discounts (cache read ~10x cheaper);
atelier shows heavy cache read (subagents re-read the contract) — that's fine, it's
priced in, compare `Total cost` as the bottom line. You may run arms in parallel in
separate windows (each session tracks its own usage) — but never two arms in one
session.

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
