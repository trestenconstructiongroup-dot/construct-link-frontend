/**
 * Theme configuration with Freak Turbulence (BRK) font family
 * Colors: Black background for dark mode, White background for light mode
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Brand
    accent: '#0082C9',
    accentMuted: '#0a7ea4',
    // Semantic
    error: '#ef4444',
    errorDark: '#dc2626',
    success: '#16a34a',
    successLight: '#22c55e',
    warning: '#f59e0b',
    // Surfaces & borders
    surface: '#f9fafb',
    surfaceDark: '#1a1a2e',
    border: '#e5e7eb',
    borderDark: '#374151',
    // Text hierarchy
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    // Landing warm gradient
    warmStart: 'rgb(209, 144, 86)',
    warmEnd: 'rgb(247, 180, 109)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#000000',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Brand
    accent: '#0082C9',
    accentMuted: '#0a7ea4',
    // Semantic
    error: '#ef4444',
    errorDark: '#dc2626',
    success: '#16a34a',
    successLight: '#22c55e',
    warning: '#f59e0b',
    // Surfaces & borders
    surface: '#1a1a2e',
    surfaceDark: '#f9fafb',
    border: '#374151',
    borderDark: '#e5e7eb',
    // Text hierarchy
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',
    textInverse: '#000000',
    // Landing warm gradient
    warmStart: 'rgb(209, 144, 86)',
    warmEnd: 'rgb(247, 180, 109)',
  },
};

// Font families
// - body: clean sans-serif for UI text, form labels, paragraphs
// - display: large headings (Knucklehead)
// - accent: decorative brand text at 20px+ (FreakTurbulenceBRK)
// - sans/serif/rounded/mono: legacy compat
export const Fonts = Platform.select({
  ios: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'Knucklehead',
    accent: 'FreakTurbulenceBRK',
    sans: 'FreakTurbulenceBRK',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    body: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
    display: 'Knucklehead',
    accent: 'FreakTurbulenceBRK',
    sans: 'FreakTurbulenceBRK',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'Knucklehead, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    accent: 'FreakTurbulenceBRK, "Freak Turbulence (BRK)", system-ui, sans-serif',
    sans: 'FreakTurbulenceBRK',
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type Theme = 'light' | 'dark';
