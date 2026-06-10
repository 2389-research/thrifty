# atelier eval — results

## Main findings

**atelier builds the same spec ~64% cheaper than Opus, at equal gate quality.**

The recommended architecture: **spec → Sonnet writes the contract + sprints → one cached
Haiku agent builds and self-fixes (running the gate in-loop) → a scoped Sonnet patch only
if a specific failure is left.** No Opus in the loop; no stateless dispatch script.

### Headline — full pipeline, spec → working code (apples-to-apples)

Both arms start from the **identical spec** and must reach a green gate. atelier's total
includes its own Sonnet planning; Opus's total includes its own planning. Gate-verified
independently. (Data + repro: [`../experiments/`](../experiments/README.md).)

| task | lang | atelier (Sonnet→sprints + Haiku exec) | Opus solo from spec | savings |
|------|------|---------------------------------------|---------------------|---------|
| 01-wordfreq  | JS    | $0.164 | $0.456 | 64% |
| 02-taskstore | JS    | $0.267 | $0.599 | 55% |
| 03-jqlite    | JS    | $0.263 | $0.962 | 73% |
| 04-pysummary | Py    | $0.215 | $0.395 | 46% |
| 05-brief     | prose | $0.123 | $0.271 | 55% |
| 06-ledger    | Py    | $0.366 | $0.915 | 60% |
| 07-taskgraph | Go    | $0.240 | $0.987 | 76% |
| **TOTAL**    |       | **$1.638** | **$4.584** | **64% (2.8×)** |

atelier's $1.64 = Sonnet→sprints **$0.70** + Haiku exec **$0.94** + Sonnet-fix **$0.00**.
The Sonnet-fix fallback **never fired** — the cached Haiku agent self-fixed to green on
all 7. Across framings the direction is unambiguous: executor-vs-executor on the same plan
= Haiku **67%** cheaper; full-pipeline (planning in both) = **54–64%** cheaper.

### Why this architecture (the load-bearing lessons)

1. **One cached Haiku agent beats the stateless `--bare` dispatch.** A single session
   caches the contract+harness across turns; total output collapses (Go: $0.52 dispatch →
   $0.18 agent). The stateless N-subprocess design was an *Opus-orchestrator* workaround;
   with a Haiku driver it's obsolete.
2. **The contract must pin genuinely ambiguous decisions.** Leave one open (e.g. "does
   balance-sheet equity include retained earnings?") and the executor writes *contradictory
   tests* → an unwinnable gate. Pinning it in the contract made 06 converge cleanly.
3. **Fixing is cheap only when SCOPED.** A one-shot, single-file Sonnet patch of an
   isolated bug ≈ $0.02. An open-ended "Sonnet, fix this repo" agent blew up to $1.63 and
   still failed. Never route fixing to an open-ended fix agent.
4. **Disable MCP for executors.** Headless agents inherit the global CLAUDE.md; a Haiku
   agent once posted to social media mid-build. `--strict-mcp-config --mcp-config
   '{"mcpServers":{}}'` removes the temptation (and the wasted turns).

### Honest caveats

- Cost is `total_cost_usd` from `claude -p` — a **local estimate** on subscription plans,
  noisy at single-call level (~±20%), and **n=1 per task** (variance is real). The
  *direction and magnitude* are robust; don't over-trust any single cell.
- Each arm authors its **own** tests, so "passes its own gate" isn't a perfectly level
  quality bar — Opus sometimes writes more tests (04: 17 vs 9). A shared held-out suite is
  the rigorous fix (scoped, not yet built).
- The cost win shrinks on stacks Haiku is less fluent in (largest on JS, smaller on Go),
  and amplifies with a free/local executor.
- **Prices drift.** A fresh re-measure on 2026-06-10 (see the dated block at the bottom)
  found the **Sonnet planning tier ~30–90% pricier** than these 05-29 rows, while Opus and
  Haiku-execution held stable. The win is real but narrower now (jqlite ~43% vs the 73%
  below), and the small-task crossover moved up — on trivial builds a single agent beats
  thrifty. Treat the headline figures as a *best case at the time measured*, not a constant.

---

# Detailed journey (how we got here)

Older rows use session `/status` totals; later rounds use per-call `total_cost_usd` from
`claude -p --output-format json`. The earlier verdicts (e.g. "direct wins") were corrected
as the framing tightened — read top-to-bottom as a narrative, with the **Main findings**
above as the settled conclusion.

## Experiment 1 — cost / quality

| Task | Size | Method | Total $ | opus $ | sonnet $ | haiku $ | Tests pass | Escalations | Notes |
|------|------|--------|---------|--------|----------|---------|------------|-------------|-------|
| 01-wordfreq | small | direct-opus | $0.499 | 0.499 | — | — | 18/18 ✓ | n/a | single-agent, no skills |
| 01-wordfreq | small | opus+subagents | $0.505 | 0.505 | — | — | 17/17 ✓ | n/a | **0 Task calls** — given permission, didn't delegate |
| 01-wordfreq | small | direct-sonnet | _pending_ | — | | — | | n/a | |
| 01-wordfreq | small | atelier-split | $1.856 | | | | 12/12 ✓ | 0 | full split-tier headless, 3/3 units; **3.7× direct** (small = worst case) |
| 01-wordfreq | small | atelier-dispatch | $0.624 | 0.446 (orch) | — | 0.178 (disp) | 35/35 ✓ | 0 | JSONL-dispatch headless; **3× cheaper than subagent**, ~1.25× direct; orch fixed cost dominates at small size |
| 02-taskstore | medium | direct-opus | | | — | — | | n/a | |
| 02-taskstore | medium | direct-sonnet | | — | | — | | n/a | |
| 02-taskstore | medium | atelier-split | | | | | | | |
| 03-jqlite | large | direct-opus | | | — | — | | n/a | |
| 03-jqlite | large | direct-sonnet | | — | | — | | n/a | |
| 03-jqlite | large | atelier-split | | | | | | | |

### Generality probes (vary stack/type; run once each, not on the size curve)

| Task | Type | Method | Model(s) | Total $ | Total tokens | Quality (gate) | Notes |
|------|------|--------|----------|---------|--------------|----------------|-------|
| 04-pysummary | Python code | direct-opus | opus | | | pytest | |
| 04-pysummary | Python code | atelier-split | opus+sonnet+haiku | | | pytest | |
| 05-comparison-brief | non-code | direct-opus | opus | | | checklist | |
| 05-comparison-brief | non-code | atelier-split | opus+sonnet+haiku | | | checklist | |

### Verdict (gate-verified, all on Opus, headless cold-fresh)

| size | units | direct | atelier-dispatch (orch + disp) | gap | tests |
|------|-------|--------|-------------------------------|-----|-------|
| small  (01) | 3 | $0.499 | $0.624 ($0.446 + $0.178) | 1.25× | both pass |
| medium (02) | 9 | $0.634 | $0.956 ($0.681 + $0.274) | 1.51× | both 29/29 |
| large  (03) | 9 | $0.783 | $1.165 ($0.909 + $0.255) | 1.49× | direct 50, disp 48 |
| (01 subagent-atelier, for reference) | 3 | — | $1.856 | 3.7× | 12/12 |

**Direct wins at every size; the crossover never happens.** The dispatch architecture
fixed the subagent catastrophe (3.7× → ~1.5×) but does not beat direct for this task
class. Root cause: by medium/large the **orchestrator alone costs more than direct's
entire run** ($0.68 > $0.63; $0.91 > $0.78) — it must do the same architectural
thinking as direct, expressed as a contract + N briefs (more output than direct's
code), re-read each turn; the cheap dispatch is pure addition on top.

Atelier-style tiering only pays when execution dominates planning: huge-volume
low-reasoning codegen, a FREE executor (local_code_gen wins because its executor is
$0 local qwen, not paid Haiku), context-exceeding work, or repeated runs. For
self-contained design-heavy/code-light builds at this scale: **use Opus/Sonnet
directly.** Quality was equal across methods (all gates pass), so there is no quality
offset justifying the cost.

## Experiment 2 — simmer refinement trajectory

| Round | Prompt change (ASI) | Eval subset | atelier $ (before→after) | Quality held? | Keep/rollback |
|-------|---------------------|-------------|--------------------------|---------------|---------------|
| 0 (baseline) | — | 01 (+02) | | — | — |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

Held-out check (run once at end, simmer never saw it): 03-jqlite — cost ___, tests ___.

## Task-02 architecture sweep (medium, gate-verified, all on subscription/Opus)
Testing every who-does-what configuration against direct:

| config | Opus | Sonnet | Haiku | fix | TOTAL | vs direct |
|--------|------|--------|-------|-----|-------|-----------|
| subagent split-tier        | (in 1.86) | (subagents) | (subagents) | — | $1.856 | 2.9× |
| Opus-writes-all dispatch    | ~0.68 | — | ~0.27 | — | $0.956 | 1.51× |
| thin-Opus + review (Sonnet writes contracts) | 0.349 | 0.111 | 0.254 | — | $0.713 | 1.12× |
| **architect+fire** (Opus agenda → script: Sonnet contracts → Haiku exec → fix) | 0.312 | 0.134 | 0.342 | 0.032 | $0.819 | 1.29× |
| **direct (single Opus)** | 0.634 | — | — | — | **$0.634** | 1.0× |

**Verdict:** no atelier config beats direct for self-contained, design-light code at
this scale. Two floors make it structural: (1) Opus *architecting* alone ≈ half of
direct (~$0.31 — a minimal Opus session's baseline context re-read over a few turns is
irreducible); (2) the script's PAID tier calls add ~$0.5 on top. Opus-architect +
paid-script ≈ $0.7–0.8 > direct $0.63.

**The swing factor is the executor's price.** Haiku execution is ~40% of the total.
local_code_gen beats direct because its executor is FREE local qwen ($0); with a free
executor this run would be ~$0.44 < direct. So tiered delegation pays when: the
executor is free/near-free (local model), execution volume dwarfs the Opus-architect
floor, or work is repeated / exceeds one context. For paid-Haiku small builds: use
Opus/Sonnet directly.

## CORRECTED FRAMING — execution-only (planning is a shared/sunk cost)

Realistic usage: the plan is worked out WITH Opus in the normal session (sunk cost,
incurred either way), then atelier *executes* it. So the fair benchmark hands the
SAME plan to both arms and compares only execution. (The earlier "direct wins" tables
wrongly charged atelier for planning-from-scratch.)

Task 02, identical Sonnet-written contract+units handed to both, gate-verified:

| (planning excluded) | execution cost | tests |
|---------------------|----------------|-------|
| **atelier** (Haiku executes the units) | **$0.240** | 24/24 |
| **direct** (Opus implements the plan)  | $0.391 | 21/21 |

**atelier ~39% cheaper (1.6×) at equal quality** — the honest verdict for atelier as
an EXECUTION engine. (direct-from-plan $0.391 is itself well below direct-from-spec
$0.634 — handing Opus the plan saved its figuring-out; fair, and atelier still wins.)

Caveats: (1) win assumes the handoff includes per-unit chunking; if atelier must chunk
at exec time (+~$0.13 Sonnet) it's ~a tie. (2) cost noise is real (Haiku exec varied
$0.24–0.34); direction solid, magnitude noisy — run 2–3× for a firm number. (3) win
amplifies with execution volume and especially a FREE local executor (atelier-exec ~$0).

### Confirmation run — 02 + 03 across the size curve (2026-05-29)

Same protocol, fresh: one Sonnet plan per task handed identically to both arms;
atelier = `dispatch.py` execute (Haiku), direct = Opus implements the plan headless;
both gate-verified externally with `node --test`. (Planning excluded from both —
task 03's shared plan cost $0.151 of Sonnet, incurred either way.)

| task | size | units | atelier (Haiku) | direct (Opus) | atelier savings | quality |
|------|------|-------|-----------------|---------------|-----------------|---------|
| 02-taskstore | medium |  9 | **$0.240** | $0.376 | **36% (1.57×)** | 24/24 vs 21/21 — both green |
| 03-jqlite    | large  | 12 | **$0.262** | $0.667 | **61% (2.54×)** | 41/41 vs 45/45 — both green |

**The win amplifies with execution volume, as predicted.** At medium it's ~36%; at
large it's ~61% (1.57× → 2.54×). Direct's cost climbs with the build (more code = more
Opus output, $0.376 → $0.667) while atelier's Haiku execution stays nearly flat
($0.240 → $0.262) — the cheap tier absorbs volume cheaply. Reproducibility is good on
the atelier side (02 Haiku exec hit $0.240 again, identical to the first corrected run;
direct $0.376 vs the earlier $0.391, within noise). Both arms pass their gates at every
size — equal quality, no offset.

**Settled headline:** as an execution engine for an already-made plan, atelier is
~35–60% cheaper than Opus-execution at equal quality, and the gap widens with build
size. (Still paid-Haiku; a free local executor would push both rows toward ~$0 exec.)

### FULL SUITE — all 5 tasks, execution-only (2026-05-29)

Every task: one Sonnet plan (contract+units) handed identically to both arms; atelier =
`dispatch.py` execute on the cheap tier, direct = Opus implements the same plan headless;
both gate-verified externally. Planning excluded from both (shared/sunk). Plan costs
were 01 $0.038, 02 ≈$0.11 (from a prior session), 03 $0.151, 04 $0.061, 05 $0.026 of Sonnet — paid either way.

| task | size/type | atelier (cheap tier) | direct (Opus) | savings | quality |
|------|-----------|----------------------|---------------|---------|---------|
| 01-wordfreq  | small JS   | $0.185 | $0.276 | 33% (1.49×) | 9/9 vs 9/9 — both green |
| 02-taskstore | medium JS  | $0.240 | $0.376 | 36% (1.57×) | 24/24 vs 21/21 — both green |
| 03-jqlite    | large JS   | $0.262 | $0.667 | 61% (2.54×) | 41/41 vs 45/45 — both green |
| 04-pysummary | Python     | $0.341 | $0.373 |  8% (1.09×) | 11/11 vs 11/11 — both green |
| 05-brief     | non-code   | $0.103 | $0.286 | 64% (2.77×) | both meet checklist |
| **TOTAL**    |            | **$1.131** | **$1.978** | **43% (1.75×)** | equal quality |

**Atelier wins on all 5, ~43% cheaper overall at equal quality.** Findings:
- **The win scales with build volume** (small 33% → large 61%): direct's Opus cost climbs
  with output ($0.28→$0.67) while the cheap tier stays nearly flat ($0.18→$0.26).
- **Python (04) is the thinnest win (8%)** — the honest cross-language caveat. Haiku's
  Python exec was the priciest execution ($0.304) AND it shipped a brittle CLI test
  (hardcoded `python`, not `sys.executable`) needing one cheap Sonnet fix (+$0.038);
  meanwhile Opus implemented the Python plan cheaply (9 turns, $0.373). Haiku's edge is
  real but narrower outside its strongest (JS) idiom.
- **Non-code (05) is the biggest win (64%)** — a bare-Sonnet call writes the one-page
  brief for $0.103 vs Opus's $0.286. Small quality offset: atelier's brief met every
  measurable criterion (3 sections in the 60–110 band, citations, 4 decision bullets,
  neutral voice) but didn't *label* its TL;DR paragraph; direct's was cleaner. Gate met
  by both; direct marginally higher polish.
- **Quality is equal across the runnable gates** (all green); the only quality gap is the
  cosmetic 05 TL;DR label. No quality offset justifies paying Opus to execute.

**Conclusion:** the execution-only verdict is now firm across size *and* stack *and*
code/non-code: atelier-as-execution-engine is cheaper than Opus-execution at equal
quality on every task tried, ~43% overall, widening with volume — with paid Haiku. The
two honest asterisks: (1) thinner on Python, (2) one-shot prose may need a polish pass.

### COMPLEXITY × LANGUAGE — is the thin Python win about size or language? (2026-05-29)

Added two large, multi-module tasks to disambiguate: **06-ledger** (jqlite-scale Python,
double-entry bookkeeping, 5 modules + domain invariants, 13 units) and **07-taskgraph**
(Go module, DAG scheduler — topo sort, wave scheduling, critical path, 12 units). Same
execution-only protocol; both gate-verified (`pytest`, `go test ./...`).

| task | lang | size | haiku-exec | atelier total | direct (Opus) | savings | quality |
|------|------|------|-----------|---------------|---------------|---------|---------|
| 03-jqlite    | JS | large | $0.262 | $0.262 | $0.667 | **61%** | 41 vs 45 ✓ |
| 06-ledger    | Py | large | $0.443 | $0.467¹ | $0.561 | **17%** | 31 vs 25 ✓ |
| 07-taskgraph | Go | large | $0.517 | $0.517 | $0.550 | **6%**  | both ✓ (Haiku clean one-shot) |

¹ +$0.024 cheap Sonnet fix for the same brittle CLI test (`["python", ...]` hardcoded,
not `sys.executable`) — Haiku's recurring Python habit, also seen on 04.

**Answer: it's BOTH, but language dominates.** Scaling Python small→large widened the
win (04 small 8% → 06 large 17%), so size is real. But at *equal* (large) size the win
is wildly language-dependent: **JS 61%, Python 17%, Go 6%.**

**Mechanism — Opus execution cost is roughly flat across languages; Haiku's is not.**
Opus does a large build for ~$0.55–0.67 regardless of stack. Haiku's exec cost *swings
by language*: $0.262 (JS) → $0.443 (Py) → $0.517 (Go) for comparable size. Per unit,
Haiku costs ~1.7× (Py) and ~2× (Go) what it does on JS — it burns far more tokens being
less fluent outside its strongest idiom. The win collapses not because Opus gets cheaper
but because **Haiku gets expensive off-JS**, approaching Opus's price (Go: $0.517 vs
$0.550 — nearly a wash). Confirmed by the raw exec column: Haiku's *small* Python task
(04, $0.304) cost more than its *large* JS task (03, $0.262).

Quality held everywhere (all gates green); notably Haiku wrote **correct multi-package
Go one-shot** (07) — the fluency tax is on *tokens/cost*, not correctness here.

**Practical rule:** atelier's cost win is largest on JS, modest on Python, marginal on
Go. The lever remains the executor's price/fluency — which is exactly why a FREE local
executor (next experiment) matters more than squeezing paid Haiku: it removes the
language-dependent Haiku tax entirely.

### ARCHITECTURE — single Haiku agent vs stateless dispatch (2026-05-29)

Hypothesis (from the user): now that Opus is removed from execution, the original reason
for the stateless N-subprocess dispatch (avoid the *Opus* orchestrator re-reading context
every turn) is gone. So just let **one persistent Haiku agent** iterate the Sonnet-made
unit list and build files one by one — it caches the contract+harness across turns and
runs its own gate. Tested on 06/07, same Sonnet plan, gate-verified:

| task | Opus direct | stateless dispatch | **1 Haiku agent** | agent turns / cache_read |
|------|------------|--------------------|--------------------|--------------------------|
| 06-ledger (Py)    | $0.561 | $0.467 (+ ext. fix) | **$0.531** | 41 turns / 2.17M cached — 30/30, **self-fixed** the brittle CLI test |
| 07-taskgraph (Go) | $0.550 | $0.517              | **$0.347** | 25 turns / 1.08M cached — pass, no fix |

**The hypothesis holds.** The single Haiku agent:
- **Caches the contract+harness** (cache_read 1–2M reused across turns) — the stateless
  dispatch's fatal `cache_read: 0` is solved. Total output collapses (07: 11.7k vs the
  dispatch's ~100k across 12 cold, thinking-heavy calls) → **33% cheaper than dispatch on
  Go, 37% under Opus.**
- **Is autonomous** — it runs its own `pytest`/`go test` and fixes failures in-session.
  On Python it *self-corrected* the `["python", ...]`→`sys.executable` test with no
  external Sonnet fix step (the dispatch needs an orchestrator to gate+fix).
- **Is far simpler** — no script, no `<FILE>` parsing, no manual fix loop. Two calls:
  Sonnet plans, Haiku builds-and-verifies.

Caveat: cost tracks **turn count**. Go converged in 25 turns ($0.347, big win); Python
took 41 turns of iteration ($0.531, slightly *above* the dispatch's $0.467 but fully
autonomous and gate-closed). So the single-agent wins outright when the build converges
fast, and ties/loses slightly on cost when it has to debug a lot — but always wins on
simplicity + autonomy. n=1 each; variance is real.

**Takeaway:** removing Opus from execution dissolves the case for the stateless-dispatch
complexity. The simplest architecture — *Sonnet writes the list, one cached Haiku agent
builds and self-verifies it* — is cheaper (Go) or comparable+autonomous (Python), and is
the recommended shape going forward. The `--bare` stateless dispatch was an
Opus-orchestrator workaround; with a Haiku driver, a normal cached agent session is better.

### ARCHITECTURE 2 — "Haiku builds, Sonnet fixes" (a tested NEGATIVE result) (2026-05-29)

Hypothesis (user): Haiku thrashes at debugging (06 self-fix = 12 edits + 7 test runs),
so split it: Haiku **builds only** (no test loop), then a **Sonnet agent tests + fixes
strategically**. Sounds clean. Tested on 06/07 (MCP hard-disabled so no social-media
side-quests). Four-way comparison, all from the same Sonnet plan:

| 06-ledger (Python) | cost | gate |
|--------------------|------|------|
| stateless dispatch + **scoped** one-shot Sonnet fix | $0.467 | 31/31 ✓ |
| single Haiku agent (builds + self-fixes)            | $0.531 | 30/30 ✓ |
| Opus direct                                          | $0.561 | 25/25 ✓ |
| **Haiku-build + open-ended Sonnet-fix agent**        | **$1.825** | **33/34 ✗ still failing** |

| 07-taskgraph (Go) | cost | gate |
|-------------------|------|------|
| single Haiku agent (builds + self-fixes) | $0.347 | ✓ |
| **Haiku-build + Sonnet-fix**             | $0.429 | ✓ |
| stateless dispatch                        | $0.517 | ✓ |
| Opus direct                               | $0.550 | ✓ |

**The proposed split was the WORST option on both** — most expensive on Go, and on Python
it cost **$1.83 and didn't even converge** (Sonnet ran 26 turns and left a real
balance-sheet logic bug). Why:

- **An open-ended "Sonnet, go fix this codebase" agent is the expensive trap.** Sonnet
  must cold-comprehend a multi-module codebase it didn't write, then agentically debug at
  Sonnet rates over many turns. On a genuine cross-module logic bug (06's balance-sheet
  totals) it burned $1.63 and *still failed*. The model that wrote the code (the single
  Haiku agent) fixes its own output far cheaper because it already has it in context.
- **The cheap Sonnet-fix win is real but ONLY when SCOPED.** The dispatch's $0.024 fix
  worked because it was a one-shot, single-file, tightly-targeted fix of an *isolated
  trivial* bug (the brittle `["python"]` CLI test). Hand Sonnet the failing file + a tight
  prompt → $0.024. Hand Sonnet the whole repo + "iterate until green" → $1.63.
- **On Go the split lost too** ($0.43 > $0.347): the only bug was one unused import; a
  full Sonnet session to delete one line is gross overkill.

**Refined lesson (this overturns the naive split):** "Haiku is bad at fixing" is true, but
"hand it to an open-ended Sonnet agent" is *worse*. What actually wins:
1. **Single Haiku agent that builds AND self-fixes** — cheapest when the build converges
   and failures are self-correctable (Go $0.347; Python $0.531).
2. **Generation + a TIGHTLY-SCOPED one-shot fix** for isolated trivial failures ($0.024).

The fixer's cost is governed by the *nature of the failure* and the *scope of the fix
task*, not by which model fixes. Trivial+isolated → scoped one-shot (cheap). Genuine
multi-module logic bug → expensive for anyone, and an open-ended agent blows up. Do NOT
route all fixing to an open-ended Sonnet session.

### DEFINITIVE — single Haiku agent (build + self-fix) vs Opus, ALL 7 tasks (2026-05-29)

The winning architecture run clean across the whole suite: Sonnet writes the plan once
(shared), then **one cached Haiku agent builds + runs the gate + self-fixes in a single
session**, MCP hard-disabled (no social-media detours). Compared to Opus implementing the
same plan. All gate-verified externally.

| task | lang | 1 Haiku agent | Opus direct | savings | quality |
|------|------|---------------|-------------|---------|---------|
| 01-wordfreq  | JS    | $0.077 | $0.276 | 72% (3.6×) | 9/9 vs 9/9 |
| 02-taskstore | JS    | $0.091 | $0.376 | 76% (4.1×) | 22/22 vs 21/21 |
| 03-jqlite    | JS    | $0.308 | $0.462 | 33% (1.5×) | 41/41 vs 42/42 |
| 04-pysummary | Py    | $0.120 | $0.373 | 68% (3.1×) | 11/11 vs 11/11 |
| 05-brief     | prose | $0.075 | $0.286 | 74% (3.8×) | both pass checklist |
| 06-ledger    | Py    | $0.281 | $0.561 | 50% (2.0×) | 30/30 vs 25/25 |
| 07-taskgraph | Go    | $0.184 | $0.550 | 67% (3.0×) | both pass |
| **TOTAL**    |       | **$1.136** | **$2.884** | **61% (2.54×)** | all gates green |

**The single cached Haiku agent beats Opus on every task, ~61% cheaper overall at equal
quality.** This is the strongest, cleanest result of the whole investigation, and it
dwarfs the original `--bare` stateless dispatch numbers. Two changes drove the jump:

1. **Caching (one session instead of N cold subprocesses).** The contract+harness is
   cached and reused across turns; total output collapses. Go went from $0.517 (dispatch)
   → **$0.184** (3× cheaper) — the language gap that capped Go/Python *closed*, because
   the cold-call output bloat (the per-call thinking re-spend) is gone.
2. **MCP disabled = no off-task waste.** The earlier non-clean single-agent runs (07
   $0.347, 06 $0.531) were inflated by social-media side-quests inherited from the global
   CLAUDE.md. Clean, they're $0.184 / $0.281 — roughly half. (This also retroactively means
   the "language tax" we measured on the stateless dispatch was partly cold-call thinking,
   not pure idiom: a cached agent erases most of it.)

Quality note: Haiku met or exceeded Opus's gate on every task (it writes *more* tests in
several cases and all pass). The earlier Python "thrash" / logic-bug failures did not
recur here — 06 self-corrected to 30/30. Variance is real (n=1), but the direction and
magnitude are unambiguous.

**Final architecture for atelier:** Sonnet writes the unit list → one cached Haiku agent
builds and self-verifies it (MCP off, gate in-loop). Cheaper than Opus by 33–76% per task
(~61% overall) at equal quality, across JS / Python / Go / prose. Escalate to a *scoped*
one-shot Sonnet fix only for a specific stubborn failure — never an open-ended fix agent.

---

## 2026-06-10 — fresh three-way re-measure (Opus / dispatch / subagent) + planning-cost drift

Re-ran the full pipeline on two tasks to (a) get fresh Opus *and* both thrifty flows on the
same specs in one sitting, and (b) check the recorded numbers ~2 weeks on. All measured via
`claude -p --output-format json` (`total_cost_usd`), MCP disabled, every arm gate-verified
(`node --test`). Earlier rows above are left intact; this is an append, not a revision.

| task | size | Opus full CC | dispatch (Sonnet plan + bare Haiku) | subagent (aggregate orch+subagents) | cheapest |
|------|------|--------------|--------------------------------------|--------------------------------------|----------|
| fibkit       | small (393 LOC, 14 units) | **$0.374** | $0.448 | $0.544¹ | **Opus** |
| 03-jqlite    | large (~560 LOC, 5 modules, 12 units) | $0.880 | **$0.497** | $0.753 | **dispatch** |

¹ subagent runs were per-unit dispatch (fibkit $0.544; jqlite $0.753, 7 units). Both gate-PASS; the jqlite
subagent LEDGER recorded all 7 executors on `claude-haiku-4-5` (the model override landed
this run — it's environment-dependent, which is why the flow now *verifies* rather than assumes).

**Findings:**
1. **Crossover confirmed fresh.** Simple task → a single Opus agent is cheapest (thrifty's
   fixed planning toll doesn't amortize). Large task → both thrifty flows beat Opus, dispatch
   by ~43%. Scaling simple→large: **Opus +135%** ($0.374→$0.880), **subagent +38%**, **dispatch
   +11%** — the cheap tier absorbs volume nearly flat while the strong single agent's cost balloons.
2. **Dispatch < subagent on both,** and the gap widens with unit count (+21% → +51%) — the
   per-spawn harness + orchestrator report re-read. (Motivates the cached-pool enhancement, issue #9.)
3. **Planning-cost drift.** dispatch jqlite was **$0.263 recorded (05-29) → $0.497 now**, almost
   entirely the **Sonnet planning** line (jqlite plan $0.137 → $0.278); Haiku execution
   ($0.21–0.22) and Opus ($0.88 vs recorded $0.96) held stable. So the win narrowed from ~73%
   to ~43% on jqlite — still decisive on large builds, but the "~64%" headline is now a
   best-case-at-time-of-measure figure, and the small-task crossover moved up.

**Takeaway unchanged in direction, updated in magnitude:** use dispatch by default; thrifty
pays on large/multi-unit builds and loses to a single agent on trivial ones; watch the Sonnet
planning tier, which is the volatile cost. (n=1, ±20% noise — directional, not precise.)
