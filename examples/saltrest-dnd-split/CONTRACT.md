# The Bones of Saltrest — Contract

**Decomposition mode:** partition · **Planning tier:** split

## Objective
A playable D&D 5e adventure hook (party level 5), assembled from four GM-facing
sections: the hook, the cast, the dungeon, and the resolution paths. Architect
concatenates the four fragments into `ADVENTURE.md`.

## Tone & conventions
- Grim nautical folk-horror. GM-facing, second person, present tense. Concrete, not
  bombastic. 5e stat refs as `AC 12, 22 HP` / `DC 15 Strength (Athletics)`.

## Canon (use these exact names; invent no other named characters)
- Village **Saltrest**; tavern **the Salted Anchor**; the **breakwater**.
- **Mayor Halrik** — vanished last week, rowed alone to the north-shore caves.
- **Mother Vell** — village priest, refuses the water.
- **Coria Sleet** — a necromancer; aim is **mercy, not malice** (lay drowned souls
  to rest by reading a ship's manifest aloud). Seen buying rope + lanterns.
- Dungeon: **Kelpwater Cove**, north-shore sea caves, 3 levels.
- Artifact: the **Seraphine ledger** (a manifest of 143 drowned names).
- The drowned sailors raised by Coria = **the Drowned Choir**.

## The ticking clock (UNIT-003 defines exact rules; UNIT-004 must honor them)
In the climax, initiates sink the Seraphine ledger; it submerges after **5** rounds
(`DC 15 Strength (Athletics)` to recover) and dissolves after **10**, closing the
"read the names aloud" path. UNIT-003 owns these numbers; others stay consistent.

## The three resolution paths (UNIT-004 details; others must not contradict)
1. Combat — destroy the Choir in the cove.  2. Town defense — hold the breakwater.
3. Mercy — recover + read the Seraphine ledger before it dissolves.

## Ownership (each writes its own fragment; architect concatenates)
- UNIT-001 → briefs/out/hook.md (`## The Hook`)
- UNIT-002 → briefs/out/npcs.md (`## Cast & Factions`)
- UNIT-003 → briefs/out/dungeon.md (`## Kelpwater Cove`, the clock)
- UNIT-004 → briefs/out/resolution.md (`## Resolution`, three paths)

## Dependency graph
UNIT-001, UNIT-002, UNIT-003 (independent) → UNIT-004 (references hook, NPC motives, the clock numbers)
