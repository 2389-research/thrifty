# atelier — Tiered-Delegation Skill Family

**Date:** 2026-05-28
**Status:** Design (pending spec review + implementation plan)

## Summary

`atelier` is a general-purpose Claude Code skill family that executes a task by
delegating each unit of work to the **weakest model that can do it correctly**.
A strong model plans every cross-cutting decision once, a fast cheap model
executes the bulk of the work from those plans, and a mid-tier model verifies
each piece against explicit acceptance criteria and applies fixes. The result is
the same quality of output at a fraction of the strong-model token cost and
wall-clock time.

The paradigm generalizes two existing systems to arbitrary (not only code-gen)
tasks:

- **speed-run** — offload first-pass generation to a fast model; the strong
  model does architecture and *surgical* fixes, never regeneration.
- **pipelines/local_code_gen** — a strong "architect" pins every cross-unit
  decision in a contract so the weak executor never makes system-level choices.
- **Noospheric Orrery** (validation of the philosophy) — Sonnet never does the
  extraction; Haiku does all the work; Sonnet only writes/judges the spec and
  refines it until Haiku reliably passes against a golden set.

## Motivation

Strong-model reasoning is expensive and slow. Most of the work in a task is
pattern-following execution, not reasoning. By concentrating the strong model on
the parts that genuinely need judgment — decomposition, cross-cutting decisions,
defining what "done" means, and strategic fixes — and pushing execution down to a
cheap fast model, we keep quality while cutting cost and latency.

The key enabler, proven by the Orrery pipeline, is that **acceptance criteria are
the trust contract** that makes it safe to hand bulk work to a cheap model: as
long as the journeyman verifies each unit against concrete criteria, the
apprentice's output is trustworthy.

## Roles and model tiers

The atelier metaphor maps onto three tiers.

| Role | Atelier term | Model | Responsibility |
|------|--------------|-------|----------------|
| Architect | the **master** | Opus 4.8 (main session) | Clarify the goal, explore context, decompose into units, write the CONTRACT (all cross-cutting decisions + dependency graph) and per-unit BRIEFs with acceptance criteria. Owns every cross-unit decision. |
| Executor | the **apprentices** | Haiku 4.5 (parallel subagents) | Take one brief, execute it, report results against the brief's acceptance criteria. Make only within-unit decisions. |
| Checker | the **journeyman** | Sonnet 4.6 (subagent) | Verify each finished unit against its acceptance criteria; apply surgical fixes; route escalations. |

**Routing mechanism:** the `Agent` tool's `model` parameter (`haiku` / `sonnet` /
`opus`). The master is the main Opus session; it dispatches apprentice subagents
with `model: haiku` and journeyman subagents with `model: sonnet`. No new
infrastructure.

## Calibration principle

Because Haiku is genuinely capable (unlike the tiny local model
`local_code_gen` targets), briefs do **not** need byte-level pinning. The master:

- pins **cross-unit / system-wide** decisions exhaustively (shared interfaces,
  conventions, terminology, ownership, ordering) — these are the decisions the
  apprentice must never have to make, and,
- writes **within-unit** steps at the level Haiku needs to succeed, trusting
  Haiku for ordinary implementation choices.

Briefs are "enough detail," not "every byte." The skill states this explicitly so
the master does not over-specify.

## Skill family (4 skills)

```
atelier          orchestrator playbook (the master runs this)
atelier-plan     master: decompose + write CONTRACT, BRIEFs, criteria
atelier-execute  apprentice: execute one brief  (dispatched as Haiku subagent)
atelier-check    journeyman: verify + fix one unit (dispatched as Sonnet subagent)
```

`atelier-execute` and `atelier-check` carry a "do not invoke directly — dispatched
as a subagent" note, matching the simmer/speed-run convention.

## Artifacts

Persisted to `docs/atelier/<task-slug>/` so a run is auditable and resumable.

### `CONTRACT.md` — written once by the master

The cross-unit architectural surface. Pre-answers every question that crosses a
unit boundary so no apprentice has to. Sections:

- **Objective** — what the whole task achieves, in 2-4 sentences.
- **Conventions** — shared decisions every unit must honor (naming, formats,
  error handling, style, tone — domain-appropriate).
- **Interfaces / contracts** — the exact shapes that cross unit boundaries
  (function signatures, data schemas, file formats, shared section structures).
- **Glossary** — terminology pinned to one meaning.
- **Ownership map** — which unit owns/creates/modifies which files or outputs.
- **Dependency graph** — `UNIT-NNN depends on [UNIT-MMM, ...]`. Drives ordering
  and parallelism.

### `briefs/UNIT-NNN.md` — one per unit, written by the master

- **Objective** — the single thing this unit produces.
- **Inputs / context** — exact files, data, and prior-unit outputs to read.
- **Approach** — prose steps at the level Haiku needs (not pseudocode unless the
  task is code and precision is load-bearing).
- **Constraints** — what not to touch; conventions inherited from the contract.
- **Acceptance criteria** — the checklist the journeyman verifies against (see
  below).
- **Dependencies** — unit ids this one depends on.

### `LEDGER.md` — status tracking

One row per unit: `id · title · deps · status · model · notes`. Status is one of
`pending` / `executing` / `checking` / `done` / `escalated`. Makes the run
resumable and gives a final audit/cost summary.

## Acceptance criteria

This is the generalization of "tests as the source of truth." Every brief ends
with a checklist of **verifiable assertions**, and the journeyman scores against
*that list* — never against vibes.

### How criteria are set (simmer-setup discipline)

**Inspect → infer → propose → confirm. The master does the thinking; the user
validates. Never ask the user to describe something the master can read.**

1. **Infer** — the master drafts each unit's criteria from the task and context.
2. **Make concrete** — every criterion is phrased as "what done looks like" in a
   way that can be checked, not "make it good."
3. **Classify the anchor:**
   - **Runnable** (preferred when available, esp. code): a command/test the
     journeyman executes — e.g. `pytest passes`, `curl returns 200`,
     `build succeeds`.
   - **Assertional** (non-code): a concrete checklist — e.g. "summary covers all
     5 sources; no claim uncited; under 800 words."
4. **Propose + confirm** — the master presents inferred criteria in one message;
   the user adjusts or overrides.
5. **Sufficiency-check skip** — if the user already stated the criteria, skip the
   proposal and use them. The user is never *forced* to author criteria, but
   always gets to veto.

Criteria become the binding contract for that unit for the rest of the run.

## Flow

1. **Frame** — master (Opus) clarifies the goal and explores context.
2. **Plan** (`atelier-plan`) — master writes `CONTRACT.md`, decomposes into units
   with a dependency graph, and writes each `BRIEF` with acceptance criteria.
   Proposes criteria to the user (unless already specified).
3. **Dispatch** (`atelier-execute`) — for each unit whose dependencies are
   satisfied, the master dispatches a Haiku apprentice subagent. Independent
   units **fan out in parallel**; dependent units wait for their inputs. Each
   apprentice executes its brief and reports results against the criteria.
4. **Check** (`atelier-check`) — as each unit finishes, a Sonnet journeyman
   verifies it against its acceptance criteria and applies the tiered fix loop.
5. **Integrate** — once all units pass, the master does a final coherence pass
   (do the units fit together as a whole?) and reports outcome + cost summary
   (approximate strong-model tokens saved vs. doing everything in the main
   session).

## Tiered fix loop (escalation)

When the journeyman finds a unit fails its criteria:

1. **Journeyman surgical fix** (default) — small in-place corrections, the
   speed-run discipline of fixing rather than regenerating.
2. **Apprentice redo** — when the unit went substantially wrong but the brief was
   sound: re-execute the whole unit with corrective notes (a fresh Haiku
   subagent).
3. **Master replan** — when the *brief or contract itself* was wrong (a
   cross-unit decision was missing or incorrect): bubble back to the master to
   revise the contract/brief, then re-dispatch. This is the Orrery
   "refine the spec until the cheap model succeeds" move, and the analog of the
   pipelines `gpt-5` recovery tier.

Each escalation step is recorded in the ledger so loops are visible and bounded.

## Error handling

- **Dependency not satisfied / missing input** — the apprentice reports it cannot
  start; the orchestrator holds the unit `pending` and surfaces the gap.
- **Apprentice produces malformed output** — caught by the journeyman's criteria
  check; routed through the fix loop.
- **Escalation loop bound** — a unit that has been through master-replan more than
  once is surfaced to the human rather than looped indefinitely.
- **Resumability** — the ledger records status; a re-run resumes from the first
  not-`done` unit using existing artifacts.

## Validating the skill itself

Dogfood on two real tasks before declaring done:

1. A **code-heavy** task (e.g. add a feature across a few files with tests as the
   runnable criteria).
2. A **general / non-code** task (e.g. a short multi-source research brief with
   assertional criteria).

Confirm, for each: (a) Haiku can execute purely from the brief, (b) the Sonnet
journeyman catches a deliberately planted defect, and (c) at least one escalation
tier fires correctly. Record approximate strong-model token savings vs. doing the
task entirely in the main session.

## Documented extension (not built in v1, YAGNI)

For tasks that will be **repeated** (a recurring pipeline or job), `atelier` could
run the Orrery loop: simmer a brief against a golden set until the cheap model
reliably passes, then keep that hardened brief for cheap repeated execution. This
is noted as a future capability, not part of the initial implementation.

## Non-goals

- Not a replacement for speed-run's greenfield Cerebras codegen — atelier uses
  Claude model tiers and targets general tasks.
- Not the byte-pinned rigor of `local_code_gen` — Haiku does not need it.
- v1 does not implement the repeated-task brief-hardening loop.

## Open questions for review

- Should the orchestrator cap parallel apprentices (e.g. a max fan-out) to control
  cost, or rely on the platform's subagent concurrency limits?
- Should `CONTRACT.md` and briefs be emitted to disk before any dispatch (fully
  upfront, pipelines-style) or can the master stream briefs as units become
  ready? Default: fully upfront, for auditability and a clean dependency graph.
