import React, { useEffect, useRef } from 'react';
import { View, Text, Platform, ViewStyle, TextStyle } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Colors, Fonts } from '../../../../constants/theme';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/4BzjUq921Y4';

const HEADING_TEXT = 'See Tresten Construction Group Inc in Action';

interface VideoShowcaseProps {
  isSmallScreen: boolean;
}

function VideoShowcaseComponent({ isSmallScreen }: VideoShowcaseProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    if (isSmallScreen) {
      // Mobile: IntersectionObserver (ScrollTrigger can't detect scroll in RNW containers)
      const t1 = gsap.from('.vs-word', {
        y: '100%', opacity: 0, duration: 0.5, stagger: 0.04,
        ease: 'power3.out', paused: true,
      });
      const t2 = gsap.from('.vs-video', {
        opacity: 0, y: 60, scale: 0.95, duration: 0.8,
        ease: 'power2.out', paused: true,
      });
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) { t1.play(); t2.play(); }
          else { t1.reverse(); t2.reverse(); }
        },
        { threshold: 0.1 },
      );
      obs.observe(containerRef.current);
      return () => { obs.disconnect(); t1.kill(); t2.kill(); };
    }

    // Desktop: ScrollTrigger
    const ta = 'play reverse play reverse';
    const ctx = gsap.context(() => {
      gsap.from('.vs-word', {
        y: '100%', opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current!, start: 'top 85%', toggleActions: ta },
      });
      gsap.from('.vs-video', {
        opacity: 0, y: 60, scale: 0.95, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: '.vs-video', start: 'top 85%', toggleActions: ta },
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, []);

  const headingWords = HEADING_TEXT.split(' ');

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      {Platform.OS === 'web' ? (
        <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* word-by-word heading */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0 0.35em',
              marginBottom: isSmallScreen ? 20 : 32,
              maxWidth: 900,
            }}
          >
            {headingWords.map((word, i) => (
              <span
                key={i}
                style={{ overflow: 'hidden', display: 'inline-block' }}
              >
                <span
                  className="vs-word"
                  style={{
                    display: 'inline-block',
                    fontSize: isSmallScreen ? 'clamp(20px, 6vw, 28px)' : 36,
                    fontFamily: Fonts.display,
                    fontWeight: 700,
                    color: colors.text,
                  }}
                >
                  {word}
                </span>
              </span>
            ))}
          </div>

          {/* video container */}
          <div
            className="vs-video"
            style={{
              position: 'relative' as const,
              width: '100%',
              maxWidth: 900,
              aspectRatio: '16 / 9',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                : '0 8px 32px rgba(15, 23, 42, 0.15)',
              alignSelf: 'center',
            }}
          >
            <iframe
              src={YOUTUBE_EMBED_URL}
              title="Construct Link Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute' as const,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <Text style={[styles.heading, { color: colors.text }, isSmallScreen && styles.headingSmall]}>
            {HEADING_TEXT}
          </Text>
          <View style={[styles.placeholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Video available on web
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 80,
    marginBottom: 40,
  } as ViewStyle,
  containerSmall: {
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 24,
  } as ViewStyle,
  heading: {
    fontSize: 36,
    fontFamily: Fonts.display,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  } as TextStyle,
  headingSmall: {
    fontSize: 28,
    marginBottom: 20,
  } as TextStyle,
  placeholder: {
    width: '100%',
    maxWidth: 900,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  placeholderText: {
    fontSize: 16,
    fontFamily: Fonts.body,
  } as TextStyle,
};

export default React.memo(VideoShowcaseComponent);
