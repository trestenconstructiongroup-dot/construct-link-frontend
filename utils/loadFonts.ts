import * as Font from 'expo-font';
import { Platform } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

/**
 * Load Inter font variants.
 *
 * On web, fonts are loaded via WebFontLoader component in the root layout.
 * This utility is available for mobile platforms if needed outside the
 * component tree (e.g. before navigation mounts).
 */
export async function loadFonts() {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    await Font.loadAsync({
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
    });
  } catch (error) {
    console.warn('Font loading error:', error);
  }

  return true;
}
