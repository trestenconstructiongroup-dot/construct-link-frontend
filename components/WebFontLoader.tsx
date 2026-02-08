import { useEffect } from 'react';
import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { logger } from '../utils/logger';

/**
 * Global font loader.
 *
 * Loads Inter font variants used across the app:
 * - Inter_400Regular  → body text, form inputs
 * - Inter_500Medium   → buttons, emphasis
 * - Inter_600SemiBold → sub-headings, card titles
 * - Inter_700Bold     → page titles, hero headings
 */
export function WebFontLoader() {
  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });
        logger.log('Inter fonts loaded');
      } catch (error) {
        logger.warn('Error loading Inter fonts:', error);
      }
    };

    loadFonts();
  }, []);

  return null;
}
