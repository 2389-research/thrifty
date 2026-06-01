# UNIT-004 — scoring + leaderboard

## Objective
Implement scoring and a persistent top-N leaderboard with injectable storage, tested.

## Inputs / context
- CONTRACT.md §Scoring + Leaderboard, §World constants (ASTEROID_SCORES). Read
  `src/constants.js` (on disk) for the score values; do not hardcode duplicates.

## Approach
- `src/scoring.js`: createScore, scoreForSize(size) -> ASTEROID_SCORES[size],
  addPoints(score,size) in-place (value += scoreForSize*multiplier).
- `src/leaderboard.js`: createLeaderboard(storage?) defaulting to an in-memory
  storage object implementing getItem/setItem; addScore(lb,name,score) inserts and
  persists JSON under LB_KEY; getTop(lb,n=10) returns entries sorted by score desc,
  length<=n. Survives reload when given a persistent storage (verify with a fake).
- `test/scoring.test.js`: scoreForSize values; addPoints respects multiplier;
  leaderboard sorts desc, trims to n, and round-trips through a fake storage.

## Constraints
- Import ASTEROID_SCORES/LB_KEY from constants where pinned. No DOM (storage is
  injected; do not reference localStorage directly in the module body). ES modules.

## Acceptance criteria
- [ ] (runnable) `cd <project> && node --test test/scoring.test.js` exits 0, ≥4 tests pass
- [ ] (assertional) scoring + leaderboard exports match the contract signatures
- [ ] (assertional, specificity) getTop returns score-desc, length<=n; addScore persists via injected storage (a fake storage round-trips)
- [ ] (assertional) score values come from ASTEROID_SCORES (not duplicated literals); no direct localStorage reference in module body

## Dependencies
none
