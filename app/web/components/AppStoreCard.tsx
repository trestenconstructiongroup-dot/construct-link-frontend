/**
 * App Store / Play Store "Coming Soon" card for the landing hero.
 * Uses ElectricBorderCard and SVG assets for Apple / Google badges.
 */

import React from 'react';
import { Image, Platform } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import ElectricBorderCard from './ElectricBorderCard';

const AppleStoreSvg = require('../../../assets/images/appleStore-svg.svg');
const GoogleSvg = require('../../../assets/images/google-svg.svg');

function getSvgUri(src: unknown): string | undefined {
  if (typeof src === 'string') return src;
  if (typeof src === 'number' && typeof Image?.resolveAssetSource === 'function') {
    return Image.resolveAssetSource(src as number)?.uri;
  }
  const o = src as { uri?: string; default?: { uri?: string } } | undefined;
  return o?.default?.uri ?? o?.uri;
}

function AppleBadge({ size = 1, isDark = false }: { size?: number; isDark?: boolean }) {
  const uri = getSvgUri(AppleStoreSvg);
  const h = 40 * size;
  if (!uri) return null;
  return (
    <img
      src={uri}
      alt="Download on the App Store"
      style={{
        display: 'block',
        height: h,
        width: 'auto',
        minWidth: 0,
        ...(isDark ? { filter: 'brightness(0) invert(1)' } : {}),
      }}
    />
  );
}

function GooglePlayBadge({ size = 1 }: { size?: number }) {
  const uri = getSvgUri(GoogleSvg);
  const h = 40 * size;
  if (!uri) return null;
  return (
    <img
      src={uri}
      alt="Get it on Google Play"
      style={{ display: 'block', height: h, width: 'auto', minWidth: 0 }}
    />
  );
}

export default function AppStoreCard({ compact = false }: { compact?: boolean }) {
  const { isDark } = useTheme();

  if (Platform.OS !== 'web') {
    return null;
  }

  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const badgeSize = compact ? 0.72 : 1.25;
  const padding = compact ? 12 : 28;
  const gap = compact ? 10 : 20;
  const gapBadges = compact ? 8 : 14;

  return (
    <ElectricBorderCard
      color="#0a7ea4"
      speed={0.8}
      borderRadius={compact ? 12 : 20}
      style={{
        backgroundColor: cardBg,
        padding,
        width: 'fit-content',
        minWidth: compact ? undefined : 320,
        maxWidth: '100%',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap,
        }}
      >
        <span
          style={{
            fontFamily: 'FreakTurbulenceBRK, "Freak Turbulence (BRK)", system-ui, sans-serif',
            fontSize: compact ? 11 : 16,
            fontWeight: 600,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Mobile app
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: gapBadges,
          }}
        >
          <div
            style={{
              opacity: 0.9,
              flex: '0 1 auto',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AppleBadge size={badgeSize} isDark={isDark} />
            {!compact && (
              <span
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontSize: 9,
                  fontWeight: 400,
                  color: textColor,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Download on the
                <br />
                <span style={{ fontSize: 13, fontWeight: 600 }}>App Store</span>
              </span>
            )}
          </div>
          <div
            style={{
              opacity: 0.9,
              flex: '0 1 auto',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <GooglePlayBadge size={badgeSize} />
            {!compact && (
              <span
                style={{
                  fontFamily: 'Roboto, system-ui, sans-serif',
                  fontSize: 11,
                  fontWeight: 400,
                  color: textColor,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Get it on
                <br />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Google Play</span>
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'FreakTurbulenceBRK, "Freak Turbulence (BRK)", system-ui, sans-serif',
            fontSize: compact ? 11 : 15,
            fontWeight: 700,
            color: '#0a7ea4',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}
        >
          Coming soon
        </div>
      </div>
    </ElectricBorderCard>
  );
}
