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

### The methods (per task)
Run the *same task spec* multiple ways to triangulate quality vs cost. The `direct`
arms are **single-agent, no skills, no subagents** (`--disable-slash-commands
--disallowedTools Task`) — a clean, deterministic "the model does it itself" control.
1. **direct-sonnet** — the realistic cheap baseline; the bar atelier most needs to beat.
2. **direct-opus** — the expensive / quality anchor (no delegation).
3. **atelier-split** — Opus orchestrates the tiered skill (Haiku exec, Sonnet check).

**Optional 4th variant — `direct-opus + ad-hoc subagents` (no atelier).** Allow Opus
the Task tool but no atelier skill. This *controls for delegation*: much of atelier's
cost win is just "Haiku is cheaper than Opus," and a single-agent baseline can't
separate that from atelier's structure. If atelier barely beats Opus-spawning-Haiku-
ad-hoc, the structure isn't earning its complexity; if it clearly beats it, the
contract/brief/verify discipline is the value. Run this later, when you want to prove
the *structure* (not just the delegation) is worth it.

### Procedure (per run)
```text
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

### Automated alternative — headless (verified)
Instead of reading `/status` by hand, run each problem headless and parse the JSON:
```bash
./run.sh tasks/01-wordfreq.md atelier opus     # -> prints total_cost_usd (subagents included)
./run.sh tasks/01-wordfreq.md direct  sonnet
```
`claude -p "<prompt>" --output-format json --model <m> --permission-mode bypassPermissions`
returns `total_cost_usd` for the run, which **includes subagent cost** (verified: a
1-subagent run cost ~2.5x a no-subagent run). One invocation per problem → one number
→ your N per-task costs, scriptable. Caveats: (a) the headless JSON has aggregate
`usage` but **no per-model split** — for the per-tier breakdown use interactive
`/status`; (b) `total_cost_usd` is a client-side estimate, fine for relative A/B;
(c) **always re-run the gate yourself** after — don't trust the run's self-report.

### Fairness — what atelier's cost includes (and why that's correct)
An atelier run's cost includes Claude **reading the atelier skill** + each subagent's
**~41k system-prompt startup** (a no-op subagent costs ~$0.05). That is a *real,
unavoidable* cost of choosing atelier, and the direct arm genuinely doesn't pay it —
so **include it; don't discount it.** The asymmetry is the point: this fixed overhead
is ~constant regardless of task size, so it correctly makes atelier look bad on small
tasks and wash out on large ones — which is the size-scaling result we want. Excluding
it would hide atelier's real weakness.

Nuance: the **fresh-cold-session-per-task** protocol is the *worst case* for atelier
(every subagent pays cold cache-creation; a warm long-lived deployment would
cache-*read* the system prompt + skill text ~10x cheaper). But the direct arm also
runs cold-fresh, so cold-vs-cold is apples-to-apples and atelier wears its full
overhead — the honest bar. (Optional: measure a near-empty atelier invocation once to
report task cost with vs without the fixed overhead.)

### Granularity you can and can't get (verified)
- **Per task** — yes: fresh-session `Total cost` (includes subagents; they bill to
  the session).
- **Per tier** — yes: the `Usage by model` rows. In an atelier session these include
  the subagents' haiku/sonnet usage, so the opus/sonnet/haiku rows ARE the tier split
  with cache-correct $. This is the per-tier breakdown — use it.
- **Per unit (per subagent)** — NOT reliably. The `subagent_tokens` figure in the
  Agent tool result is **undocumented** (open CC feature requests #10164, #22625) and
  is dominated by fixed per-subagent context overhead (~20k mostly-cached tokens just
  to start — a no-op subagent reports ~21k), so it does not map to task cost. Do NOT
  log it as cost. Per-unit would require parsing subagent transcript JSONL under
  `~/.claude/projects/` — out of scope; per-task + per-tier are enough.

### Scoring rule — equal quality, or it isn't a comparison
Cost is only meaningful **at equal, independently-verified quality** — the cheapest
way to "solve" any task is to solve it badly. So **do not trust either arm's
self-report.** atelier verifies structurally (gate + checker); a direct pass verifies
only as much as it bothers to and can ship vacuous tests (`assert(true)`) to look
cheap. To neutralize that:

1. **Author a held-out gate per task** (a reference test suite for code; a concrete
   checklist for prose) that the *experimenter* runs against every arm's output.
   Neither arm sees it, so neither can write tests to its own bar. (Both arms still
   write their own tests as part of the deliverable — but scoring uses the held-out
   gate, applied identically.)
2. **A run counts only if it passes the held-out gate.** A cheaper run that fails it
   is a **loss, not a saving.** Compare cost *only among runs that pass.*
3. Spot-check that each arm's *own* tests are non-vacuous (exist, assert real values,
   cover the spec's named behaviors) — the vacuous-test hole exists on **both** sides.

Both arms also get the identical done-bar in their prompt (write real tests, iterate
to green) — see `run.sh` — but the prompt is necessary, not sufficient; the held-out
gate is what actually enforces equal quality.

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

```text
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
```text
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
