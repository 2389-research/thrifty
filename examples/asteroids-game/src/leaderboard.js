export const LB_KEY = 'asteroids.highscores';

export function createLeaderboard(storage) {
  if (!storage) {
    storage = {
      data: {},
      getItem(key) {
        return this.data[key];
      },
      setItem(key, value) {
        this.data[key] = value;
      }
    };
  }
  return { storage };
}

export function addScore(lb, name, score) {
  const entries = getTop(lb, Infinity) || [];
  entries.push({ name, score });
  entries.sort((a, b) => b.score - a.score);
  lb.storage.setItem(LB_KEY, JSON.stringify(entries));
}

export function getTop(lb, n = 10) {
  const stored = lb.storage.getItem(LB_KEY);
  if (!stored) {
    return [];
  }
  let entries;
  try {
    entries = JSON.parse(stored);
  } catch {
    return []; // corrupted storage value — don't break rendering on game-over
  }
  return Array.isArray(entries) ? entries.slice(0, n) : [];
}
