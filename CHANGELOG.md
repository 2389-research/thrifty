# Changelog

All notable changes to atelier are recorded here. Versioning is [SemVer](https://semver.org/):
the `version` in `.claude-plugin/plugin.json` is the source of truth, and **every release
bumps it** so `/plugin` installs pick the change up cleanly.

- **MAJOR** — a breaking change to the skill contract (renamed/removed skill, changed
  invocation, incompatible dispatch interface).
- **MINOR** — new capability or a backwards-compatible behavior/doc change.
- **PATCH** — fixes and small corrections, no behavior change.

## [0.2.0]

- Packaged as a Claude Code plugin: added `.claude-plugin/marketplace.json` so the repo
  is installable via `/plugin marketplace add 2389-research/atelier` +
  `/plugin install atelier@atelier`. Enriched `plugin.json` metadata.
- Corrected the model framing throughout the skills: the architect/director tier is
  **Sonnet**, not Opus. atelier executes a spec you bring (authored however); Opus is the
  baseline it beats, not a tier it runs. Reframed split tier's rationale to parallelism +
  lean architect context.
- Stopped tracking compiled Python bytecode; gitignored `__pycache__/` + `*.pyc`.

## [0.1.0]

- Initial release. Tiered-delegation execution (spec → Sonnet contract + sprints → Haiku
  executes + self-verifies → scoped Sonnet fix). Benchmarked ~64% cheaper than
  Opus-from-spec at equal gate quality across 7 tasks (JS / Python / Go / prose). See
  `eval/RESULTS.md` and `experiments/`.
