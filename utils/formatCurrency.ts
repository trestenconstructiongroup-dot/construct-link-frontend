/**
 * Kenya deployment: display amounts in KES for jobs, rates, and budgets.
 */
export const DEFAULT_JOB_CURRENCY = 'KES';

export function formatJobPayLabel(
  currency: string | undefined | null,
  payMin: string | number | null | undefined,
  payMax: string | number | null | undefined,
  payTypeLabel: string,
): string {
  const code = (currency || DEFAULT_JOB_CURRENCY).toUpperCase();
  return `${code} ${payMin ?? '?'} - ${payMax ?? '?'} (${payTypeLabel})`;
}

export function formatIndividualRateLabel(item: {
  hourly_rate?: string | null;
  daily_rate?: string | null;
}): string {
  if (item.hourly_rate) return `KES ${item.hourly_rate}/hr`;
  if (item.daily_rate) return `KES ${item.daily_rate}/day`;
  return 'Contact for rate';
}
