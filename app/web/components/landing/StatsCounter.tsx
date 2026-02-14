/**
 * Animated stats counter section – numbers count up from 0 on scroll.
 */

import React, { useEffect, useRef } from 'react';
import { Platform, View, Text, ViewStyle, TextStyle } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Colors, Fonts } from '../../../../constants/theme';
import { STATS } from './_constants';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

interface StatsCounterProps {
  isSmallScreen: boolean;
}

function StatsCounterComponent({ isSmallScreen }: StatsCounterProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    if (isSmallScreen) {
      // Mobile: IntersectionObserver
      const cardTween = gsap.from('.stat-card', {
        y: 60, opacity: 0, stagger: 0.15, duration: 0.6,
        ease: 'power3.out', paused: true,
      });
      const counterTweens: gsap.core.Tween[] = [];
      STATS.forEach((stat, i) => {
        const el = numberRefs.current[i];
        if (!el) return;
        const obj = { val: 0 };
        counterTweens.push(gsap.to(obj, {
          val: stat.value, duration: 2, ease: 'power1.out', paused: true,
          onUpdate: () => { el.textContent = Math.floor(obj.val).toLocaleString() + stat.suffix; },
        }));
      });
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            cardTween.play();
            counterTweens.forEach((t) => t.play());
          } else {
            cardTween.reverse();
            counterTweens.forEach((t) => t.reverse());
          }
        },
        { threshold: 0.1 },
      );
      obs.observe(containerRef.current);
      return () => {
        obs.disconnect();
        cardTween.kill();
        counterTweens.forEach((t) => t.kill());
      };
    }

    // Desktop: ScrollTrigger
    const ta = 'play reverse play reverse';
    const ctx = gsap.context(() => {
      gsap.from('.stat-card', {
        y: 60, opacity: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current!, start: 'top 85%', toggleActions: ta },
      });
      STATS.forEach((stat, i) => {
        const el = numberRefs.current[i];
        if (!el) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value, duration: 2, ease: 'power1.out',
          scrollTrigger: { trigger: containerRef.current!, start: 'top 85%', toggleActions: ta },
          onUpdate: () => { el.textContent = Math.floor(obj.val).toLocaleString() + stat.suffix; },
        });
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
        <View style={[styles.grid, isSmallScreen && styles.gridSmall]}>
          {STATS.map((stat) => (
            <View
              key={stat.label}
              style={[styles.card, { borderColor: colors.border }]}
            >
              <Text style={[styles.number, { color: colors.accent }]}>
                {stat.value.toLocaleString()}{stat.suffix}
              </Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      <div ref={containerRef} style={{ width: '100%', maxWidth: 1200 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: isSmallScreen ? 'column' : 'row',
            gap: isSmallScreen ? 16 : 32,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-card"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: isSmallScreen ? 20 : 32,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(0,0,0,0.02)',
              }}
            >
              <span
                ref={(el) => { numberRefs.current[i] = el; }}
                style={{
                  fontSize: isSmallScreen ? 'clamp(28px, 8vw, 36px)' : 48,
                  fontFamily: Fonts.display,
                  fontWeight: 700,
                  color: colors.accent,
                  lineHeight: 1.1,
                }}
              >
                0{stat.suffix}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontFamily: Fonts.body,
                  color: colors.textSecondary,
                  marginTop: 8,
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </View>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
    marginBottom: 40,
  } as ViewStyle,
  containerSmall: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  } as ViewStyle,
  grid: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
  } as ViewStyle,
  gridSmall: {
    flexDirection: 'column',
    gap: 16,
  } as ViewStyle,
  card: {
    flex: 1,
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  } as ViewStyle,
  number: {
    fontSize: 48,
    fontFamily: Fonts.display,
    fontWeight: '700',
  } as TextStyle,
  label: {
    fontSize: 14,
    fontFamily: Fonts.body,
    marginTop: 8,
  } as TextStyle,
};

export default React.memo(StatsCounterComponent);
