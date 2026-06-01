import test from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';

test('CLI with valid file exits 0 and outputs top words', () => {
  const result = execFileSync('node', ['src/cli.js', 'test/fixtures/sample.txt'], {
    encoding: 'utf-8'
  });

  assert(result.includes(':'), 'Output should contain word:count format');
  assert(result.includes('Stats:'), 'Output should contain stats');
});

test('CLI with missing file exits non-zero', () => {
  assert.throws(
    () => {
      execFileSync('node', ['src/cli.js', 'nonexistent.txt'], {
        encoding: 'utf-8'
      });
    },
    (error) => error.status !== 0,
    'Missing file should cause non-zero exit'
  );
});
