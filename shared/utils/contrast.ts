/**
 * Whether the given hex color is dark enough that white foreground text reads better than black.
 * Uses the relative luminance approximation from WCAG.
 */
export function needsLightText(hex: string): boolean {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return true;
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.55;
}
