# Benchmark 01 — wordfreq (small)

Build a small Node ESM package `wordfreq` (zero deps, `package.json` has
`"type":"module"`, tests via `node --test`). It analyzes a UTF-8 text file.

## Requirements
- `src/wordfreq.js` exports:
  - `tokenize(text) -> string[]` — lowercase words, split on non-letters, drop empties.
  - `topWords(text, n = 10) -> {word, count}[]` — the n most frequent words, count desc
    (ties broken alphabetically).
  - `stats(text) -> { total, unique }` — total word count and distinct-word count.
- `src/cli.js` — `node src/cli.js <file> [n]` prints the top-n words and the stats;
  missing file exits non-zero.
- Tests in `test/` covering tokenize (punctuation, case), topWords (ordering + ties),
  stats, and a CLI integration test against a small fixture you create.

## Done = 
`node --test` passes; `node src/cli.js <somefile>` prints output and exits 0;
missing-file exits non-zero.
