import { RECIPES, type Recipe } from '@lunch/recipes';
import type { PantryItem, Preferences, Recommendation, RecommendOptions } from './types';
import type { Item } from '@lunch/shared-kernel';

const DEFAULT_WEIGHTS = {
  coverage: 1.0,
  missingPenalty: 0.8,
  likeBonus: 0.2,
  dislikePenalty: 1.5,
} as const;

function indexPantry(pantry: PantryItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of pantry) map.set(p.ingredient, (map.get(p.ingredient) ?? 0) + p.qty);
  return map;
}

function diffMissing(items: Item[], pantryIdx: Map<string, number>): Item[] {
  const missing: Item[] = [];
  for (const it of items) {
    const have = pantryIdx.get(it.ingredient) ?? 0;
    if (have < it.qty) missing.push({ ingredient: it.ingredient, qty: it.qty - have });
  }
  return missing;
}

function coverage(items: Item[], pantryIdx: Map<string, number>): number {
  const total = items.reduce((s, it) => s + it.qty, 0);
  if (total === 0) return 0;
  const covered = items.reduce((s, it) => s + Math.min(it.qty, pantryIdx.get(it.ingredient) ?? 0), 0);
  return covered / total; // 0..1
}

function preferenceScore(items: Item[], prefs?: Preferences): number {
  if (!prefs) return 0;
  const likes = new Set(prefs.likes ?? []);
  const dislikes = new Set(prefs.dislikes ?? []);
  let score = 0;
  for (const it of items) {
    if (likes.has(it.ingredient)) score += 1;
    if (dislikes.has(it.ingredient)) score -= 1;
  }
  return score; // puede ser negativo
}

export function recommendByIngredients(
  pantry: PantryItem[],
  prefs?: Preferences,
  opts?: RecommendOptions,
): Recommendation[] {
  const k = opts?.k ?? 5;
  const W = { ...DEFAULT_WEIGHTS, ...(opts?.weights ?? {}) };
  const pantryIdx = indexPantry(pantry);

  const recs: Recommendation[] = RECIPES.map((r: Recipe) => {
    const cov = coverage(r.items, pantryIdx); // 0..1
    const missing = diffMissing(r.items, pantryIdx);

    // base score: cobertura - faltantes normalizados
    const totalQty = r.items.reduce((s, it) => s + it.qty, 0) || 1;
    const missingQty = missing.reduce((s, it) => s + it.qty, 0) / totalQty; // 0..1

    // preferencias
    const pref = preferenceScore(r.items, prefs); // puede ser negativo

    // penalización dura si hay ingredientes prohibidos (dislikes)
    const hasForbidden = prefs?.dislikes?.some((d) => r.items.some((it) => it.ingredient === d)) ?? false;

    let score = 0;
    score += W.coverage * cov;
    score -= W.missingPenalty * missingQty;
    score += W.likeBonus * Math.max(0, pref);
    score -= W.dislikePenalty * Math.max(0, -pref);
    if (hasForbidden) score -= W.dislikePenalty; // extra golpe si la receta contiene algo prohibido

    return { recipe: r, score, coverage: cov, missing };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return recs;
}

export type { PantryItem, Preferences, Recommendation, RecommendOptions } from './types';
