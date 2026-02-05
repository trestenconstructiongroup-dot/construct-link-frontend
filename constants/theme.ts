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
  },
  dark: {
    text: '#ECEDEE',
    background: '#000000',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Freak Turbulence (BRK) font family
// NOTE: For React Native (including web), the fontFamily must be a single name,
// not a comma‑separated list. The actual TTF is registered as "FreakTurbulenceBRK"
// in WebFontLoader, so we use that key here.
export const Fonts = Platform.select({
  ios: {
    sans: 'FreakTurbulenceBRK',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'FreakTurbulenceBRK',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'FreakTurbulenceBRK',
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type Theme = 'light' | 'dark';
