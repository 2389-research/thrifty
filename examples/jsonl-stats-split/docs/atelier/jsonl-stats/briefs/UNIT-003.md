# UNIT-003 — CLI

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.

## Objective

Produce `src/cli.js` (the CLI entry point) and `test/cli.test.js`.  
`node src/cli.js <file>` prints the stats report; exits non-zero when the file is missing.

## Inputs / context

- `CONTRACT.md` — cross-unit seam: `loadRecords(path) -> object[]` and `report(records) -> { count, coverage, types }`, both exported from `src/stats.js` (UNIT-001).
- `test/sample.jsonl` — the fixture (UNIT-002), used in the integration test.
- No other source files are owned or written by this unit.

## Approach

`src/cli.js`:
- Import `loadRecords` and `report` from `../src/stats.js` (ESM, `.js` extension).
- Read `process.argv[2]` as the file path. If absent or the file does not exist, print a short error to stderr and `process.exit(1)`.
- Call `loadRecords(path)`, pass the result to `report(records)`, then print the result as formatted JSON (`JSON.stringify(result, null, 2)`) to stdout. Exit 0.

`test/cli.test.js` (three tests using `node:test` + `node:assert`):
1. Fixture run — spawn `node src/cli.js test/sample.jsonl`, assert exit code 0, assert stdout contains `"count"`.
2. Missing file — spawn `node src/cli.js /no/such/file.jsonl`, assert exit code non-zero.
3. No args — spawn `node src/cli.js` with no args, assert exit code non-zero.

Use `node:child_process` `spawnSync` for the subprocess calls. Resolve the project root with `import.meta.url` so tests run from any cwd.

## Constraints

- **No reimplemented logic.** `src/cli.js` must import and call `loadRecords`/`report` from `src/stats.js`; it must not re-parse JSONL or compute coverage/types itself.
- **No deps.** Only Node built-ins (`node:fs`, `node:path`, `node:url`, `node:child_process`, `node:test`, `node:assert`).
- ESM throughout; use `.js` extensions on all local imports (contract convention).
- Pure functions in `src/stats.js` are not touched by this unit.
- Do not create or modify any file outside `src/cli.js` and `test/cli.test.js`.
- Output format is JSON (stdout); stderr is for error messages only.

## Acceptance criteria

> The checker scores against this list only.

- [ ] (runnable) `node --test test/cli.test.js` exits 0 and all three tests pass.
- [ ] (runnable) `node src/cli.js test/sample.jsonl` exits 0 and its stdout is valid JSON containing a `"count"` key.
- [ ] (runnable) `node src/cli.js /no/such/file.jsonl`; exit code is non-zero.
- [ ] (runnable) `node src/cli.js` (no args); exit code is non-zero.
- [ ] (assertional) `src/cli.js` contains an import of `loadRecords` and `report` from `./stats.js` (or `../src/stats.js`) — no re-implementation of parsing or statistics logic.
- [ ] (assertional) `src/cli.js` does not import any third-party module (only Node built-ins and `src/stats.js`).

## Dependencies

UNIT-001 (provides `loadRecords`/`report` at `src/stats.js`), UNIT-002 (provides `test/sample.jsonl` fixture)
