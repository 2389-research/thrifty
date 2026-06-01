import { ASTEROID_SCORES } from './constants.js';

export function createScore() {
  return { value: 0, multiplier: 1 };
}

export function scoreForSize(size) {
  return ASTEROID_SCORES[size] ?? 0; // unknown size scores 0 rather than corrupting score with NaN
}

export function addPoints(score, size) {
  score.value += scoreForSize(size) * score.multiplier;
}
