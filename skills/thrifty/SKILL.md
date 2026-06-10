---
name: thrifty
description: >
  Use when the user says "thrifty", "delegate this", "tiered build", or asks to
  execute a spec cheaply. thrifty takes a spec you already have (written by hand or by
  any model — thrifty doesn't care which) and EXECUTES it for less. Orchestrates a
  tiered-delegation run: the architect (Sonnet) refines the spec into a contract that
  pins every cross-cutting decision, ONE cached Haiku executor subagent builds the whole
  ordered unit list in a single session (gate in-loop, self-fixing — not one subagent per
  unit), and Sonnet verifies/fixes only where a test can't judge. Works for code
  and non-code tasks alike. PREFER the lean dispatch flow (thrifty-dispatch) by default —
  it is the benchmarked, cheapest path; THIS subagent substrate is the richer, pricier
  fallback.
---

# thrifty — tiered delegation

> **Pick the flow first — default to dispatch.** thrifty has two execution substrates,
> and the cheap one is the default. **Before using the subagent flow described in this
> file, try the lean `thrifty-dispatch` flow** — it runs the same Sonnet-plans /
> Haiku-executes pipeline through bare `claude -p` calls (no per-subagent harness, no
> orchestrator report re-read), and is **measurably cheaper** (benchmarked: dispatch beats
> this subagent flow on every task, and the gap widens with size). Fall back to this
> subagent substrate **only when**:
> - the dispatch runtime is unavailable (`python3` not on PATH, or `claude -p` subprocesses
>   can't be spawned in this environment), **or**
> - you need per-unit **parallel** Sonnet verification, or executors need rich in-session
>   tool use *during* execution (reading the repo, running things) that bare text calls
>   can't do.
>
> If you're here purely to minimize cost on a multi-sprint build, **stop and invoke
> `thrifty-dispatch` instead.**

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
executor (Haiku, 1)      one cached agent builds the whole unit list in order,
                         gate in-loop, self-fixing (no per-unit parallelism)
        │
        ▼
gate + checker (Sonnet)  orchestrator re-runs the gate; Sonnet fixes on failure /
                         judges assertional criteria a test can't
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
| **executor** | Haiku 4.5 | dispatched subagent | **one cached agent** builds the whole ordered unit list (gate in-loop, self-fix) — not one-per-unit |
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

### Step 1 — Frame (first: confirm there's a spec to execute)
**thrifty executes a spec — it does not invent one.** Before anything else, confirm a
spec actually exists: a clear statement of *what to build* and *what "done" means*
(acceptance criteria / a gate). thrifty does the **planning** for you (decomposition into a
contract + units in Step 2) — but it needs *requirements* as input. "Spec" here means the
requirements, not a finished plan.

**If the user hasn't given a spec or a pointer to one, do NOT fabricate requirements and
start building.** Stop and tell them plainly: thrifty is for *executing* a spec cheaply, so
they need to bring one first. They're free to author it however they like — by hand, with
Opus/Gemini, or via the `brainstorming` skill — **thrifty is plan-agnostic**; it only needs
a spec to exist. Offer to help draft or brainstorm one, then re-enter thrifty once it does.
Only proceed past framing when the requirements + done-criteria are clear enough to pin
cross-unit decisions against.

Then: clarify any remaining ambiguity, and explore the relevant context (existing
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

**Decomposition mode** — how the artifact is split (the one executor builds the units in
dependency order regardless; the mode shapes the briefs + the integration step):
- **partition** — units own separate regions/files; the executor writes each in turn, you
  assemble the fragments at integration. (Default for separable outputs.)
- **relay** — one shared artifact extended segment by segment, in order, each unit picking
  up the artifact's current state.
- **layered** — role-specialized passes over the whole artifact (draft → edit → polish),
  in order.
- *Single artifact, no cross-unit seams* → degenerate plan: no `CONTRACT.md`, one
  brief, one execute, one check.

### Step 3 — Execute (default: ONE cached Haiku executor over the whole list)
**The default — and the cost-correct choice — is a single cached Haiku executor that builds
the entire unit list in one session.** Do **not** spawn one subagent per unit. Hand the one
executor the dependency-ordered list; it reads `CONTRACT.md` once and builds each unit in
turn, **reusing (caching) the contract + its own accumulating output across units**, then
runs the gate in-loop and self-fixes. It uses the same one-cached-agent *shape* as
`eval/RESULTS.md`'s cheapest architecture: one spawn's harness amortized across all units,
and **one report back** instead of N. (Measured, it's a *modest* win over one-subagent-per-unit
— the subagent flow's cost is dominated by this orchestrating session, not by executor
spawns, so it stays above the dispatch flow regardless; that's why dispatch is the default.
Pooling executors is still the right call here: simpler and no worse.) Parallelism isn't the
point — you're not fanning out for speed.

```text
Agent(
  subagent_type: general-purpose,
  model: "haiku",
  description: "thrifty execute <slug>",
  prompt: "Use the thrifty-execute skill. Working dir: docs/thrifty/<slug>/.
           Read CONTRACT.md, then build these units IN DEPENDENCY ORDER:
           UNIT-001, UNIT-002, … (read each brief in briefs/<UNIT>.md). Honor the
           contract; reuse what you've already built. After building, run the gate
           <gate cmd> and fix until it passes. Report per-unit results against each
           unit's acceptance criteria.
           FIRST LINE of your report MUST be: 'model: <the model id you are running on>'."
)
```

**Splitting the list across more than one executor — for *context*, not speed.** If the
build is too large to fit one agent's context (compaction risk), split into a few
**sequential** batches along the dependency order: each batch is its own cached agent, run
one after the next, each handed the prior batches' outputs. Relay/layered decomposition (a
shared artifact extended segment by segment) is inherently sequential and maps onto this
directly. **Never split for parallelism** — sequential cached agents are the whole point.

Mark units `executing` → `done` in the ledger as the executor reports them. The orchestrator
independently re-runs the gate in Step 4 (the executor's self-fix is not taken on trust).

**Verify the executor tier actually landed (do not assume — and do not trust self-report).**
Setting `model: "haiku"` is a *request* — a runtime may ignore it and fall back to Sonnet or
the orchestrator's own model, silently erasing the cost win (this has happened in real runs).
Verifying which model ran is harder than it looks:
- **A subagent's self-reported `model:` line is only a weak signal — it can be wrong.** A model
  asked "what model are you?" answers from priors, not from ground truth about its own runtime
  routing; under a *silent* substitution it will often still claim to be Haiku. So a self-report
  of "haiku" does **not** confirm Haiku ran. Use it only as a cheap smoke check, never as proof.
- **The authoritative signal is observed cost/usage.** Where the harness exposes per-call
  cost/tokens, a Haiku call is ~10–20× cheaper than Sonnet for the same work — that price gap
  *is* the proof (cf. the cost smoke test in `thrifty-dispatch`). A unit that cost Sonnet-money
  did not run on Haiku, whatever it reported.

Record the **observed** model only when you can corroborate it (cost/usage, or a self-report
that the cost corroborates). When you genuinely can't observe it, mark the tier **`unverified`**
in the ledger rather than writing a model you can't confirm — and compute savings conservatively.
Flag loudly any executor that demonstrably ran off Haiku. (The dispatch flow sidesteps all of
this by pinning Haiku *in code* — prefer it when cost is the priority.)

### Step 4 — Verify (tiered by criterion type — don't pay Sonnet to read passing code)
Verification matches the criterion. **A Sonnet read is expensive (~3× Haiku);
spend it only where judgment is actually needed.**

1. **Run the runnable criteria yourself first (the gate).** For each runnable
   criterion (a test/command), run it directly with Bash. This *is* the independent
   verification — you re-run rather than trust the executor's self-report, and it
   costs no model tokens. (For heavy/parallel gates you may delegate to a Haiku
   runner, but the orchestrator running a one-line command is cheapest.)

   **The gate must be the command the project actually ships with** — `npm run build`,
   `tsc -b && vite build`, `pytest`, `go build ./...`, etc. Do **not** accept a weaker
   proxy that can pass while the real build fails: e.g. a bare `tsc --noEmit` is often a
   no-op under a project-reference (`tsc -b`) setup and will report green while
   `npm run build` errors. If unsure what the project ships, read its `package.json`
   scripts / build config and gate on *that*.

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
Then report: what was built, the ledger summary, and a note on tokens/cost saved vs.
building the whole spec without delegation. **Compute that savings from the *observed*
executor models (what each unit actually ran on), never from the intended tier** — if any
executor fell back off Haiku (Step 3), the savings are lower than planned and the report
must say so. An estimate is fine; an estimate that assumes a tier that didn't run is not.

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

- **Spawning one subagent per unit.** That's the cost trap — each spawn re-pays ~40–50k
  of harness and dumps another report into the orchestrator's context (re-read every
  turn). The default is **one cached executor for the whole list**; split into *sequential*
  cached agents only when the build won't fit one context. Never fan out per unit for speed.
- **Over-specifying briefs.** Haiku is capable. Pin the *seams* (cross-unit), trust
  Haiku for the *interiors*. Byte-level pinning is for tiny local models, not this.
- **Letting the checker escalate itself.** Escalation decisions and counters live
  with you, the orchestrator, or the loop won't terminate predictably.
- **Vibes-based acceptance.** Every unit is judged against its written criteria,
  not a general sense of quality. If criteria are missing, the plan is incomplete.
- **Assuming the executor ran on Haiku.** `model: "haiku"` is a request, not a
  guarantee — verify the *observed* model per executor (Step 3) and base the cost
  report on it. A ledger that claims Haiku savings while Sonnet actually ran is wrong.
- **Gating on a no-op.** A green proxy command (e.g. `tsc --noEmit` under a `tsc -b`
  project) can pass while the real `npm run build` fails. Gate on the ship command.
- **Doing the executor's work yourself.** If you find yourself writing the unit's
  output, either the brief was wrong (fix the brief) or the task didn't need
  thrifty. Don't quietly absorb execution back into the architect session.
