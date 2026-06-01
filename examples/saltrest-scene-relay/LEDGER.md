# Ledger — The Tide at Saltrest (relay scene)

Working dir: `docs/atelier/saltrest-scene/`   Mode: **relay** (one shared SCENE.md)

## Units

| Unit | Title | Deps | Status | surgical_n | redo_n | replan_n | Notes |
|------|-------|------|--------|-----------|--------|----------|-------|
| UNIT-001 | Beat 1 — Dawn dread | none | done | 0 | 0 | 0 | checker pass, clean handoff |
| UNIT-002 | Beat 2 — The catch | UNIT-001 | done | 1 | 0 | 0 | checker caught forbidden names Kess/Tam -> surgical anonymize |
| UNIT-003 | Beat 3 — The strangers | UNIT-002 | done | 0 | 0 | 0 | checker pass, clean |
| UNIT-004 | Beat 4 — The hook | UNIT-003 | done | 1 | 0 | 0 | checker trimmed 342->270 words (over cap) |

Status ∈ pending · executing · checking · done · escalated
Relay rule: dispatch ONE unit at a time, check before dispatching the next.

## Fix-loop log
- UNIT-001: executor pass -> checker pass -> done
- UNIT-002: executor pass(self) -> checker caught 2 forbidden named chars (Kess, Tam) -> tier1 surgical (anonymized to "the eldest fisherman"/"his mate") -> pass. Drift caught BEFORE Beat 3 could build on it.
- UNIT-003: executor pass(self) -> checker pass (villagers kept anonymous) -> done
- UNIT-004: executor pass(self, ran long) -> checker caught 342>280-word cap -> tier1 surgical trim to 270 -> pass

## Run summary
- Units: 4/4 done. Shared artifact SCENE.md = one continuous ~1,012-word scene (relay; no assembly step).
- Escalations: 2 surgical (forbidden names; over-length) · 0 redo · 0 replan · 0 to human.
- Relay validation: single voice/POV held across 4 sequential Haiku writers, each seeing only scene-so-far + its brief; check-before-continue caught canon drift (named fishermen) before it could propagate.
- Architect coherence pass: reads as one scene; canon held (Coria's rope/lanterns, unnamed "singing" foreshadow); accepted 12-word total overage (per-unit budgets all honored).
