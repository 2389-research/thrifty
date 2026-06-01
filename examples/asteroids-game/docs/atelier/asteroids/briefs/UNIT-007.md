# UNIT-007 — game loop + glue + page

## Objective
Wire everything into a playable game: state machine, main loop, and the HTML page.

## Inputs / context
- CONTRACT.md §Game state shape, §Game + glue, and ALL prior module interfaces.
  Read every file in `src/` on disk for the real exports.

## Approach
- `src/game.js`: createGame(opts) builds the state (spawns wave 1 asteroids away
  from center), update(state,input,dt) advances ship/asteroids/bullets/particles,
  runs collisions (bullet hits -> remove bullet, splitAsteroid, emitExplosion,
  addPoints; ship hit -> emit explosion, lose a life, respawn ship or set
  status='gameover' at 0 lives), and starts the next wave (wave++, more/faster
  rocks) when no asteroids remain. fire(state) spawns a bullet from the ship.
- `src/main.js`: get the canvas + 2d ctx, createInput().attach(), rAF loop with dt
  in seconds calling update then render; fire on the rising edge of input.fire; on
  transition to gameover, add the score to the leaderboard (name via prompt or
  'PLAYER'). Guard so importing main.js doesn't crash outside a browser.
- `index.html`: dark page with <canvas id="game" width="800" height="600"> and
  <script type="module" src="src/main.js"></script>. `style.css`: minimal dark theme.
- `test/game.test.js`: createGame yields the pinned state shape with wave-1
  asteroids; update advances time without throwing on a headless state; a bullet
  overlapping an asteroid increases score and splits it.

## Constraints
- Compose the existing modules; do not reimplement physics/collision/scoring.
  main.js must not execute canvas/DOM work at import time (wrap in a guarded init).
  ES modules.

## Acceptance criteria
- [ ] (runnable) `cd <project> && node --test test/game.test.js` exits 0, ≥3 tests pass
- [ ] (runnable) `cd <project> && node --check src/game.js && node --check src/main.js` exits 0
- [ ] (assertional) createGame returns the contract's state shape; update runs collisions -> split + score + explosion, handles ship death + lives + gameover, advances waves
- [ ] (assertional) index.html loads src/main.js as a module and has the canvas; game.js composes prior modules (no reimplemented physics/collision/scoring)
- [ ] (assertional) no DOM work at import time in main.js

## Dependencies
UNIT-001, UNIT-002, UNIT-003, UNIT-004, UNIT-005, UNIT-006
