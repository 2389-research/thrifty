# <Task name> — Contract

**Decomposition mode:** partition | relay | layered
<partition = separate regions, parallel, architect merges • relay = one shared
artifact extended segment by segment, sequential • layered = role-specialized
passes over the whole artifact, sequential>

**Planning tier:** direct | split | hybrid
<direct = the architect writes the briefs • split = the architect writes terse
UNIT-SPECS, Sonnet brief-writers expand them • hybrid = the architect writes the
subtle units, delegates the rest>

> The cross-unit architectural surface. Pin only what crosses a unit boundary —
> the seams, not the interiors. Test for every line: *would two independent
> executors have to agree on this for their outputs to fit together?* If no, it
> belongs in a brief, not here.

## Objective
<2-4 sentences: what the whole task achieves and the units it breaks into.>

## Conventions
<Shared decisions every unit must honor: naming, formats, error handling, style,
tone, citation scheme — whatever is domain-appropriate. Reference existing
project conventions rather than redefining them.>

## Interfaces (cross-unit)
<The exact shapes that cross unit boundaries: function signatures, data schemas,
file formats, shared section structures, shared keys. Name which unit owns each.>

## Glossary
<Terminology pinned to one meaning. Source keys, domain terms, scope boundaries.>

## Ownership map
- UNIT-001 → <file or output it owns/creates/modifies>
- UNIT-002 → <...>
- UNIT-003 → <...>

## Dependency graph
<List edges. Independent units may run in parallel; dependents wait.>

```text
UNIT-001, UNIT-002   (independent)
        ↓
UNIT-003             (depends on 001, 002)
```

## Fix-loop overrides (optional)
<Only if defaults need changing. Defaults: surgical ≤2, redo ≤1, replan ≤1.>
