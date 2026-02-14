import React, { useEffect, useRef } from 'react';
import { View, Text, Platform, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Colors, Fonts } from '../../../../constants/theme';
import { HOW_IT_WORKS_STEPS } from './_constants';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

interface HowItWorksProps {
  isSmallScreen: boolean;
}

function HowItWorksComponent({ isSmallScreen }: HowItWorksProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    const ta = isSmallScreen ? 'play none none reverse' : 'play reverse play reverse';

    const ctx = gsap.context(() => {
      // heading reveal
      gsap.from('.hiw-heading', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current!,
          start: 'top 85%',
          toggleActions: ta,
        },
      });

      // staggered card reveal
      gsap.from('.hiw-card', {
        y: 80,
        opacity: 0,
        scale: 0.9,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current!,
          start: 'top 80%',
          toggleActions: ta,
        },
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, []);

  const content = (
    <>
      <Text
        style={[styles.heading, { color: colors.text }, isSmallScreen && styles.headingSmall]}
        {...(Platform.OS === 'web' ? { className: 'hiw-heading' } as any : {})}
      >
        How It Works
      </Text>
      <View style={[styles.stepsRow, isSmallScreen && styles.stepsColumn]}>
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <View
            key={step.title}
            {...(Platform.OS === 'web' ? { className: 'hiw-card' } as any : {})}
            style={[
              styles.card,
              isSmallScreen && { padding: 16 },
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Ionicons
              name={step.icon as any}
              size={40}
              color={colors.accent}
              style={styles.icon}
            />
            <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {step.description}
            </Text>
          </View>
        ))}
      </View>
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
        <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {content}
        </div>
      </View>
    );
  }

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      {content}
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
    marginTop: 60,
    marginBottom: 40,
  } as ViewStyle,
  containerSmall: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  } as ViewStyle,
  heading: {
    fontSize: 36,
    fontFamily: Fonts.display,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
  } as TextStyle,
  headingSmall: {
    ...Platform.select({
      web: { fontSize: 'clamp(20px, 6vw, 28px)' as any },
      default: { fontSize: 28 },
    }),
    marginBottom: 24,
  } as TextStyle,
  stepsRow: {
    flexDirection: 'row',
    gap: 32,
    width: '100%',
  } as ViewStyle,
  stepsColumn: {
    flexDirection: 'column',
    gap: 20,
  } as ViewStyle,
  card: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  } as ViewStyle,
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Fonts.heading,
    fontWeight: '600',
  } as TextStyle,
  icon: {
    marginVertical: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.heading,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  description: {
    fontSize: 14,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
};

export default React.memo(HowItWorksComponent);
