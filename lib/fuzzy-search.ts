// lib/fuzzy-search.ts

/** Generate character trigrams from a string */
function trigrams(str: string): Set<string> {
  const s = str.toLowerCase().replace(/\s+/g, ' ').trim();
  const set = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}

/** Calculate similarity between two strings (0..1) based on trigram overlap */
function similarity(a: string, b: string): number {
  const triA = trigrams(a);
  const triB = trigrams(b);
  if (triA.size === 0 || triB.size === 0) return 0;
  let overlap = 0;
  triA.forEach((t) => {
    if (triB.has(t)) overlap++;
  });
  return overlap / Math.max(triA.size, triB.size);
}

export interface FuzzyTarget {
  id: string;
  frage: string;
  antwort: string;
  tags: string[];
}

export interface FuzzyResult {
  id: string;
  score: number;
}

const THRESHOLD = 0.25;

/**
 * Search targets by query using trigram fuzzy matching.
 * Scoring weights: frage (3x) > tags (2x) > antwort (1x).
 * Returns matches sorted by score descending, filtered by threshold.
 */
export function fuzzySearch(query: string, targets: FuzzyTarget[]): FuzzyResult[] {
  if (query.trim().length < 2) return [];

  const results: FuzzyResult[] = [];

  for (const target of targets) {
    const frageScore = similarity(query, target.frage) * 3;
    const tagScore = Math.max(...target.tags.map((t) => similarity(query, t)), 0) * 2;
    // Strip HTML for antwort matching
    const plainAntwort = target.antwort.replace(/<[^>]*>/g, '');
    const antwortScore = similarity(query, plainAntwort);
    const score = Math.max(frageScore, tagScore, antwortScore);

    if (score >= THRESHOLD) {
      results.push({ id: target.id, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
