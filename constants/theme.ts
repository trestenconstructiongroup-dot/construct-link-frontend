/**
 * Theme configuration with Inter font family
 * Colors: Black background for dark mode, White background for light mode
 */

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
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    textInverse: '#000000',
    // Landing warm gradient
    warmStart: 'rgb(209, 144, 86)',
    warmEnd: 'rgb(247, 180, 109)',
  },
};

// Font families — Inter across all platforms
// - display: page titles, hero headings (Bold 700)
// - heading: sub-headings, card titles, nav (SemiBold 600)
// - body: paragraphs, form text, descriptions (Regular 400)
// - accent: buttons, emphasis, highlighted text (Medium 500)
export const Fonts = {
  display: 'Inter_700Bold',
  heading: 'Inter_600SemiBold',
  body: 'Inter_400Regular',
  accent: 'Inter_500Medium',
  // Legacy compat
  sans: 'Inter_400Regular',
  serif: 'Inter_400Regular',
  rounded: 'Inter_400Regular',
  mono: 'Inter_400Regular',
};

export type Theme = 'light' | 'dark';
