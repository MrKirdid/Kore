/**
 * FuzzyMatcher — fuse.js wrapper for fuzzy name matching.
 */

import Fuse from 'fuse.js';

export interface FuzzyResult {
  name: string;
  score: number;
}

export class FuzzyMatcher {
  private fuse: Fuse<{ name: string }>;
  private threshold: number;

  constructor(names: string[], threshold: number = 0.4) {
    this.threshold = threshold;
    this.fuse = new Fuse(
      names.map(n => ({ name: n })),
      {
        keys: ['name'],
        threshold,
        includeScore: true,
      }
    );
  }

  search(query: string): FuzzyResult[] {
    const results = this.fuse.search(query);
    return results.map(r => ({
      name: r.item.name,
      score: r.score ?? 1,
    }));
  }

  update(names: string[]): void {
    this.fuse = new Fuse(
      names.map(n => ({ name: n })),
      {
        keys: ['name'],
        threshold: this.threshold,
        includeScore: true,
      }
    );
  }
}
