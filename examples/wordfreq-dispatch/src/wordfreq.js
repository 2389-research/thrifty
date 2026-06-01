/**
 * Tokenizes text into lowercase words
 * @param {string} text - The text to tokenize
 * @returns {string[]} Array of lowercase words, non-letter characters removed, empties dropped
 */
export function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(word => word.length > 0);
}

/**
 * Gets the top N most frequent words
 * @param {string} text - The text to analyze
 * @param {number} n - Number of top words to return (default 10)
 * @returns {Array<{word: string, count: number}>} Top N words sorted by count DESC, then alphabetically
 */
export function topWords(text, n = 10) {
  const words = tokenize(text);

  const freqMap = new Map();
  for (const word of words) {
    freqMap.set(word, (freqMap.get(word) || 0) + 1);
  }

  const sorted = Array.from(freqMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      return a.word.localeCompare(b.word);
    });

  return sorted.slice(0, n);
}

/**
 * Gets statistics about the text
 * @param {string} text - The text to analyze
 * @returns {{total: number, unique: number}} Total and unique word counts
 */
export function stats(text) {
  const words = tokenize(text);
  const unique = new Set(words).size;

  return {
    total: words.length,
    unique
  };
}
