/**
 * HeroTextMorpher – two-word phrase with type/delete animation.
 * Two separate spans: only words that change get type-then-delete; unchanged words stay still.
 * Inspired by https://reactbits.dev/text-animations/text-type
 */

import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text as RNText, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Fonts } from '../../../constants/theme';

const PHRASES = [
  { a: 'Create', s: 'Jobs' },
  { a: 'Find', s: 'Jobs' },
  { a: 'Find', s: 'Workers' },
];

const TYPING_SPEED_MS = 75;
const DELETING_SPEED_MS = 50;
const PAUSE_BEFORE_TYPING_MS = 400;
const CYCLE_MS = 4000;

export interface HeroTextMorpherProps {
  textColor?: string;
  fontSize?: number | string;
  style?: object;
  showCursor?: boolean;
}

export default function HeroTextMorpher({
  textColor = '#fff',
  fontSize = 140,
  style,
  showCursor = false,
}: HeroTextMorpherProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const [displayA, setDisplayA] = useState(PHRASES[0].a);
  const [displayS, setDisplayS] = useState(PHRASES[0].s);
  const [cursorVisible, setCursorVisible] = useState(showCursor);

  const currentIndexRef = useRef(0);
  const displayARef = useRef(displayA);
  const displaySRef = useRef(displayS);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  displayARef.current = displayA;
  displaySRef.current = displayS;

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const runTypeDelete = (
    currentWord: string,
    nextWord: string,
    setDisplay: (s: string) => void,
    isWordA: boolean
  ) => {
    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      timeoutsRef.current.push(id);
    };

    let delay = 0;

    // Delete phase: remove one character at a time
    for (let len = currentWord.length; len >= 0; len--) {
      schedule(() => setDisplay(currentWord.slice(0, len)), delay);
      delay += DELETING_SPEED_MS;
    }

    // Pause then type new word
    delay += PAUSE_BEFORE_TYPING_MS;

    for (let len = 1; len <= nextWord.length; len++) {
      schedule(() => setDisplay(nextWord.slice(0, len)), delay);
      delay += TYPING_SPEED_MS;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      clearTimeouts();

      const nextIndex = (currentIndexRef.current + 1) % PHRASES.length;
      const next = PHRASES[nextIndex];
      const curA = displayARef.current;
      const curS = displaySRef.current;
      const aChanged = next.a !== curA;
      const sChanged = next.s !== curS;

      if (aChanged && sChanged) {
        runTypeDelete(curA, next.a, setDisplayA, true);
        runTypeDelete(curS, next.s, setDisplayS, false);
      } else if (aChanged) {
        runTypeDelete(curA, next.a, setDisplayA, true);
        setDisplayS(next.s);
      } else if (sChanged) {
        setDisplayA(next.a);
        runTypeDelete(curS, next.s, setDisplayS, false);
      } else {
        setDisplayA(next.a);
        setDisplayS(next.s);
      }

      currentIndexRef.current = nextIndex;
    }, CYCLE_MS);

    return () => {
      clearInterval(interval);
      clearTimeouts();
    };
  }, []);

  // Optional cursor blink
  useEffect(() => {
    if (!showCursor) return;
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, [showCursor]);

  const fontFamily = Fonts.display;

  const baseStyle: any = { color: textColor, fontSize, fontFamily: fontFamily as any };

  const wrapperPadding =
    Platform.OS === 'web'
      ? {
          // On small screens, push the hero text down a bit from the navbar;
          // keep the original offset on larger screens.
          paddingTop: isSmallScreen ? 56 : 24,
          paddingLeft: isSmallScreen ? 12 : 40,
        }
      : {
          paddingTop: 64,
          paddingLeft: 40,
        };

  return (
    <View style={[styles.wrapper, wrapperPadding as any, style, { pointerEvents: 'none' }]}>
      <RNText style={[styles.line, baseStyle]}>
        <RNText style={styles.word}>{displayA}</RNText>
        {' '}
        <RNText style={styles.word}>{displayS}</RNText>
        {showCursor && (
          <RNText style={[styles.cursor, baseStyle]}>
            {cursorVisible ? '|' : '\u00A0'}
          </RNText>
        )}
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {},
  cursor: {
    marginLeft: 2,
  },
});
