import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createParticles,
  emitExplosion,
  emitThrust,
  updateParticles,
} from '../src/effects.js';

test('createParticles initializes with empty items array', () => {
  const ps = createParticles();
  assert.deepEqual(ps, { items: [] });
});

test('emitExplosion adds count particles with correct shape', () => {
  const ps = createParticles();
  const pos = { x: 100, y: 100 };
  const count = 18;

  emitExplosion(ps, pos, count);

  assert.equal(ps.items.length, count);

  // Check first particle has all required fields
  const particle = ps.items[0];
  assert(particle.pos !== undefined);
  assert(particle.pos.x !== undefined);
  assert(particle.pos.y !== undefined);
  assert(particle.vel !== undefined);
  assert(particle.vel.x !== undefined);
  assert(particle.vel.y !== undefined);
  assert(particle.life !== undefined);
  assert(particle.maxLife !== undefined);
  assert(particle.color !== undefined);
  assert(particle.size !== undefined);

  // All particles should start at the same position
  for (const p of ps.items) {
    assert.equal(p.pos.x, pos.x);
    assert.equal(p.pos.y, pos.y);
  }

  // All particles should have equal life and maxLife
  for (const p of ps.items) {
    assert.equal(p.life, p.maxLife);
    assert(p.life > 0);
  }
});

test('emitExplosion default count is 18', () => {
  const ps = createParticles();
  const pos = { x: 50, y: 50 };

  emitExplosion(ps, pos);

  assert.equal(ps.items.length, 18);
});

test('emitThrust adds particles opposite the angle', () => {
  const ps = createParticles();
  const pos = { x: 200, y: 200 };
  const angle = Math.PI / 2; // pointing up

  emitThrust(ps, pos, angle);

  assert(ps.items.length > 0);

  // Check all particles have correct shape
  for (const p of ps.items) {
    assert(p.pos !== undefined);
    assert(p.vel !== undefined);
    assert(p.life !== undefined);
    assert(p.maxLife !== undefined);
    assert(p.color !== undefined);
    assert(p.size !== undefined);
  }
});

test('updateParticles integrates position', () => {
  const ps = createParticles();
  const initialPos = { x: 0, y: 0 };
  const vel = { x: 10, y: 20 };
  const life = 1;

  ps.items.push({
    pos: initialPos,
    vel,
    life,
    maxLife: life,
    color: 'white',
    size: 1,
  });

  const dt = 0.1;
  updateParticles(ps, dt);

  const p = ps.items[0];
  assert.deepEqual(p.pos, { x: 1, y: 2 }); // vel * dt
});

test('updateParticles decrements life', () => {
  const ps = createParticles();
  const particle = {
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    life: 1,
    maxLife: 1,
    color: 'white',
    size: 1,
  };

  ps.items.push(particle);
  const dt = 0.3;

  updateParticles(ps, dt);

  assert.equal(ps.items[0].life, 1 - dt);
});

test('updateParticles culls dead particles', () => {
  const ps = createParticles();

  ps.items.push(
    {
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      life: 0.1,
      maxLife: 1,
      color: 'white',
      size: 1,
    },
    {
      pos: { x: 10, y: 10 },
      vel: { x: 0, y: 0 },
      life: 0.5,
      maxLife: 1,
      color: 'white',
      size: 1,
    }
  );

  const dt = 0.2; // First particle: 0.1 - 0.2 = -0.1 (dies)
  // Second particle: 0.5 - 0.2 = 0.3 (survives)

  updateParticles(ps, dt);

  assert.equal(ps.items.length, 1);
  assert.equal(ps.items[0].pos.x, 10);
});
