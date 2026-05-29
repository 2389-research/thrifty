# UNIT-003 — Kelpwater Cove + the Clock

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.

## Objective

Produce `briefs/out/dungeon.md` — the `## Kelpwater Cove` section: a three-level sea-cave dungeon (GM-facing, second-person, present tense) for a party of level-5 characters, including all stat references and the ticking-clock rules that govern the Seraphine ledger in the climax.

## Inputs / context

- `CONTRACT.md` — tone, canon names, stat-ref format, and the declaration that UNIT-003 owns the ticking-clock numbers (submerge @5, dissolve @10, DC 15). Read the **Canon**, **Tone & conventions**, and **The ticking clock** sections in full before writing.
- `UNIT-SPECS.md` — UNIT-003 entry: three level subsections, ≥3 AC/HP refs, ≥3 DC checks, clock as explicit round-by-round rules, more than one way to engage the Vault.

No upstream unit output is required; UNIT-003 has no dependencies.

## Approach

This is dungeon-writing. The pattern is well-trodden for 5e designers; spell out only the load-bearing gotchas.

1. **Section heading.** Open with `## Kelpwater Cove`. Brief introductory flavour (2–4 sentences): grim nautical, where it is (north-shore sea caves, north of Saltrest), why it matters.

2. **Three level subsections.** Use `### Level 1 — <name>`, `### Level 2 — <name>`, `### Level 3 — <name>` (invent evocative names that fit grim nautical folk-horror). For each level:
   - 1–2 sentences of flavour/description (sensory, concrete).
   - The hazard, creature, or encounter present on that level.
   - At least one 5e-format stat reference (`AC <n>, <n> HP`) and at least one skill-check line (`DC <n> <Ability> (<Skill>)`) distributed across levels so the totals meet criteria. DC values you invent (outside the pinned clock DC) should be thematically grounded (treacherous kelp, slick rock, collapsed passage, etc.).
   - At least one concrete GM note per level (how creatures behave, what a room contains, a tactical wrinkle).

3. **The Vault (Level 3).** This is where the Seraphine ledger rests. Describe ≥2 distinct approaches to reaching/engaging the Vault (e.g., force through the Choir vs. find a tidal passage that bypasses them). Do not describe what happens after the ledger is retrieved — that is UNIT-004's domain.

4. **Ticking Clock — The Seraphine Ledger.** After the level subsections, write a dedicated `### The Ticking Clock — Seraphine Ledger` subsection. This is the canonical rules block that UNIT-004 must honor. Use explicit round-by-round prose:
   - When initiates submerge the ledger, the clock starts.
   - **Round 5:** the ledger fully submerges; recovering it requires a `DC 15 Strength (Athletics)` check.
   - **Round 10:** the ledger dissolves; the "read the names aloud" mercy path is permanently closed.
   - State these numbers exactly — do not soften, rephrase as "approximately," or add variance.
   - A brief GM note on how to track rounds in play is welcome but not required.

## Constraints

- **Stat-ref format is contract-pinned.** Use `AC 12, 22 HP` and `DC 15 Strength (Athletics)` forms exactly as shown in CONTRACT.md's Tone & conventions. No other formats (no "15 STR check," no "Athletics DC 15").
- **Clock numbers are pinned.** Submerge at round 5, dissolve at round 10, DC 15 Strength (Athletics) to recover. Do not adjust these.
- **Canon names only.** The dungeon is **Kelpwater Cove**; the creatures are **the Drowned Choir**; the artifact is the **Seraphine ledger**. Do not introduce new named characters (no new NPCs, no named sub-bosses — unnamed monsters are fine).
- **GM-facing, second person, present tense.** "As the party descends…" / "The floor is slick with brine." Not past tense, not player-facing.
- **Scope boundary.** Do not describe resolution paths or rewards — those belong to UNIT-004. Stop at "the ledger is here and accessible by these routes."
- **Length.** Aim for ~350–550 words for the full fragment. Dense and useful, not padded.

## Acceptance criteria

> The checker scores against this list. Each item is concrete and tagged.

- [ ] (assertional) `briefs/out/dungeon.md` exists and begins with `## Kelpwater Cove`.
- [ ] (assertional) The file contains exactly three level subsections, each opening with `### Level`.
- [ ] (assertional) The file contains a `### The Ticking Clock` subsection (heading contains "Ticking Clock").
- [ ] (assertional) The ticking-clock subsection states submerge at round **5** and dissolve at round **10** using those exact numbers (not approximations).
- [ ] (assertional) The ticking-clock subsection states the recovery check as exactly `DC 15 Strength (Athletics)` — matching the contract's pinned format.
- [ ] (assertional) The file contains ≥3 stat references matching the pattern `AC \d+, \d+ HP`.
- [ ] (assertional) The file contains ≥3 skill-check references matching the pattern `DC \d+ \w+ \(\w+\)`.
- [ ] (assertional) The Level 3 / Vault section describes ≥2 distinct approaches to reaching or engaging the Vault (one may be combat, one non-combat or environmental).
- [ ] (assertional) No new named NPCs appear (only canon names from CONTRACT.md — Saltrest, Kelpwater Cove, Drowned Choir, Seraphine ledger, and any of Halrik/Vell/Coria if referenced in passing).
- [ ] (assertional) Tone is GM-facing second person present tense throughout; no player-facing language ("you the player," "your character sheet").
- [ ] (assertional) The file contains no resolution-path text (rewards, consequences, path outcomes) — that content belongs to UNIT-004.
- [ ] (assertional) Word count of the file is between 300 and 600 words (brief GM prose, not padding).

## Dependencies

none
