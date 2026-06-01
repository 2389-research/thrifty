import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, topWords, stats } from '../src/wordfreq.js';

test('tokenize - basic functionality', () => {
  const result = tokenize('Hello World');
  assert.deepEqual(result, ['hello', 'world']);
});

test('tokenize - handles punctuation', () => {
  const result = tokenize('Hello, World! How are you?');
  assert.deepEqual(result, ['hello', 'world', 'how', 'are', 'you']);
});

test('tokenize - converts to lowercase', () => {
  const result = tokenize('HELLO world HeLLo');
  assert.deepEqual(result, ['hello', 'world', 'hello']);
});

test('tokenize - drops empty strings', () => {
  const result = tokenize('Hello...World');
  assert.deepEqual(result, ['hello', 'world']);
});

test('tokenize - handles mixed punctuation and numbers', () => {
  const result = tokenize('Hello123World!!!456Test');
  assert.deepEqual(result, ['hello', 'world', 'test']);
});

test('topWords - returns top N words by frequency', () => {
  const text = 'apple apple apple banana banana cherry';
  const result = topWords(text, 3);
  assert.equal(result.length, 3);
  assert.equal(result[0].word, 'apple');
  assert.equal(result[0].count, 3);
  assert.equal(result[1].word, 'banana');
  assert.equal(result[1].count, 2);
  assert.equal(result[2].word, 'cherry');
  assert.equal(result[2].count, 1);
});

test('topWords - sorts alphabetically for ties (ascending)', () => {
  const text = 'apple banana cherry date';
  const result = topWords(text, 4);
  assert.deepEqual(
    result.map(r => r.word),
    ['apple', 'banana', 'cherry', 'date']
  );
});

test('topWords - sorts alphabetically for ties (reverse alphabet)', () => {
  const text = 'zebra yankee xray whiskey';
  const result = topWords(text, 4);
  assert.deepEqual(
    result.map(r => r.word),
    ['whiskey', 'xray', 'yankee', 'zebra']
  );
});

test('topWords - default n is 10', () => {
  const words = Array.from({ length: 15 }, (_, i) => String.fromCharCode(97 + i)).join(' ');
  const result = topWords(words);
  assert.equal(result.length, 10);
});

test('topWords - n larger than unique words', () => {
  const text = 'one two three';
  const result = topWords(text, 10);
  assert.equal(result.length, 3);
});

test('topWords - complex frequency ordering with alphabetical tie-break', () => {
  const text = 'charlie alpha bravo charlie alpha bravo echo delta delta';
  // charlie: 2, alpha: 2, bravo: 2, delta: 2, echo: 1
  const result = topWords(text, 5);
  assert.equal(result[0].count, 2);
  assert.equal(result[1].count, 2);
  assert.equal(result[2].count, 2);
  assert.equal(result[3].count, 2);
  assert.equal(result[4].count, 1);
  // Verify alphabetical ordering among the tied words
  assert.deepEqual(
    result.slice(0, 4).map(r => r.word),
    ['alpha', 'bravo', 'charlie', 'delta']
  );
});

test('topWords - zero count results in empty array', () => {
  const result = topWords('', 10);
  assert.deepEqual(result, []);
});

test('stats - total and unique counts', () => {
  const text = 'hello world hello';
  const result = stats(text);
  assert.equal(result.total, 3);
  assert.equal(result.unique, 2);
});

test('stats - empty text', () => {
  const result = stats('');
  assert.equal(result.total, 0);
  assert.equal(result.unique, 0);
});

test('stats - single word repeated', () => {
  const result = stats('test test test test');
  assert.equal(result.total, 4);
  assert.equal(result.unique, 1);
});

test('stats - all unique words', () => {
  const text = 'apple banana cherry date elderberry';
  const result = stats(text);
  assert.equal(result.total, 5);
  assert.equal(result.unique, 5);
});

test('stats - punctuation and case insensitivity', () => {
  const text = 'Hello, hello! HELLO?';
  const result = stats(text);
  assert.equal(result.total, 3);
  assert.equal(result.unique, 1);
});
