# Benchmark 06 — ledger (complex, multi-module Python)

Cross-language **complexity** probe: a larger, genuinely multi-module Python build with
real coupling and domain invariants — to separate "atelier's win is thin on Python"
from "atelier's win is thin on *small* tasks." This is jqlite-scale, in Python.

Build a Python package `ledger` (stdlib only, tests via `pytest`): a **double-entry
bookkeeping** engine with a chart of accounts, balanced journal entries, account
balances, a trial balance, and derived financial reports.

## Domain rules (the real logic — get these right)
- Five account types: `ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE`.
- **Normal balance side**: debit-normal = {ASSET, EXPENSE}; credit-normal =
  {LIABILITY, EQUITY, INCOME}. An account's balance = (sum of debits − sum of credits)
  if debit-normal, else (sum of credits − sum of debits). A normal positive balance is
  thus non-negative for a well-behaved book.
- A **journal entry** is a dated description plus ≥2 postings; each posting is
  `(account, debit, credit)` with exactly one of debit/credit > 0 and the other 0.
  An entry is valid only if `sum(debits) == sum(credits)` and the total is > 0
  (double-entry invariant). Use integer cents for money (no floats).

## Requirements (each a natural module/unit)
- `ledger/accounts.py` — `AccountType` (enum or constants), `normal_side(type) -> "debit"|"credit"`,
  and `Account(code, name, type)`. A `ChartOfAccounts` with `add(account)` and
  `get(code) -> Account` (unknown code raises `KeyError`/a clear error).
- `ledger/journal.py` — `Posting(account_code, debit, credit)` and
  `Entry(date, description, postings)`. `validate(entry) -> True | raises` enforcing the
  one-side-only and balanced invariants above with clear error messages.
- `ledger/book.py` — `Book(chart)` with `post(entry)` (validates, then records),
  `balance(code) -> int` (signed per normal side), `balances() -> dict[code, int]`,
  and `trial_balance() -> {"debits": int, "credits": int, "balanced": bool}` (total
  debit-side vs credit-side across all accounts; balanced iff equal). Posting to an
  unknown account code raises.
- `ledger/reports.py` — `balance_sheet(book) -> {"assets","liabilities","equity","balanced"}`
  and `income_statement(book) -> {"income","expenses","net_income"}` (net = income − expenses),
  both computed from account balances. IMPORTANT (pin this — it is the one genuinely
  ambiguous decision): `equity` in the balance sheet is the sum of equity-account balances
  **PLUS net income** (income − expenses, i.e. retained earnings rolled in). With that
  definition `balanced` is `assets == liabilities + equity`, which holds for any
  well-formed posted book. Do NOT report raw equity-account balances alone — that would
  break the accounting equation.
- `ledger/__main__.py` — `python -m ledger <file.json>` where the JSON has
  `{"accounts":[{code,name,type}], "entries":[{date,description,postings:[{account,debit,credit}]}]}`.
  Loads the book, posts all entries, and prints the trial balance + both reports.
  A missing file, malformed JSON, or an invalid/unbalanced entry exits non-zero with a
  message on stderr.
- `tests/` (pytest) covering: normal-side mapping for all five types; entry validation
  (balanced ok; unbalanced raises; both-sides-nonzero raises); posting + per-account
  balance with correct sign; trial balance balanced on a real multi-entry book;
  balance sheet satisfies assets == liabilities + equity; income statement net; the
  unknown-account error; and a CLI integration test over a fixture JSON you create.

## Done =
`python -m pytest` passes; `python -m ledger <fixture.json>` prints a balanced trial
balance plus the two reports and exits 0; malformed input / unbalanced entry exits
non-zero.
