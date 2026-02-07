/**
 * Hero CardSwap – Find workers, Find jobs, Create jobs cards for the landing hero.
 * Uses reactbits CardSwap with company images and icons.
 */

import React from 'react';
import { View, Image, Text, ImageSourcePropType } from 'react-native';
import CardSwap, { Card } from './CardSwap';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../../constants/theme';

export interface HeroCardSwapProps {
  /** require() or source for Find workers card (image17) */
  imageFindWorkers: ImageSourcePropType;
  /** require() or source for Find jobs card (image11) */
  imageFindJobs: ImageSourcePropType;
  /** require() or source for Create jobs card (image18) */
  imageCreateJobs: ImageSourcePropType;
  cardWidth?: number | string;
  cardHeight?: number | string;
  /** Background color of the card surface (use theme background). */
  cardBackground?: string;
  /** Text color for card labels (use theme text color). */
  cardTextColor?: string;
  /** Font family for card labels (e.g. FreakTurbulenceBRK). */
  cardFontFamily?: string;
  /** Background for the image/margin area inside the card. */
  cardMarginBackground?: string;
  /** Background for the icon + label row (darker in light mode so it’s visible). */
  cardIconRowBackground?: string;
  /** Border color under the icon row (e.g. darker in light mode). */
  cardIconRowBorderColor?: string;
}

export default function HeroCardSwap({
  imageFindWorkers,
  imageFindJobs,
  imageCreateJobs,
  cardWidth = 580,
  cardHeight = 480,
  cardBackground = '#ffffff',
  cardTextColor = '#000000',
  cardFontFamily,
  cardMarginBackground = 'rgba(0,0,0,0.06)',
  cardIconRowBackground,
  cardIconRowBorderColor,
}: HeroCardSwapProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 520, minHeight: 400 }}>
      <CardSwap
        width={cardWidth}
        height={cardHeight}
        cardDistance={60}
        verticalDistance={70}
        delay={2000}
        pauseOnHover={true}
        skewAmount={6}
        easing="elastic"
      >
        <Card>
          <View style={[cardContentStyle, { backgroundColor: cardBackground }]}>
            <View
              style={[
                cardIconRowStyle,
                ...(cardIconRowBackground ? [{ backgroundColor: cardIconRowBackground }] : []),
                ...(cardIconRowBorderColor ? [{ borderBottomColor: cardIconRowBorderColor }] : []),
              ]}
            >
              <Ionicons name="people-outline" size={28} color={Colors.light.accent} />
              <Text
                style={[
                  cardLabelStyle,
                  { color: cardTextColor, ...(cardFontFamily ? { fontFamily: cardFontFamily } : {}) },
                ]}
              >
                Find workers
              </Text>
            </View>
            <View style={[cardImageWrapStyle, { backgroundColor: cardMarginBackground }]}>
              <Image source={imageFindWorkers} style={cardImageStyle} resizeMode="contain" />
            </View>
          </View>
        </Card>
        <Card>
          <View style={[cardContentStyle, { backgroundColor: cardBackground }]}>
            <View
              style={[
                cardIconRowStyle,
                ...(cardIconRowBackground ? [{ backgroundColor: cardIconRowBackground }] : []),
                ...(cardIconRowBorderColor ? [{ borderBottomColor: cardIconRowBorderColor }] : []),
              ]}
            >
              <Ionicons name="search-outline" size={28} color={Colors.light.accent} />
              <Text
                style={[
                  cardLabelStyle,
                  { color: cardTextColor, ...(cardFontFamily ? { fontFamily: cardFontFamily } : {}) },
                ]}
              >
                Find jobs
              </Text>
            </View>
            <View style={[cardImageWrapStyle, { backgroundColor: cardMarginBackground }]}>
              <Image source={imageFindJobs} style={cardImageStyle} resizeMode="contain" />
            </View>
          </View>
        </Card>
        <Card>
          <View style={[cardContentStyle, { backgroundColor: cardBackground }]}>
            <View
              style={[
                cardIconRowStyle,
                ...(cardIconRowBackground ? [{ backgroundColor: cardIconRowBackground }] : []),
                ...(cardIconRowBorderColor ? [{ borderBottomColor: cardIconRowBorderColor }] : []),
              ]}
            >
              <Ionicons name="add-circle-outline" size={28} color={Colors.light.accent} />
              <Text
                style={[
                  cardLabelStyle,
                  { color: cardTextColor, ...(cardFontFamily ? { fontFamily: cardFontFamily } : {}) },
                ]}
              >
                Create jobs
              </Text>
            </View>
            <View style={[cardImageWrapStyle, { backgroundColor: cardMarginBackground }]}>
              <Image source={imageCreateJobs} style={cardImageStyle} resizeMode="contain" />
            </View>
          </View>
        </Card>
      </CardSwap>
    </div>
  );
}

const cardContentStyle = {
  width: '100%' as const,
  height: '100%' as const,
  borderRadius: 12,
  overflow: 'hidden' as const,
};
const cardIconRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.08)',
};
const cardLabelStyle = {
  fontSize: 15,
  fontWeight: '600' as const,
  color: '#fff',
};
const cardImageWrapStyle = {
  flex: 1,
  minHeight: 0,
  padding: 12,
};
const cardImageStyle = {
  width: '100%' as const,
  height: '100%' as const,
};
