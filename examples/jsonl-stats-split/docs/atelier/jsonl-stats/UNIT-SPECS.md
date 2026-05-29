# Unit Specs — jsonl-stats (split tier)

## UNIT-001 — stats core
- Objective: implement `loadRecords` + `report` (the seam) plus any small helpers.
- Owns: src/stats.js, test/stats.test.js
- Deps: none
- Criteria-intent: `node --test test/stats.test.js` passes; coverage is a fraction
  (field in 1 of 2 records → 0.5, not a count); types keyed by value type name.

## UNIT-002 — fixture
- Objective: a small valid .jsonl fixture exercising the stats.
- Owns: test/sample.jsonl
- Deps: none
- Criteria-intent: ≥5 records, valid JSON per line, at least one field missing from
  some records (so coverage < 1), mixed value types.

## UNIT-003 — CLI
- Objective: `node src/cli.js <file>` prints the report; errors non-zero on a
  missing file.
- Owns: src/cli.js, test/cli.test.js
- Deps: UNIT-001 (imports loadRecords/report), UNIT-002 (integration test reads fixture)
- Criteria-intent: CLI on the fixture exits 0 and prints the count; `node --test
  test/cli.test.js` passes; missing file exits non-zero; imports stats from UNIT-001
  (no reimplemented logic).
