/**
 * Page loader – cycles through construction-themed words then exits.
 * Shows only once per session (sessionStorage).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { gsap } from 'gsap';
import { Colors, Fonts } from '../../../../constants/theme';
import { useTheme } from '../../../../contexts/ThemeContext';
import { LOADER_WORDS } from './_constants';

function PageLoaderComponent() {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [done, setDone] = useState(Platform.OS !== 'web');

  const loaderRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);

  const exit = useCallback(() => {
    if (!loaderRef.current) return;
    gsap.to(loaderRef.current, {
      scale: 0.5,
      y: -200,
      opacity: 0,
      duration: 1,
      ease: 'power3.inOut',
      onComplete: () => {
        setDone(true);
      },
    });
  }, []);

  useEffect(() => {
    if (done || Platform.OS !== 'web') return;

    // lock body scroll while loader is active
    document.body.style.overflow = 'hidden';

    const interval = setInterval(() => {
      indexRef.current += 1;

      if (indexRef.current >= LOADER_WORDS.length) {
        clearInterval(interval);
        // brief pause then exit
        setTimeout(exit, 400);
        return;
      }

      // fade out → swap → fade in
      if (wordRef.current) {
        gsap.to(wordRef.current, {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            if (wordRef.current) {
              wordRef.current.textContent = LOADER_WORDS[indexRef.current];
              gsap.to(wordRef.current, { opacity: 1, duration: 0.15 });
            }
          },
        });
      }
    }, 300);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = '';
    };
  }, [done, exit]);

  if (done || Platform.OS !== 'web') return null;

  return (
    <div
      ref={loaderRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <span
        ref={wordRef}
        style={{
          fontFamily: Fonts.display,
          fontSize: 'clamp(2rem, 6vw, 5rem)',
          fontWeight: 700,
          color: colors.text,
          userSelect: 'none',
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        {LOADER_WORDS[0]}
      </span>
    </div>
  );
}

export default React.memo(PageLoaderComponent);
