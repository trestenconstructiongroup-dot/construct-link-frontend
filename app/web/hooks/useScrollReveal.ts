/**
 * Reusable GSAP ScrollTrigger hook for scroll-driven animations.
 * No-ops on native platforms — only runs on web.
 */

import { useEffect, useRef, type RefObject } from 'react';
import { Platform } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollRevealConfig {
  /** CSS selector for target elements inside the container */
  selector: string;
  /** GSAP `from` vars (starting state) */
  from: gsap.TweenVars;
  /** Optional ScrollTrigger overrides */
  trigger?: Partial<ScrollTrigger.Vars>;
}

/**
 * Animate elements inside `containerRef` when they scroll into view.
 *
 * @param containerRef – ref to the wrapping DOM element
 * @param configs      – one or more animation configs
 * @param deps         – extra dependency array items (default [])
 */
export function useScrollReveal(
  containerRef: RefObject<HTMLElement | null>,
  configs: ScrollRevealConfig[],
  deps: unknown[] = [],
) {
  // stable ref so the effect doesn't re-run on every render
  const configsRef = useRef(configs);
  configsRef.current = configs;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      for (const cfg of configsRef.current) {
        gsap.from(cfg.selector, {
          ...cfg.from,
          scrollTrigger: {
            trigger: containerRef.current!,
            start: 'top 75%',
            toggleActions: 'play reverse play reverse',
            ...cfg.trigger,
          },
        });
      }
    }, containerRef.current);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Lower-level hook: returns a gsap.context scoped to `containerRef`.
 * The caller builds animations inside the callback and cleanup is automatic.
 */
export function useGsapContext(
  containerRef: RefObject<HTMLElement | null>,
  callback: (ctx: gsap.Context) => void,
  deps: unknown[] = [],
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      cbRef.current(ctx);
    }, containerRef.current);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
