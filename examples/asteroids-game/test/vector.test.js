import test from 'node:test';
import assert from 'node:assert/strict';
import { vec, add, sub, scale, length, normalize, rotate, fromAngle, limit, wrap } from '../src/vector.js';

test('vec constructor', () => {
  assert.deepEqual(vec(3, 4), { x: 3, y: 4 });
  assert.deepEqual(vec(), { x: 0, y: 0 });
  assert.deepEqual(vec(5), { x: 5, y: 0 });
});

test('add', () => {
  const a = { x: 1, y: 2 };
  const b = { x: 3, y: 4 };
  assert.deepEqual(add(a, b), { x: 4, y: 6 });
  // Verify no mutation
  assert.deepEqual(a, { x: 1, y: 2 });
  assert.deepEqual(b, { x: 3, y: 4 });
});

test('sub', () => {
  const a = { x: 5, y: 7 };
  const b = { x: 2, y: 3 };
  assert.deepEqual(sub(a, b), { x: 3, y: 4 });
  // Verify no mutation
  assert.deepEqual(a, { x: 5, y: 7 });
  assert.deepEqual(b, { x: 2, y: 3 });
});

test('scale', () => {
  const v = { x: 2, y: 3 };
  assert.deepEqual(scale(v, 2), { x: 4, y: 6 });
  assert.deepEqual(scale(v, 0), { x: 0, y: 0 });
  assert.deepEqual(scale(v, -1), { x: -2, y: -3 });
  // Verify no mutation
  assert.deepEqual(v, { x: 2, y: 3 });
});

test('length', () => {
  assert.equal(length({ x: 3, y: 4 }), 5);
  assert.equal(length({ x: 0, y: 0 }), 0);
  assert.equal(length({ x: 1, y: 1 }), Math.sqrt(2));
});

test('normalize', () => {
  const v = { x: 3, y: 4 };
  const normalized = normalize(v);
  assert.equal(normalized.x, 0.6);
  assert.equal(normalized.y, 0.8);
  // Verify no mutation
  assert.deepEqual(v, { x: 3, y: 4 });
});

test('normalize zero vector', () => {
  assert.deepEqual(normalize({ x: 0, y: 0 }), { x: 0, y: 0 });
});

test('rotate', () => {
  // Rotate {1, 0} by PI/2 should give approximately {0, 1}
  const v = { x: 1, y: 0 };
  const rotated = rotate(v, Math.PI / 2);
  assert.ok(Math.abs(rotated.x) < 1e-10);
  assert.ok(Math.abs(rotated.y - 1) < 1e-10);
  // Verify no mutation
  assert.deepEqual(v, { x: 1, y: 0 });
});

test('rotate by 0', () => {
  const v = { x: 3, y: 4 };
  const rotated = rotate(v, 0);
  assert.equal(rotated.x, 3);
  assert.equal(rotated.y, 4);
});

test('fromAngle', () => {
  // fromAngle(0) should give {1, 0}
  const v1 = fromAngle(0);
  assert.equal(v1.x, 1);
  assert.equal(v1.y, 0);

  // fromAngle(PI/2) should give approximately {0, 1}
  const v2 = fromAngle(Math.PI / 2);
  assert.ok(Math.abs(v2.x) < 1e-10);
  assert.ok(Math.abs(v2.y - 1) < 1e-10);

  // fromAngle with magnitude
  const v3 = fromAngle(0, 5);
  assert.equal(v3.x, 5);
  assert.equal(v3.y, 0);
});

test('limit', () => {
  const v = { x: 3, y: 4 }; // length = 5
  const limited = limit(v, 10);
  // Should not change since 5 < 10
  assert.deepEqual(limited, { x: 3, y: 4 });

  const limited2 = limit(v, 2.5);
  // Should scale down by 2.5/5 = 0.5
  assert.deepEqual(limited2, { x: 1.5, y: 2 });

  // Verify no mutation
  assert.deepEqual(v, { x: 3, y: 4 });
});

test('wrap toroidal x', () => {
  const bounds = { width: 800, height: 600 };

  // Negative x wraps to positive
  assert.deepEqual(wrap({ x: -10, y: 300 }, bounds), { x: 790, y: 300 });

  // x >= width wraps around
  assert.deepEqual(wrap({ x: 800, y: 300 }, bounds), { x: 0, y: 300 });
  assert.deepEqual(wrap({ x: 810, y: 300 }, bounds), { x: 10, y: 300 });

  // In bounds stays same
  assert.deepEqual(wrap({ x: 400, y: 300 }, bounds), { x: 400, y: 300 });
});

test('wrap toroidal y', () => {
  const bounds = { width: 800, height: 600 };

  // Negative y wraps to positive
  assert.deepEqual(wrap({ x: 400, y: -10 }, bounds), { x: 400, y: 590 });

  // y >= height wraps around
  assert.deepEqual(wrap({ x: 400, y: 600 }, bounds), { x: 400, y: 0 });
  assert.deepEqual(wrap({ x: 400, y: 610 }, bounds), { x: 400, y: 10 });

  // In bounds stays same
  assert.deepEqual(wrap({ x: 400, y: 300 }, bounds), { x: 400, y: 300 });
});

test('wrap toroidal both axes', () => {
  const bounds = { width: 800, height: 600 };
  assert.deepEqual(wrap({ x: -10, y: -10 }, bounds), { x: 790, y: 590 });
  assert.deepEqual(wrap({ x: 810, y: 610 }, bounds), { x: 10, y: 10 });
});
