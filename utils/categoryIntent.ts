/**
 * Category intent persistence.
 *
 * When an unauthenticated user clicks a landing-page category button and
 * chooses a destination (Find Workers / Browse Jobs), we store their intent
 * in sessionStorage so AuthGate can redirect them after login/signup.
 */

const INTENT_KEY = 'category_intent';

export interface CategoryIntent {
  category: string;
  destination: 'find-workers' | 'find-jobs';
}

/** Save the user's intent before redirecting them to auth. */
export function saveCategoryIntent(intent: CategoryIntent): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));
}

/**
 * Read and clear the stored intent.
 * Returns null if nothing was saved or sessionStorage is unavailable.
 */
export function popCategoryIntent(): CategoryIntent | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(INTENT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(INTENT_KEY);
  try {
    return JSON.parse(raw) as CategoryIntent;
  } catch {
    return null;
  }
}
