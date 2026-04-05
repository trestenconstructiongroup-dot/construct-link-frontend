/**
 * Extracts a human-readable message from an API error thrown by apiFetch().
 * apiFetch() attaches `error.data` (parsed JSON) and `error.status` when the
 * server returns a non-2xx response, so prefer those over raw message strings.
 */
export function parseApiError(
  error: unknown,
  fallback = 'An error occurred. Please try again.'
): string {
  if (!error || typeof error !== 'object') return fallback;
  const e = error as Record<string, unknown>;
  const data = e?.data as Record<string, unknown> | undefined;
  return (
    (typeof data?.detail === 'string' ? data.detail : undefined) ||
    (typeof data?.message === 'string' ? data.message : undefined) ||
    (typeof data?.error === 'string' ? data.error : undefined) ||
    (typeof e?.message === 'string' ? e.message : undefined) ||
    fallback
  );
}
