# Ledger — Asteroids

Working dir: `docs/atelier/asteroids/`   Project root: `/tmp/atelier-asteroids`   Mode: partition

## Units

| Unit | Title | Deps | Status | surgical_n | redo_n | replan_n | Notes |
|------|-------|------|--------|-----------|--------|----------|-------|
| UNIT-001 | constants + vector | none | done | 0 | 0 | 0 | checker pass, 14 tests |
| UNIT-002 | entities + physics | UNIT-001 | done | 0 | 0 | 0 | checker pass, 21 tests |
| UNIT-003 | collision | UNIT-001, UNIT-002 | done | 0 | 0 | 0 | checker pass, 12 tests |
| UNIT-004 | scoring + leaderboard | none | done | 0 | 0 | 0 | checker pass, 9 tests |
| UNIT-005 | particle effects | UNIT-001 | done | 0 | 0 | 0 | checker pass, 7 tests |
| UNIT-006 | input + render | UNIT-002, UNIT-004, UNIT-005 | done | 0 | 0 | 0 | checker pass, syntax clean |
| UNIT-007 | game loop + glue + page | UNIT-001..006 | done | 0 | 0 | 0 | checker pass, full 66-test suite green |

Status ∈ pending · executing · checking · done · escalated

## Dispatch waves (partition; parallel within a wave)
- Wave 1: UNIT-001, UNIT-004
- Wave 2: UNIT-002, UNIT-005
- Wave 3: UNIT-003, UNIT-006
- Wave 4: UNIT-007

## Fix-loop log
- All 7 units: executor pass(self) -> independent Sonnet checker re-ran node --test/--check -> pass. Zero escalations.
- Wave 1 (UNIT-001, UNIT-004) parallel; Wave 2 (002, 005) parallel; Wave 3 (003, 006) parallel; Wave 4 (007).

## Run summary
- Units: 7/7 done. ~14 files. Full suite: 66 tests pass. All src/*.js syntax-clean.
- Architect integration pass: removed a duplicate DOMContentLoaded registration in main.js (coherence cleanup); headless smoke confirmed createGame + update + collision/split run end-to-end.
- Escalations: 0 surgical · 0 redo · 0 replan · 0 to human (clean across all 7 units — the pinned interfaces let parallel Haiku modules compose without integration breakage).
- Division of labor: Opus planned + integrated; Haiku wrote all 14 files; Sonnet verified every unit.
