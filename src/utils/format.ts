/**
 * Formatting helpers for currency, numbers, percentages, and dates.
 */

/**
 * Format a number as a human-readable currency string.
 * - >= 1B  -> "$1.2B"
 * - >= 1M  -> "$1.2M"
 * - >= 1K  -> "$500K"
 * - < 1K   -> "$1,234"
 * Negative values are prefixed with "-".
 */
export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format a number as a percentage string (e.g. 45.2%).
 * Expects the input as a raw value (e.g. 45.2 -> "45.2%", 0.85 is treated as 0.9%).
 * For fractional values (0-1), multiply by 100 before calling.
 */
export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format a game date as "Jan 6, 2026".
 */
export function formatDate(year: number, month: number, day: number): string {
  const monthName = MONTH_NAMES[month - 1] ?? 'Jan';
  return `${monthName} ${day}, ${year}`;
}
