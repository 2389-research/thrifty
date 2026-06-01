# atelier examples

Real dogfood runs, captured verbatim. Each was produced by the architect (Opus)
writing the contract + briefs, Haiku subagents executing units, and Sonnet
subagents checking against acceptance criteria.

## `jsonl-stats-code/` — code task (partition mode, runnable criteria)

A small Python package (`jsonl_stats`) built across three units: core stats module
+ tests, a JSONL fixture, and a CLI + integration test. UNIT-001 and UNIT-002 ran
in parallel; UNIT-003 depended on both. All acceptance criteria were **runnable**
(pytest, CLI exit codes). Final: 16 tests pass.

Run it: `cd jsonl-stats-code && python -m pytest -q && python -m jsonl_stats tests/sample.jsonl`

The atelier artifacts are under `docs/atelier/jsonl-stats/` (CONTRACT, briefs,
LEDGER). The ledger also records a separate fault-injection check: a planted
`field_coverage` bug (returning counts not fractions) was caught by the checker,
diagnosed `local`, and surgically fixed with the regression guard.

## `asteroids-game/` — larger code task (partition mode, 7 units, dependency waves)

A playable browser Asteroids game in vanilla JS (HTML5 Canvas, ES modules, zero
deps): ship physics, asteroids that split, bullets, circle collision, scoring, a
persistent top-10 **leaderboard**, a particle **effects** system (explosions +
thrust), a canvas renderer with HUD + game-over leaderboard overlay, keyboard
input, and the game-loop glue. ~14 files across **7 units**.

This is the best demonstration of the architect's job: the contract pins the
cross-unit seams (the Vector API, the entity shape, the **game-state shape** that
render and game must agree on, collision/scoring/effects signatures, world
constants) so the units compose. Dispatch ran in **4 dependency waves** with
parallel Haiku executors per wave (1: math+scoring · 2: entities+effects ·
3: collision+render/input · 4: game loop). **Zero escalations** — every unit's
Sonnet checker re-ran `node --test`/`node --check` independently and passed; the
pinned interfaces meant the parallel modules assembled without integration breakage.

Play it: `cd asteroids-game && ./serve.sh` then open http://localhost:8777
(ES modules require an HTTP origin — opening `index.html` via `file://` is blocked
by browser CORS; see `asteroids-game/README.md`).
Verify: `cd asteroids-game && node --test` → 66 tests pass.

## `saltrest-dnd/` — creative writing (partition mode, assertional criteria)

A playable D&D 5e adventure ("The Bones of Saltrest"), assembled from four units:
hook, NPCs, dungeon (with a ticking-clock mechanic), and resolution paths. The
contract pinned all canon (named entities, the 5/10-round clock, the three
resolution paths) so four independently-written units stayed consistent.

`ADVENTURE.md` is the assembled module. The `LEDGER.md` fix-loop log is the
interesting part: every Haiku executor self-reported "pass," but the Sonnet
checkers independently caught four real defects — three heading-level errors and a
**canon contradiction** (a date that disagreed with the contract) — and fixed each
surgically. That gap between executor self-report and independent verification is
exactly what the checker tier exists to close.

> Note: the two examples above used the **partition** mode (separable sections).

## `saltrest-scene-relay/` — creative writing (relay mode, one shared artifact)

The same Saltrest world, but the artifact is a single continuous prose scene
(`SCENE.md`) — the literary cold-open, third-person-limited on Mother Vell. This is
**relay mode**: four Haiku agents wrote it *sequentially*, each reading the
scene-so-far and appending the next beat in the established voice (dawn dread → the
bone-catch → the strangers → the hook). No fragments, no merge — the file *is* the
output.

The architect's call here matters: for cohesive prose you do **not** partition by
topic (that produces seams). You pin a single POV/voice in the contract and relay
beat by beat, checking each before the next runs. The `LEDGER.md` shows why
check-before-continue is the point: Beat 2 introduced two forbidden named fishermen
(Kess, Tam); the checker caught and anonymized them *before* Beat 3 could build on
the drift. (Contrast: in partition mode such an error would surface only at final
assembly, after everything downstream had already committed to it.)

> For one seamless voice via multiple specialized passes (draft → continuity edit →
> polish) instead of sequential beats, use **layered** mode — see the main README.

## `jsonl-stats-split/` & `saltrest-dnd-split/` — the SPLIT planning tier + adaptive verify

The same two task types, re-run through the **split** tier (Opus director writes a
lean contract + terse unit specs; **Sonnet brief-writers** expand them in parallel;
Haiku executes) with **adaptive verification** (gate-run for runnable criteria,
Sonnet read only for assertional ones). They demonstrate the two verify paths:

- **`jsonl-stats-split/`** (code) — lean ~200-word contract (vs ~1150 for the direct
  asteroids contract), 3 Sonnet briefs, 3 Haiku executors, 12 tests pass. Because
  every criterion is runnable, the **orchestrator ran the gates and dispatched zero
  Sonnet checkers** — the cheap path. Run: `cd jsonl-stats-split && node --test`.
- **`saltrest-dnd-split/`** (creative) — lean canon contract, 4 Sonnet briefs
  (calibrated: clock spelled out, prose terse), 4 Haiku executors. Criteria are
  assertional, so **Sonnet checkers read and judged** — and caught 3 real defects
  (an invented NPC, a role mislabel, an over-length section), all tier-1 surgical.
  Cross-unit canon held (clock numbers match dungeon↔resolution). `ADVENTURE.md` is
  the assembled module.

Together they show the split tier works on both task types, and that verification
diverges by criterion type — gates-only for code, full reads for prose.
