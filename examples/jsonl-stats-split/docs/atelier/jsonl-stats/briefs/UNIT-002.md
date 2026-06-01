# UNIT-002 — fixture

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.

## Objective
Create `test/sample.jsonl` — a small valid JSONL fixture that exercises the stats
functions with coverage < 1 on at least one field and mixed value types.

## Inputs / context
- `CONTRACT.md` — defines what a "record" is (one parsed JSON object per non-blank
  line), and the `coverage` shape (field → fraction in [0,1]).
- No upstream unit output needed; this unit has no deps.

## Approach
Write `test/sample.jsonl` manually. Each non-blank line must be valid, standalone
JSON (an object). Design the records so:
1. At least 5 records total.
2. At least one field is missing from some records (so its coverage fraction < 1).
3. At least two different value types appear across the file (e.g., string, number,
   boolean, null) — spread across different fields or the same field in different
   records.

Keep the fixture small (5–8 records, 3–5 fields). No trailing blank lines required,
but blank lines are allowed (they will be skipped by `loadRecords`).

## Constraints
- File path must be exactly `test/sample.jsonl` (owned by this unit per CONTRACT.md).
- Each non-blank line must parse as a JSON object (not array, not primitive).
- Do not add any `src/` files or test runner files — this unit owns only the fixture.
- Do not define or alter any cross-unit interfaces; this unit has no seam.

## Acceptance criteria

- [ ] (assertional) `test/sample.jsonl` exists at the repo root under `test/`.
- [ ] (runnable) Every non-blank line parses as valid JSON: `node -e "const fs=require('fs'); fs.readFileSync('test/sample.jsonl','utf8').split('\n').filter(l=>l.trim()).forEach(l=>JSON.parse(l)); console.log('ok')"` exits 0.
- [ ] (assertional) File contains at least 5 non-blank lines (records).
- [ ] (assertional) At least one field is absent from at least one record, so its coverage fraction computed by `report` would be < 1 (not every record has every field).
- [ ] (assertional) At least two distinct `typeof`-style value types appear in the data (e.g., `"string"` and `"number"`, or `"boolean"` and `"number"`), ensuring `types` histograms are non-trivial.
- [ ] (assertional) Every non-blank line is a JSON object (not an array or primitive).

## Dependencies
none
