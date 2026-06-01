# jsonl_stats — Contract

## Objective
Build a small Python package `jsonl_stats` that analyzes a JSON Lines file and
reports record count, per-field coverage, and a per-field value-type histogram.
Three units: the core stats module (+ unit tests), a test fixture file, and the
CLI (+ integration test). Plain stdlib only.

## Conventions
- Python 3.11+ stdlib only. No third-party runtime deps. Tests use `pytest`.
- Package lives at `jsonl_stats/` with `__init__.py`. Tests live at `tests/`.
- All public functions have type hints and a one-line docstring.
- A "record" is one parsed JSON object (a `dict`) from one non-empty line.
- Blank lines in the input are skipped, not counted as records.

## Interfaces (cross-unit)
These signatures are the seam between UNIT-001 (defines) and UNIT-003 (consumes).
Pin them exactly:

```python
# jsonl_stats/core.py  — owned by UNIT-001
def load_records(path: str) -> list[dict]: ...
    # parse a .jsonl file into a list of dicts; skip blank lines

def count_records(records: list[dict]) -> int: ...

def field_coverage(records: list[dict]) -> dict[str, float]: ...
    # field name -> fraction of records (0.0–1.0) that contain that field

def type_histogram(records: list[dict]) -> dict[str, dict[str, int]]: ...
    # field name -> { python_type_name -> count } over records that have the field
    # type name is type(value).__name__ (e.g. "int", "str", "float", "bool", "NoneType", "list", "dict")
```

Report dict shape (returned by `build_report`, also UNIT-001):

```python
def build_report(records: list[dict]) -> dict: ...
    # {"count": int, "coverage": dict[str,float], "types": dict[str,dict[str,int]]}
```

## Glossary
- "coverage" = fraction of records containing a field, in [0.0, 1.0]. NOT a count.
- "fixture" = the sample JSONL file at `tests/sample.jsonl`.

## Ownership map
- UNIT-001 → `jsonl_stats/__init__.py`, `jsonl_stats/core.py`, `tests/test_core.py`
- UNIT-002 → `tests/sample.jsonl`
- UNIT-003 → `jsonl_stats/__main__.py`, `tests/test_cli.py`

## Dependency graph
```text
UNIT-001, UNIT-002   (independent — run in parallel)
        ↓
UNIT-003             (CLI imports core from 001; integration test reads fixture from 002)
```

## Fix-loop overrides
None. Defaults apply (surgical ≤2, redo ≤1, replan ≤1).
