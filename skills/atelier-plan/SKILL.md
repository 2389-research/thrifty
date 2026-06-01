---
name: atelier-plan
description: >
  Planning discipline for atelier, run by the architect (Opus) itself. Decomposes
  a task into units, writes CONTRACT.md (cross-unit decisions + dependency graph),
  one self-contained BRIEF per unit with concrete acceptance criteria, and
  initializes the LEDGER. Invoked by the atelier orchestrator during the Plan step.
---

# atelier-plan — the architect's planning discipline

Your job here is to produce a plan detailed enough that cheap executors (Haiku)
can do the work to ~90% with no further decisions, and a checker (Sonnet) can
verify each piece objectively. You make every cross-unit decision **once, here**,
so no executor ever has to.

Work in this order. Persist everything to `docs/atelier/<task-slug>/`.

## 0. First: is this even an atelier job?

atelier's machinery (contract + briefs + ledger) exists **only to keep multiple
units consistent**. Before planning, check the shape of the work:

- **One indivisible artifact, no tiering wanted** → don't use atelier. Just do it.
- **One artifact, but you want the cost/quality tiering** → run a *degenerate plan*:
  **skip `CONTRACT.md`** (there are no cross-unit seams to pin), write a single
  `briefs/UNIT-001.md` with acceptance criteria, dispatch one Haiku executor, one
  Sonnet checker. You still get "Haiku drafts, Sonnet verifies" without orchestration.
- **Multiple units** → continue below.

## 1. Choose a decomposition mode

"One unit = one file" is only one way to split work. Pick the mode by asking **how
cohesive the final artifact must be** — how seamlessly the pieces must read as one.

| Mode | Units relate by | Dispatch | Use when |
|------|-----------------|----------|----------|
| **partition** | each owns a separate region/file; architect concatenates fragments | parallel | outputs are cleanly separable — code files, doc sections, dungeon rooms, independent transforms |
| **relay** | each agent continues the *same* artifact, receiving its current state + a brief for the next segment | sequential | one flowing artifact where each part depends on the voice/flow of the previous — a prose chapter written beat by beat |
| **layered** | role-specialized *passes* over the *whole* artifact (e.g. draft → continuity edit → polish) | sequential | you want one seamless voice but multiple specialized lenses applied in turn |

Default to **partition** when pieces are separable. Reach for **relay** or
**layered** when parallel fragment-writing would produce seams — drifting voice,
broken continuity, a committee-written feel. You can also mix: partition a document
into chapters, then relay *within* a chapter.

A good unit, in any mode:
- produces one coherent contribution (a region, the next segment, or one pass),
- can be executed by reading only the contract + its own brief (+ in relay/layered,
  the current artifact state),
- is small enough for one Haiku pass.

Identify the **dependencies**. In partition, independent units run in parallel. In
relay and layered, the graph is fully linear (each unit depends on the previous and
operates on the same artifact). Record the chosen mode in `CONTRACT.md`.

Prefer fewer, well-bounded units over many tiny ones — each dispatch has overhead.

## 1b. Choose a planning tier (direct vs split)

Independently of the decomposition mode, decide **who writes the per-unit briefs**.
This trades Opus output tokens (expensive) against an extra tier + a translation
boundary.

- **direct** — you (Opus) write the contract AND every brief (this skill, steps
  2–5 below). One translation boundary (you → executor). Best for **few units**,
  **subtle/high-coupling briefs**, or correctness-critical work where your judgment
  must reach the brief intact.
- **split** — you (Opus, the *director*) write the contract + a **terse unit spec**
  per unit, then **stop**. The orchestrator dispatches Sonnet `atelier-brief`
  writers (in parallel, one per unit) to expand each spec into a full brief. The
  bulky brief-writing drops to the 5×-cheaper tier and your context stays lean.
  Best for **many units (≳ 6)** with **mechanical / well-trodden briefs**, or when
  running at scale.

You may also go **hybrid**: write the 1–2 subtle units' briefs yourself and leave
the routine ones to the split tier. Record the chosen tier in `CONTRACT.md`.

**In split tier, you do steps 2 + 3-split + 5 below and STOP** (the contract, the
terse unit specs, and the ledger — *not* the full briefs). In direct tier you do
all of steps 2–5.

## 2. Write CONTRACT.md

Use `../atelier/templates/CONTRACT.template.md`. This is the cross-unit surface.

**The specificity rule — the one test for every line:**

> *Would two different executors, working independently, have to agree on this for
> their outputs to fit together?*

- **Yes** → it's a seam. Pin it in the contract.
- **No** (it only affects one unit's interior) → leave it out; it goes in that
  unit's brief, at the depth Haiku needs.

| Goes in CONTRACT.md (cross-unit) | Goes in the BRIEF (within-unit) |
|----------------------------------|----------------------------------|
| A shared type/error shape + which unit owns it | how a function builds and raises it |
| Schemas / data shapes passed between units | a unit's internal data structures |
| Naming + formatting conventions all units follow | a unit's local variable names |
| File / output ownership map | a unit's internal file organization |
| Terminology fixed to one meaning | prose phrasing inside one unit's output |
| The dependency graph + ordering | a unit's internal step order |

### Calibrate to the executor — and Haiku is strong

This is the governing principle, and it controls your token budget. The
exhaustiveness of a contract should scale **inversely with the executor's
strength**:

- `local_code_gen` writes 600-line, byte-pinned contracts (every field, a
  cross-module test on every edge, "what fails without this" on every convention)
  because its executor is a **tiny local model (qwen3.6 / gemma)** that infers
  nothing.
- **atelier's executor is Haiku — far stronger.** Haiku fills obvious fields,
  follows idiom, and handles ordinary ambiguity on its own. So **pin only what is
  both cross-unit AND genuinely ambiguous** — the few decisions where two capable
  units would otherwise diverge. Everything Haiku can reasonably infer, leave out.

Because Opus/Sonnet output tokens are the expensive part, **terseness is the goal,
not thoroughness.** When in doubt, write less and let the acceptance criteria catch
the rare miss — a cheap checker catch beats expensive over-specification on every
unit.

Two cheap habits worth keeping (they remove ambiguity without bulk):
- **Make the call on genuine forks.** Where a cross-unit decision is truly
  ambiguous, commit to one answer rather than "X or Y" — but only for decisions
  that actually cross a boundary. Don't adjudicate within-unit trivia.
- **Name shared shapes once.** Give a shared type/interface once so units agree on
  it; you need not enumerate every obvious field — Haiku fills those. Spell a field
  set out only when getting it wrong would silently break a consumer.

**Cross-module tests are an opt-in tool, not a mandate.** For most edges, pinning
the shared interface is enough for Haiku. Reach for a required cross-module test
(a named test in the consumer that feeds a *real* upstream value through the API)
only on a **genuinely fragile seam** — one where signature drift would slip past
unit-level tests. One or two across a whole project, not one per edge.

## 3-split (split tier only): Write terse UNIT-SPECS, then stop

If you chose the **split** tier, do NOT write full briefs. Instead write
`UNIT-SPECS.md` — one terse block per unit (the analog of `local_code_gen`'s
`sprint_descriptions.jsonl`) that a Sonnet brief-writer will expand. Each block:

- **id + title + objective** (1–2 sentences) and **owned files/outputs** + **deps**.
- **Symbols it defines** — by NAME (reference shared shapes in the contract; don't
  restate them).
- **Consumes** — the upstream symbols/sections it depends on.
- **Criteria-intent** — what "done" means at a high level, and any validation
  command. The brief-writer turns this into concrete tagged criteria.
- *(only if the contract pins a cross-module test for an incoming edge)* note it so
  the brief-writer surfaces it. Most units won't have one.

Keep these terse — a few lines each. The point of split tier is that *you* write
little and Sonnet expands; don't pre-write the brief here.

Use `../atelier/templates/UNIT-SPEC.template.md`. Then go to step 5 (ledger) and
stop — the orchestrator dispatches the Sonnet brief-writers. **Steps 3–4 below are
the brief-writers' job in split tier (they run `atelier-brief`); they are YOUR job
only in direct tier.**

## 3. Write one BRIEF per unit  *(direct tier)*

Use `../atelier/templates/BRIEF.template.md`. Each brief is **self-contained**: an
executor reads the contract + this brief and nothing else.

- **Approach** at the level Haiku needs — describe what to do, not every keystroke.
  Pseudocode only where a precise sequence is genuinely load-bearing.
- Name the exact inputs (paths, upstream symbols/sections) the unit consumes.
- State constraints an executor might otherwise get wrong.

## 4. Set acceptance criteria (the trust contract)

Every brief ends with concrete, checkable acceptance criteria. This is the
generalization of "tests as the source of truth" — the checker scores against this
list, never against vibes.

**Discipline (from simmer-setup): inspect → infer → propose → confirm. You do the
thinking; the user validates. Never ask the user to describe what you can read.**

1. **Infer** the criteria for each unit from the task and context.
2. **Make each concrete** — "what done looks like," not "make it good."
3. **Classify each criterion:**
   - **runnable** (preferred when available, especially code) — a command/test the
     checker executes: `pytest passes`, `curl returns 200`, `build succeeds`.
   - **assertional** (non-code) — a concrete checklist item: "covers all 5 sources;
     no claim uncited; under 800 words."
4. **Propose + confirm** — present the inferred criteria to the user in one message;
   let them adjust or override.
5. **Sufficiency-check skip** — if the user already stated the criteria, skip the
   proposal and use them. The user is never forced to author criteria, but always
   gets to veto.

Bad criterion: "the CSV export works well."
Good criteria: "(runnable) `pytest tests/test_csv_export.py` passes" + "(assertional)
output has a header row and CRLF line endings" + "(assertional) unknown id → 404
ApiError, not a raw dict."

## 5. Initialize the LEDGER

Use `../atelier/templates/LEDGER.template.md`. One row per unit, all `pending`,
counters at 0, with the dependency column filled from the graph.

## Output of this step

In `docs/atelier/<task-slug>/`:
- `CONTRACT.md` with the dependency graph and the chosen modes/tier,
- `LEDGER.md` initialized,
- **direct tier:** `briefs/UNIT-NNN.md` … one per unit, each with acceptance
  criteria (you wrote them); confirm criteria with the user unless pre-specified.
- **split tier:** `UNIT-SPECS.md` with one terse block per unit (you wrote these);
  the briefs do **not** exist yet — the orchestrator dispatches Sonnet
  `atelier-brief` writers to produce them, and criteria are confirmed after that.

Return control to the orchestrator for the dispatch phase.
