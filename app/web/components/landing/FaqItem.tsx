/**
 * FAQ accordion item – memoized, with useCallback for toggle.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text as RNText, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { Colors } from '../../../../constants/theme';
import type { FaqItemEntry } from './_constants';

export interface FaqItemProps {
  item: FaqItemEntry;
  isSmallScreen: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
  itemId?: string;
}

const styles = StyleSheet.create({
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
    ...Platform.select({
      web: {
        fontFamily: 'FreakTurbulenceBRK, "Freak Turbulence (BRK)", system-ui, sans-serif' as any,
      },
      default: {
        fontFamily: 'FreakTurbulenceBRK',
      },
    }),
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
});

function FaqItemComponent({ item, isSmallScreen, colors, itemId }: FaqItemProps) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [open, anim]);

  const bodyHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  const iconRotation = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.faqItem} {...(itemId ? { nativeID: itemId } : {})}>
      <Pressable onPress={toggle} style={styles.faqItemHeader}>
        <RNText
          style={[
            styles.faqQuestion,
            isSmallScreen && styles.faqQuestionCentered,
            { color: colors.text },
          ]}
        >
          {item.question}
        </RNText>
        <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
          <Ionicons name="add" size={18} color={colors.text} />
        </Animated.View>
      </Pressable>
      <Animated.View
        style={[styles.faqItemBody, { maxHeight: bodyHeight, opacity: anim }]}
      >
        <RNText
          style={[
            styles.faqAnswer,
            isSmallScreen && styles.faqAnswerCentered,
            { color: colors.text },
          ]}
        >
          {item.answer}
        </RNText>
      </Animated.View>
    </View>
  );
}

export default React.memo(FaqItemComponent);
