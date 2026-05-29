# The Tide at Saltrest — Scene Contract

**Decomposition mode:** relay
(One shared artifact, `SCENE.md`, extended segment by segment, sequentially. Each
unit reads the scene-so-far and appends the next beat. No fragment files; no merge.)

## Objective
Write a single continuous prose scene (~800–1000 words total) — the cold open of
the Saltrest adventure, as literary fiction. Four sequential beats, each appended
to the same `SCENE.md`, building one seamless scene from dawn dread to the hook.

## The shared artifact
- File: `SCENE.md` (in the working dir). It starts empty.
- Each unit APPENDS its beat to the end. Never rewrite or delete prior beats.
- No beat headings in the prose — it must read as one unbroken scene. (A unit may
  leave a single blank line between paragraphs; do not insert `##` markers.)

## Voice & POV (the seam every beat must hold)
- **POV:** third-person limited, anchored entirely on **Mother Vell**. We only ever
  know what she sees, feels, fears. Do not head-hop to other characters.
- **Tense:** past tense. **Voice:** grim nautical folk-horror — restrained,
  concrete, sensory; literary, not game-mechanical. No stat blocks, no dice, no
  second person, no GM instructions.
- **Continuity:** weather/time-of-day is a single dawn that progresses slightly;
  details established in an earlier beat (who is present, what was said, physical
  state) must remain true. Do not contradict prior beats.

## Canon (use these exact names; invent no other named characters)
- Village **Saltrest**; the tavern **the Salted Anchor**; the **breakwater**; the
  north-shore sea caves **Kelpwater Cove**.
- **Mother Vell** — the village priest of a drowned-saint faith; refuses to enter
  the water; our POV. She carries guilt/fear about the sea.
- **Mayor Halrik** — vanished last week, rowed alone toward the caves.
- **Coria Sleet** — a wandering necromancer seen buying rope and lanterns; her aim
  (unknown to Vell, only hinted) is mercy, not malice.
- The catch: human **bones** in the nets for three weeks. (The Seraphine ledger and
  the Drowned Choir are NOT yet known to Vell — do not name them in this scene.)
- "The strangers" / "the travelers" = the adventuring party. They are unnamed and
  undescribed beyond what Vell observes; do not give them names or classes.

## Beat arc & handoffs (the linear dependency spine)
1. **UNIT-001 — Dawn dread.** Establish: gray dawn over Saltrest harbor through
   Vell's eyes, the wrong silence, the empty sea, her dread of the water. End as a
   single fishing boat appears, rowing in against the pale light.
2. **UNIT-002 — The catch.** The boat lands; the net is hauled; bones spill onto the
   stones; the gathered villagers react. Vell's horror and her refusal to approach
   the water's edge. End as strangers step onto the dock, noticed by the crowd.
3. **UNIT-003 — The strangers.** The party's arrival through Vell's wary eyes; the
   villagers' mix of hope and suspicion; Mayor Halrik's absence surfaces in what is
   said or unsaid. End with Vell resolving to speak to the strangers herself.
4. **UNIT-004 — The hook.** Vell tells the strangers what she fears and what she
   will not do, and turns them toward Kelpwater Cove; a glancing mention of the
   necromancer Coria Sleet. Close on a final ominous sea image. End: the pull toward
   the caves is unmistakable.

## Ownership map
- All units write to the one shared `SCENE.md` (relay). UNIT-001 first, then 002,
  003, 004, each appending after the previous beat is checked.

## Dependency graph
```
UNIT-001 → UNIT-002 → UNIT-003 → UNIT-004   (strictly sequential; one shared artifact)
```

## Fix-loop overrides
None. Defaults apply.
