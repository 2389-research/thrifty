import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScore, scoreForSize, addPoints } from '../src/scoring.js';
import { createLeaderboard, addScore, getTop, LB_KEY } from '../src/leaderboard.js';

test('createScore initializes with value=0, multiplier=1', () => {
  const score = createScore();
  assert.equal(score.value, 0);
  assert.equal(score.multiplier, 1);
});

test('scoreForSize returns correct values from ASTEROID_SCORES', () => {
  assert.equal(scoreForSize('large'), 20);
  assert.equal(scoreForSize('medium'), 50);
  assert.equal(scoreForSize('small'), 100);
});

test('addPoints adds score to value, respecting multiplier', () => {
  const score = createScore();
  addPoints(score, 'large');
  assert.equal(score.value, 20);

  addPoints(score, 'medium');
  assert.equal(score.value, 70); // 20 + 50

  score.multiplier = 2;
  addPoints(score, 'small');
  assert.equal(score.value, 270); // 70 + (100 * 2)
});

test('createLeaderboard uses default in-memory storage when none provided', () => {
  const lb = createLeaderboard();
  assert.ok(lb.storage);
  assert.ok(lb.storage.getItem);
  assert.ok(lb.storage.setItem);
});

test('addScore inserts entry and persists via storage', () => {
  const lb = createLeaderboard();
  addScore(lb, 'Alice', 1000);
  addScore(lb, 'Bob', 1500);

  const stored = lb.storage.getItem(LB_KEY);
  assert.ok(stored);
  const entries = JSON.parse(stored);
  assert.equal(entries.length, 2);
});

test('getTop returns entries sorted by score descending, limited to n', () => {
  const lb = createLeaderboard();
  addScore(lb, 'Alice', 1000);
  addScore(lb, 'Bob', 1500);
  addScore(lb, 'Charlie', 800);

  const top2 = getTop(lb, 2);
  assert.equal(top2.length, 2);
  assert.equal(top2[0].name, 'Bob');
  assert.equal(top2[0].score, 1500);
  assert.equal(top2[1].name, 'Alice');
  assert.equal(top2[1].score, 1000);
});

test('getTop returns all entries when n is larger than list size', () => {
  const lb = createLeaderboard();
  addScore(lb, 'Alice', 1000);
  addScore(lb, 'Bob', 1500);

  const top = getTop(lb, 10);
  assert.equal(top.length, 2);
});

test('getTop returns empty array when no scores exist', () => {
  const lb = createLeaderboard();
  const top = getTop(lb, 10);
  assert.deepEqual(top, []);
});

test('leaderboard round-trips through fake storage', () => {
  const fakeStorage = {
    data: {},
    getItem(key) {
      return this.data[key];
    },
    setItem(key, value) {
      this.data[key] = value;
    }
  };

  const lb = createLeaderboard(fakeStorage);
  addScore(lb, 'Alice', 1000);
  addScore(lb, 'Bob', 1500);

  const stored = fakeStorage.getItem(LB_KEY);
  assert.ok(stored);

  const parsed = JSON.parse(stored);
  assert.equal(parsed[0].name, 'Bob');
  assert.equal(parsed[0].score, 1500);
  assert.equal(parsed[1].name, 'Alice');
  assert.equal(parsed[1].score, 1000);
});
