/**
 * Hydration-safe screen width hook.
 *
 * During SSR / static pre-render, `useWindowDimensions` returns a default
 * (desktop-sized) width.  If we branch JSX on that value the server HTML
 * won't match the mobile client → React error #418 (hydration mismatch).
 *
 * This hook solves the problem:
 *  – First render always returns `fallback` (default 1024 – desktop)
 *    so the initial client render matches the static HTML.
 *  – After mount it switches to the real window width.
 */

import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

const SSR_FALLBACK = 1024;

export function useClientWidth(fallback = SSR_FALLBACK) {
  const { width } = useWindowDimensions();
  const [clientWidth, setClientWidth] = useState(fallback);

  useEffect(() => {
    setClientWidth(width);
  }, [width]);

  return clientWidth;
}
