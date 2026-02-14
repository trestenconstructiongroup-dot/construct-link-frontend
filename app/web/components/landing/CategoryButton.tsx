/**
 * Landing category button – memoized, with useCallback for hover.
 */

import React, { useCallback, useState } from 'react';
import { Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, View, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { Colors } from '../../../../constants/theme';

const CATEGORY_IMAGES: Partial<Record<string, ImageSourcePropType>> = {
  Plumbing: require('../../../../assets/images/landingPageImages/image12.jpg'),
  Architect: require('../../../../assets/images/landingPageImages/image7.jpg'),
  Electrician: require('../../../../assets/images/landingPageImages/image13.jpg'),
  Carpenter: require('../../../../assets/images/landingPageImages/image4.jpg'),
  Masonry: require('../../../../assets/images/landingPageImages/image14.jpg'),
  HVAC: require('../../../../assets/images/landingPageImages/image16.jpg'),
  Roofing: require('../../../../assets/images/landingPageImages/image15.jpg'),
  Concrete: require('../../../../assets/images/landingPageImages/image5.jpg'),
};

const NOISE_SVG =
  "data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

export interface CategoryButtonProps {
  label: string;
  isDark: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
  isCompact: boolean;
  buttonId?: string;
}

const styles = StyleSheet.create({
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
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
    flexShrink: 0,
  } as TextStyle,
});

function CategoryButtonComponent({
  label,
  isDark,
  colors,
  isCompact,
  buttonId,
}: CategoryButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const imageAreaBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const imageSource = CATEGORY_IMAGES[label] ?? null;

  const onHoverIn = useCallback(() => setIsHovered(true), []);
  const onHoverOut = useCallback(() => setIsHovered(false), []);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.categoryButton,
        isCompact && styles.categoryButtonCompact,
        { backgroundColor: buttonBg },
        isHovered && styles.categoryButtonHovered,
        pressed && styles.categoryButtonPressed,
      ]}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      {...(buttonId ? { nativeID: buttonId } : {})}
      {...(Platform.OS === 'web' ? { className: 'cat-btn' } as any : {})}
    >
      <View
        style={[
          styles.noiseOverlay,
          Platform.OS === 'web' && { backgroundImage: `url("${NOISE_SVG}")` as any },
        ]}
      />
      <View style={[styles.categoryImageArea, { backgroundColor: imageAreaBg }]}>
        {imageSource != null && (
          <Image source={imageSource} style={styles.categoryImage} resizeMode="cover" />
        )}
      </View>
      <Text style={[styles.categoryLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export default React.memo(CategoryButtonComponent);
