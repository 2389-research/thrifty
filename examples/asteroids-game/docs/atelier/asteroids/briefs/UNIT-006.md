# UNIT-006 — input + render

## Objective
Implement keyboard input and the canvas renderer (entities, particles, HUD,
game-over leaderboard overlay).

## Inputs / context
- CONTRACT.md §Input, §Render, §Game state shape, §Effects (drawParticles),
  §Leaderboard (getTop). Read `src/effects.js`, `src/leaderboard.js`,
  `src/entities.js`, `src/constants.js` on disk for real exports.

## Approach
- `src/input.js`: createInput(target) -> { state:{thrust,left,right,fire}, attach(),
  detach() }. attach() adds keydown/keyup listeners mapping Arrow/WASD + Space to
  the state booleans; detach() removes them. No listener work at import time.
- `src/render.js`: render(ctx,state) clears the canvas (dark bg), draws asteroids
  (circles/polygons), bullets (dots), the ship as a triangle oriented by angle,
  calls drawParticles(ctx,state.particles), and an HUD (score value, lives, wave).
  When state.status==='gameover', overlays "GAME OVER" + the top scores via
  getTop(state.leaderboard).

## Constraints
- Browser APIs only inside functions; nothing at import time touches document/window
  (so `node --check` passes). Import drawParticles/getTop rather than reimplementing.
  ES modules.

## Acceptance criteria
- [ ] (runnable) `cd <project> && node --check src/input.js && node --check src/render.js` exits 0
- [ ] (assertional) createInput returns {state,attach,detach}; maps Arrows+WASD+Space to thrust/left/right/fire
- [ ] (assertional) render(ctx,state) draws ship/asteroids/bullets, calls drawParticles, draws HUD (score/lives/wave), and a leaderboard overlay on gameover via getTop
- [ ] (assertional) no DOM/window access at import time; imports effects + leaderboard rather than reimplementing them

## Dependencies
UNIT-002, UNIT-004, UNIT-005
