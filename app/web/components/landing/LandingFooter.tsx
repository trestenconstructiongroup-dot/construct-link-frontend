/**
 * Landing footer – extracted for smaller Landing.web.tsx and reuse.
 */

import React from 'react';
import { Platform, Text as RNText, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { Colors } from '../../../../constants/theme';

export interface LandingFooterProps {
  isSmallScreen: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
}

const webId = (id: string) => (Platform.OS === 'web' ? { nativeID: id } : {});

const styles = StyleSheet.create({
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
    ...Platform.select({
      web: {
        fontFamily: 'Knucklehead, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' as any,
      },
      default: {
        fontFamily: 'Knucklehead',
      },
    }),
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
    ...Platform.select({
      web: {
        fontFamily: 'Knucklehead, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' as any,
      },
      default: {
        fontFamily: 'Knucklehead',
      },
    }),
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
    ...Platform.select({
      web: {
        fontFamily: 'Knucklehead, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' as any,
      },
      default: {
        fontFamily: 'Knucklehead',
      },
    }),
  } as TextStyle,
  footerMetaBuiltBy: {
    ...Platform.select({
      web: {
        fontFamily: 'FreakTurbulenceBRK, "Freak Turbulence (BRK)", system-ui, sans-serif' as any,
      },
      default: {
        fontFamily: 'FreakTurbulenceBRK',
      },
    }),
  } as TextStyle,
});

function LandingFooterComponent({ isSmallScreen, colors }: LandingFooterProps) {
  return (
    <View style={styles.footerSection} {...webId('landing-footer')}>
      {isSmallScreen ? (
        <>
          <View style={[styles.footerColBrand, styles.footerColBrandSmall]} {...webId('landing-footer-col-brand')}>
            <RNText style={[styles.footerBrand, { color: colors.text }]}>
              ConstructionLink
            </RNText>
            <RNText
              style={[
                styles.footerText,
                styles.footerTextCentered,
                { color: colors.text },
              ]}
            >
              Connecting construction companies with skilled workers who are
              ready to build, repair and deliver on real projects.
            </RNText>
            <View style={styles.footerContactRow}>
              <Text
                style={[
                  styles.footerMeta,
                  styles.footerTextCentered,
                  { color: colors.text },
                ]}
              >
                +254 (7) 9639‑7296 · support@constructionlink.co
              </Text>
            </View>
          </View>
          <View style={styles.footerColumnsRowSmall}>
            <View style={styles.footerCol} {...webId('landing-footer-col-links')}>
              <RNText
                style={[styles.footerColTitle, styles.footerTextCentered, { color: colors.text }]}
              >
                Quick Links
              </RNText>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                Home
              </Text>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                Find Jobs
              </Text>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                Find Workers
              </Text>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                How It Works
              </Text>
            </View>
            <View style={styles.footerCol} {...webId('landing-footer-col-support')}>
              <RNText
                style={[styles.footerColTitle, styles.footerTextCentered, { color: colors.text }]}
              >
                Support
              </RNText>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                Help Center
              </Text>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                Contact Us
              </Text>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                Privacy Policy
              </Text>
              <Text style={[styles.footerLink, styles.footerLinkCentered, { color: colors.text }]}>
                Terms of Service
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.footerTopRow}>
          <View style={styles.footerColBrand} {...webId('landing-footer-col-brand')}>
            <RNText style={[styles.footerBrand, { color: colors.text }]}>
              ConstructionLink
            </RNText>
            <RNText style={[styles.footerText, { color: colors.text }]}>
              Connecting construction companies with skilled workers who are
              ready to build, repair and deliver on real projects.
            </RNText>
            <View style={styles.footerContactRow}>
              <Text style={[styles.footerMeta, { color: colors.text }]}>
                +254 (7) 9639‑7296 · support@constructionlink.co
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
      )}
      <View style={styles.footerMetaRow} {...webId('landing-footer-meta')}>
        <RNText style={[styles.footerMeta, { color: colors.text }]}>
          © {new Date().getFullYear()}{' '}
          <RNText style={styles.footerMetaBrand}>ConstructionLink</RNText>. Built for
          construction work, by people who've been on site.{' '}
          <RNText style={styles.footerMetaBuiltBy}>BuiltBySisi</RNText>
        </RNText>
      </View>
    </View>
  );
}

export default React.memo(LandingFooterComponent);
