---
name: thrifty
description: >
  Use when the user says "thrifty", "delegate this", "tiered build", or asks to
  execute a spec cheaply. thrifty takes a spec you already have (written by hand or by
  any model — thrifty doesn't care which) and EXECUTES it for less. Orchestrates a
  tiered-delegation run: the architect (Sonnet) refines the spec into a contract that
  pins every cross-cutting decision, executors (Haiku subagents) do the bulk work in
  parallel from per-unit briefs, and a checker (Sonnet subagent) verifies each unit
  against explicit acceptance criteria and applies bounded tiered fixes. Works for code
  and non-code tasks alike.
---

# thrifty — tiered delegation

You bring a **spec**; thrifty executes it for less by delegating each unit of work to
the **weakest model that can do it correctly**. The architect (Sonnet) does the
thinking that genuinely needs a capable model — decomposition, cross-cutting decisions,
defining what "done" means, and strategic fixes. Everything else is pushed down to
cheaper, faster models. (Where the spec comes from — hand-written, Opus, Gemini,
whatever — is your call; thrifty starts once you have one.)

```text
architect (Sonnet)       plan: contract + briefs + acceptance criteria
        │
        ▼
executors (Haiku × N)    execute one brief each, in parallel where deps allow
        │
        ▼
checker (Sonnet)         verify each unit vs criteria; bounded tiered fixes
        │
        ▼
architect (Sonnet)       integrate, coherence pass, report
```

**Why:** strong-model reasoning is expensive and slow; most work in a task is
pattern-following execution, not reasoning. Concentrate the strong model where
judgment is needed and offload execution. The enabler is **acceptance criteria as
the trust contract** — as long as the checker verifies each unit against concrete
criteria, the executor's output is trustworthy.

## When to use / not use

**Use** when the task decomposes into multiple units of work that share some
cross-cutting decisions (conventions, interfaces, terminology) — a feature across
several files, a multi-section document, a batch of similar transforms, a
migration. The payoff scales with the number of units.

**Don't use** for a single indivisible unit (just do it directly), for work that
is *all* novel reasoning with little execution (the architect would do it all
anyway), or for trivial tasks where the planning overhead exceeds the work.

## The roles (model tiers)

| Role | Model | Who | Does |
|------|-------|-----|------|
| **architect / director** | Sonnet 4.6 | this session | plan, decide cross-unit, integrate, replan |
| **brief-writer** *(split tier only)* | Sonnet 4.6 | dispatched subagent | expand one terse unit spec into a full brief |
| **executor** | Haiku 4.5 | dispatched subagent | execute one brief |
| **checker** | Sonnet 4.6 | dispatched subagent | judge + fix a unit — *only when a gate fails or there are assertional criteria* |

**Dispatch mechanism:** the `Agent` tool's `model` parameter. Dispatch executors
with `model: "haiku"`, brief-writers and checkers with `model: "sonnet"`. The
architect tier is Sonnet too — run the orchestrating session on Sonnet. The
brief-writer tier exists only in **split** planning tier — in direct tier the
architect writes the briefs itself.

## Artifacts

Create a working directory `docs/thrifty/<task-slug>/` and persist:

- `CONTRACT.md` — the cross-unit architectural surface (see `thrifty-plan`).
- `briefs/UNIT-NNN.md` — one self-contained brief per unit.
- `LEDGER.md` — status + fix-loop counters per unit; makes the run resumable.

Templates live in this skill's `templates/` directory:
`CONTRACT.template.md`, `BRIEF.template.md`, `LEDGER.template.md`.

## Workflow

### Step 1 — Frame
Clarify the goal if it is ambiguous, and explore the relevant context (existing
code, source material, conventions). You cannot pin cross-unit decisions you
haven't looked at. Choose a `<task-slug>` and create the working directory.

### Step 2 — Plan
Invoke **`thrifty-plan`** (you run this yourself; it is your planning discipline).
It picks a **decomposition mode** and a **planning tier**, then produces
`CONTRACT.md`, the dependency graph, and the briefs (direct) or terse unit specs
(split). Initialize `LEDGER.md` with every unit `pending`. Criteria are confirmed
with the user (unless pre-specified) once briefs exist.

**Calibration (the cost lever):** the executor is Haiku — far stronger than the
tiny local models the `local_code_gen` discipline was built for. Pin only what is
**cross-unit AND genuinely ambiguous**; let Haiku infer the rest. Architect/checker
(Sonnet) output is the expensive part, so **terse beats thorough** — a cheap checker
catch is better than over-specifying every unit.

**Planning tier** — who writes the briefs (Step 2b):
- **direct** — the architect writes the contract AND every brief. Best for few units,
  subtle briefs, correctness-critical work. (No Step 2b.)
- **split** — the architect writes the contract + terse `UNIT-SPECS.md` and stops; the
  orchestrator dispatches parallel Sonnet brief-writers (Step 2b). Best for many units
  (≳ 6) with mechanical briefs, or at scale — parallel brief-writing keeps the
  architect's context lean and shortens wall-clock. Hybrid (the architect writes the
  subtle units' briefs, delegates the rest) is allowed.

### Step 2b — Dispatch brief-writers (split tier only)
For each unit, dispatch a **Sonnet** `thrifty-brief` writer. These are independent
(each needs only the contract + its unit spec), so **dispatch them in parallel**
(one message, multiple `Agent(model:"sonnet")` calls). Each expands its terse spec
into `briefs/UNIT-NNN.md` with right-sized approach + concrete criteria, with
within-unit authority only. If a brief-writer returns an `escalation` (a cross-unit
problem in the contract/spec), that's yours to resolve — fix the contract/spec and
re-dispatch that writer. Once briefs exist, confirm criteria with the user (unless
pre-specified), then proceed to Step 3.

**Decomposition mode** — how the artifact is split governs dispatch in Step 3:
- **partition** — units own separate regions/files; run in **parallel**; you merge
  fragments at integration. (Default for separable outputs.)
- **relay** — one shared artifact extended segment by segment; units run
  **sequentially**, each receiving the artifact's current state.
- **layered** — role-specialized passes over the whole artifact (draft → edit →
  polish); units run **sequentially**.
- *Single artifact, no cross-unit seams* → degenerate plan: no `CONTRACT.md`, one
  brief, one execute, one check.

### Step 3 — Dispatch executors
**Partition mode:** walk the dependency graph; for every unit whose dependencies are
all `done`, dispatch a Haiku executor, and **dispatch all currently-ready units in a
single message** (multiple `Agent` calls) so independent units run in parallel.

**Relay / layered mode:** dispatch **one unit at a time, in order** — do not
parallelize. Each executor reads the shared artifact's current state and
extends it (relay) or applies its pass (layered). Check each unit before
dispatching the next, so continuity errors are caught before they compound.

```text
Agent(
  subagent_type: general-purpose,
  model: "haiku",
  description: "thrifty execute UNIT-NNN",
  prompt: "Use the thrifty-execute skill. Working dir: docs/thrifty/<slug>/.
           Your unit: UNIT-NNN. Read CONTRACT.md and briefs/UNIT-NNN.md, execute
           the brief, and report results against its acceptance criteria."
)
```

Mark dispatched units `executing` in the ledger. As executors return, record their
self-reported results. When a unit's dependencies become satisfied, dispatch it in
the next batch.

### Step 4 — Verify (tiered by criterion type — don't pay Sonnet to read passing code)
Verification matches the criterion. **A Sonnet read is expensive (~3× Haiku);
spend it only where judgment is actually needed.**

1. **Run the runnable criteria yourself first (the gate).** For each runnable
   criterion (a test/command), run it directly with Bash. This *is* the independent
   verification — you re-run rather than trust the executor's self-report, and it
   costs no model tokens. (For heavy/parallel gates you may delegate to a Haiku
   runner, but the orchestrator running a one-line command is cheapest.)

2. **Decide whether Sonnet is even needed for this unit:**
   - **All runnable criteria pass AND no assertional criteria** → mark the unit
     `done`. **Do not dispatch a checker.** (Most code units land here — the
     asteroids run would have skipped Sonnet on all 7.)
   - **A runnable criterion fails** → dispatch a Sonnet checker to *diagnose and
     surgically fix* (now a code read is justified — there's a real failure).
   - **The unit has assertional criteria** (prose, "no claim uncited", design
     quality — things only a reader can judge) → dispatch a Sonnet checker to read
     and judge *those dimensions*. It need not re-read code that already passed its
     gate; point it at what requires judgment.

```text
Agent(
  subagent_type: general-purpose,
  model: "sonnet",
  description: "thrifty check UNIT-NNN",
  prompt: "Use the thrifty-check skill. Working dir: docs/thrifty/<slug>/.
           Your unit: UNIT-NNN. Reason for check: <failing gate: ...> | <assertional
           criteria to judge: ...>. Verify ONLY what's needed (don't re-read passing
           code), apply the surgical fix if local, return the structured verdict."
)
```

Apply the **fix-loop control rules** below to the checker's verdict. A unit is only
`done` when the checker returns `diagnosis: pass`.

### Step 5 — Integrate
When all units are `done`, do a final coherence pass yourself (the architect): do the units
fit together as one whole? Resolve any seams the unit-level checks couldn't see.
- **partition** — assemble the fragments into the final artifact (concatenate per
  the contract's ownership order).
- **relay / layered** — assembly is a no-op; the shared artifact *is* the output.
  Your coherence pass just confirms the whole reads as one.
Then report: what was built, the ledger summary, and an approximate note on
tokens saved vs. building the whole spec without delegation.

## Fix-loop control (you own loop termination)

**The checker diagnoses and recommends; you decide and count.** The checker never
escalates itself — it returns a structured verdict with a `diagnosis` field. You
apply bounded routing using the per-unit counters in the ledger
(`surgical_n`, `redo_n`, `replan_n`).

| diagnosis | meaning | action |
|-----------|---------|--------|
| `pass` | all criteria met | mark `done` |
| `local` | small localized defect, brief sound | tier 1 — checker already attempts the surgical fix and re-checks |
| `execution` | unit substantially wrong, brief sound | tier 2 — fresh Haiku executor redo with the checker's notes |
| `brief` | criteria unachievable / contract or brief wrong | tier 3 — revise the spec, re-dispatch (see jurisdiction below) |

**Tier 3 by jurisdiction (split tier):** a `brief` defect that is *within the unit*
(the brief itself was thin/wrong, contract is fine) routes to a fresh **Sonnet
`thrifty-brief` re-write**, isolated to that unit. Only a defect in the **contract**
(a missing/wrong cross-unit decision) comes back to **you (the architect)**, since
cross-unit decisions are yours alone. In direct tier, both are yours. Match authority
to the defect: a within-unit brief fix doesn't need the architect's full context.

**Bounds (defaults; overridable in the contract):**
- Tier 1 surgical: ≤ 2 passes. Still failing → treat as `execution`, go to tier 2.
- Tier 2 redo: ≤ 1. Still failing → escalate to tier 3 regardless of diagnosis.
- Tier 3 replan: ≤ 1. Still failing after one replan → **stop, surface to the
  human** with full verdict history. Do not loop further.
- **Regression guard:** before any tier-1/tier-2 fix, snapshot the unit's outputs
  (git stash / file copy for code; saved artifact version otherwise). After the
  fix, re-run *all* of the unit's criteria. If a previously-passing criterion now
  fails, **roll back** and escalate one tier instead of accepting the regression.
- Log every tier transition as a `LEDGER.md` row so the loop stays auditable.

Worst case per unit: 2 surgical + 1 redo + 1 replan, then human. Bounds guarantee
termination.

## Common mistakes

- **Dispatching ready units one at a time.** Batch all currently-ready units into a
  single message so they run in parallel — that is the whole point.
- **Over-specifying briefs.** Haiku is capable. Pin the *seams* (cross-unit), trust
  Haiku for the *interiors*. Byte-level pinning is for tiny local models, not this.
- **Letting the checker escalate itself.** Escalation decisions and counters live
  with you, the orchestrator, or the loop won't terminate predictably.
- **Vibes-based acceptance.** Every unit is judged against its written criteria,
  not a general sense of quality. If criteria are missing, the plan is incomplete.
- **Doing the executor's work yourself.** If you find yourself writing the unit's
  output, either the brief was wrong (fix the brief) or the task didn't need
  thrifty. Don't quietly absorb execution back into the architect session.
