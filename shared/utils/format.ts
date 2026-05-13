const SUFFIXES = ['k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'] as const;

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs < 1_000) return Math.round(n).toString();
  for (let i = 0; i < SUFFIXES.length; i++) {
    const divisor = Math.pow(1000, i + 1);
    if (abs < divisor * 1000) return (n / divisor).toFixed(1) + SUFFIXES[i];
  }
  const last = SUFFIXES.length;
  return (n / Math.pow(1000, last)).toFixed(1) + SUFFIXES[last - 1];
}
