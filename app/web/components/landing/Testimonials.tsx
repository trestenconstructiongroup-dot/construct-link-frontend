/**
 * Testimonials section with auto-scrolling horizontal cards.
 * Cards scroll automatically as the user scrolls down the page.
 */

import React, { useEffect, useRef } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Colors, Fonts } from '../../../../constants/theme';
import { TESTIMONIALS } from './_constants';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

interface TestimonialsProps {
  isSmallScreen: boolean;
}

function TestimonialsComponent({ isSmallScreen }: TestimonialsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    if (isSmallScreen) {
      // Mobile: IntersectionObserver for heading + timed auto-scroll for track
      const headingTween = gsap.from('.tm-letter', {
        yPercent: 120, opacity: 0, duration: 0.5, stagger: 0.03,
        ease: 'power4.out', paused: true,
      });
      const tweens: gsap.core.Tween[] = [headingTween];

      const track = trackRef.current;
      if (track) {
        const cardWidth = window.innerWidth * 0.8;
        const gap = 32;
        const totalTrackWidth = TESTIMONIALS.length * (cardWidth + gap) - gap;
        const viewportWidth = containerRef.current!.offsetWidth;
        const scrollDistance = Math.max(0, totalTrackWidth - viewportWidth);
        const trackTween = gsap.to(track, {
          x: -scrollDistance, duration: 10, ease: 'power1.inOut', paused: true,
        });
        tweens.push(trackTween);
      }

      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) { tweens.forEach((t) => t.play()); }
          else { tweens.forEach((t) => t.reverse()); }
        },
        { threshold: 0.1 },
      );
      obs.observe(containerRef.current);
      return () => { obs.disconnect(); tweens.forEach((t) => t.kill()); };
    }

    // Desktop: ScrollTrigger
    const ta = 'play reverse play reverse';
    const ctx = gsap.context(() => {
      gsap.from('.tm-letter', {
        yPercent: 120, opacity: 0, duration: 0.5, stagger: 0.03, ease: 'power4.out',
        scrollTrigger: { trigger: containerRef.current!, start: 'top 85%', toggleActions: ta },
      });

      const track = trackRef.current;
      if (track) {
        const cardWidth = Math.min(window.innerWidth * 0.45, 600);
        const gap = 32;
        const totalTrackWidth = TESTIMONIALS.length * (cardWidth + gap) - gap;
        const viewportWidth = containerRef.current!.offsetWidth;
        const scrollDistance = Math.max(0, totalTrackWidth - viewportWidth);

        gsap.to(track, {
          x: -scrollDistance, ease: 'none',
          scrollTrigger: { trigger: containerRef.current!, start: 'top 70%', end: 'bottom 20%', scrub: 1 },
        });
      }
    }, containerRef.current);

    return () => ctx.revert();
  }, [isSmallScreen]);

  if (Platform.OS !== 'web') {
    return null;
  }

  const headingText = 'What People Say';
  const headingLetters = headingText.split('');

  return (
    <View style={styles.outerWrap}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          paddingTop: 60,
          paddingBottom: 60,
          overflow: 'hidden',
        }}
      >
        {/* heading with per-letter animation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 40,
            paddingLeft: isSmallScreen ? 20 : 40,
            paddingRight: isSmallScreen ? 20 : 40,
          }}
        >
          <div style={{ overflow: 'hidden', display: 'inline-flex' }}>
            {headingLetters.map((letter, i) => (
              <span
                key={i}
                className="tm-letter"
                style={{
                  display: 'inline-block',
                  fontSize: isSmallScreen ? 'clamp(22px, 6vw, 28px)' : 42,
                  fontFamily: Fonts.display,
                  fontWeight: 700,
                  color: colors.text,
                  whiteSpace: letter === ' ' ? 'pre' : undefined,
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* auto-scrolling horizontal track */}
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: 32,
            paddingLeft: isSmallScreen ? 20 : 80,
            paddingRight: isSmallScreen ? 20 : 80,
            willChange: 'transform',
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="tm-card"
              style={{
                flexShrink: 0,
                width: isSmallScreen ? '80vw' : '45vw',
                maxWidth: 600,
                padding: isSmallScreen ? 16 : 40,
                borderRadius: 20,
                border: `1px solid ${colors.border}`,
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <span
                style={{
                  fontSize: isSmallScreen ? 16 : 22,
                  fontFamily: Fonts.body,
                  color: colors.text,
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </span>
              <div>
                <span
                  style={{
                    fontSize: 16,
                    fontFamily: Fonts.heading,
                    fontWeight: 600,
                    color: colors.text,
                    display: 'block',
                  }}
                >
                  {t.name}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontFamily: Fonts.body,
                    color: colors.textSecondary,
                  }}
                >
                  {t.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </View>
  );
}

const styles = {
  outerWrap: {
    width: '100%',
    marginTop: 60,
  } as ViewStyle,
};

export default React.memo(TestimonialsComponent);
