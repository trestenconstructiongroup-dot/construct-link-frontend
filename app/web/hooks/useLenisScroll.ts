/**
 * Lenis smooth-scroll hook integrated with GSAP ScrollTrigger.
 * Call once from Landing.web.tsx. No-ops on native.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
// Side-effect import: assigns Lenis to globalThis.Lenis
import 'lenis/dist/lenis.js';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useLenisScroll() {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    let frame: number;
    const LenisClass = (globalThis as any).Lenis;
    if (!LenisClass) return;

    const lenis = new LenisClass({
      lerp: 0.1,
      duration: 1.2,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      ScrollTrigger.update();
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value?: number) {
        if (value !== undefined) {
          lenis.scrollTo(value as number);
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', refresh);
    refresh();

    return () => {
      window.removeEventListener('resize', refresh);
      lenis.destroy();
      cancelAnimationFrame(frame);
    };
  }, []);

  return lenisRef;
}
