# jsonl-stats — Contract

**Decomposition mode:** partition · **Planning tier:** split

## Objective
A small ESM Node package that analyzes a `.jsonl` file: record count, per-field
coverage, value-type histogram, plus a CLI. Zero deps. `package.json` has
`"type":"module"`. Tests via `node --test`.

## Conventions
- ESM, named exports, `.js` import extensions. Pure functions don't mutate inputs.
- A "record" = one parsed JSON object from one non-blank line.

## Cross-unit seam (the only thing units must agree on)
`src/stats.js` (UNIT-001) exports, and `src/cli.js` (UNIT-003) imports:
- `loadRecords(path) -> object[]`  (parse non-blank lines)
- `report(records) -> { count, coverage, types }` where `coverage` maps field →
  fraction in [0,1] of records containing it, and `types` maps field →
  { typeName → count } using `typeof`-style names.

## Ownership
- UNIT-001 → `src/stats.js`, `test/stats.test.js`
- UNIT-002 → `test/sample.jsonl` (the fixture)
- UNIT-003 → `src/cli.js` (run as `node src/cli.js <file>`), `test/cli.test.js`

## Dependency graph
UNIT-001, UNIT-002 (independent) → UNIT-003 (imports stats from 001, reads fixture from 002)
