# Changelog

All notable changes to atelier are recorded here. Versioning is [SemVer](https://semver.org/):
the `version` in `.claude-plugin/plugin.json` is the source of truth, and **every release
bumps it** so `/plugin` installs pick the change up cleanly.

- **MAJOR** — a breaking change to the skill contract (renamed/removed skill, changed
  invocation, incompatible dispatch interface).
- **MINOR** — new capability or a backwards-compatible behavior/doc change.
- **PATCH** — fixes and small corrections, no behavior change.

## [0.3.0]

- **Dispatch executor is now always Haiku.** Code generation never escalates to Sonnet:
  the planner is instructed to decompose each sprint to Haiku-executable granularity (and
  to *split* a too-hard unit rather than assign a stronger executor), and `execute()` runs
  every generate sprint on Haiku regardless of any tier the plan wrote. Sonnet is reserved
  for planning and the bounded post-gate fix loop. Rationale: on a real multi-module build,
  the planner had been promoting the coupled sprints (engine, tests, UI) to Sonnet — one
  Sonnet test sprint alone was 77% of execution cost. Forcing Haiku for all codegen cut a
  representative build from $1.23 → $0.86 total at equal verified quality (gate green, 100%
  engine branch coverage). The point of planning is Haiku-sized sprints; escalating the
  executor is the planner punting.
- **Retry transient model-call failures.** `claude -p` intermittently exits `rc!=0`
  (transient API/rate/network blip) or returns unparseable output; `call_model` now
  retries once before giving up, so a single flaky call can no longer silently drop a
  plan or a sprint's artifact.

## [0.2.0]

- Packaged as a Claude Code plugin: added `.claude-plugin/marketplace.json` so the repo
  is installable via `/plugin marketplace add 2389-research/atelier` +
  `/plugin install atelier@atelier`. Enriched `plugin.json` metadata.
- Corrected the model framing throughout the skills: the architect/director tier is
  **Sonnet**, not Opus. atelier executes a spec you bring (authored however); Opus is the
  baseline it beats, not a tier it runs. Reframed split tier's rationale to parallelism +
  lean architect context.
- Stopped tracking compiled Python bytecode; gitignored `__pycache__/` + `*.pyc`.
- Added an MIT `LICENSE` (matches the 2389 plugin marketplace convention) and set
  `license: "MIT"` in the manifests.

## [0.1.0]

- Initial release. Tiered-delegation execution (spec → Sonnet contract + sprints → Haiku
  executes + self-verifies → scoped Sonnet fix). Benchmarked ~64% cheaper than
  Opus-from-spec at equal gate quality across 7 tasks (JS / Python / Go / prose). See
  `eval/RESULTS.md` and `experiments/`.
