# UNIT-004 — Resolution

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.
> Pin within-unit detail only to the depth Haiku needs — not "every byte."

## Objective

Write `briefs/out/resolution.md` — the `## Resolution` section of the adventure.
It covers all three resolution paths (Combat, Town Defense, Mercy) with distinct
end-states, concrete rewards or consequences per path, and a Mercy path that
correctly references the ticking-clock numbers from UNIT-003.

## Inputs / context

Before writing, read the following files to stay consistent with the finished
content they contain — in particular, pick up the actual clock numbers,
NPC motives, and any dungeon details that the resolution paths reference:

- `CONTRACT.md` — canon names, the three resolution paths, the clock parameters
  (submerge @round 5, dissolve @round 10, DC 15 Strength (Athletics)), tone &
  conventions, the `## Resolution` section heading you must use.
- `briefs/out/hook.md` (written by UNIT-001) — the party's call to action and
  whatever investigative threads were seeded; mirror them in how rewards are framed.
- `briefs/out/npcs.md` (written by UNIT-002) — Coria Sleet's mercy motive,
  Halrik's fate, Mother Vell's role; the resolution paths must be consistent with
  these characterisations.
- `briefs/out/dungeon.md` (written by UNIT-003) — the Kelpwater Cove layout and,
  critically, the exact ticking-clock rules as UNIT-003 wrote them (round numbers,
  DC values). Use those values verbatim in the Mercy path description.

Do not contradict or re-interpret anything pinned by those files. If a number or
NPC detail in the finished files differs from the contract, treat the finished
file as authoritative (UNIT-003 owns the clock numbers; CONTRACT.md defers to it).

## Approach

The section heading must be exactly: `## Resolution`

Write three H3 subsections, one per path, in this order:

### Path 1 — Combat: Silence the Choir
Describe the outcome when the party destroys the Drowned Choir in the cove.
End-state: the raised dead sink back into the sea; Coria is captured or driven off
(executor decides tone-consistent outcome). Concrete reward: name one tangible item
or XP equivalent the party receives.

### Path 2 — Town Defense: Hold the Breakwater
Describe the outcome when the party holds the breakwater long enough for the Choir
to thin out (mechanically: Choir can't reinforce from the sea once its cove-link
is broken by whatever dungeon event UNIT-003 describes — reference that event by
name if dungeon.md names it). Concrete reward: Saltrest's gratitude expressed as
one specific thing (coin, safe haven, a named NPC's boon — pick one that fits the
hook). Note the cost: some villagers may fall; frame that honestly.

### Path 3 — Mercy: Read the Names Aloud
This is the ticking-clock path. Write it in two beats:
1. **Recovery** — the party must retrieve the Seraphine ledger from the sea; state
   the exact round it submerges and the exact DC check to recover it, quoting from
   dungeon.md (those numbers come from UNIT-003, not from your head).
2. **Reading** — once recovered, a character must read all 143 names aloud while the
   Choir presses in. Describe the dramatic moment and the outcome: the Choir
   dissolves peacefully, Coria weeps and surrenders, and the drowned find rest.
   Concrete reward: Coria offers the party a named boon (her cooperation, a spell,
   or knowledge of the Seraphine wreck's location — pick one that fits npcs.md).
   Also note: if the ledger dissolves (round 10), this path closes permanently.

**Closing paragraph (all paths):** A short, standalone paragraph (2–4 sentences)
after the three paths noting what happens to Saltrest long-term regardless of path:
the sea does not forget, but the village survives or doesn't based on what the party
chose.

**Length and voice:** 300–500 words total. GM-facing, second person, present tense.
Concrete, not bombastic. Tone as per CONTRACT.md (grim nautical folk-horror).

## Constraints

- Use canon names exactly as in the contract: Saltrest, the Salted Anchor, the
  breakwater, Mayor Halrik, Mother Vell, Coria Sleet, the Drowned Choir, Kelpwater
  Cove, the Seraphine ledger. Invent no new named characters.
- Stat refs follow the contract format: `AC 12, 22 HP` / `DC 15 Strength (Athletics)`.
- Do not define or alter the clock rules — only reference them. UNIT-003 owns those
  numbers.
- Do not describe dungeon interiors or NPC backstories — those belong to UNIT-001,
  UNIT-002, UNIT-003. Reference their outcomes only.
- The output file is `briefs/out/resolution.md`; no other files are written.
- Do not mention the party level (5th) explicitly — it is implicit in the challenge
  ratings and DCs already set by other units.

## Acceptance criteria

> The binding checklist. The checker scores against THIS — never vibes.

- [ ] (assertional) `briefs/out/resolution.md` exists and its first heading is exactly `## Resolution`.
- [ ] (assertional) The file contains exactly three H3 subsections corresponding to the three paths: Combat, Town Defense, and Mercy (in that order; exact H3 wording may vary but each must be clearly labelled).
- [ ] (assertional) The Combat path names one concrete, specific reward (item, XP sum, or equivalent) — not "treasure" or "XP" as a vague placeholder.
- [ ] (assertional) The Town Defense path names one specific reward (coin amount, named NPC's boon, or equivalent) and acknowledges a cost (villager casualties or equivalent).
- [ ] (assertional) The Mercy path states the exact round the Seraphine ledger submerges and the exact DC + ability + skill of the recovery check, matching the values in `briefs/out/dungeon.md` verbatim.
- [ ] (assertional) The Mercy path explicitly states the round at which the ledger dissolves permanently (closing the path), matching `briefs/out/dungeon.md`.
- [ ] (assertional) Coria Sleet appears in at least one path resolution as mercy-not-malice (she cooperates, surrenders, weeps, or offers help — not as a villain who is simply defeated).
- [ ] (assertional) All canon names from the contract (Saltrest, breakwater, Seraphine ledger, the Drowned Choir, Coria Sleet) appear in the file; no new named characters are introduced.
- [ ] (assertional) The file is 300–500 words (count the body text, excluding the heading).
- [ ] (assertional) Voice is GM-facing, second person, present tense throughout (no past-tense narration, no "the players").
- [ ] (assertional) At least one stat ref appears in the file using the contract's format (`DC <n> <Ability> (<Skill>)`), taken from the Mercy path recovery check.
- [ ] (assertional) A closing paragraph (distinct from the three path subsections) addresses Saltrest's long-term fate.

## Dependencies

UNIT-001, UNIT-002, UNIT-003 (all must be complete before this unit executes)
