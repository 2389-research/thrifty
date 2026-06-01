# The Bones of Saltrest — Adventure Contract

## Objective
Produce a playable D&D 5e adventure hook for a party of **level 5**, assembled from
four units: the Hook & village, the NPCs & factions, the dungeon (sea caves), and
the resolution paths & rewards. The architect pins all shared canon here so each
unit, written independently, stays consistent and assembles into one coherent module.

## Seed premise (canon — do not contradict)
The fishing village of **Saltrest** has stopped catching fish. For three weeks the
nets have come up empty or full of human bones. **Mayor Halrik** vanished last
Thursday after rowing alone toward the **sea caves on the north shore**. The
village's only cleric refuses to enter the water. A wandering **necromancer** was
seen buying rope and lanterns at the market the day before the mayor disappeared.

## Tone & system conventions
- Tone: grim nautical folk-horror. Restrained, concrete, no high-fantasy bombast.
- System: D&D 5e. Stat references use the form `AC 12, 22 HP`; checks as
  `DC 15 Strength (Athletics)`. Keep monsters low-mid CR appropriate to level 5.
- Voice: second person to the GM ("you"), present tense. GM-facing, runnable cold.

## Canonical entities (every unit MUST use these exact names/spellings)
- Village: **Saltrest**. The tavern: **the Salted Anchor**. The shore landmark:
  **the breakwater**.
- Missing mayor: **Mayor Halrik**.
- The cleric (refuses the water): **Mother Vell**, priest of a drowned-saint faith.
- The necromancer: **Coria Sleet**, motive = reading a ship's manifest aloud to
  "carry the souls home" (she believes this is mercy, not malice).
- The dungeon: **Kelpwater Cove**, the north-shore sea caves, 3 levels —
  *Tide Cut* (entry), *the Choir Gallery* (mid), *the Vault* (flooded bottom).
- The artifact: **the Seraphine ledger** — a waterlogged ship's manifest, 143 names
  under a column headed *souls carried*. This is what the drowned want read aloud.
- The antagonph faction: **the Drowned Choir** — drowned sailors raised by Coria.

## The ticking-clock mechanic (shared spine — UNIT-003 defines it, UNIT-004 honors it)
A single escalating timer drives the climax. UNIT-003 specifies it precisely; all
other units must remain consistent with it:
- In the Vault, two Drowned Choir initiates kneel pressing the Seraphine ledger
  into black water with a sinking curse.
- Each round they act uninterrupted, the ledger sinks ~1 inch. After **5** rounds
  it is submerged (recovery needs `DC 15 Strength (Athletics)`). After **10** rounds
  the pages dissolve — closing the "read the names aloud" resolution path permanently.

## The three resolution paths (canon — UNIT-004 details; others must not contradict)
1. **Combat / dungeon crawl** — fight down through Kelpwater Cove, destroy the Choir.
2. **Town defense** — let the drowned come ashore at Saltrest and hold the breakwater.
3. **Negotiation / mercy** — recover and read the Seraphine ledger aloud before it
   dissolves, laying the souls to rest (requires beating the clock).

## Ownership map
- UNIT-001 → `briefs/out/hook.md`   (the Hook, Saltrest, call to action, opening scene)
- UNIT-002 → `briefs/out/npcs.md`   (Mayor Halrik, Mother Vell, Coria Sleet, the Drowned Choir)
- UNIT-003 → `briefs/out/dungeon.md` (Kelpwater Cove, 3 levels, stat blocks, the clock)
- UNIT-004 → `briefs/out/resolution.md` (the three paths, rewards, consequences)
- Architect assembles `ADVENTURE.md` from the four fragments at integration.

## Dependency graph
```text
UNIT-001, UNIT-002, UNIT-003   (independent — run in parallel)
              ↓
UNIT-004                        (resolution references hook, NPC motives, and the clock)
```

## Acceptance criteria rubric (the 4 lenses, applied per unit)
Every unit is judged against these four; each brief makes them concrete:
- **narrative_tension** — stakes escalate; urgency and unease are conveyed mechanically, not just asserted.
- **player_agency** — multiple angles/approaches implied, not a single rail.
- **specificity** — concrete names, places, sensory detail, and (where relevant) stat blocks; never "a town, a villain."
- **hook_clarity** — a GM can read it once and know what is wrong and where to start.

## Fix-loop overrides
None. Defaults apply.
