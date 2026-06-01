import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRecords, report } from '../src/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('loadRecords - basic JSONL parsing', async (t) => {
  // Create a temporary fixture file
  const tempFile = path.join(__dirname, 'temp-fixture.jsonl');
  const fixtureContent = `{"name":"Alice","age":30}
{"name":"Bob","age":25}
{"name":"Charlie","score":95}`;

  fs.writeFileSync(tempFile, fixtureContent);

  try {
    const records = loadRecords(tempFile);
    assert.strictEqual(records.length, 3);
    assert.deepStrictEqual(records[0], { name: 'Alice', age: 30 });
    assert.deepStrictEqual(records[1], { name: 'Bob', age: 25 });
    assert.deepStrictEqual(records[2], { name: 'Charlie', score: 95 });
  } finally {
    fs.unlinkSync(tempFile);
  }
});

test('loadRecords - skips blank lines', async (t) => {
  const tempFile = path.join(__dirname, 'temp-blank.jsonl');
  const fixtureContent = `{"id":1}

{"id":2}


{"id":3}
`;

  fs.writeFileSync(tempFile, fixtureContent);

  try {
    const records = loadRecords(tempFile);
    assert.strictEqual(records.length, 3);
    assert.deepStrictEqual(records.map(r => r.id), [1, 2, 3]);
  } finally {
    fs.unlinkSync(tempFile);
  }
});

test('report - count', async (t) => {
  const records = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ];

  const result = report(records);
  assert.strictEqual(result.count, 2);
});

test('report - coverage fractions', async (t) => {
  // Create records where fields have partial coverage
  const records = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Charlie', age: 35, email: 'charlie@example.com' }
  ];

  const result = report(records);

  // All 3 records have "name"
  assert.strictEqual(result.coverage.name, 1.0);

  // 2 of 3 records have "age"
  assert.strictEqual(result.coverage.age, 2 / 3);

  // 2 of 3 records have "email"
  assert.strictEqual(result.coverage.email, 2 / 3);

  // Coverage values are in [0, 1]
  for (const value of Object.values(result.coverage)) {
    assert(value >= 0 && value <= 1);
  }
});

test('report - types histogram', async (t) => {
  const records = [
    { id: 1, name: 'Alice', active: true, tags: ['a', 'b'] },
    { id: 2, name: 'Bob', active: false, meta: { score: 100 } },
    { id: 3, name: 'Charlie', score: 95 }
  ];

  const result = report(records);

  // "id" should have only "number" type
  assert.deepStrictEqual(result.types.id, { number: 3 });

  // "name" should have only "string" type
  assert.deepStrictEqual(result.types.name, { string: 3 });

  // "active" should have only "boolean" type (in 2 records)
  assert.deepStrictEqual(result.types.active, { boolean: 2 });

  // "tags" should have only "object" type (arrays are typeof "object")
  assert.deepStrictEqual(result.types.tags, { object: 1 });

  // "meta" should have only "object" type
  assert.deepStrictEqual(result.types.meta, { object: 1 });

  // "score" field appears with "number" type in record 3
  assert.deepStrictEqual(result.types.score, { number: 1 });
});

test('report - multi-type histogram', async (t) => {
  // Create a record where one field has multiple types
  const records = [
    { value: 42 },
    { value: 'hello' },
    { value: true },
    { value: { nested: true } }
  ];

  const result = report(records);

  assert.deepStrictEqual(result.types.value, {
    number: 1,
    string: 1,
    boolean: 1,
    object: 1
  });
});

test('report - does not mutate input records', async (t) => {
  const records = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ];

  // Deep copy for comparison
  const originalRecords = JSON.parse(JSON.stringify(records));

  report(records);

  // Verify records are unchanged
  assert.deepStrictEqual(records, originalRecords);
});

test('report - return shape validation', async (t) => {
  const records = [{ field: 'value' }];
  const result = report(records);

  // Check that result has exactly the required keys
  assert(result.hasOwnProperty('count'));
  assert(result.hasOwnProperty('coverage'));
  assert(result.hasOwnProperty('types'));

  // Check types of each field
  assert.strictEqual(typeof result.count, 'number');
  assert.strictEqual(typeof result.coverage, 'object');
  assert.strictEqual(typeof result.types, 'object');
});

test('report - empty records', async (t) => {
  const records = [];
  const result = report(records);

  assert.strictEqual(result.count, 0);
  assert.deepStrictEqual(result.coverage, {});
  assert.deepStrictEqual(result.types, {});
});
