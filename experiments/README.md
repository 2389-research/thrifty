# atelier experiments

Cost/quality experiments behind the headline claim: **atelier (Sonnet writes sprints →
Haiku executes) builds the same spec ~64% cheaper than Opus solo, at equal gate quality.**

See [`../eval/RESULTS.md`](../eval/RESULTS.md) for the full write-up and the journey
(the architectures we tried and rejected). This dir holds the reproducible scripts +
captured cost data for the final, clean comparison.

## Methodology

- **Cost** = the `total_cost_usd` field that `claude -p --output-format json` self-reports
  for each call, summed across phases. On a **subscription plan this is a local estimate**
  (token-usage × model rates), not an invoice — directionally solid, noisy at the
  single-call level (~±20%). It is *not* a separate billing feed.
- **Quality** = the task's gate (`node --test` / `pytest` / `go test ./...`, or the
  prose checklist for 05), re-run **independently** after each round — never the run's
  self-report.
- **Fairness**: both arms start from the **same spec** (`../eval/tasks/*.md`) and must
  reach a green gate. MCP is hard-disabled (`--strict-mcp-config --mcp-config
  '{"mcpServers":{}}'`) so agents can't drift onto inherited tools (a Haiku agent once
  posted to social media mid-run because of a global CLAUDE.md instruction).
- **Caveat on the gate**: each arm authors its *own* tests, so "passes its own suite"
  isn't a perfectly level bar — Opus sometimes writes more tests (e.g. 04: 17 vs 9). A
  held-out shared suite is the rigorous fix (scoped, not yet built).

## The headline round (apples-to-apples, spec → working code)

`data/headline.csv` — both from the same spec, gate-verified:

| | atelier (Sonnet→sprints + Haiku exec) | Opus solo from spec |
|---|---|---|
| total (7 tasks) | **$1.64** | **$4.58** |
| | | **→ atelier 64% cheaper (2.8×)** |

Reproduce:
```text
bash scripts/run_atelier_flow.sh     /tmp/atelier_flow      # data/atelier_flow.csv
bash scripts/run_opus_from_spec.sh   /tmp/opus_from_spec    # data/opus_from_spec.csv
# then re-verify every gate by hand (cd into each task dir, run its gate)
```

### Per-phase breakdown (atelier flow, `data/atelier_flow.csv`)
Sonnet→sprints **$0.70** + Haiku exec **$0.94** + Sonnet-fix **$0.00** = **$1.64**.
The Sonnet-fix fallback **never fired** — the single cached Haiku agent self-fixed to
green on all 7. In practice the flow is just *Sonnet-plans → Haiku-executes-and-self-fixes*.

## What else is in `data/`
- `atelier_flow.csv` — per-phase cost (plan / haiku / fix) + gate, per task.
- `opus_from_spec.csv` — Opus-solo cost + turns + gate, per task.
- `headline.csv` — the side-by-side savings table.

## Rounds we ran to get here (full detail in `../eval/RESULTS.md`)
1. **Execution-only** (same plan to both, exclude planning): Haiku executor ~67% < Opus.
2. **Complexity × language** (JS/Py/Go large builds): win is largest on JS, holds on Py/Go.
3. **Architecture bake-off**: stateless `--bare` dispatch vs single cached Haiku agent vs
   Haiku-build→open-ended-Sonnet-fix. Winner: **single cached Haiku agent** (caching kills
   the cold-call output bloat). The open-ended-Sonnet-fix variant *lost* ($1.83, didn't
   converge) — fixing is cheap only when **scoped**, and contracts must **pin ambiguous
   decisions** or the executor writes contradictory tests.
4. **This round**: full pipeline, spec → code, both arms — the 64% headline.
