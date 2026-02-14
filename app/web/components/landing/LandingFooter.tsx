/**
 * Landing footer – columns, meta row, and staggered scroll reveal.
 */

import React, { useEffect, useRef } from 'react';
import { Image, Platform, Text as RNText, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Text } from '../../../../components/Text';
import { Colors, Fonts } from '../../../../constants/theme';

if (Platform.OS === 'web') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface LandingFooterProps {
  isSmallScreen: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
}

const webId = (id: string) => (Platform.OS === 'web' ? { nativeID: id } : {});

const styles = StyleSheet.create({
  footerSection: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 32,
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
    gap: 10,
  } as ViewStyle,
  footerCol: {
    flex: 1,
  } as ViewStyle,
  footerBrand: {
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Fonts.display,
    ...Platform.select({
      web: { fontSize: 'clamp(18px, 5vw, 28px)' as any },
      default: { fontSize: 28 },
    }),
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    fontFamily: Fonts.heading,
    textAlign: 'left',
  } as TextStyle,
  footerLink: {
    fontSize: 14,
    marginBottom: 14,
  } as TextStyle,
  footerLinkCentered: {
    textAlign: 'center',
  } as TextStyle,
  footerColumnsRowSmall: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: 20,
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  } as ViewStyle,
  footerMetaRow: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
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
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  footerLogo: {
    width: 40,
    height: 40,
  },
});

function LandingFooterComponent({ isSmallScreen, colors }: LandingFooterProps) {
  const footerContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const ta = isSmallScreen ? 'play none none reverse' : 'play reverse play reverse';

    const ctx = gsap.context(() => {
      // footer content staggered reveal
      if (footerContentRef.current) {
        gsap.from('.footer-reveal', {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerContentRef.current,
            start: 'top 90%',
            toggleActions: ta,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const footerColumns = isSmallScreen ? (
    <>
      <View style={[styles.footerColBrand, styles.footerColBrandSmall]} {...webId('landing-footer-col-brand')}>
        <View style={styles.footerBrandRow}>
          <Image
            source={Platform.OS === 'web' ? { uri: '/logo.png' } : require('../../../../assets/images/logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <RNText style={[styles.footerBrand, { color: colors.text }]}>
            Tresten Construction Group Inc
          </RNText>
        </View>
        <RNText
          style={[styles.footerText, styles.footerTextCentered, { color: colors.text }]}
        >
          Connecting construction companies with skilled workers who are
          ready to build, repair and deliver on real projects.
        </RNText>
        <View style={styles.footerContactRow}>
          <Text style={[styles.footerMeta, styles.footerTextCentered, { color: colors.text }]}>
            +254 (7) 9639‑7296 · info@trestenconstruction.com
          </Text>
        </View>
      </View>
      <View style={styles.footerColumnsRowSmall}>
        <View style={styles.footerCol} {...webId('landing-footer-col-links')}>
          <RNText style={[styles.footerColTitle, styles.footerTextCentered, { color: colors.text }]}>
            Quick Links
          </RNText>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>Home</Text>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>Find Jobs</Text>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>Find Workers</Text>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>How It Works</Text>
        </View>
        <View style={styles.footerCol} {...webId('landing-footer-col-support')}>
          <RNText style={[styles.footerColTitle, styles.footerTextCentered, { color: colors.text }]}>
            Support
          </RNText>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>Help Center</Text>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>Contact Us</Text>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>Privacy Policy</Text>
          <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>Terms of Service</Text>
        </View>
      </View>
    </>
  ) : (
    <View style={styles.footerTopRow}>
      <View style={styles.footerColBrand} {...webId('landing-footer-col-brand')}>
        <View style={styles.footerBrandRow}>
          <Image
            source={Platform.OS === 'web' ? { uri: '/logo.png' } : require('../../../../assets/images/logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <RNText style={[styles.footerBrand, { color: colors.text }]}>
            Tresten Construction Group Inc
          </RNText>
        </View>
        <RNText style={[styles.footerText, { color: colors.text }]}>
          Connecting construction companies with skilled workers who are
          ready to build, repair and deliver on real projects.
        </RNText>
        <View style={styles.footerContactRow}>
          <Text style={[styles.footerMeta, { color: colors.text }]}>
            +254 (7) 9639‑7296 · info@trestenconstruction.com
          </Text>
        </View>
      </View>
      <View style={styles.footerCol} {...webId('landing-footer-col-links')}>
        <RNText style={[styles.footerColTitle, { color: colors.text }]}>
          Quick Links
        </RNText>
        <Text style={[styles.footerLink, { color: colors.text }]}>Home</Text>
        <Text style={[styles.footerLink, { color: colors.text }]}>Find Jobs</Text>
        <Text style={[styles.footerLink, { color: colors.text }]}>Find Workers</Text>
        <Text style={[styles.footerLink, { color: colors.text }]}>How It Works</Text>
      </View>
      <View style={styles.footerCol} {...webId('landing-footer-col-support')}>
        <RNText style={[styles.footerColTitle, { color: colors.text }]}>
          Support
        </RNText>
        <Text style={[styles.footerLink, { color: colors.text }]}>Help Center</Text>
        <Text style={[styles.footerLink, { color: colors.text }]}>Contact Us</Text>
        <Text style={[styles.footerLink, { color: colors.text }]}>Privacy Policy</Text>
        <Text style={[styles.footerLink, { color: colors.text }]}>Terms of Service</Text>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.footerSection} {...webId('landing-footer')}>
        <div ref={footerContentRef}>
          <div className="footer-reveal">
            {footerColumns}
          </div>
          <div className="footer-reveal">
            <View style={styles.footerMetaRow} {...webId('landing-footer-meta')}>
              <RNText style={[styles.footerMeta, { color: colors.text }]}>
                © {new Date().getFullYear()}{' '}
                <RNText style={styles.footerMetaBrand}>Tresten Construction Group Inc</RNText>. Built for
                construction work, by people who've been on site.{' '}
                <RNText style={styles.footerMetaBuiltBy}>BuiltBySisi</RNText>
              </RNText>
            </View>
          </div>
        </div>
      </View>
    );
  }

  return (
    <View style={styles.footerSection} {...webId('landing-footer')}>
      {footerColumns}
      <View style={styles.footerMetaRow} {...webId('landing-footer-meta')}>
        <RNText style={[styles.footerMeta, { color: colors.text }]}>
          © {new Date().getFullYear()}{' '}
          <RNText style={styles.footerMetaBrand}>Tresten Construction Group Inc</RNText>. Built for
          construction work, by people who've been on site.{' '}
          <RNText style={styles.footerMetaBuiltBy}>BuiltBySisi</RNText>
        </RNText>
      </View>
    </View>
  );
}

export default React.memo(LandingFooterComponent);
