# wordfreq — contract (cross-unit decisions)

ESM, zero deps, package.json has "type":"module". Tests via `node --test`.
Named exports, `.js` import extensions. Pure functions don't mutate inputs.

## Cross-unit seam (src/wordfreq.js exports; src/cli.js imports)
- tokenize(text) -> string[]   : lowercase, split on non-letters, drop empties
- topWords(text, n=10) -> {word,count}[] : n most frequent, count DESC, ties alphabetical
- stats(text) -> {total, unique}

## Ownership
UNIT-001 -> src/wordfreq.js, test/wordfreq.test.js
UNIT-002 -> test/fixtures/sample.txt
UNIT-003 -> src/cli.js, test/cli.test.js   (deps: 001 imports, 002 fixture)
