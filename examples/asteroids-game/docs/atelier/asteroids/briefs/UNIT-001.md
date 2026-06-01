# UNIT-001 — constants + vector math

## Objective
Implement world constants and the pure 2D vector library, with unit tests.

## Inputs / context
- CONTRACT.md: §World constants and §Vector. Match exports exactly.

## Approach
- `src/constants.js`: export the pinned constants verbatim (WIDTH, HEIGHT, BOUNDS,
  SHIP, BULLET, ASTEROID, ASTEROID_SCORES).
- `src/vector.js`: implement every function in the Vector interface. All pure,
  return new `{x,y}` objects, no mutation. `wrap(pos,bounds)` maps coordinates
  toroidally into [0,width)×[0,height). `normalize` of the zero vector returns
  `{x:0,y:0}`.
- `test/vector.test.js`: node:test + node:assert/strict. Cover add/sub/scale,
  length, normalize (incl. zero), rotate (e.g. rotate {1,0} by PI/2 ≈ {0,1}),
  fromAngle, limit (clamps magnitude), and wrap (both edges).

## Constraints
- ES modules, named exports, `.js` import extensions. No DOM. No deps.

## Acceptance criteria
- [ ] (runnable) `cd <project> && node --test test/vector.test.js` exits 0, ≥6 tests pass
- [ ] (assertional) `src/constants.js` exports all pinned constants with the contract's values
- [ ] (assertional) `src/vector.js` exports every function in the contract's Vector interface, all pure (no input mutation)
- [ ] (assertional) `wrap` is toroidal; `normalize({x:0,y:0})` returns `{x:0,y:0}`

## Dependencies
none
