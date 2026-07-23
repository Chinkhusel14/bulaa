/**
 * Bulaa design tokens — Clutch (locked).
 *
 * Single source of truth for UI. See DESIGN.md for rules agents must follow.
 *
 * @example
 * import { colors, fonts, radius, tailwindTheme } from "@bulaa/design";
 */

export const brandId = "clutch" as const;
export const brandName = "Clutch";
export const productName = "Bulaa";

export const fonts = {
  display: '"Chakra Petch", sans-serif',
  body: '"IBM Plex Sans", sans-serif',
  mono: '"IBM Plex Mono", monospace',
  /** Append after https://fonts.googleapis.com/css2?family= */
  googleFamilies:
    "Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500",
} as const;

export const radius = {
  sm: "4px",
  md: "5px",
  lg: "6px",
} as const;

export const colors = {
  bgVoid: "#070809",
  bgBase: "#0C0E12",
  bgRaised: "#14181F",
  bgOverlay: "#1C222C",

  border: "#2A3140",
  borderStrong: "#3D4658",

  text: "#F4F6F8",
  textMuted: "#8B93A7",
  textFaint: "#5C6578",

  primary: "#C8F542",
  primaryHover: "#D6FF66",
  primaryPressed: "#A8D12E",
  primaryMuted: "#C8F54226",
  onPrimary: "#0A0C08",

  accent: "#6B9BFF",
  success: "#C8F542",
  warning: "#FFC53D",
  danger: "#FF3D4A",
  info: "#6B9BFF",
  money: "#FFE66B",

  tierPro: "#C8F542",
  tierMid: "#6B9BFF",
  tierLow: "#8B93A7",
} as const;

export type BrandColor = keyof typeof colors;

/** Draft timer thresholds (seconds remaining). */
export const timer = {
  warningAt: 10,
  dangerAt: 5,
} as const;

/** Motion defaults (ms). */
export const motion = {
  pickSnap: 120,
  pickFlash: 200,
  fade: 150,
} as const;

/** CSS custom-property map (keys without leading --). */
export const cssVarMap = {
  "bg-void": colors.bgVoid,
  "bg-base": colors.bgBase,
  "bg-raised": colors.bgRaised,
  "bg-overlay": colors.bgOverlay,
  border: colors.border,
  "border-strong": colors.borderStrong,
  text: colors.text,
  "text-muted": colors.textMuted,
  "text-faint": colors.textFaint,
  primary: colors.primary,
  "primary-hover": colors.primaryHover,
  "primary-pressed": colors.primaryPressed,
  "primary-muted": colors.primaryMuted,
  "on-primary": colors.onPrimary,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  money: colors.money,
  "tier-pro": colors.tierPro,
  "tier-mid": colors.tierMid,
  "tier-low": colors.tierLow,
  "radius-sm": radius.sm,
  "radius-md": radius.md,
  "radius-lg": radius.lg,
  "font-display": fonts.display,
  "font-body": fonts.body,
  "font-mono": fonts.mono,
} as const;

export function toCssVariables(): string {
  const lines = Object.entries(cssVarMap).map(([k, v]) => `  --${k}: ${v};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

/** Spread into Tailwind `theme.extend`. */
export const tailwindTheme = {
  colors: {
    void: colors.bgVoid,
    base: colors.bgBase,
    raised: colors.bgRaised,
    overlay: colors.bgOverlay,
    border: {
      DEFAULT: colors.border,
      strong: colors.borderStrong,
    },
    text: {
      DEFAULT: colors.text,
      muted: colors.textMuted,
      faint: colors.textFaint,
    },
    primary: {
      DEFAULT: colors.primary,
      hover: colors.primaryHover,
      pressed: colors.primaryPressed,
      muted: colors.primaryMuted,
      foreground: colors.onPrimary,
    },
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    money: colors.money,
    tier: {
      pro: colors.tierPro,
      mid: colors.tierMid,
      low: colors.tierLow,
    },
  },
  borderRadius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
  },
  fontFamily: {
    display: ["Chakra Petch", "sans-serif"],
    sans: ["IBM Plex Sans", "sans-serif"],
    mono: ["IBM Plex Mono", "monospace"],
  },
} as const;

export const cssVars = Object.fromEntries(
  Object.keys(cssVarMap).map((k) => [k, `var(--${k})`]),
) as { [K in keyof typeof cssVarMap]: string };

const tokens = {
  brandId,
  brandName,
  productName,
  fonts,
  radius,
  colors,
  timer,
  motion,
  cssVarMap,
  toCssVariables,
  tailwindTheme,
  cssVars,
} as const;

export default tokens;
