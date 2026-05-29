# UNIT-002 — Cast & Factions

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.
> Pin within-unit detail only to the depth Haiku needs — not "every byte."

## Objective

Write `briefs/out/npcs.md`, a GM-facing `## Cast & Factions` section covering
all four canon principals — Mayor Halrik, Mother Vell, Coria Sleet, and the
Drowned Choir — each with a motivation and one vivid concrete detail.

## Inputs / context

- `CONTRACT.md` — tone, canon names, the mercy-not-malice framing for Coria,
  the Seraphine ledger, the Drowned Choir. Read in full before writing.
- No upstream unit outputs are required (UNIT-002 has no deps).

Key canon from the contract to carry into the section:
- **Coria Sleet** — necromancer; goal is **mercy, not malice**: she wants to lay
  the drowned souls to rest by reading the Seraphine ledger (manifest of 143
  names) aloud. Last seen buying rope and lanterns.
- **Mayor Halrik** — vanished last week, rowed alone to the north-shore caves.
- **Mother Vell** — village priest, refuses the water.
- **The Drowned Choir** — the drowned sailors Coria has raised.

## Approach

This is a focused NPC write-up — four entries, each short and GM-actionable.
Haiku knows the format; no step-by-step narration needed. Focus on:

1. Open with the section header `## Cast & Factions`.
2. Write one subsection per principal (Halrik, Vell, Coria, the Choir).
   Each entry needs:
   - One sentence of **motivation** (what this person/group wants right now).
   - One **concrete detail** — a sensory, behavioral, or physical beat a GM can
     use at the table (something they say, do, carry, or look like).
3. Coria's entry is load-bearing: her mercy-not-malice arc must be unmistakable.
   She is not a villain — she is desperate and grieving. Surface this clearly.
   The Seraphine ledger and its 143 names should appear in or adjacent to her
   entry as the instrument of her plan.
4. Assign each principal a **role tag** of either `ally`, `antagonist`, or
   `neutral / context` — making the party's navigation clear to the GM at a glance.
   The section must contain at least one playable ally and at least one antagonist.
5. The Drowned Choir entry describes them as a collective, not individuals.
   Their role is antagonist by default (they imperil the village), but note they
   are redeemable via the mercy path (consistent with UNIT-004's resolution paths).
6. Keep the whole section within 200–380 words — dense GM utility, not prose.
   Use grim nautical folk-horror voice; second person, present tense.

## Constraints

- **No new named characters.** Canon names only (from the contract). Do not
  invent additional NPCs.
- **No dungeon interior detail** — that belongs to UNIT-003.
- **No resolution path detail** — that belongs to UNIT-004. You may hint at
  Coria's goal (read the ledger aloud), but do not write out mechanics or endings.
- **No stat blocks.** This section is motive + flavor, not combat mechanics.
- **Honor the contract's voice:** GM-facing, second person, present tense.
  Concrete, not bombastic. See `CONTRACT.md § Tone & conventions`.
- **Do not alter the Coria framing.** Mercy-not-malice is pinned by the
  contract. Do not reframe her as ambiguous, misguided, or dangerous-despite-
  good-intentions — she is unambiguously sympathetic.

## Acceptance criteria

- [ ] (assertional) File exists at `briefs/out/npcs.md` and opens with `## Cast & Factions`.
- [ ] (assertional) All four principals are present: Mayor Halrik, Mother Vell, Coria Sleet,
  and the Drowned Choir — each in its own named subsection.
- [ ] (assertional) Every principal entry contains an explicit motivation statement and at
  least one concrete sensory/behavioral detail.
- [ ] (assertional) Coria's entry frames her as mercy-not-malice: her stated goal is to lay
  the drowned souls to rest by reading the Seraphine ledger aloud (143 names).
  No language casts her as a villain or as morally ambiguous.
- [ ] (assertional) The section contains at least one entry tagged or described as a
  **playable ally** and at least one tagged or described as an **antagonist**.
- [ ] (assertional) The Drowned Choir is present as a collective entry (not individual
  stat blocks) and is identified as the direct threat to the village.
- [ ] (assertional) No new named characters appear beyond the four canon principals.
- [ ] (assertional) No dungeon-interior descriptions appear (those belong to UNIT-003).
- [ ] (assertional) No resolution-path mechanics appear (those belong to UNIT-004).
- [ ] (assertional) Word count is 200–380 words.
- [ ] (assertional) Voice is GM-facing, second person, present tense throughout —
  consistent with `CONTRACT.md § Tone & conventions`.

## Dependencies

none
