/**
 * Format a monetary value as whole Indian Rupees — no decimal places.
 * Returns '—' for null/undefined/NaN.
 * All amounts are stored and displayed as integers.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const n = Math.round(Number(amount));
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Compact version — just the number with Indian locale, no currency symbol.
 * Use for tables where ₹ is already shown in the header.
 */
export function formatAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const n = Math.round(Number(amount));
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-IN');
}
