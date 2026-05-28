# atelier — Tiered-Delegation Skill Family

**Date:** 2026-05-28
**Status:** Implemented (v0.1.0) and dogfooded — see "Validating the skill itself".
Spec synced with the decomposition-modes addition.

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
long as the checker verifies each unit against concrete criteria, the
executor's output is trustworthy.

## Roles and model tiers

Three functional roles, each pinned to a model tier. Names are deliberately
plain and non-hierarchical — they describe the function, not a rank.

| Role | Model | Responsibility |
|------|-------|----------------|
| **architect** | Opus 4.8 (main session) | Clarify the goal, explore context, decompose into units, write the CONTRACT (all cross-cutting decisions + dependency graph) and per-unit BRIEFs with acceptance criteria. Owns every cross-unit decision. |
| **executor** | Haiku 4.5 (parallel subagents) | Take one brief, execute it, report results against the brief's acceptance criteria. Makes only within-unit decisions. |
| **checker** | Sonnet 4.6 (subagent) | Verify each finished unit against its acceptance criteria; apply surgical fixes; route escalations. |

**Routing mechanism:** the `Agent` tool's `model` parameter (confirmed: enum
`haiku` / `sonnet` / `opus`; the Workflow `agent()` helper takes the same
`model` option). The architect is the main Opus session; it dispatches executor
subagents with `model: haiku` and checker subagents with `model: sonnet`. No
new infrastructure.

## Calibration principle

Because Haiku is genuinely capable (unlike the tiny local model
`local_code_gen` targets), briefs do **not** need byte-level pinning. The architect:

- pins **cross-unit / system-wide** decisions exhaustively (shared interfaces,
  conventions, terminology, ownership, ordering) — these are the decisions the
  executor must never have to make, and,
- writes **within-unit** steps at the level Haiku needs to succeed, trusting
  Haiku for ordinary implementation choices.

Briefs are "enough detail," not "every byte." The skill states this explicitly so
the architect does not over-specify.

## Decomposition modes

"One unit = one file" is only one way to split work. The architect chooses a
**decomposition mode** based on how cohesive the final artifact must be — how
seamlessly the pieces must read as one. The mode is recorded in `CONTRACT.md` and
governs how the orchestrator dispatches.

| Mode | Units relate by | Dispatch | Use when |
|------|-----------------|----------|----------|
| **partition** | each owns a separate region/file; architect concatenates fragments | parallel | outputs are cleanly separable — code files, doc sections, dungeon rooms, independent transforms |
| **relay** | each agent continues the *same* artifact, receiving its current state + a brief for the next segment | sequential | one flowing artifact where each part depends on the voice/flow of the previous — a prose chapter written beat by beat |
| **layered** | role-specialized *passes* over the *whole* artifact (draft → continuity edit → polish) | sequential | one seamless voice, but multiple specialized lenses applied in turn |

In all three modes the contract's job is identical — pin the *seams* (voice, POV,
character state, canon, timeline, interfaces) so the pieces/passes cohere. What
changes is whether a unit owns a *region*, a *segment*, or a *pass*, and whether
dispatch is parallel (partition) or sequential (relay, layered). For relay and
layered the dependency graph is fully linear and the artifact is edited in place,
so the integration step is a no-op (the shared artifact *is* the output). Modes can
also nest — e.g. partition a document into chapters, then relay *within* a chapter.

### The single-artifact / degenerate case

atelier's machinery exists only to keep *multiple* units consistent. If the task is
**one indivisible artifact**:

- with no need for tiering → don't use atelier; just do it.
- but you still want the cost/quality tiering → run a *degenerate plan*: **skip
  `CONTRACT.md`** (there are no cross-unit seams), write a single brief with
  acceptance criteria, dispatch one executor, one checker. You keep "Haiku drafts,
  Sonnet verifies" without the orchestration overhead.

## Skill family (4 skills)

```
atelier          orchestrator playbook (the architect runs this)
atelier-plan     architect: decompose + write CONTRACT, BRIEFs, criteria
atelier-execute  executor: execute one brief  (dispatched as Haiku subagent)
atelier-check    checker: verify + fix one unit (dispatched as Sonnet subagent)
```

`atelier-execute` and `atelier-check` carry a "do not invoke directly — dispatched
as a subagent" note, matching the simmer/speed-run convention.

## Artifacts

Persisted to `docs/atelier/<task-slug>/` so a run is auditable and resumable.

### `CONTRACT.md` — written once by the architect

The cross-unit architectural surface. Pre-answers every question that crosses a
unit boundary so no executor has to. Sections:

- **Objective** — what the whole task achieves, in 2-4 sentences.
- **Conventions** — shared decisions every unit must honor (naming, formats,
  error handling, style, tone — domain-appropriate).
- **Interfaces / contracts** — the exact shapes that cross unit boundaries
  (function signatures, data schemas, file formats, shared section structures).
- **Glossary** — terminology pinned to one meaning.
- **Ownership map** — which unit owns/creates/modifies which files or outputs.
- **Dependency graph** — `UNIT-NNN depends on [UNIT-MMM, ...]`. Drives ordering
  and parallelism.

#### The specificity rule: pin what crosses a boundary, nothing more

The single test for whether something belongs in `CONTRACT.md`: **would two
different executors, working independently, have to agree on it for their outputs
to fit together?** If yes, pin it in the contract. If it only affects the inside
of one unit, it does not go in the contract — it goes in that unit's brief (and
only to the depth Haiku needs).

For reference, `local_code_gen` produces ~430–630 line contracts that pin types
*to the byte* (every field, every error message string, Pratt binding-power
tables) because its executor is a tiny local qwen model that makes errors on any
unpinned detail. **atelier deliberately sits well below that.** Haiku does not
need division-by-zero check ordering spelled out; it needs the shared `Error`
shape and which module owns it. The contract pins the *seams*, not the *interiors*.

A useful split:

| Goes in CONTRACT.md (cross-unit) | Goes in the BRIEF (within-unit) |
|----------------------------------|----------------------------------|
| The `Error` type's shape + which unit owns it | How a given function builds and raises it |
| Shared schema / data shapes passed between units | A unit's internal data structures |
| Naming + formatting conventions all units follow | A unit's local variable names |
| File/output ownership map | A unit's internal file organization |
| Terminology fixed to one meaning | Prose phrasing inside one unit's output |
| The dependency graph + ordering | A unit's internal step order |

#### Example — code task ("add CSV export to the reports API")

```markdown
## Objective
Add a CSV export endpoint to the existing reports service. Three units:
shared serializer, the route, and the test suite.

## Conventions
- Errors: raise `ApiError(status, code, detail)` — never return raw dicts.
  (Existing class in `app/errors.py`; do not redefine.)
- New code follows the repo's existing FastAPI + Pydantic style.
- CSV uses the stdlib `csv` module, UTF-8, CRLF line endings, header row first.

## Interfaces (cross-unit)
- `serialize_report_csv(report: Report) -> str` — owned by UNIT-001, imported by
  UNIT-002. Returns the full CSV document as a string.
- Route contract (UNIT-002): `GET /reports/{id}/export.csv`
  → 200 `text/csv` body = output of `serialize_report_csv`;
  → 404 `ApiError(404, "REPORT_NOT_FOUND", ...)` if id is unknown.

## Ownership map
- UNIT-001 → `app/exporters/csv.py` (new)
- UNIT-002 → `app/routers/reports.py` (edit: add one route)
- UNIT-003 → `tests/test_csv_export.py` (new)

## Dependency graph
UNIT-001 → UNIT-002 → UNIT-003   (002 imports 001; 003 tests 002's route)
```

Note what is *absent*: how the serializer loops over rows, what its local
variables are called, the exact CSV column order beyond "header row first." Those
are within-unit and live in UNIT-001's brief — at the level Haiku needs, no more.

#### Example — non-code task ("write a 3-section market brief from these sources")

```markdown
## Objective
Produce a single market brief (intro + 3 analysis sections + conclusion) from the
5 provided sources. Each analysis section is one unit; intro/conclusion is a unit
that depends on all three.

## Conventions
- Every factual claim carries an inline citation `[S1]`–`[S5]` mapping to the
  source list. No claim without a citation.
- Voice: neutral analyst, present tense, no first person.
- Each analysis section: 250–350 words, one H2 heading, no sub-bullets.

## Interfaces (cross-unit)
- Shared source list + citation keys `[S1]`–`[S5]` (pinned in §Glossary).
- Section headings are fixed: "Demand", "Supply", "Pricing" — the conclusion unit
  references these exact titles.

## Glossary
- "the market" = the North American widget market, 2024–2025, per source S1.
- [S1]..[S5] = <the five source titles/URLs>.

## Ownership map
- UNIT-001 → "Demand" section
- UNIT-002 → "Supply" section
- UNIT-003 → "Pricing" section
- UNIT-004 → intro + conclusion (depends on 001-003)

## Dependency graph
UNIT-001, UNIT-002, UNIT-003  (independent — run in parallel)
        ↓
UNIT-004  (intro/conclusion — needs all three section drafts)
```

The contract pins the seams that make four independently-written pieces read as
one document: citation scheme, voice, exact headings, word budget, shared "market"
definition. It does *not* dictate the argument inside any section — that is the
executor's job, guided by its brief.

### `briefs/UNIT-NNN.md` — one per unit, written by the architect

- **Objective** — the single thing this unit produces.
- **Inputs / context** — exact files, data, and prior-unit outputs to read.
- **Approach** — prose steps at the level Haiku needs (not pseudocode unless the
  task is code and precision is load-bearing).
- **Constraints** — what not to touch; conventions inherited from the contract.
- **Acceptance criteria** — the checklist the checker verifies against (see
  below).
- **Dependencies** — unit ids this one depends on.

### `LEDGER.md` — status tracking

One row per unit: `id · title · deps · status · model · notes`. Status is one of
`pending` / `executing` / `checking` / `done` / `escalated`. Makes the run
resumable and gives a final audit/cost summary.

## Acceptance criteria

This is the generalization of "tests as the source of truth." Every brief ends
with a checklist of **verifiable assertions**, and the checker scores against
*that list* — never against vibes.

### How criteria are set (simmer-setup discipline)

**Inspect → infer → propose → confirm. The architect does the thinking; the user
validates. Never ask the user to describe something the architect can read.**

1. **Infer** — the architect drafts each unit's criteria from the task and context.
2. **Make concrete** — every criterion is phrased as "what done looks like" in a
   way that can be checked, not "make it good."
3. **Classify the anchor:**
   - **Runnable** (preferred when available, esp. code): a command/test the
     checker executes — e.g. `pytest passes`, `curl returns 200`,
     `build succeeds`.
   - **Assertional** (non-code): a concrete checklist — e.g. "summary covers all
     5 sources; no claim uncited; under 800 words."
4. **Propose + confirm** — the architect presents inferred criteria in one message;
   the user adjusts or overrides.
5. **Sufficiency-check skip** — if the user already stated the criteria, skip the
   proposal and use them. The user is never *forced* to author criteria, but
   always gets to veto.

Criteria become the binding contract for that unit for the rest of the run.

## Flow

1. **Frame** — architect (Opus) clarifies the goal and explores context.
2. **Plan** (`atelier-plan`) — architect chooses a decomposition mode, writes
   `CONTRACT.md`, decomposes into units with a dependency graph, and writes each
   `BRIEF` with acceptance criteria. Proposes criteria to the user (unless already
   specified). (Single-artifact tasks take the degenerate path: no contract.)
3. **Dispatch** (`atelier-execute`) — mode-dependent:
   - **partition** — for each unit whose dependencies are satisfied, dispatch a
     Haiku executor; independent units **fan out in parallel**.
   - **relay / layered** — dispatch **one unit at a time, in order**; each executor
     reads the shared artifact's current state and extends it (relay) or applies its
     pass (layered). Check each before dispatching the next so continuity errors are
     caught before they compound.
   Each executor reports results against the criteria.
4. **Check** (`atelier-check`) — as each unit finishes, a Sonnet checker
   verifies it against its acceptance criteria and applies the tiered fix loop.
5. **Integrate** — once all units pass, the architect does a final coherence pass
   (do the units fit together as a whole?). For partition this includes assembling
   the fragments; for relay/layered the artifact is already whole. Then reports
   outcome + cost summary (approximate strong-model tokens saved vs. doing
   everything in the main session).

## Tiered fix loop (escalation)

The fix loop is the part most likely to spin out of control, so control is
explicit: **the checker diagnoses and recommends, the orchestrator decides and
counts.** The checker never escalates itself — it returns a structured verdict,
and the architect/orchestrator applies bounded routing rules. This keeps one
place in charge of loop termination.

### The checker's verdict (structured)

After verifying a unit, `atelier-check` returns:

```
unit: UNIT-002
criteria:
  - id: c1  pass: true   evidence: "pytest tests/test_csv_export.py -> 4 passed"
  - id: c2  pass: false  evidence: "404 path returns raw dict, not ApiError"
overall: fail
diagnosis: execution        # one of: pass | local | execution | brief
recommended_tier: 1         # 0=none, 1=surgical, 2=redo, 3=replan
notes: "Route ignores the ApiError convention from CONTRACT §Conventions."
```

The `diagnosis` field is the routing signal:

| diagnosis | meaning | tier |
|-----------|---------|------|
| `pass` | all criteria met | 0 — mark `done` |
| `local` | small, localized defect; brief was sound | 1 — checker surgical fix |
| `execution` | unit substantially wrong but brief was sound | 2 — fresh executor redo with corrective notes |
| `brief` | criteria unachievable / contract or brief is wrong or ambiguous | 3 — architect replan |

### Tiers

1. **Checker surgical fix** — the checker (already Sonnet, already in context)
   makes small in-place corrections, then re-runs the criteria. Speed-run
   discipline: fix, don't regenerate.
2. **Executor redo** — a *fresh* Haiku executor re-runs the whole unit, with the
   original brief plus the checker's `notes` as corrective guidance.
3. **Architect replan** — the defect is in the brief or contract itself (a missing
   or wrong cross-unit decision). Bubble back to the architect to revise
   `CONTRACT.md` / the brief, then re-dispatch. This is the Orrery "refine the
   spec until the cheap model succeeds" move and the analog of the
   `local_code_gen` `gpt-5` recovery tier.

### Control rules (how the orchestrator bounds the loop)

The ledger holds per-unit counters: `surgical_n`, `redo_n`, `replan_n`. The
orchestrator applies these defaults (all overridable in the contract):

- **Tier 1 (surgical):** up to **2** surgical passes. If criteria still fail after
  2, the diagnosis is treated as at least `execution` → go to tier 2.
- **Tier 2 (redo):** up to **1** executor redo. If it still fails, escalate to
  tier 3 regardless of the checker's diagnosis (a brief that produced two failed
  executions is suspect).
- **Tier 3 (replan):** up to **1** architect replan. After one replan, if the unit
  still fails its criteria, **stop and surface to the human** with the full
  verdict history — do not loop further.
- **Regression guard (from simmer/Orrery):** before any tier-1 or tier-2 fix, the
  orchestrator snapshots the unit's outputs (git stash / file copy for code; saved
  artifact version otherwise). After the fix, the checker re-runs *all* of the
  unit's criteria. If a previously-passing criterion now fails, **roll back to the
  snapshot** and escalate one tier instead of accepting a regression.
- **Ledger logging:** every tier transition writes a row
  (`UNIT-NNN: tier 1 surgical -> still failing c2; escalate tier 2`) so the loop is
  fully visible and the run stays auditable.

### Worked trace

```
UNIT-002 executed (Haiku) -> checker: c2 fails, diagnosis=local, tier 1
  tier 1 surgical (Sonnet): edit route to raise ApiError; re-check
    -> c1,c2 pass, no regression -> mark done            [surgical_n=1]
UNIT-003 executed (Haiku) -> checker: 3 criteria fail, diagnosis=execution, tier 2
  tier 2 redo (fresh Haiku + notes) -> checker: 1 still fails, diagnosis=brief
    -> tier 3 architect replan: brief omitted the CRLF requirement; fix brief
       re-dispatch -> checker: all pass -> mark done      [redo_n=1, replan_n=1]
```

Worst case for any unit: 2 surgical + 1 redo + 1 replan, then human. The bounds
guarantee termination.

## Error handling

- **Dependency not satisfied / missing input** — the executor reports it cannot
  start; the orchestrator holds the unit `pending` and surfaces the gap.
- **Executor produces malformed output** — caught by the checker's criteria
  check; routed through the fix loop.
- **Escalation loop bound** — enforced by the fix-loop control rules above (max
  2 surgical + 1 redo + 1 replan per unit); a unit still failing after its one
  architect-replan is surfaced to the human with full verdict history rather than
  looped indefinitely.
- **Resumability** — the ledger records status; a re-run resumes from the first
  not-`done` unit using existing artifacts.

## Validating the skill itself

Dogfooded on three real tasks (artifacts captured in `examples/`), each run with
real Haiku executor + Sonnet checker subagents via the `Agent` `model` override:

1. **code-heavy** (`examples/jsonl-stats-code/`) — 3-unit Python package, partition
   mode, runnable criteria; 16 tests pass.
2. **non-code, assertional** (tool-explainer) — parallel sections + dependent
   synthesis; assembled cited document.
3. **creative writing** (`examples/saltrest-dnd/`) — 4-unit playable D&D module,
   partition mode, assertional criteria modeled on the simmer-sdk D&D rubric
   (narrative_tension, player_agency, specificity, hook_clarity).

Results against the three validation conditions:

- **(a) Haiku executes purely from the brief** — confirmed across all units.
- **(b) the checker catches defects** — confirmed both by injection (a planted
  `field_coverage` bug, caught + surgically fixed) and naturally (the D&D checkers
  caught four defects — three heading errors and a real canon contradiction — that
  every executor had self-reported as passing).
- **(c) escalation tiers fire** — tier-1 surgical fired repeatedly with the
  regression guard; a contradictory brief correctly triggered a **tier-3** `brief`
  diagnosis (checker refused to corrupt working code).

Empirical echo of the simmer-sdk D&D experiment: cheap models execute well from a
strong plan but cannot police their own cross-cutting consistency — which is
precisely what the pinned contract + independent checker tiers exist to provide.

Outstanding: a **relay-mode** validation run (both partition and degenerate paths
are exercised; relay/layered are designed but not yet dogfooded).

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

- Cap on parallel executors. **Default:** rely on the platform's subagent
  concurrency limits for v1 (no explicit cap); revisit only if cost during
  dogfooding warrants an orchestrator-level max fan-out.
- Should `CONTRACT.md` and briefs be emitted to disk before any dispatch (fully
  upfront, pipelines-style) or can the architect stream briefs as units become
  ready? Default: fully upfront, for auditability and a clean dependency graph.
