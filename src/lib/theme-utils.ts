/**
 * theme-utils.ts — Dynamic NFT color theming utilities.
 *
 * Usage convention: all CSS variable values are bare HSL strings (no hsl() wrapper).
 * Usage sites must wrap: hsl(var(--dynamic-primary)), hsl(var(--dynamic-accent)), etc.
 * This is consistent with shadcn's own token pattern.
 */

/** Parse an HSL string in any common format to { h, s, l } numbers. */
export function parseHsl(hslString: string): { h: number; s: number; l: number } | null {
  // Handles: "hsl(271, 81%, 56%)", "hsl(271 81% 56%)", "271 81% 56%", "271, 81%, 56%"
  const match = hslString
    .replace(/hsl\(|\)/g, "")
    .trim()
    .match(/^(\d+\.?\d*)[,\s]+(\d+\.?\d*)%?[,\s]+(\d+\.?\d*)%?/);
  if (!match) return null;
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

/** Convert hex color (#rrggbb or #rgb) to relative luminance (0–1). */
export function hexToLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two hex colors. */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Convert HSL numbers to a hex color string (approximate). */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export interface DynamicTheme {
  "--dynamic-primary": string; // bare HSL "H S% L%"
  "--dynamic-accent": string;  // bare HSL "H S% L%"
  "--dynamic-glow": string;    // bare HSL with alpha "H S% 70% / 0.2"
}

/**
 * Build CSS custom property values from a fast-average-color result.
 *
 * Processing order:
 * 1. Parse HSL from extracted color (hex input)
 * 2. Clamp dark colors in light mode (L < 40 → L=55, S-=15)
 * 3. Contrast check against white — if < 3.0, return null (fall back to brand purple)
 * 4. Derive accent and glow
 *
 * Returns null if color should not be used (low contrast or parse failure).
 */
export function buildDynamicTheme(
  hex: string,
  _isDark: boolean,
  userIsDarkMode: boolean
): DynamicTheme | null {
  // Convert hex → RGB → HSL
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  let finalH = h;
  let finalS = Math.round(s * 100);
  let finalL = Math.round(l * 100);

  // Step 1: Light-mode clamping — dark colors look wrong on white backgrounds
  if (!userIsDarkMode && finalL < 40) {
    finalL = 55;
    finalS = Math.max(0, finalS - 15);
  }

  // Step 2: Contrast check against white (#ffffff) — threshold 3.0:1
  const primaryHex = hslToHex(finalH, finalS, finalL);
  const contrast = getContrastRatio(primaryHex, "#ffffff");
  if (contrast < 3.0) return null;

  // Step 3: Derive accent (S-20, L+15, floor S at 0)
  const accentS = Math.max(0, finalS - 20);
  const accentL = Math.min(100, finalL + 15);

  return {
    "--dynamic-primary": `${finalH} ${finalS}% ${finalL}%`,
    "--dynamic-accent": `${finalH} ${accentS}% ${accentL}%`,
    "--dynamic-glow": `${finalH} ${finalS}% 70% / 0.2`,
  };
}
