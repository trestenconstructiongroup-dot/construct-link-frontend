import * as Font from 'expo-font';
import { Platform } from 'react-native';

/**
 * Load Freak Turbulence (BRK) font
 * 
 * For web: Add the font via CSS @font-face or link tag in your HTML
 * For mobile: Place the font file in assets/fonts/ and uncomment the loadAsync call
 */
export async function loadFonts() {
  if (Platform.OS === 'web') {
    // For web, fonts should be loaded via CSS or HTML link tag
    // Example: Add this to your HTML head or a CSS file:
    // <link href="https://fonts.googleapis.com/css2?family=YourFont" rel="stylesheet">
    // Or use @font-face in CSS
    return true;
  }

  // For mobile platforms, load the font file
  // Uncomment and adjust the path when you have the font file:
  /*
  try {
    await Font.loadAsync({
      // Keep the family name consistent with WebFontLoader / theme.ts
      FreakTurbulenceBRK: require('../assets/fonts/freaktur.ttf'),
    });
  } catch (error) {
    console.warn('Font loading error:', error);
  }
  */
  
  return true;
}
