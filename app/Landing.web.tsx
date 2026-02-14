import Ionicons from '@expo/vector-icons/Ionicons';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Image, ImageStyle, Platform, Text as RNText, StyleSheet, TextStyle, useWindowDimensions, View, ViewStyle } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Colors, Fonts } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import HeroCardSwap from './web/components/HeroCardSwap';
import HeroTextMorpher from './web/components/HeroTextMorpher';
import { CONSTRUCTION_CATEGORIES, FAQ_ITEMS } from './web/components/landing/_constants';
import CategoryButton from './web/components/landing/CategoryButton';
import DownloadApp from './web/components/landing/DownloadApp';
import FaqItem from './web/components/landing/FaqItem';
import HowItWorks from './web/components/landing/HowItWorks';
import LandingFooter from './web/components/landing/LandingFooter';
import PageLoader from './web/components/landing/PageLoader';
import ProjectSlider from './web/components/landing/ProjectSlider';
import StatsCounter from './web/components/landing/StatsCounter';
import Testimonials from './web/components/landing/Testimonials';
import VideoShowcase from './web/components/landing/VideoShowcase';
import WebLayout from './web/layout';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

const HERO_VIDEO = require('../assets/images/transparentVideo/Cyberpunk Idle.mp4.webm');

export default function WebLanding() {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const [heroVideoUri, setHeroVideoUri] = useState<string | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const [heroSearchValue, setHeroSearchValue] = useState('');

  // Hero entrance animation (kept as-is)
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(32)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 900,
        delay: 80,
        useNativeDriver: false,
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0,
        duration: 900,
        delay: 80,
        useNativeDriver: false,
      }),
    ]).start();
    // CTA buttons fade in after hero text
    Animated.timing(ctaOpacity, {
      toValue: 1,
      duration: 600,
      delay: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  // Override Expo's body { overflow: hidden } so ScrollTrigger can detect window scroll.
  // Also hide the scrollbar. Runs before any useEffect (child or parent).
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.id = 'landing-scroll-fix';
    style.textContent = `
      html, body { overflow-y: auto !important; overflow-x: hidden !important; }
      #root { height: auto !important; min-height: 100% !important; }
      html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; }
      html, body { scrollbar-width: none !important; -ms-overflow-style: none !important; }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('landing-scroll-fix');
      if (el) el.remove();
    };
  }, []);

  // Resolve hero video URI for web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const resolved = typeof Image.resolveAssetSource === 'function'
      ? (Image.resolveAssetSource as (x: number) => { uri?: string })(HERO_VIDEO)?.uri
      : null;
    if (resolved) {
      setHeroVideoUri(resolved);
      return;
    }
    const asset = Asset.fromModule(HERO_VIDEO);
    if (asset.uri) {
      setHeroVideoUri(asset.uri);
      return;
    }
    asset.downloadAsync().then(() => setHeroVideoUri(asset.uri));
  }, []);

  // Ping-pong loop for hero video
  useEffect(() => {
    if (Platform.OS !== 'web' || !heroVideoUri) return;
    const video = heroVideoRef.current;
    if (!video) return;

    video.playbackRate = 1;
    const FPS = 30;
    const STEP_SEC = 1 / FPS;
    const INTERVAL_MS = 1000 / FPS;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const onEnded = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        video.currentTime = 0;
        video.play().catch(() => {});
        return;
      }
      intervalId = setInterval(() => {
        const next = Math.max(0, video.currentTime - STEP_SEC);
        video.currentTime = next;
        if (next <= 0) {
          if (intervalId != null) {
            clearInterval(intervalId);
            intervalId = null;
          }
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      }, INTERVAL_MS);
    };

    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('ended', onEnded);
      if (intervalId != null) clearInterval(intervalId);
    };
  }, [heroVideoUri]);

  // GSAP scroll reveals for inline sections (categories, unlock, FAQ)
  const categoriesRef = useRef<HTMLDivElement>(null);
  const unlockRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // On small screens, keep elements visible after reveal (no reverse on leave)
    // On desktop, full reverse-on-scroll effect
    const small = window.innerWidth < 768;
    const ta = small ? 'play none none reverse' : 'play reverse play reverse';

    const ctx = gsap.context(() => {
      // Categories: staggered scale-in
      if (categoriesRef.current) {
        gsap.from('.cat-btn', {
          opacity: 0,
          scale: 0.6,
          stagger: 0.08,
          duration: 0.5,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: categoriesRef.current,
            start: 'top 85%',
            toggleActions: ta,
          },
        });
      }

      // Unlock Opportunities: heading + subtitle + card
      if (unlockRef.current) {
        gsap.from('.unlock-word', {
          yPercent: 120,
          opacity: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: unlockRef.current,
            start: 'top 85%',
            toggleActions: ta,
          },
        });

        gsap.from('.unlock-sub', {
          y: 30,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: unlockRef.current,
            start: 'top 80%',
            toggleActions: ta,
          },
        });

        gsap.from('.unlock-card', {
          opacity: 0,
          x: 100,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: unlockRef.current,
            start: 'top 75%',
            toggleActions: ta,
          },
        });
      }

      // FAQ: heading + items + side image
      if (faqRef.current) {
        gsap.from('.faq-heading', {
          y: 40,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: faqRef.current,
            start: 'top 85%',
            toggleActions: ta,
          },
        });

        gsap.from('.faq-item-reveal', {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: faqRef.current,
            start: 'top 80%',
            toggleActions: ta,
          },
        });

        gsap.from('.faq-side-img', {
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: faqRef.current,
            start: 'top 80%',
            toggleActions: ta,
          },
        });
      }
    });

    // Refresh ScrollTrigger positions after layout settles
    const rafId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, []);

  const isSmallScreen = screenWidth < 768;
  const showHeroImage = screenWidth >= 768;

  const unlockHeadingWords = 'Unlock Opportunities'.split(' ');

  return (
    <>
      <PageLoader />
      <WebLayout>
        <View style={[styles.page, { backgroundColor: colors.background }]}>
          {/* ─── Hero (UNTOUCHED) ─── */}
          <Animated.View
            style={[
              styles.newHeroSection,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            <HeroTextMorpher
              textColor={colors.text}
              fontSize={Platform.OS === 'web' ? (isSmallScreen ? 'clamp(36px, 10vw, 72px)' as any : 'clamp(48px, 10vw, 100px)' as any) : 80}
              style={[styles.heroTextMorpher, isSmallScreen && { top: '15%', left: 0, right: 0, alignItems: 'center' }]}
            />
            {/* ─── Hero CTA Buttons + Search ─── */}
            {Platform.OS === 'web' && (
              <Animated.View
                style={{
                  position: 'absolute',
                  zIndex: 3,
                  pointerEvents: 'box-none' as any,
                  opacity: ctaOpacity,
                  ...(isSmallScreen
                    ? {
                        top: '15%' as any,
                        left: 0,
                        right: 0,
                        alignItems: 'center' as any,
                        paddingTop: 'calc(clamp(36px, 10vw, 72px) * 2 + 32px)' as any,
                        paddingHorizontal: 20,
                      }
                    : {
                        top: 0,
                        left: 0,
                        paddingTop: 'calc(24px + clamp(48px, 10vw, 100px) + 24px)' as any,
                        paddingLeft: 40,
                      }),
                } as any}
              >
                <View
                  style={{
                    flexDirection: isSmallScreen ? 'column' : 'row',
                    alignItems: isSmallScreen ? 'center' : 'flex-start',
                    gap: 12,
                    pointerEvents: 'auto' as any,
                  } as any}
                >
                  <button
                    type="button"
                    onClick={() => router.push('/workers')}
                    style={{
                      backgroundColor: colors.accent,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      padding: isSmallScreen ? '12px 24px' : '14px 28px',
                      fontFamily: Fonts.heading,
                      fontSize: isSmallScreen ? 16 : 18,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, filter 0.15s ease',
                      minWidth: isSmallScreen ? 200 : undefined,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  >
                    Find Workers
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/jobs-create')}
                    style={{
                      backgroundColor: 'transparent',
                      color: colors.text,
                      border: `2px solid ${colors.text}`,
                      borderRadius: 12,
                      padding: isSmallScreen ? '10px 24px' : '12px 28px',
                      fontFamily: Fonts.heading,
                      fontSize: isSmallScreen ? 16 : 18,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, background-color 0.2s ease',
                      minWidth: isSmallScreen ? 200 : undefined,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Post a Job
                  </button>
                </View>
                {/* Hero search bar */}
                <div
                  style={{
                    marginTop: isSmallScreen ? 16 : 20,
                    display: 'flex',
                    alignItems: 'center',
                    maxWidth: isSmallScreen ? '100%' : 400,
                    width: '100%',
                    pointerEvents: 'auto',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      borderRadius: 12,
                      paddingLeft: 16,
                      paddingRight: 8,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Ionicons name="search" size={20} color={colors.icon} />
                    <input
                      type="text"
                      placeholder="Search workers, companies, skills..."
                      value={heroSearchValue}
                      onChange={(e) => setHeroSearchValue(e.target.value)}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        padding: '12px',
                        fontSize: 15,
                        fontFamily: Fonts.body,
                        color: colors.text,
                        outline: 'none',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && heroSearchValue.trim()) {
                          router.push(`/workers?search=${encodeURIComponent(heroSearchValue.trim())}`);
                        }
                      }}
                    />
                  </div>
                </div>
              </Animated.View>
            )}
            {Platform.OS === 'web' && heroVideoUri ? (
              <div
                ref={heroVideoContainerRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 2,
                }}
              >
                <video
                  ref={heroVideoRef}
                  src={heroVideoUri}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    ...(isSmallScreen
                      ? {
                          bottom: 0,
                          right: 0,
                          width: '65%',
                          height: '70%',
                          top: 'auto',
                          left: 'auto',
                        }
                      : {
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: '55%',
                          height: '100%',
                          left: 'auto',
                        }),
                    objectFit: 'contain',
                    objectPosition: isSmallScreen ? 'center bottom' : 'right center',
                  }}
                />
              </div>
            ) : null}
          </Animated.View>

          {/* ─── Video Showcase (enhanced) ─── */}
          <VideoShowcase isSmallScreen={isSmallScreen} />

          {/* ─── Project Slider (NEW) ─── */}
          <ProjectSlider isSmallScreen={isSmallScreen} />

          {/* ─── How It Works (enhanced) ─── */}
          <HowItWorks isSmallScreen={isSmallScreen} />

          {/* ─── Stats Counter (NEW) ─── */}
          <StatsCounter isSmallScreen={isSmallScreen} />

          {/* ─── Category Buttons Grid (enhanced) ─── */}
          <View style={[styles.categoriesSection, isSmallScreen && styles.categoriesSectionCompact]}>
            {Platform.OS === 'web' ? (
              <div ref={categoriesRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <View style={[styles.categoriesGrid, isSmallScreen && styles.categoriesGridCompact]}>
                  {CONSTRUCTION_CATEGORIES.map((category, index) => (
                    <CategoryButton
                      key={index}
                      label={category}
                      isDark={isDark}
                      colors={colors}
                      isCompact={isSmallScreen}
                      buttonId={`landing-cat-${index}`}
                    />
                  ))}
                </View>
              </div>
            ) : (
              <View style={[styles.categoriesGrid, isSmallScreen && styles.categoriesGridCompact]}>
                {CONSTRUCTION_CATEGORIES.map((category, index) => (
                  <CategoryButton
                    key={index}
                    label={category}
                    isDark={isDark}
                    colors={colors}
                    isCompact={isSmallScreen}
                  />
                ))}
              </View>
            )}
          </View>

          {/* ─── Unlock Opportunities (enhanced with GSAP) ─── */}
          {Platform.OS === 'web' ? (
            <div
              ref={unlockRef}
              style={{
                width: '100%',
                maxWidth: isSmallScreen ? '100%' : 1200,
                display: 'flex',
                flexDirection: isSmallScreen ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: isSmallScreen ? 'center' : 'space-between',
                paddingLeft: isSmallScreen ? 16 : 40,
                paddingRight: isSmallScreen ? 16 : 40,
                gap: isSmallScreen ? 24 : 32,
                alignSelf: 'center',
                margin: '0 auto',
                marginTop: isSmallScreen ? 48 : 80,
              }}
            >
              <div
                style={{
                  flex: 1,
                  maxWidth: isSmallScreen ? '100%' : 540,
                  width: isSmallScreen ? '100%' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isSmallScreen ? 'center' : undefined,
                  ...(isSmallScreen
                    ? {
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 20,
                        paddingLeft: 24,
                        paddingRight: 24,
                        paddingTop: 28,
                        paddingBottom: 28,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      }
                    : {}),
                }}
              >
                {/* word-by-word heading */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: isSmallScreen ? 'center' : 'flex-start',
                    gap: '0 0.35em',
                    marginBottom: isSmallScreen ? 12 : 24,
                  }}
                >
                  {unlockHeadingWords.map((word, i) => (
                    <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
                      <span
                        className="unlock-word"
                        style={{
                          display: 'inline-block',
                          fontFamily: Fonts.display,
                          fontWeight: 700,
                          color: colors.text,
                          fontSize: 'clamp(32px, 5vw, 56px)',
                          textAlign: isSmallScreen ? 'center' : 'left',
                        }}
                      >
                        {word}
                      </span>
                    </span>
                  ))}
                </div>
                <span
                  className="unlock-sub"
                  style={{
                    fontSize: 'clamp(16px, 2vw, 20px)',
                    textAlign: isSmallScreen ? 'center' : 'left',
                    maxWidth: 700,
                    marginBottom: isSmallScreen ? 0 : 48,
                    lineHeight: '28px',
                    fontWeight: 400,
                    fontFamily: Fonts.body,
                    color: colors.text,
                  }}
                >
                  Connect with skilled construction professionals and discover your ideal career opportunities.
                </span>
              </div>
              {showHeroImage && (
                <div className="unlock-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HeroCardSwap
                    imageFindWorkers={require('../assets/images/landingPageImages/image17.png')}
                    imageFindJobs={require('../assets/images/landingPageImages/image11.png')}
                    imageCreateJobs={require('../assets/images/landingPageImages/image18.png')}
                    cardWidth={580}
                    cardHeight={480}
                    cardBackground={colors.background}
                    cardTextColor={colors.text}
                    cardFontFamily={Fonts.sans}
                    cardMarginBackground={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.18)'}
                    cardIconRowBackground={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'}
                    cardIconRowBorderColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)'}
                  />
                </div>
              )}
            </div>
          ) : (
            <View
              style={[
                styles.hero,
                isSmallScreen && styles.heroStacked,
              ]}
            >
              <View
                style={[
                  styles.heroLeft,
                  isSmallScreen && styles.heroLeftCentered,
                  isSmallScreen && {
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                    borderRadius: 20,
                    paddingHorizontal: 24,
                    paddingVertical: 28,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  },
                ]}
              >
                <RNText
                  style={[
                    styles.mainHeading,
                    isSmallScreen && styles.mainHeadingCentered,
                    isSmallScreen && { marginBottom: 12 },
                    { color: colors.text },
                  ]}
                >
                  Unlock Opportunities
                </RNText>
                <RNText
                  style={[
                    styles.subheading,
                    isSmallScreen && styles.subheadingCentered,
                    isSmallScreen && { marginBottom: 0 },
                    { color: colors.text },
                  ]}
                >
                  Connect with skilled construction professionals and discover your ideal career opportunities.
                </RNText>
              </View>
              {showHeroImage && (
                <View style={styles.heroRight}>
                  <HeroCardSwap
                    imageFindWorkers={require('../assets/images/landingPageImages/image17.png')}
                    imageFindJobs={require('../assets/images/landingPageImages/image11.png')}
                    imageCreateJobs={require('../assets/images/landingPageImages/image18.png')}
                    cardWidth={580}
                    cardHeight={480}
                    cardBackground={colors.background}
                    cardTextColor={colors.text}
                    cardFontFamily={Fonts.sans}
                    cardMarginBackground={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.18)'}
                    cardIconRowBackground={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'}
                    cardIconRowBorderColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)'}
                  />
                </View>
              )}
            </View>
          )}

          {/* ─── Download the App (enhanced) ─── */}
          <DownloadApp isSmallScreen={isSmallScreen} />

          {/* ─── Testimonials (NEW – horizontal scroll) ─── */}
          <Testimonials isSmallScreen={isSmallScreen} />

          {/* ─── FAQ Section (enhanced) ─── */}
          <View style={[styles.faqSection, isSmallScreen && { marginTop: 40, paddingVertical: 40 }]}>
            {Platform.OS === 'web' ? (
              <div ref={faqRef} style={{ width: '100%', maxWidth: 1200, alignSelf: 'center', margin: '0 auto' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isSmallScreen ? 'column' : 'row',
                    alignItems: isSmallScreen ? 'center' : 'flex-start',
                    justifyContent: 'space-between',
                    gap: 40,
                  }}
                >
                  {!isSmallScreen && (
                    <div className="faq-side-img" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Image
                        source={require('../assets/images/landingPageImages/image17.png')}
                        style={styles.faqSideImage}
                        resizeMode="contain"
                      />
                    </div>
                  )}
                  <div style={{ flex: 2 }}>
                    <div className="faq-heading">
                      <View style={[styles.faqHeadingRow, isSmallScreen && styles.faqHeadingRowSmall]}>
                        <View style={isSmallScreen ? { alignItems: 'center', width: '100%' } : undefined}>
                          <RNText style={[styles.faqTitle, isSmallScreen && { fontSize: 36, textAlign: 'center' }, { color: colors.text }]}>
                            Common
                          </RNText>
                          <RNText style={[styles.faqTitle, isSmallScreen && { fontSize: 36, textAlign: 'center' }, { color: colors.text }]}>
                            Questions
                          </RNText>
                        </View>
                        {!isSmallScreen && (
                          <RNText style={[styles.faqSubtitle, { color: colors.text }]}>
                            Some questions people usually ask
                          </RNText>
                        )}
                      </View>
                    </div>
                    <View style={styles.faqList}>
                      {FAQ_ITEMS.map((item, index) => (
                        <div key={index} className="faq-item-reveal">
                          <FaqItem
                            item={item}
                            isSmallScreen={isSmallScreen}
                            colors={colors}
                            itemId={`landing-faq-item-${index}`}
                          />
                        </div>
                      ))}
                    </View>
                  </div>
                </div>
              </div>
            ) : (
              <View style={[styles.faqContainer, isSmallScreen && styles.faqContainerStacked]}>
                {!isSmallScreen && (
                  <View style={styles.faqImageWrapper}>
                    <Image
                      source={require('../assets/images/landingPageImages/image17.png')}
                      style={styles.faqSideImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                <View style={[styles.faqContent, isSmallScreen && styles.faqContentCentered]}>
                  <View style={styles.faqHeadingRow}>
                    <View>
                      <RNText style={[styles.faqTitle, isSmallScreen && { fontSize: 36 }, { color: colors.text }]}>
                        Common
                      </RNText>
                      <RNText style={[styles.faqTitle, isSmallScreen && { fontSize: 36 }, { color: colors.text }]}>
                        Questions
                      </RNText>
                    </View>
                    {!isSmallScreen && (
                      <RNText style={[styles.faqSubtitle, { color: colors.text }]}>
                        Some questions people usually ask
                      </RNText>
                    )}
                  </View>
                  <View style={styles.faqList}>
                    {FAQ_ITEMS.map((item, index) => (
                      <FaqItem
                        key={index}
                        item={item}
                        isSmallScreen={isSmallScreen}
                        colors={colors}
                      />
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ─── Footer (redesigned with giant CTA) ─── */}
          <LandingFooter isSmallScreen={isSmallScreen} colors={colors} />
        </View>
      </WebLayout>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 100,
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
      },
    }),
  } as ViewStyle,
  newHeroSection: {
    width: '100%',
    height: '100vh' as any,
    minHeight: 400,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
      },
    }),
  } as ViewStyle,
  newHeroImage: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        objectFit: 'contain' as any,
        objectPosition: '85% 50%' as any,
      },
    }),
  } as ImageStyle,
  newHeroImageOnTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  } as ImageStyle,
  heroTextMorpher: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  } as ViewStyle,
  hero: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    gap: 32,
    alignSelf: 'center',
    marginTop: 80,
  } as ViewStyle,
  heroStacked: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 48,
    marginTop: 48,
  } as ViewStyle,
  heroLeft: {
    flex: 1,
    maxWidth: 540,
  } as ViewStyle,
  heroLeftCentered: {
    alignItems: 'center',
  } as ViewStyle,
  heroRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  heroImage: {
    width: '100%',
    maxWidth: 520,
    aspectRatio: 1.2,
  } as ImageStyle,
  mainHeading: {
    fontSize: 64,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 24,
    fontFamily: Fonts.display,
    ...Platform.select({
      web: {
        fontSize: 'clamp(32px, 5vw, 56px)' as any,
      },
    }),
  } as TextStyle,
  mainHeadingCentered: {
    textAlign: 'center',
  } as TextStyle,
  subheading: {
    fontSize: 20,
    textAlign: 'left',
    maxWidth: 700,
    marginBottom: 48,
    lineHeight: 28,
    fontWeight: '400',
    fontFamily: Fonts.body,
    ...Platform.select({
      web: {
        fontSize: 'clamp(16px, 2vw, 20px)' as any,
      },
    }),
  } as TextStyle,
  subheadingCentered: {
    textAlign: 'center',
  } as TextStyle,
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 80,
    ...Platform.select({
      web: {
        backgroundColor: 'rgba(42, 42, 42, 0.8)' as any,
        boxShadow: '0 0 30px rgba(144, 238, 144, 0.5), 0 0 60px rgba(144, 238, 144, 0.3), inset 0 0 20px rgba(144, 238, 144, 0.1)' as any,
        transform: [{ rotate: '-2deg' }] as any,
        cursor: 'pointer' as any,
        transition: 'all 0.25s ease' as any,
      },
      default: {
        backgroundColor: '#2a2a2a',
      },
    }),
    alignSelf: 'flex-start',
  } as ViewStyle,
  ctaButtonCentered: {
    alignSelf: 'center',
  } as ViewStyle,
  ctaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#8B5CF6',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' as any,
      },
    }),
  } as ViewStyle,
  ctaButtonDashboard: {
    ...Platform.select({
      web: {
        backgroundColor: `${Colors.light.accent}1F` as any,
        border: `2px solid ${Colors.light.accent}80` as any,
        boxShadow: `0 0 24px ${Colors.light.accent}73, 0 0 40px ${Colors.light.accent}40, inset 0 0 0 1px rgba(255,255,255,0.08)` as any,
        transform: [{ rotate: '0deg' }] as any,
      },
    }),
  } as ViewStyle,
  ctaIconDashboard: {
    backgroundColor: Colors.light.accent,
    ...Platform.select({
      web: {
        backgroundImage: `linear-gradient(135deg, ${Colors.light.accent} 0%, rgb(0, 100, 160) 100%)` as any,
      },
    }),
  } as ViewStyle,
  ctaButtonText: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: Fonts.display,
  } as TextStyle,
  ctaButtonTextDashboard: {
    letterSpacing: 0.5,
  } as TextStyle,
  categoriesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    maxWidth: 1200,
    ...Platform.select({
      web: {
        gap: '24px' as any,
      },
    }),
  } as ViewStyle,
  categoriesGridCompact: {
    ...Platform.select({
      web: {
        gap: '12px' as any,
      },
    }),
    paddingHorizontal: 16,
  } as ViewStyle,
  categoriesSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
  } as ViewStyle,
  categoriesSectionCompact: {
    marginTop: 32,
    marginBottom: 16,
  } as ViewStyle,
  faqSection: {
    width: '100%',
    marginTop: 80,
    paddingVertical: 80,
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        backgroundImage:
          `linear-gradient(135deg, ${Colors.light.warmStart} 0%, ${Colors.light.warmEnd} 100%)` as any,
      },
      default: {
        backgroundColor: Colors.light.warmStart,
      },
    }),
  } as ViewStyle,
  faqContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 40,
  } as ViewStyle,
  faqContainerStacked: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  faqContent: {
    flex: 2,
  } as ViewStyle,
  faqContentCentered: {
    alignItems: 'center',
  } as ViewStyle,
  faqHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  } as ViewStyle,
  faqHeadingRowSmall: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  faqTitle: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Fonts.display,
  } as TextStyle,
  faqSubtitle: {
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: Fonts.body,
  } as TextStyle,
  faqList: {
    marginTop: 24,
  } as ViewStyle,
  faqImageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  faqSideImage: {
    width: '100%',
    maxWidth: 380,
    aspectRatio: 1.1,
  } as ImageStyle,
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 14,
  } as ViewStyle,
  faqItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  } as ViewStyle,
  faqQuestion: {
    flex: 1,
    fontSize: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Fonts.body,
  } as TextStyle,
  faqQuestionCentered: {
    textAlign: 'center',
  } as TextStyle,
  faqItemBody: {
    overflow: 'hidden',
    paddingTop: 12,
    paddingBottom: 12,
  } as ViewStyle,
  faqAnswer: {
    fontSize: 17,
    lineHeight: 26,
  } as TextStyle,
  faqAnswerCentered: {
    textAlign: 'center',
  } as TextStyle,
  footerSection: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.35)',
  } as ViewStyle,
  footerTopRow: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 40,
    marginBottom: 12,
  } as ViewStyle,
  footerColBrand: {
    flex: 2,
  } as ViewStyle,
  footerColBrandSmall: {
    alignItems: 'center',
  } as ViewStyle,
  footerCol: {
    flex: 1,
  } as ViewStyle,
  footerBrand: {
    fontSize: 46,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Fonts.display,
  } as TextStyle,
  footerText: {
    fontSize: 14,
  } as TextStyle,
  footerTextCentered: {
    textAlign: 'center',
  } as TextStyle,
  footerContactRow: {
    marginTop: 14,
  } as ViewStyle,
  footerColTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Fonts.display,
    textAlign: 'left',
  } as TextStyle,
  footerLink: {
    fontSize: 14,
    marginBottom: 10,
  } as TextStyle,
  footerLinkCentered: {
    textAlign: 'center',
  } as TextStyle,
  footerColumnsRowSmall: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    marginTop: 20,
  } as ViewStyle,
  footerMetaRow: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  } as ViewStyle,
  footerMeta: {
    fontSize: 12,
  } as TextStyle,
  footerMetaBrand: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.display,
  } as TextStyle,
  footerMetaBuiltBy: {
    fontFamily: Fonts.accent,
  } as TextStyle,
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      web: {
        flexGrow: 0 as any,
        flexShrink: 0 as any,
        flexBasis: 'auto' as any,
        cursor: 'pointer' as any,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' as any,
        position: 'relative' as any,
        overflow: 'hidden' as any,
      },
      default: {
        width: '45%',
        minWidth: 200,
      },
    }),
  } as ViewStyle,
  categoryButtonCompact: {
    ...Platform.select({
      web: {
        flexBasis: 'calc(50% - 12px)' as any,
        maxWidth: 'calc(50% - 12px)' as any,
      },
      default: {
        width: '48%',
      },
    }),
  } as ViewStyle,
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: {
        opacity: 0.15 as any,
        pointerEvents: 'none' as any,
        mixBlendMode: 'overlay' as any,
      },
    }),
  } as ViewStyle,
  categoryButtonHovered: {
    ...Platform.select({
      web: {
        transform: 'translateY(-2px) scale(1.02)' as any,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)' as any,
      },
    }),
  } as ViewStyle,
  categoryButtonPressed: {
    ...Platform.select({
      web: {
        transform: 'translateY(0) scale(0.98)' as any,
      },
    }),
  } as ViewStyle,
  categoryImageArea: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    flexShrink: 0,
    overflow: 'hidden',
  } as ViewStyle,
  categoryImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
    flexShrink: 0,
  } as TextStyle,
  arrowIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as ViewStyle,
  arrowShape: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'border-left-color 0.3s ease, transform 0.3s ease' as any,
      },
    }),
  } as ViewStyle,
  arrowShapeHovered: {
    ...Platform.select({
      web: {
        transform: 'translateX(4px)' as any,
      },
    }),
  } as ViewStyle,
});
