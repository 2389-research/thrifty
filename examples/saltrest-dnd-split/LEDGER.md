# Ledger — The Bones of Saltrest (SPLIT tier)

Working dir: `docs/atelier/saltrest/`   Mode: partition · **tier: split**

## Units

| Unit | Title | Deps | Status | Notes |
|------|-------|------|--------|-------|
| UNIT-001 | The Hook | none | done | Sonnet brief → Haiku exec → Sonnet check: caught invented NPC "old Torvin" → surgical fix → pass |
| UNIT-002 | Cast & Factions | none | done | Sonnet brief → Haiku exec → Sonnet check: caught Coria mislabel "(Neutral)" → "(Ally)" → pass |
| UNIT-003 | Kelpwater Cove + clock | none | done | Sonnet brief (clock detailed, rooms terse) → Haiku exec → Sonnet check: trimmed over-length; clock numbers verified vs contract → pass |
| UNIT-004 | Resolution | 001,002,003 | done | Sonnet brief → Haiku exec (read deps) → Sonnet check: clean pass; clock 5/10 + DC 15 match dungeon.md verbatim |

## Pipeline (split tier)
1. **Director (Opus)** wrote a LEAN canon contract + terse `UNIT-SPECS.md`.
2. **Brief-writers (Sonnet ×4, parallel)** expanded specs — calibrated detail
   (clock spelled out, prose terse), proactively added "no new named chars / no stat
   blocks" constraints, 0 escalations.
3. **Executors (Haiku ×4)** — 001/002/003 parallel, then 004 (read the 3 deps).
4. **Verify (adaptive):** all criteria assertional → **Sonnet checkers read & judged**
   (correct spend for prose). Caught 3 real defects (invented NPC, role mislabel,
   over-length), all tier-1 surgical, 0 redo/replan.

## Run summary
- Assembled `ADVENTURE.md` (~1,610 words, playable). Cross-unit canon held: clock
  numbers consistent dungeon↔resolution; Coria mercy framing consistent.
- Verification-model spend: full Sonnet reads (justified — assertional path).
- Contrast with code run: same split planning tier, but verify diverged by criterion
  type — gates-only for code, full reads for prose. Adaptive verify working both ways.
