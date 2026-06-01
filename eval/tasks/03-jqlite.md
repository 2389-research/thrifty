# Benchmark 03 — jqlite (large)

Build a Node ESM package `jqlite` (zero deps, `"type":"module"`, tests via
`node --test`): a tiny JSON path-query tool (a minimal jq). This is the large,
multi-module benchmark.

## Query language (keep it small but real)
A path is a dot/bracket chain over parsed JSON, e.g.:
`.users[0].name` · `.items[].price` · `.meta.tags[1]` · `.` (identity).
`[]` (no index) maps over every element of an array. Numeric indices select one
element. Out-of-range / missing keys yield `null` (or are skipped for `[]` mapping).

## Requirements (each a natural module/unit)
- `src/lexer.js` — `tokenize(query) -> token[]` (dots, idents, `[`, `]`, ints, `[]`).
- `src/parser.js` — `parse(tokens) -> step[]` (a list of path steps: key | index | iterate).
- `src/evaluator.js` — `query(data, steps) -> result` applying steps to parsed JSON,
  with the mapping/indexing/null semantics above.
- `src/format.js` — `format(value) -> string` (pretty JSON; scalars bare).
- `src/cli.js` — `node src/cli.js '<query>' <file.json>` parses the file, runs the
  query, prints formatted output; parse errors / missing file exit non-zero.
- Tests in `test/` for the lexer, parser, evaluator (key, index, `[]` mapping,
  missing→null), formatter, and a CLI integration test over a fixture JSON you create.

## Done = 
`node --test` passes; `node src/cli.js '.users[].name' data.json` prints the mapped
names; bad query / missing file exits non-zero.
