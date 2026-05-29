# Benchmark 02 — taskstore (medium)

Build a Node ESM package `taskstore` (zero deps, `"type":"module"`, tests via
`node --test`): an in-memory task list with JSON persistence and a CLI.

## Requirements
- `src/model.js` — a task is `{ id, title, done, createdAt }`. Export
  `makeTask(title, id, now) -> task` and `validate(task) -> true | throws`.
- `src/store.js` — `createStore() -> store` plus pure-ish operations:
  `add(store, title)`, `get(store, id)`, `list(store)`, `complete(store, id)`,
  `filter(store, {done})`. Unknown id throws a clear error.
- `src/persist.js` — `save(store, storage)` / `load(storage) -> store`, where
  `storage` is an injected object with `getItem/setItem` (default in-memory); JSON
  round-trips faithfully. No direct filesystem/localStorage in the module body.
- `src/cli.js` — `node src/cli.js <add|list|done> [args]` against a JSON file;
  prints results; bad usage exits non-zero.
- Tests in `test/` for model validation, every store op (incl. the unknown-id error),
  a persist round-trip through a fake storage, and a CLI integration test.

## Done = 
`node --test` passes; the CLI add→list→done flow works against a temp JSON file;
bad usage exits non-zero.
