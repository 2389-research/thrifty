# UNIT-002 — entities + physics

## Objective
Implement ship/asteroid/bullet factories and in-place update/physics, with tests.

## Inputs / context
- CONTRACT.md §Entities, §World constants, §Vector. Read `src/vector.js` and
  `src/constants.js` (UNIT-001, on disk) for the real exports.

## Approach
- `src/entities.js`: implement createShip/createAsteroid/createBullet and
  updateShip/updateAsteroid/updateBullet and splitAsteroid per the contract.
  - Ship: turn by SHIP.turnRate*dt on input.left/right; on input.thrust add accel
    along `angle`; apply friction; clamp to SHIP.maxSpeed; integrate; wrap.
  - Bullet: integrate + wrap; `life -= dt`; `alive=false` when life<=0.
  - Asteroid: random small drift velocity at creation; integrate + wrap.
  - splitAsteroid: large->2 medium, medium->2 small, small->[] (new asteroids at
    same pos, radii from ASTEROID).
- `test/entities.test.js`: thrust increases speed then friction/clamp respected;
  bullet dies after BULLET.life; updates wrap at edges; splitAsteroid sizes/counts.

## Constraints
- Use vector.js + constants.js (don't re-derive constants). ES modules, no DOM.
- update* mutate their entity in place (as the contract specifies).

## Acceptance criteria
- [ ] (runnable) `cd <project> && node --test test/entities.test.js` exits 0, ≥4 tests pass
- [ ] (assertional) entities match the pinned shape `{type,pos,vel,angle,radius,alive}`; factories + updates + splitAsteroid match the contract signatures
- [ ] (assertional, specificity) splitAsteroid returns 2 medium for large, 2 small for medium, [] for small, with radii from ASTEROID
- [ ] (assertional) imports constants/vector from UNIT-001; does not redefine them

## Dependencies
UNIT-001
