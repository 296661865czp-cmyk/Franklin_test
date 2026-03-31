import type { ArtItem, SenseScores, SenseKey } from '../types';
import { SENSES } from '../data/constants';

export function calcSimilarity(a: SenseScores | undefined, b: SenseScores | undefined): number {
  if (!a && !b) return 0;
  if (!a || !b) return 0;

  const allKeys = [...new Set([...Object.keys(a), ...Object.keys(b)])] as SenseKey[];
  if (allKeys.length === 0) return 0;

  const score = allKeys.reduce((sum, k) => {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    return sum + Math.abs(va - vb);
  }, 0);

  return 1 - score / (allKeys.length * 100);
}

export function getRelatedItems(items: ArtItem[], item: ArtItem, n = 3): (ArtItem & { similarity: number })[] {
  return items
    .filter((i) => i.id !== item.id)
    .map((i) => ({ ...i, similarity: calcSimilarity(item.senses, i.senses) }))
    .filter((i) => i.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, n);
}

export function getOppositeItems(items: ArtItem[], item: ArtItem, n = 3): (ArtItem & { oppScore: number })[] {
  const scored = items
    .filter((i) => i.id !== item.id)
    .map((i) => {
      const score = SENSES.reduce((sum, s) => {
        const va = item.senses?.[s.key] || 0;
        const vb = i.senses?.[s.key] || 0;
        return sum + (va > 0 && vb > 0 ? Math.abs(va - vb) : 0);
      }, 0);
      return { ...i, oppScore: score };
    })
    .filter((i) => i.oppScore > 0)
    .sort((a, b) => b.oppScore - a.oppScore)
    .slice(0, n);

  return scored;
}

export function getSensoryFingerprint(senses: SenseScores | undefined): { key: SenseKey; label: string; icon: string; color: string; value: number }[] {
  if (!senses) return [];
  return SENSES.map((s) => ({ ...s, value: senses[s.key] || 0 })).filter((s) => s.value > 0);
}

export function matchItemsBySenses(
  items: ArtItem[],
  targetSenses: SenseScores
): { item: ArtItem; score: number }[] {
  const keys = Object.keys(targetSenses);
  if (keys.length === 0) return [];

  return items
    .map((item) => ({
      item,
      score: calcSimilarity(targetSenses, item.senses),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}
