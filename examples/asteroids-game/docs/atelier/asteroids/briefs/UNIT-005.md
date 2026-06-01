# UNIT-005 — particle effects

## Objective
Implement the particle system: explosions + thruster, lifecycle update, and a
canvas draw. Logic is unit-tested.

## Inputs / context
- CONTRACT.md §Effects, §Vector. Read `src/vector.js` (on disk).

## Approach
- `src/effects.js`: createParticles()->{items:[]}; emitExplosion(ps,pos,count=18)
  pushes a radial burst (random directions via fromAngle, varied speed, life,
  warm colors, size); emitThrust(ps,pos,angle) pushes a few particles opposite the
  ship heading; updateParticles(ps,dt) integrates pos, decrements life, culls
  life<=0 (mutates ps.items); drawParticles(ctx,ps) draws each with alpha = life/maxLife.
- `test/effects.test.js`: emitExplosion adds `count` particles; updateParticles
  reduces life and removes dead ones; particles have the pinned shape.

## Constraints
- drawParticles is the ONLY canvas-touching function and must not run at import
  time. The rest is pure logic. Use vector.js. ES modules.

## Acceptance criteria
- [ ] (runnable) `cd <project> && node --test test/effects.test.js` exits 0, ≥3 tests pass
- [ ] (runnable) `cd <project> && node --check src/effects.js` exits 0
- [ ] (assertional) exports match the contract; particles have `{pos,vel,life,maxLife,color,size}`
- [ ] (assertional) updateParticles culls dead particles; only drawParticles touches ctx, and nothing touches DOM at import time

## Dependencies
UNIT-001
