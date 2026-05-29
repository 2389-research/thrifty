# atelier eval — results

Fill one row per (task × method). Get `$` and tokens from `/cost` at the end of each
fresh session (includes subagents). "Tests" = did the task's `node --test` gate pass.

## Experiment 1 — cost / quality

| Task | Size | Method | Model(s) | Total $ | Total tokens | In/Out split | Tests pass | Escalations | Notes |
|------|------|--------|----------|---------|--------------|--------------|------------|-------------|-------|
| 01-wordfreq | small | direct-opus | opus | | | | | n/a | |
| 01-wordfreq | small | direct-sonnet | sonnet | | | | | n/a | |
| 01-wordfreq | small | atelier-split | opus+sonnet+haiku | | | | | | |
| 02-taskstore | medium | direct-opus | opus | | | | | n/a | |
| 02-taskstore | medium | direct-sonnet | sonnet | | | | | n/a | |
| 02-taskstore | medium | atelier-split | opus+sonnet+haiku | | | | | | |
| 03-jqlite | large | direct-opus | opus | | | | | n/a | |
| 03-jqlite | large | direct-sonnet | sonnet | | | | | n/a | |
| 03-jqlite | large | atelier-split | opus+sonnet+haiku | | | | | | |

### Read-out (fill after the table)
- atelier-split vs direct-opus, $ by size: small ___% · medium ___% · large ___%
- atelier-split vs direct-sonnet (the honest bar), $ by size: ___ / ___ / ___
- Does the win grow with size? (the core hypothesis): __________
- Any quality gaps (tasks where a method failed tests): __________

## Experiment 2 — simmer refinement trajectory

| Round | Prompt change (ASI) | Eval subset | atelier $ (before→after) | Quality held? | Keep/rollback |
|-------|---------------------|-------------|--------------------------|---------------|---------------|
| 0 (baseline) | — | 01 (+02) | | — | — |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

Held-out check (run once at end, simmer never saw it): 03-jqlite — cost ___, tests ___.
