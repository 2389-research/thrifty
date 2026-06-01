import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { circleHit, bulletsVsAsteroids, shipVsAsteroids } from '../src/collision.js';

test('circleHit: overlapping circles return true', () => {
  const a = { pos: { x: 0, y: 0 }, radius: 10 };
  const b = { pos: { x: 15, y: 0 }, radius: 10 };
  assert.equal(circleHit(a, b), true);
});

test('circleHit: distant circles return false', () => {
  const a = { pos: { x: 0, y: 0 }, radius: 10 };
  const b = { pos: { x: 100, y: 0 }, radius: 10 };
  assert.equal(circleHit(a, b), false);
});

test('circleHit: circles overlapping slightly return true', () => {
  const a = { pos: { x: 0, y: 0 }, radius: 10 };
  const b = { pos: { x: 19, y: 0 }, radius: 10 };
  assert.equal(circleHit(a, b), true);
});

test('bulletsVsAsteroids: returns colliding pairs', () => {
  const bullet1 = { pos: { x: 0, y: 0 }, radius: 2, alive: true };
  const bullet2 = { pos: { x: 100, y: 0 }, radius: 2, alive: true };
  const asteroid1 = { pos: { x: 10, y: 0 }, radius: 20, alive: true };
  const asteroid2 = { pos: { x: 200, y: 0 }, radius: 20, alive: true };

  const hits = bulletsVsAsteroids(
    [bullet1, bullet2],
    [asteroid1, asteroid2]
  );

  assert.equal(hits.length, 1);
  assert.equal(hits[0].bullet, bullet1);
  assert.equal(hits[0].asteroid, asteroid1);
});

test('bulletsVsAsteroids: ignores dead bullets', () => {
  const bullet1 = { pos: { x: 0, y: 0 }, radius: 2, alive: false };
  const asteroid1 = { pos: { x: 10, y: 0 }, radius: 20, alive: true };

  const hits = bulletsVsAsteroids([bullet1], [asteroid1]);

  assert.equal(hits.length, 0);
});

test('bulletsVsAsteroids: ignores dead asteroids', () => {
  const bullet1 = { pos: { x: 0, y: 0 }, radius: 2, alive: true };
  const asteroid1 = { pos: { x: 10, y: 0 }, radius: 20, alive: false };

  const hits = bulletsVsAsteroids([bullet1], [asteroid1]);

  assert.equal(hits.length, 0);
});

test('shipVsAsteroids: returns colliding asteroid', () => {
  const ship = { pos: { x: 0, y: 0 }, radius: 14, alive: true };
  const asteroid1 = { pos: { x: 25, y: 0 }, radius: 20, alive: true };
  const asteroid2 = { pos: { x: 100, y: 0 }, radius: 20, alive: true };

  const hit = shipVsAsteroids(ship, [asteroid1, asteroid2]);

  assert.equal(hit, asteroid1);
});

test('shipVsAsteroids: returns null when no collision', () => {
  const ship = { pos: { x: 0, y: 0 }, radius: 14, alive: true };
  const asteroid1 = { pos: { x: 100, y: 0 }, radius: 20, alive: true };

  const hit = shipVsAsteroids(ship, [asteroid1]);

  assert.equal(hit, null);
});

test('shipVsAsteroids: ignores dead asteroids', () => {
  const ship = { pos: { x: 0, y: 0 }, radius: 14, alive: true };
  const asteroid1 = { pos: { x: 25, y: 0 }, radius: 20, alive: false };

  const hit = shipVsAsteroids(ship, [asteroid1]);

  assert.equal(hit, null);
});

test('functions do not mutate their arguments', () => {
  const a = { pos: { x: 0, y: 0 }, radius: 10 };
  const b = { pos: { x: 15, y: 0 }, radius: 10 };
  const aOrig = JSON.stringify(a);
  const bOrig = JSON.stringify(b);

  circleHit(a, b);

  assert.equal(JSON.stringify(a), aOrig);
  assert.equal(JSON.stringify(b), bOrig);
});

test('bulletsVsAsteroids does not mutate arguments', () => {
  const bullets = [{ pos: { x: 0, y: 0 }, radius: 2, alive: true }];
  const asteroids = [{ pos: { x: 10, y: 0 }, radius: 20, alive: true }];
  const bulletsOrig = JSON.stringify(bullets);
  const asteroidsOrig = JSON.stringify(asteroids);

  bulletsVsAsteroids(bullets, asteroids);

  assert.equal(JSON.stringify(bullets), bulletsOrig);
  assert.equal(JSON.stringify(asteroids), asteroidsOrig);
});

test('shipVsAsteroids does not mutate arguments', () => {
  const ship = { pos: { x: 0, y: 0 }, radius: 14, alive: true };
  const asteroids = [{ pos: { x: 25, y: 0 }, radius: 20, alive: true }];
  const shipOrig = JSON.stringify(ship);
  const asteroidsOrig = JSON.stringify(asteroids);

  shipVsAsteroids(ship, asteroids);

  assert.equal(JSON.stringify(ship), shipOrig);
  assert.equal(JSON.stringify(asteroids), asteroidsOrig);
});
