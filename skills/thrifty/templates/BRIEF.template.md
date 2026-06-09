# UNIT-NNN — <unit title>

> Self-contained. An executor reads CONTRACT.md + this brief and nothing else.
> Pin within-unit detail only to the depth Haiku needs — not "every byte."

## Objective
<The single thing this unit produces.>

## Inputs / context
<Exact files, data, and prior-unit outputs to read. Be specific — paths, source
keys, the names of upstream symbols/sections this unit consumes.>

## Approach
<Prose steps at the level Haiku needs. Use pseudocode only when the task is code
and a precise sequence is load-bearing. Otherwise describe what to do, not every
keystroke. Trust Haiku for ordinary implementation choices.>

## Constraints
<What not to touch. Conventions inherited from the contract that especially apply
here. Things an executor might get wrong without being told.>

## Acceptance criteria
> The binding checklist. The checker scores against THIS — never vibes. Each item
> is concrete ("what done looks like"), and tagged runnable or assertional.

- [ ] (runnable) <command/test the checker executes, e.g. `pytest tests/x.py` passes>
- [ ] (assertional) <concrete checkable statement, e.g. "output is valid CSV with a header row">
- [ ] (assertional) <...>

## Dependencies
<unit ids this one depends on, or "none">
