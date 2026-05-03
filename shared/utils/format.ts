export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs < 1_000) return Math.round(n).toString();
  if (abs < 1_000_000) return (n / 1_000).toFixed(1) + 'k';
  if (abs < 1_000_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs < 1_000_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  return (n / 1_000_000_000_000).toFixed(1) + 'T';
}
