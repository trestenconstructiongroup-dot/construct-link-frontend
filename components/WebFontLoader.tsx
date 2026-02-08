import { useEffect } from 'react';
import * as Font from 'expo-font';
import { logger } from '../utils/logger';

/**
 * Global web/native font loader.
 *
 * Loads:
 * - Freak Turbulence (BRK) from assets/fonts as "FreakTurbulenceBRK"
 * - Knucklehead from web/Knucklehead.otf as "Knucklehead"
 */
export function WebFontLoader() {
  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          // Use a simple family name without spaces/parentheses for React Native
          FreakTurbulenceBRK: require('../assets/fonts/freaktur.ttf'),
          // Knucklehead display font (lives in /web)
          Knucklehead: require('../assets/fonts/Knucklehead2.otf'),
        });
        logger.log('Custom fonts loaded: FreakTurbulenceBRK, Knucklehead');
      } catch (error) {
        logger.warn('Error loading custom fonts:', error);
      }
    };

    loadFonts();
  }, []);

  return null;
}
