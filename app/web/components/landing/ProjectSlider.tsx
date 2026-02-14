/**
 * Auto-scrolling project image slider.
 * Images scroll horizontally automatically as the user scrolls down the page.
 */

import React, { useEffect, useRef } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Colors, Fonts } from '../../../../constants/theme';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

const SLIDER_IMAGES = [
  '/images/landingPageImages/image4.jpg',
  '/images/landingPageImages/image5.jpg',
  '/images/landingPageImages/image7.jpg',
  '/images/landingPageImages/image8.jpg',
  '/images/landingPageImages/image9.jpg',
  '/images/landingPageImages/image12.jpg',
  '/images/landingPageImages/image13.jpg',
  '/images/landingPageImages/image14.jpg',
  '/images/landingPageImages/image15.jpg',
  '/images/landingPageImages/image16.jpg',
];

const HEADING_TEXT = 'Our Projects';

interface ProjectSliderProps {
  isSmallScreen: boolean;
}

function ProjectSliderComponent({ isSmallScreen }: ProjectSliderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // heading word reveal
      const ta = isSmallScreen ? 'play none none none' : 'play reverse play reverse';
      gsap.from('.ps-word', {
        y: '100%',
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current!,
          start: 'top 85%',
          toggleActions: ta,
        },
      });

      // auto-scroll the track horizontally as user scrolls the page
      const track = trackRef.current;
      if (track) {
        const gap = isSmallScreen ? 12 : 16;
        const cardW = isSmallScreen ? Math.min(260, window.innerWidth * 0.75) : 380;
        const totalTrackWidth = SLIDER_IMAGES.length * (cardW + gap) - gap;
        const viewportWidth = containerRef.current!.offsetWidth;
        const scrollDistance = Math.max(0, totalTrackWidth - viewportWidth);

        gsap.to(track, {
          x: -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current!,
            start: 'top 70%',
            end: 'bottom 20%',
            scrub: 1,
          },
        });
      }
    }, containerRef.current);

    return () => ctx.revert();
  }, [isSmallScreen]);

  if (Platform.OS !== 'web') return null;

  const headingWords = HEADING_TEXT.split(' ');

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
        {/* heading */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0 0.4em',
            marginBottom: isSmallScreen ? 20 : 32,
          }}
        >
          {headingWords.map((word, i) => (
            <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
              <span
                className="ps-word"
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

        {/* auto-scrolling track */}
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: isSmallScreen ? 12 : 16,
            paddingBottom: 8,
            willChange: 'transform',
          }}
        >
          {SLIDER_IMAGES.map((src, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: isSmallScreen ? 'min(260px, 75vw)' : 380,
                height: isSmallScreen ? 180 : 260,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <img
                src={src}
                alt={`Project ${i + 1}`}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
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
    paddingHorizontal: 40,
    marginTop: 60,
    marginBottom: 40,
  } as ViewStyle,
  containerSmall: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  } as ViewStyle,
};

export default React.memo(ProjectSliderComponent);
