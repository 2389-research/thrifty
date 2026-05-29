# UNIT-001 — stats core

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.
> Pin within-unit detail only to the depth Haiku needs — not "every byte."

## Objective

Implement `src/stats.js` — the cross-unit seam functions `loadRecords` and
`report`, plus any small local helpers — and a passing test suite at
`test/stats.test.js`.

## Inputs / context

- `CONTRACT.md` — read the "Cross-unit seam" section for the exact signatures
  this unit must export. Do not restate or alter them here; the contract is
  authoritative.
- No upstream unit outputs: UNIT-001 has no deps.

## Approach

Standard file-parse + aggregation pattern. Haiku knows it; keep it terse.

1. `loadRecords(path)` — read the file synchronously (or with top-level await),
   split on newlines, drop blank lines, `JSON.parse` each remaining line, return
   the array of objects.
2. `report(records)` — single pass (or a couple of clean passes) over records:
   - `count`: `records.length`
   - `coverage`: for every key seen across all records, fraction of records that
     contain it (field present in 1 of 2 records → `0.5`).
   - `types`: for every key, a map of `typeof`-style names to occurrence counts
     across all records where the key is present.
3. Export both functions as named ESM exports. No default export needed.
4. Write `test/stats.test.js` using `node:test` + `node:assert`. Cover at least:
   - `loadRecords` on a small inline fixture (write a temp file or use a
     fixture string — no dep on UNIT-002's file).
   - `report` on a hand-crafted records array: verify `count`, a coverage
     fraction < 1, and a multi-type `types` map.

## Constraints

- **Zero deps.** No npm packages. `fs`, `path`, `node:test`, `node:assert` only.
- **ESM.** `package.json` has `"type":"module"`; use `.js` import extensions.
- **Pure functions.** `report` must not mutate its input array or any record.
- **Contract seam is frozen.** The exported signatures — `loadRecords(path) ->
  object[]` and `report(records) -> { count, coverage, types }` — are owned by
  the contract. Do not alter their shapes or names.
- **Do not touch** `src/cli.js`, `test/cli.test.js`, `test/sample.jsonl`, or
  anything outside the owned files.

## Acceptance criteria

> The binding checklist. The checker scores against THIS — never vibes.

- [ ] (runnable) `node --test test/stats.test.js` exits 0 with all subtests
  passing.
- [ ] (assertional) `loadRecords` is a named export in `src/stats.js`.
- [ ] (assertional) `report` is a named export in `src/stats.js`.
- [ ] (assertional) `report` return value has exactly the shape `{ count,
  coverage, types }` as specified in CONTRACT.md "Cross-unit seam" — no extra
  top-level keys required, no missing keys allowed.
- [ ] (assertional) Coverage values are fractions in [0, 1]: a field present in
  k of n records has coverage k/n (e.g. 1 of 2 → 0.5, not 1).
- [ ] (assertional) `types` maps each field to `{ [typeofName]: count }` using
  `typeof`-style names (e.g. `"string"`, `"number"`, `"boolean"`, `"object"`).
- [ ] (assertional) `report` does not mutate its input: the records array and
  individual record objects are unchanged after the call.
- [ ] (assertional) No `import` of any third-party package in `src/stats.js` or
  `test/stats.test.js`; only Node built-ins.

## Dependencies

none
