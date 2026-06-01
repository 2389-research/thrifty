# Ledger — jsonl-stats (SPLIT tier)

Working dir: `docs/atelier/jsonl-stats/`   Mode: partition · **tier: split**

## Units

| Unit | Title | Deps | Status | Notes |
|------|-------|------|--------|-------|
| UNIT-001 | stats core | none | done | Sonnet brief → Haiku exec → gate (9 tests) run by orchestrator → pass |
| UNIT-002 | fixture | none | done | Sonnet brief → Haiku exec → gate (7 valid records) → pass |
| UNIT-003 | CLI | 001, 002 | done | Sonnet brief → Haiku exec → gate (3 cli tests, exit codes) → pass |

## Pipeline (split tier)
1. **Director (Opus)** wrote a LEAN contract (~200 words, vs ~1150 for the direct
   asteroids run) + terse `UNIT-SPECS.md`.
2. **Brief-writers (Sonnet ×3, parallel)** expanded the specs into full briefs —
   terse approaches, contract-referenced seams, 0 escalations.
3. **Executors (Haiku ×3)** — 001+002 parallel, then 003.
4. **Verify (adaptive):** all criteria runnable → **orchestrator ran the gates
   itself; ZERO Sonnet checkers dispatched.**

## Run summary
- Full suite: **12 tests pass**; CLI prints report (count 7); missing file exits 1.
- Verification-model spend: **0** (gate-only path — the adaptive-verify win).
- Brief-writing moved off Opus to Sonnet (split tier). Contract stayed lean (Haiku
  is strong). Parallel modules composed with no integration breakage.
