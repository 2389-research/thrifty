# atelier eval — results

Fill one row per (task × method) from `/status` at the end of each fresh session.
`Total $` = Session Total cost (includes subagents). `opus/sonnet/haiku $` = the
`Usage by model` rows (for atelier this is the tier split incl. subagents). "Tests" =
did the task's gate pass.

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
