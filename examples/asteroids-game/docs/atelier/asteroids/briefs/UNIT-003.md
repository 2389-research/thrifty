# UNIT-003 — collision detection

## Objective
Implement circle-based collision helpers, with tests.

## Inputs / context
- CONTRACT.md §Collision, §Entities (entities expose pos + radius), §Vector.
  Read `src/vector.js` and `src/entities.js` (on disk).

## Approach
- `src/collision.js`: circleHit(a,b) via distance < a.radius+b.radius;
  bulletsVsAsteroids(bullets,asteroids) -> array of {bullet,asteroid} for every
  colliding pair (only `alive` entities); shipVsAsteroids(ship,asteroids) ->
  the first colliding asteroid or null. No mutation.
- `test/collision.test.js`: overlapping circles hit, distant ones don't; a bullet
  overlapping an asteroid is returned as a pair; ship overlapping returns that
  asteroid, else null.

## Constraints
- Pure (no mutation). Use vector.js for distance. ES modules, no DOM.

## Acceptance criteria
- [ ] (runnable) `cd <project> && node --test test/collision.test.js` exits 0, ≥3 tests pass
- [ ] (assertional) exports circleHit, bulletsVsAsteroids, shipVsAsteroids with contract signatures/return shapes
- [ ] (assertional) functions do not mutate their arguments
- [ ] (assertional) imports from UNIT-001/UNIT-002; uses entity pos+radius

## Dependencies
UNIT-001, UNIT-002
