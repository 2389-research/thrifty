import test from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Fixture run: node src/cli.js test/sample.jsonl', (t) => {
  const result = spawnSync('node', ['src/cli.js', 'test/sample.jsonl'], {
    cwd: projectRoot,
    encoding: 'utf-8'
  });

  assert.strictEqual(result.status, 0, `Expected exit code 0, got ${result.status}`);
  assert.match(result.stdout, /"count"/, 'stdout should contain "count"');
});

test('Missing file: node src/cli.js /no/such/file.jsonl', (t) => {
  const result = spawnSync('node', ['src/cli.js', '/no/such/file.jsonl'], {
    cwd: projectRoot,
    encoding: 'utf-8'
  });

  assert.notStrictEqual(result.status, 0, `Expected non-zero exit code, got ${result.status}`);
});

test('No args: node src/cli.js', (t) => {
  const result = spawnSync('node', ['src/cli.js'], {
    cwd: projectRoot,
    encoding: 'utf-8'
  });

  assert.notStrictEqual(result.status, 0, `Expected non-zero exit code, got ${result.status}`);
});
