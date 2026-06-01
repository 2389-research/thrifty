# UNIT-001 — The Hook

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.

## Objective

Write `briefs/out/hook.md` — the `## The Hook` section that opens the adventure:
the situation in Saltrest, the inciting event, and the call to action for a
level-5 party.

## Inputs / context

- `CONTRACT.md` — canon names, tone, the three resolution paths (named only),
  and ownership boundaries. Use it as the authoritative reference; do not
  restate or alter what it pins.

No upstream unit outputs are required; UNIT-001 has no dependencies.

## Approach

This is a standard adventure-hook prose passage. Haiku knows the form. Aim for
150–320 words of tight, atmospheric, GM-facing prose.

Structure the section in three beats:

1. **The village as the party finds it.** A sentence or two of sensory
   grounding — the smell of brine, the mood on the docks, the Salted Anchor's
   quiet. Do not over-explain; trust the atmosphere to land.

2. **The inciting event / what's wrong.** Mayor Halrik has been missing for a
   week; he was last seen rowing alone toward the north-shore caves. The
   village is uneasy. Weird tides, strange sounds from the breakwater at
   night.

3. **The call to action.** Someone (Mother Vell or a villager — do not invent
   a named NPC beyond what the contract allows) asks the party to find Halrik.
   The hook should make the stakes feel real without spoiling the resolution
   options.

Seed at least two investigative threads the party can pull: one pointing toward
the caves/dungeon, one pointing toward an NPC (Vell, the rumour of Coria buying
rope and lanterns, or Halrik's last known behaviour). Threads should be
implicit in the prose — do not write "investigative thread:" headers.

Keep the register GM-facing, second person, present tense, as pinned in the
contract.

## Constraints

- **Canon names only.** Use the exact names from CONTRACT.md § Canon. Invent
  no new named characters, locations, or artefacts.
- **No dungeon interior.** Do not describe Kelpwater Cove's rooms, levels, or
  stat blocks. The hook ends at the cave entrance, not inside.
- **No resolution spoilers.** Do not name or imply the three resolution paths
  from CONTRACT.md § The three resolution paths. The party must not know the
  answer before they look.
- **No stat blocks or mechanical checks.** This section is pure narration; all
  5e mechanics live in UNIT-003 and UNIT-004.
- **Word count.** Finished prose: 150–320 words (excluding the section heading).
- Tone, formatting, and 5e stat-ref style are pinned in CONTRACT.md § Tone &
  conventions. Inherit them; do not restate them here.

## Acceptance criteria

- [ ] (assertional) The file `briefs/out/hook.md` exists and opens with the
  heading `## The Hook`.
- [ ] (assertional) Word count of the prose body (excluding the heading) is
  between 150 and 320 words inclusive.
- [ ] (assertional) All five canon names used appear exactly as defined in
  CONTRACT.md § Canon: **Saltrest**, **the Salted Anchor**, **the breakwater**,
  **Mayor Halrik**, **Mother Vell** — or a subset of them; none are misspelled
  or renamed.
- [ ] (assertional) No named characters appear in the text that are not present
  in CONTRACT.md § Canon.
- [ ] (assertional) At least two investigative threads are readable in the
  prose — one pointing toward the north-shore caves, one pointing toward an NPC
  or an observable clue (e.g., Coria's rope-and-lanterns purchase, Halrik's
  last sighting).
- [ ] (assertional) The text is written GM-facing, second person, present tense
  as specified in CONTRACT.md § Tone & conventions.
- [ ] (assertional) The hook contains no description of Kelpwater Cove's
  interior, stat blocks, skill-check DCs, or resolution-path outcomes.
- [ ] (assertional) A GM reading the section once can state: what is wrong in
  Saltrest, who Halrik is and why he matters, and what the party is being asked
  to do.

## Dependencies

none
