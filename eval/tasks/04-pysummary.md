# Benchmark 04 — pysummary (generality probe: Python)

Cross-language probe — same shape of work as the JS tasks, different stack, to check
atelier isn't tuned to one language and Haiku's JS idiom isn't carrying the result.

Build a small Python package `pysummary` (stdlib only, tests via `pytest`): summarize
a CSV file.

## Requirements
- `pysummary/core.py`:
  - `load_rows(path) -> list[dict]` — parse a CSV with a header row (stdlib `csv`).
  - `column_types(rows) -> dict[str, str]` — per column, `"number"` if every non-empty
    value parses as float, else `"text"`.
  - `summary(rows) -> dict` — `{ "count": int, "columns": column_types(...),
    "numeric": { col: {"min","max","mean"} for number columns } }`.
- `pysummary/__main__.py` — `python -m pysummary <file.csv>` prints the summary;
  missing file exits non-zero.
- `tests/` (pytest) covering load_rows, column_types (mixed/empty cells), summary
  numeric stats, and a CLI integration test against a fixture CSV you create.

## Done = 
`python -m pytest` passes; `python -m pysummary <file.csv>` prints a summary and
exits 0; missing file exits non-zero.
