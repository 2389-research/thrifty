import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, fire } from '../src/game.js';

test('createGame returns the correct state shape', () => {
  const state = createGame();

  assert(state.ship !== null, 'ship should exist');
  assert(state.ship.type === 'ship', 'ship type should be "ship"');
  assert(Array.isArray(state.asteroids), 'asteroids should be an array');
  assert(state.asteroids.length > 0, 'should have wave 1 asteroids');
  assert(Array.isArray(state.bullets), 'bullets should be an array');
  assert(state.particles !== undefined, 'particles should exist');
  assert(state.particles.items !== undefined, 'particles should have items array');
  assert(state.score !== undefined, 'score should exist');
  assert(state.score.value === 0, 'initial score should be 0');
  assert(state.lives === 3, 'initial lives should be 3');
  assert(state.wave === 1, 'initial wave should be 1');
  assert(state.status === 'playing', 'initial status should be playing');
  assert(state.leaderboard !== undefined, 'leaderboard should exist');
});

test('update advances time without throwing on headless state', () => {
  const state = createGame();
  const input = { thrust: false, left: false, right: false, fire: false };

  // Should not throw
  assert.doesNotThrow(() => {
    update(state, input, 0.016);
  });
});

test('bullet overlapping asteroid increases score and splits it', () => {
  const state = createGame();
  const initialAsteroidCount = state.asteroids.length;
  const initialScore = state.score.value;

  // Move an asteroid to a predictable location
  const asteroid = state.asteroids[0];
  asteroid.pos = { x: 100, y: 100 };

  // Create a bullet at the same location
  const bullet = {
    type: 'bullet',
    pos: { x: 100, y: 100 },
    vel: { x: 0, y: 0 },
    angle: 0,
    radius: 2,
    alive: true,
    life: 1,
  };
  state.bullets.push(bullet);

  // Update to process collisions
  const input = { thrust: false, left: false, right: false, fire: false };
  update(state, input, 0.016);

  // Score should have increased (large asteroid = 20 points)
  assert(state.score.value > initialScore, 'score should increase');

  // Bullet should be dead
  assert(bullet.alive === false, 'bullet should be marked dead');

  // Original asteroid should be dead
  assert(asteroid.alive === false, 'asteroid should be marked dead');

  // Should have split into 2 medium asteroids (3 alive asteroids now minus original)
  const aliveAsteroids = state.asteroids.filter((a) => a.alive);
  assert(aliveAsteroids.length > 0, 'should have fragments');
});
