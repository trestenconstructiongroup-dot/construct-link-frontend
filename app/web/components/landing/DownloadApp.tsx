import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Colors, Fonts } from '../../../../constants/theme';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

const HEADING_TEXT = 'Take Tresten Construction Group Inc Everywhere';

interface DownloadAppProps {
  isSmallScreen: boolean;
}

function DownloadAppComponent({ isSmallScreen }: DownloadAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePress = () => {
    if (Platform.OS === 'web') {
      window.open('#', '_blank');
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    if (isSmallScreen) {
      // Mobile: IntersectionObserver
      const t1 = gsap.from('.da-word', {
        y: '100%', opacity: 0, duration: 0.5, stagger: 0.04,
        ease: 'power3.out', paused: true,
      });
      const t2 = gsap.from('.da-sub', {
        y: 30, opacity: 0, duration: 0.6, ease: 'power2.out', paused: true,
      });
      const t3 = gsap.from('.da-badge', {
        opacity: 0, y: 30, scale: 0.8, stagger: 0.2, duration: 0.6,
        ease: 'back.out(1.7)', paused: true,
      });
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) { t1.play(); t2.play(); t3.play(); }
          else { t1.reverse(); t2.reverse(); t3.reverse(); }
        },
        { threshold: 0.1 },
      );
      obs.observe(containerRef.current);
      return () => { obs.disconnect(); t1.kill(); t2.kill(); t3.kill(); };
    }

    // Desktop: ScrollTrigger
    const ta = 'play reverse play reverse';
    const ctx = gsap.context(() => {
      gsap.from('.da-word', {
        y: '100%', opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current!, start: 'top 85%', toggleActions: ta },
      });
      gsap.from('.da-sub', {
        y: 30, opacity: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: containerRef.current!, start: 'top 85%', toggleActions: ta },
      });
      gsap.from('.da-badge', {
        opacity: 0, y: 30, scale: 0.8, stagger: 0.2, duration: 0.6, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: containerRef.current!, start: 'top 80%', toggleActions: ta },
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, []);

  const headingWords = HEADING_TEXT.split(' ');

  const badgeContent = (
    <>
      <Pressable
        style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
        onPress={handlePress}
        {...(Platform.OS === 'web' ? { className: 'da-badge' } as any : {})}
      >
        <Ionicons name="logo-apple" size={24} color="#ffffff" />
        <View>
          <Text style={styles.badgeSmallText}>Download on the</Text>
          <Text style={styles.badgeLargeText}>App Store</Text>
        </View>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
        onPress={handlePress}
        {...(Platform.OS === 'web' ? { className: 'da-badge' } as any : {})}
      >
        <Ionicons name="logo-google-playstore" size={24} color="#ffffff" />
        <View>
          <Text style={styles.badgeSmallText}>Get it on</Text>
          <Text style={styles.badgeLargeText}>Google Play</Text>
        </View>
      </Pressable>
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.gradient,
          isSmallScreen && styles.gradientSmall,
          {
            backgroundImage: `linear-gradient(135deg, ${Colors.light.warmStart} 0%, ${Colors.light.warmEnd} 100%)`,
          } as any,
        ]}
      >
        <div ref={containerRef} style={{ maxWidth: 1200, width: '100%', alignSelf: 'center', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: isSmallScreen ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: isSmallScreen ? 28 : 40,
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: isSmallScreen ? 'center' : undefined }}>
              {/* word-by-word heading */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: isSmallScreen ? 'center' : 'flex-start',
                  gap: '0 0.35em',
                }}
              >
                {headingWords.map((word, i) => (
                  <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
                    <span
                      className="da-word"
                      style={{
                        display: 'inline-block',
                        fontSize: isSmallScreen ? 'clamp(22px, 5vw, 36px)' : 36,
                        fontFamily: Fonts.display,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {word}
                    </span>
                  </span>
                ))}
              </div>
              <span
                className="da-sub"
                style={{
                  fontSize: 16,
                  fontFamily: Fonts.body,
                  color: '#ffffff',
                  lineHeight: '24px',
                  textAlign: isSmallScreen ? 'center' : undefined,
                }}
              >
                Download the app and find jobs or hire workers on the go.
              </span>
            </div>
            <View style={[styles.badgeRow, isSmallScreen && styles.badgeRowSmall]}>
              {badgeContent}
            </View>
          </div>
        </div>
      </View>
    );
  }

  return (
    <View style={[styles.gradient, isSmallScreen && styles.gradientSmall]}>
      <View style={[styles.inner, isSmallScreen && styles.innerSmall]}>
        <View style={[styles.textColumn, isSmallScreen && styles.textColumnSmall]}>
          <Text style={[styles.heading, isSmallScreen && styles.headingSmall]}>
            {HEADING_TEXT}
          </Text>
          <Text style={styles.subtext}>
            Download the app and find jobs or hire workers on the go.
          </Text>
        </View>
        <View style={[styles.badgeRow, isSmallScreen && styles.badgeRowSmall]}>
          {badgeContent}
        </View>
      </View>
    </View>
  );
}

const styles = {
  gradient: {
    width: '100%',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginTop: 80,
  } as ViewStyle,
  gradientSmall: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  } as ViewStyle,
  inner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 40,
  } as ViewStyle,
  innerSmall: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
  } as ViewStyle,
  textColumn: {
    flex: 1,
    gap: 8,
  } as ViewStyle,
  textColumnSmall: {
    alignItems: 'center',
  } as ViewStyle,
  heading: {
    fontSize: 36,
    fontFamily: Fonts.display,
    fontWeight: '700',
    color: '#ffffff',
    ...Platform.select({
      web: { fontSize: 'clamp(24px, 4vw, 36px)' as any },
    }),
  } as TextStyle,
  headingSmall: {
    textAlign: 'center',
  } as TextStyle,
  subtext: {
    fontSize: 16,
    fontFamily: Fonts.body,
    color: '#ffffff',
    lineHeight: 24,
  } as TextStyle,
  badgeRow: {
    flexDirection: 'row',
    gap: 16,
  } as ViewStyle,
  badgeRowSmall: {
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as ViewStyle,
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      } as any,
    }),
  } as ViewStyle,
  badgePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  } as ViewStyle,
  badgeSmallText: {
    fontSize: 10,
    fontFamily: Fonts.body,
    color: '#ffffff',
  } as TextStyle,
  badgeLargeText: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    fontWeight: '600',
    color: '#ffffff',
  } as TextStyle,
};

export default React.memo(DownloadAppComponent);
