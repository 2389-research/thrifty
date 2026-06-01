import fs from 'fs';
import path from 'path';

/**
 * Load records from a JSONL file.
 * Reads the file synchronously, splits on newlines, drops blank lines,
 * and parses each remaining line as JSON.
 * @param {string} filePath - Path to the JSONL file
 * @returns {object[]} Array of parsed JSON objects
 */
export function loadRecords(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const records = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      const parsed = JSON.parse(trimmed);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Each non-blank line must be a JSON object, got: ${trimmed.slice(0, 50)}`);
      }
      records.push(parsed);
    }
  }

  return records;
}

/**
 * Generate a report on record coverage and field types.
 * @param {object[]} records - Array of records
 * @returns {object} Report with { count, coverage, types }
 *   - count: number of records
 *   - coverage: {fieldName -> fraction in [0,1]}
 *   - types: {fieldName -> {typeName -> count}}
 */
export function report(records) {
  const count = records.length;
  const coverage = {};
  const types = {};
  const fieldCounts = {};

  // First pass: collect all fields and their types
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      const typeName = typeof value;

      // Track field coverage
      if (!fieldCounts[key]) {
        fieldCounts[key] = 0;
      }
      fieldCounts[key]++;

      // Track type histogram
      if (!types[key]) {
        types[key] = {};
      }
      if (!types[key][typeName]) {
        types[key][typeName] = 0;
      }
      types[key][typeName]++;
    }
  }

  // Calculate coverage fractions
  for (const [field, count] of Object.entries(fieldCounts)) {
    coverage[field] = count / records.length;
  }

  return {
    count,
    coverage,
    types
  };
}
