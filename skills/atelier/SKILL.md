---
name: atelier
description: >
  Use when the user says "atelier", "delegate this", "tiered build", "plan and
  delegate", or asks to execute a multi-part task cheaply by having a strong model
  plan and cheaper models execute. Orchestrates a tiered-delegation run: the
  architect (Opus, this session) decomposes the task and pins every cross-cutting
  decision in a contract, executors (Haiku subagents) do the bulk work in parallel
  from per-unit briefs, and a checker (Sonnet subagent) verifies each unit against
  explicit acceptance criteria and applies bounded tiered fixes. Works for code and
  non-code tasks alike.
---

# atelier — tiered delegation

Execute a task by delegating each unit of work to the **weakest model that can do
it correctly**. You (Opus, the architect) do the thinking that genuinely needs a
strong model — decomposition, cross-cutting decisions, defining what "done" means,
and strategic fixes. Everything else is pushed down to cheaper, faster models.

```
architect (Opus, you)   plan: contract + briefs + acceptance criteria
        │
        ▼
executors (Haiku × N)    execute one brief each, in parallel where deps allow
        │
        ▼
checker (Sonnet)         verify each unit vs criteria; bounded tiered fixes
        │
        ▼
architect (you)          integrate, coherence pass, report
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
| **architect** | Opus 4.8 | you, this session | plan, decide cross-unit, integrate, replan |
| **executor** | Haiku 4.5 | dispatched subagent | execute one brief |
| **checker** | Sonnet 4.6 | dispatched subagent | verify + fix one unit |

**Dispatch mechanism:** the `Agent` tool's `model` parameter. Dispatch executors
with `model: "haiku"` and the checker with `model: "sonnet"`. You are already Opus.

## Artifacts

Create a working directory `docs/atelier/<task-slug>/` and persist:

- `CONTRACT.md` — the cross-unit architectural surface (see `atelier-plan`).
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
Invoke **`atelier-plan`** (you run this yourself; it is your planning discipline).
It produces `CONTRACT.md`, the unit decomposition with a dependency graph, and one
`briefs/UNIT-NNN.md` per unit — each ending in **acceptance criteria**. Propose the
inferred criteria to the user in one message and let them adjust, unless the user
already specified them (sufficiency-check skip). Initialize `LEDGER.md` with every
unit `pending`.

**Calibration:** pin cross-unit decisions exhaustively; write within-unit steps
only to the depth Haiku needs. Briefs are "enough detail," not "every byte."

### Step 3 — Dispatch executors
Walk the dependency graph. For every unit whose dependencies are all `done`,
dispatch a Haiku executor. **Dispatch all currently-ready units in a single
message** (multiple `Agent` calls) so independent units run in parallel.

```
Agent(
  subagent_type: general-purpose,
  model: "haiku",
  description: "atelier execute UNIT-NNN",
  prompt: "Use the atelier-execute skill. Working dir: docs/atelier/<slug>/.
           Your unit: UNIT-NNN. Read CONTRACT.md and briefs/UNIT-NNN.md, execute
           the brief, and report results against its acceptance criteria."
)
```

Mark dispatched units `executing` in the ledger. As executors return, record their
self-reported results. When a unit's dependencies become satisfied, dispatch it in
the next batch.

### Step 4 — Check each unit
As each unit finishes executing, dispatch a Sonnet checker for it:

```
Agent(
  subagent_type: general-purpose,
  model: "sonnet",
  description: "atelier check UNIT-NNN",
  prompt: "Use the atelier-check skill. Working dir: docs/atelier/<slug>/.
           Your unit: UNIT-NNN. Verify the unit's output against the acceptance
           criteria in briefs/UNIT-NNN.md and return the structured verdict."
)
```

Apply the **fix-loop control rules** below to the checker's verdict. A unit is only
`done` when the checker returns `diagnosis: pass`.

### Step 5 — Integrate
When all units are `done`, do a final coherence pass yourself (Opus): do the units
fit together as one whole? Resolve any seams the unit-level checks couldn't see.
Then report: what was built, the ledger summary, and an approximate note on
strong-model tokens saved vs. doing the whole task in this session.

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
| `brief` | criteria unachievable / contract or brief wrong | tier 3 — you (architect) revise CONTRACT/brief, re-dispatch |

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
  atelier. Don't quietly absorb execution back into the Opus session.
