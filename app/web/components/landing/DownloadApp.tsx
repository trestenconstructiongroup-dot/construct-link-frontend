import React from 'react';
import { View, Text, Pressable, Platform, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../../../constants/theme';

interface DownloadAppProps {
  isSmallScreen: boolean;
}

function DownloadAppComponent({ isSmallScreen }: DownloadAppProps) {
  const handlePress = () => {
    if (Platform.OS === 'web') {
      window.open('#', '_blank');
    }
  };

  return (
    <View
      style={[
        styles.gradient,
        isSmallScreen && styles.gradientSmall,
        Platform.OS === 'web' && {
          backgroundImage: `linear-gradient(135deg, ${Colors.light.warmStart} 0%, ${Colors.light.warmEnd} 100%)`,
        } as any,
      ]}
    >
      <View style={[styles.inner, isSmallScreen && styles.innerSmall]}>
        <View style={[styles.textColumn, isSmallScreen && styles.textColumnSmall]}>
          <Text style={[styles.heading, isSmallScreen && styles.headingSmall]}>
            Take Tresten Construction Group Inc Everywhere
          </Text>
          <Text style={styles.subtext}>
            Download the app and find jobs or hire workers on the go.
          </Text>
        </View>
        <View style={[styles.badgeRow, isSmallScreen && styles.badgeRowSmall]}>
          <Pressable
            style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
            onPress={handlePress}
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
          >
            <Ionicons name="logo-google-playstore" size={24} color="#ffffff" />
            <View>
              <Text style={styles.badgeSmallText}>Get it on</Text>
              <Text style={styles.badgeLargeText}>Google Play</Text>
            </View>
          </Pressable>
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
    opacity: 0.9,
    lineHeight: 24,
  } as TextStyle,
  badgeRow: {
    flexDirection: 'row',
    gap: 16,
  } as ViewStyle,
  badgeRowSmall: {
    justifyContent: 'center',
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
    opacity: 0.8,
  } as TextStyle,
  badgeLargeText: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    fontWeight: '600',
    color: '#ffffff',
  } as TextStyle,
};

export default React.memo(DownloadAppComponent);
