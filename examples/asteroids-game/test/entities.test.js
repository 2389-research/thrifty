import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createShip,
  createAsteroid,
  createBullet,
  updateShip,
  updateAsteroid,
  updateBullet,
  splitAsteroid,
} from '../src/entities.js';
import { vec, length } from '../src/vector.js';
import { WIDTH, HEIGHT, SHIP, BULLET, ASTEROID } from '../src/constants.js';

test('createShip creates ship with correct initial state', () => {
  const ship = createShip();
  assert.equal(ship.type, 'ship');
  assert.equal(ship.pos.x, WIDTH / 2);
  assert.equal(ship.pos.y, HEIGHT / 2);
  assert.equal(ship.vel.x, 0);
  assert.equal(ship.vel.y, 0);
  assert.equal(ship.angle, -Math.PI / 2);
  assert.equal(ship.radius, SHIP.radius);
  assert.equal(ship.alive, true);
});

test('createShip allows custom position', () => {
  const ship = createShip(100, 200);
  assert.equal(ship.pos.x, 100);
  assert.equal(ship.pos.y, 200);
});

test('createAsteroid creates asteroid with correct shape', () => {
  const asteroid = createAsteroid(50, 75, 'large');
  assert.equal(asteroid.type, 'asteroid');
  assert.equal(asteroid.pos.x, 50);
  assert.equal(asteroid.pos.y, 75);
  assert.equal(asteroid.radius, ASTEROID.large);
  assert.equal(asteroid.alive, true);
  // Velocity should be non-zero drift
  const velLen = length(asteroid.vel);
  assert.ok(velLen > 0);
});

test('createAsteroid has random drift velocity', () => {
  const a1 = createAsteroid(0, 0, 'medium');
  const a2 = createAsteroid(0, 0, 'medium');
  const vel1Len = length(a1.vel);
  const vel2Len = length(a2.vel);
  assert.ok(vel1Len > 0);
  assert.ok(vel2Len > 0);
  // the drift must actually be RANDOM: two asteroids should not share an identical
  // velocity vector (a hard-coded fixed drift would still pass the >0 checks above)
  assert.ok(a1.vel.x !== a2.vel.x || a1.vel.y !== a2.vel.y, 'drift velocities should differ');
});

test('createBullet creates bullet with correct initial state', () => {
  const bullet = createBullet({ x: 100, y: 200 }, 0);
  assert.equal(bullet.type, 'bullet');
  assert.equal(bullet.pos.x, 100);
  assert.equal(bullet.pos.y, 200);
  assert.equal(bullet.angle, 0);
  assert.equal(bullet.radius, BULLET.radius);
  assert.equal(bullet.alive, true);
  assert.equal(bullet.life, BULLET.life);
  // Velocity should be along angle at bullet speed
  const expectedVel = { x: BULLET.speed, y: 0 };
  assert.ok(Math.abs(bullet.vel.x - expectedVel.x) < 0.01);
  assert.ok(Math.abs(bullet.vel.y - expectedVel.y) < 0.01);
});

test('updateShip: thrust increases speed', () => {
  const ship = createShip(0, 0);
  const input = { thrust: true, left: false, right: false, fire: false };
  updateShip(ship, input, 0.1);
  const speed = length(ship.vel);
  assert.ok(speed > 0);
});

test('updateShip: friction is applied', () => {
  const ship = createShip(0, 0);
  // Give it initial velocity
  ship.vel = { x: 100, y: 0 };
  const input = { thrust: false, left: false, right: false, fire: false };
  updateShip(ship, input, 1.0);
  const speed = length(ship.vel);
  // Friction should reduce speed from 100
  assert.ok(speed < 100);
  assert.ok(speed > 0);
});

test('updateShip: max speed is clamped', () => {
  const ship = createShip(0, 0);
  // Give it velocity above max speed
  ship.vel = { x: SHIP.maxSpeed + 100, y: 0 };
  const input = { thrust: false, left: false, right: false, fire: false };
  updateShip(ship, input, 0.01);
  const speed = length(ship.vel);
  assert.ok(speed <= SHIP.maxSpeed);
});

test('updateShip: left turn changes angle', () => {
  const ship = createShip(0, 0);
  const initialAngle = ship.angle;
  const input = { thrust: false, left: true, right: false, fire: false };
  updateShip(ship, input, 0.1);
  // Angle should decrease with left turn
  assert.ok(ship.angle < initialAngle);
});

test('updateShip: right turn changes angle', () => {
  const ship = createShip(0, 0);
  const initialAngle = ship.angle;
  const input = { thrust: false, left: false, right: true, fire: false };
  updateShip(ship, input, 0.1);
  // Angle should increase with right turn
  assert.ok(ship.angle > initialAngle);
});

test('updateShip: position wraps at edges', () => {
  const ship = createShip(WIDTH - 10, HEIGHT / 2);
  ship.vel = { x: 100, y: 0 };
  const input = { thrust: false, left: false, right: false, fire: false };
  updateShip(ship, input, 1.0);
  // Should wrap to left side
  assert.ok(ship.pos.x >= 0);
  assert.ok(ship.pos.x < WIDTH);
});

test('updateAsteroid: position updates with velocity', () => {
  const asteroid = createAsteroid(100, 100, 'large');
  asteroid.vel = { x: 50, y: 0 };
  const input = { thrust: false, left: false, right: false };
  updateAsteroid(asteroid, 1.0);
  assert.equal(asteroid.pos.x, 150);
  assert.equal(asteroid.pos.y, 100);
});

test('updateAsteroid: wraps at edges', () => {
  const asteroid = createAsteroid(WIDTH - 10, HEIGHT / 2, 'large');
  asteroid.vel = { x: 100, y: 0 };
  updateAsteroid(asteroid, 1.0);
  // Should wrap to left side
  assert.ok(asteroid.pos.x >= 0);
  assert.ok(asteroid.pos.x < WIDTH);
});

test('updateBullet: position updates with velocity', () => {
  const bullet = createBullet({ x: 100, y: 100 }, 0);
  const initialX = bullet.pos.x;
  updateBullet(bullet, 0.1);
  // Should move right (velocity is positive in x)
  assert.ok(bullet.pos.x > initialX);
  assert.equal(bullet.alive, true);
});

test('updateBullet: life decreases', () => {
  const bullet = createBullet({ x: 0, y: 0 }, 0);
  const initialLife = bullet.life;
  updateBullet(bullet, 0.1);
  assert.equal(bullet.life, initialLife - 0.1);
});

test('updateBullet: becomes dead when life expires', () => {
  const bullet = createBullet({ x: 0, y: 0 }, 0);
  bullet.life = 0.05;
  updateBullet(bullet, 0.1);
  assert.equal(bullet.alive, false);
});

test('updateBullet: wraps at edges', () => {
  const bullet = createBullet({ x: WIDTH - 10, y: HEIGHT / 2 }, 0);
  bullet.vel = { x: 100, y: 0 };
  updateBullet(bullet, 1.0);
  // Should wrap to left side
  assert.ok(bullet.pos.x >= 0);
  assert.ok(bullet.pos.x < WIDTH);
});

test('splitAsteroid: large -> 2 medium', () => {
  const asteroid = createAsteroid(100, 100, 'large');
  const result = splitAsteroid(asteroid);
  assert.equal(result.length, 2);
  assert.equal(result[0].type, 'asteroid');
  assert.equal(result[0].radius, ASTEROID.medium);
  assert.equal(result[1].radius, ASTEROID.medium);
});

test('splitAsteroid: medium -> 2 small', () => {
  const asteroid = createAsteroid(100, 100, 'medium');
  const result = splitAsteroid(asteroid);
  assert.equal(result.length, 2);
  assert.equal(result[0].radius, ASTEROID.small);
  assert.equal(result[1].radius, ASTEROID.small);
});

test('splitAsteroid: small -> empty', () => {
  const asteroid = createAsteroid(100, 100, 'small');
  const result = splitAsteroid(asteroid);
  assert.equal(result.length, 0);
});

test('splitAsteroid: new asteroids are at same position', () => {
  const asteroid = createAsteroid(250, 350, 'large');
  const result = splitAsteroid(asteroid);
  result.forEach((child) => {
    assert.equal(child.pos.x, 250);
    assert.equal(child.pos.y, 350);
  });
});
