import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageStyle, Platform, Pressable, Text as RNText, StyleSheet, TextStyle, useWindowDimensions, View, ViewStyle } from 'react-native';
import { Text } from '../components/Text';
import { Colors, Fonts } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import HeroCardSwap from './web/components/HeroCardSwap';
import HeroTextMorpher from './web/components/HeroTextMorpher';
import { CONSTRUCTION_CATEGORIES, FAQ_ITEMS } from './web/components/landing/_constants';
import CategoryButton from './web/components/landing/CategoryButton';
import FaqItem from './web/components/landing/FaqItem';
import LandingFooter from './web/components/landing/LandingFooter';
import MagnetButton from './web/components/MagnetButton';
import WebLayout from './web/layout';

const HERO_VIDEO = require('../assets/images/transparentVideo/Cyberpunk Idle.mp4.webm');
const HERO_MASK_IMAGE = require('../assets/images/landingPageImages/image19.png');

export default function WebLanding() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width: screenWidth } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(40)).current;
  const [heroVideoUri, setHeroVideoUri] = useState<string | null>(null);
  const [heroMaskUri, setHeroMaskUri] = useState<string | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const heroMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Current hero section (top) – entrance on page load
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(rise, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]).start();
  }, []);

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

  // Resolve hero mask image URI (for light-mode text mask: white text only where hero visual is)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const resolved = typeof Image.resolveAssetSource === 'function'
      ? (Image.resolveAssetSource as (x: number) => { uri?: string })(HERO_MASK_IMAGE)?.uri
      : null;
    if (resolved) {
      setHeroMaskUri(resolved);
      return;
    }
    const asset = Asset.fromModule(HERO_MASK_IMAGE);
    if (asset.uri) {
      setHeroMaskUri(asset.uri);
      return;
    }
    asset.downloadAsync().then(() => setHeroMaskUri(asset.uri));
  }, []);

  // Ping-pong loop at 1x: play forward to end, then scrub backward (visible frame steps), then play forward again (web only)
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

  // Light mode only: canvas overlay – white text only where character (video) is, so it follows motion
  useEffect(() => {
    if (Platform.OS !== 'web' || isDark || !heroVideoUri) return;
    const video = heroVideoRef.current;
    const container = heroVideoContainerRef.current;
    const canvas = heroMaskCanvasRef.current;
    if (!video || !container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const OBJECT_POSITION_X = 0.85;
    const OBJECT_POSITION_Y = 0.50;
    const TAGLINE = 'THE ALL-IN-ONE ECOSYSTEM FOR THE MODERN WORKFORCE.';
    const FONT_FAMILY = Fonts.accent;
    const PAD_RIGHT = 40;
    const PAD_BOTTOM = 48;
    const TEXT_LEFT_PCT = 1 / 3;
    const LETTER_SPACING = 0.5;
    const LINE_HEIGHT_MULT = 1.4;
    const OFFSET_X = 10;
    const OFFSET_Y = 12;

    let rafId: number | null = null;

    const measureWithSpacing = (ctx: CanvasRenderingContext2D, s: string) =>
      (ctx.measureText(s).width + (s.length > 0 ? (s.length - 1) * LETTER_SPACING : 0));

    const draw = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (cw <= 0 || ch <= 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);

      const vwPx = typeof window !== 'undefined' ? window.innerWidth : cw;
      // Match the web CSS clamp used for the tagline:
      // font-size: clamp(16px, 3.5vw, 40px);
      const fontSize = Math.min(40, Math.max(16, vwPx * 0.035));
      const lineHeight = fontSize * LINE_HEIGHT_MULT;
      ctx.font = `${fontSize}px ${FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';

      const textRight = cw - PAD_RIGHT + OFFSET_X;
      const maxWidth = cw * (1 - TEXT_LEFT_PCT) - PAD_RIGHT;
      const words = TAGLINE.split(' ');
      const lines: string[] = [];
      let line = '';
      for (let i = 0; i < words.length; i++) {
        const test = line ? `${line} ${words[i]}` : words[i];
        const w = measureWithSpacing(ctx, test);
        if (w > maxWidth && line) {
          lines.push(line);
          line = words[i];
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);

      ctx.textBaseline = 'bottom';
      let y = ch - PAD_BOTTOM - OFFSET_Y;
      for (let i = lines.length - 1; i >= 0; i--) {
        const ln = lines[i];
        let x = textRight;
        for (let j = ln.length - 1; j >= 0; j--) {
          const char = ln[j];
          const w = ctx.measureText(char).width;
          ctx.fillText(char, x, y);
          x -= w + LETTER_SPACING;
        }
        y -= lineHeight;
      }

      if (vw > 0 && vh > 0) {
        const scale = Math.min(cw / vw, ch / vh);
        const rw = vw * scale;
        const rh = vh * scale;
        const destX = OBJECT_POSITION_X * (cw - rw);
        const destY = OBJECT_POSITION_Y * (ch - rh);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(video, 0, 0, vw, vh, destX, destY, rw, rh);
        ctx.globalCompositeOperation = 'source-over';
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [heroVideoUri, isDark]);

  const isSmallScreen = screenWidth < 900;
  const showHeroImage = screenWidth >= 900;

  const goHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const goLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleCtaPress = useCallback(() => {
    if (isAuthenticated) goHome();
    else goLogin();
  }, [isAuthenticated, goHome, goLogin]);

  return (
    <WebLayout>
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        {/* New hero section – full viewport, image fits (no crop) then scroll */}
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
            fontSize={Platform.OS === 'web' ? ('clamp(72px, 14vw, 200px)' as any) : 160}
            style={styles.heroTextMorpher}
          />
          <View style={[styles.heroTagline, { pointerEvents: 'none' }]}>
            {Platform.OS === 'web' ? (
              <div
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  alignSelf: 'stretch',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    padding: 0,
                    width: '100%',
                    maxWidth: '100%',
                    textAlign: 'right',
                    fontFamily: Fonts.accent,
                    // Slightly smaller and more responsive on small screens to avoid distortion
                    fontSize: 'clamp(16px, 3.5vw, 40px)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    lineHeight: 1.4,
                    color: colors.text,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  THE ALL-IN-ONE ECOSYSTEM FOR THE MODERN WORKFORCE.
                </p>
              </div>
            ) : (
              <View style={styles.heroTaglineTextWrap}>
                <RNText style={[styles.heroTaglineText, { color: colors.text }]}>
                  THE ALL-IN-ONE ECOSYSTEM FOR THE MODERN WORKFORCE.
                </RNText>
              </View>
            )}
          </View>
          {/* Light mode, no video: fallback static mask by image */}
          {Platform.OS === 'web' && !isDark && heroMaskUri && !heroVideoUri && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 4,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                paddingBottom: 48,
                paddingRight: 40,
                paddingLeft: '33.333%',
                boxSizing: 'border-box',
                WebkitMaskImage: `url(${heroMaskUri})`,
                maskImage: `url(${heroMaskUri})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: '85% 50%',
                maskPosition: '85% 50%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                isolation: 'isolate',
              } as React.CSSProperties}
            >
              <p
                style={{
                  margin: 0,
                  padding: 0,
                  width: '100%',
                  maxWidth: '100%',
                  textAlign: 'right',
                  fontFamily: Fonts.accent,
                  fontSize: 'clamp(16px, 3.5vw, 40px)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  lineHeight: 1.4,
                  color: 'white',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                THE ALL-IN-ONE ECOSYSTEM FOR THE MODERN WORKFORCE.
              </p>
            </div>
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
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: '85% 50%',
                }}
              />
            </div>
          ) : null}
          {/* Light + video: white text only where character is – above tagline so white is visible */}
          {Platform.OS === 'web' && !isDark && heroVideoUri && (
            <canvas
              ref={heroMaskCanvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 4,
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
              }}
              aria-hidden
            />
          )}
        </Animated.View>

        {/* Common Questions / FAQ section */}
        <View style={styles.faqSection}>
          <View
            style={[
              styles.faqContainer,
              isSmallScreen && styles.faqContainerStacked,
            ]}
          >
            {/* Image on the left for large screens */}
            {!isSmallScreen && (
              <View style={styles.faqImageWrapper}>
                <Image
                  source={require('../assets/images/landingPageImages/image17.png')}
                  style={styles.faqSideImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Text on the right */}
            <View
              style={[
                styles.faqContent,
                isSmallScreen && styles.faqContentCentered,
              ]}
            >
              <View style={styles.faqHeadingRow}>
                <View>
                  <RNText style={[styles.faqTitle, { color: colors.text }]}>
                    Common
                  </RNText>
                  <RNText style={[styles.faqTitle, { color: colors.text }]}>
                    Questions
                  </RNText>
                </View>
                {!isSmallScreen && (
                  <RNText
                    style={[styles.faqSubtitle, { color: colors.text }]}
                  >
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
                    itemId={Platform.OS === 'web' ? `landing-faq-item-${index}` : undefined}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Unlock Opportunities hero + CardSwap (below Q&A) */}
        <Animated.View
          style={[
            styles.hero,
            isSmallScreen && styles.heroStacked,
            {
              opacity: fade,
              transform: [{ translateY: rise }],
            },
          ]}
        >
          <View style={[styles.heroLeft, isSmallScreen && styles.heroLeftCentered]}>
            <RNText
              style={[
                styles.mainHeading,
                isSmallScreen && styles.mainHeadingCentered,
                { color: colors.text },
              ]}
            >
              Unlock Opportunities
            </RNText>
            <RNText
              style={[
                styles.subheading,
                isSmallScreen && styles.subheadingCentered,
                { color: colors.text },
              ]}
            >
              Connect with skilled construction professionals and discover your ideal career opportunities.
            </RNText>
            {Platform.OS === 'web' && isAuthenticated ? (
              <MagnetButton padding={100} magnetStrength={2}>
                <Pressable
                  style={[
                    styles.ctaButton,
                    styles.ctaButtonDashboard,
                    isSmallScreen && styles.ctaButtonCentered,
                  ]}
                  onPress={goHome}
                >
                  <View style={[styles.ctaIcon, styles.ctaIconDashboard]} />
                  <Text
                    style={[
                      styles.ctaButtonText,
                      styles.ctaButtonTextDashboard,
                      { color: !isDark ? colors.text : '#ffffff' },
                    ]}
                  >
                    Lets go
                  </Text>
                </Pressable>
              </MagnetButton>
            ) : (
              <Pressable
                style={[
                  styles.ctaButton,
                  isAuthenticated && styles.ctaButtonDashboard,
                  isSmallScreen && styles.ctaButtonCentered,
                ]}
                onPress={handleCtaPress}
              >
                <View style={[styles.ctaIcon, isAuthenticated && styles.ctaIconDashboard]} />
                <Text
                  style={[
                    styles.ctaButtonText,
                    isAuthenticated && styles.ctaButtonTextDashboard,
                    { color: isAuthenticated && !isDark ? colors.text : '#ffffff' },
                  ]}
                >
                  {isAuthenticated ? 'Lets go' : 'Join Us Now'}
                </Text>
              </Pressable>
            )}
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
      </Animated.View>

        {/* Category Buttons Grid + and so much more... */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesGrid}>
            {CONSTRUCTION_CATEGORIES.map((category, index) => (
              <CategoryButton
                key={index}
                label={category}
                isDark={isDark}
                colors={colors}
                isCompact={isSmallScreen}
                buttonId={Platform.OS === 'web' ? `landing-cat-${index}` : undefined}
              />
            ))}
          </View>
          <RNText style={[styles.moreText, { color: colors.text }]}>
            and so much more...
          </RNText>
        </View>

        <LandingFooter isSmallScreen={isSmallScreen} colors={colors} />
      </View>
    </WebLayout>
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
        overflowY: 'auto' as any,
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
  heroTagline: {
    position: 'absolute',
    bottom: 48,
    right: 40,
    left: '33.333%' as any,
    top: 0,
    zIndex: 3,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        maxHeight: '100%' as any,
        minWidth: 0,
      },
    }),
  } as ViewStyle,
  heroTaglineTextWrap: {
    width: '100%',
    alignSelf: 'stretch',
    maxWidth: '100%',
    minWidth: 0,
  } as ViewStyle,
  heroTaglineText: {
    textAlign: 'right',
    ...Platform.select({
      web: {
        fontFamily: Fonts.accent as any,
        fontSize: 'clamp(24px, 4.5vw, 56px)' as any,
        textTransform: 'uppercase' as any,
        letterSpacing: 0.5,
        lineHeight: 1.4,
        width: '100%' as any,
        maxWidth: '100%' as any,
        display: 'block' as any,
      },
      default: {
        fontFamily: Fonts.accent,
        fontSize: 28,
        textTransform: 'uppercase',
        lineHeight: 36,
      },
    }),
  } as TextStyle,
  hero: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    gap: 32,
  } as ViewStyle,
  heroStacked: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
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
    fontSize: 120,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 24,
    fontFamily: Fonts.display,
    ...Platform.select({
      web: {
        fontSize: 'clamp(40px, 6vw, 88px)' as any,
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
  categoriesSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  } as ViewStyle,
  moreText: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Fonts.display,
  } as TextStyle,
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
  faqTitle: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    opacity: 0.9,
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
    opacity: 0.9,
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
    opacity: 0.8,
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
