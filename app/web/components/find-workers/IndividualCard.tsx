/**
 * Find Workers – individual result card. Memoized for list performance.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Image, ImageStyle, Pressable, Text as RNText, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { Colors } from '../../../../constants/theme';
import type { WorkerSearchResultIndividual } from '../../../../services/api';

const BRAND_BLUE = Colors.light.accentMuted;
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
  master: 'Master / Veteran',
};

export interface IndividualCardProps {
  item: WorkerSearchResultIndividual;
  colors: typeof Colors.light | typeof Colors.dark;
  fontHeading: string;
  fontBody: string;
  onView: (userId: number) => void;
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 380, padding: 20, borderRadius: 12, borderWidth: 1 } as ViewStyle,
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 } as ViewStyle,
  avatar: { width: 56, height: 56, borderRadius: 28 } as ImageStyle,
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  cardHeaderText: { flex: 1, minWidth: 0 } as ViewStyle,
  cardTitle: { fontSize: 18, fontWeight: '700' } as TextStyle,
  cardSubtitle: { fontSize: 13, marginTop: 2 } as TextStyle,
  cardDesc: { fontSize: 14, marginTop: 8, opacity: 0.9 } as TextStyle,
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 } as ViewStyle,
  skillChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  skillChipText: { fontSize: 12, fontWeight: '600' } as TextStyle,
  cardMeta: { fontSize: 13, marginTop: 4 } as TextStyle,
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1 } as ViewStyle,
  viewBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 } as ViewStyle,
  viewBtnText: { fontSize: 14, fontWeight: '600' } as TextStyle,
  contactBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 } as ViewStyle,
  contactBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' } as TextStyle,
});

function IndividualCardComponent({ item, colors, fontHeading, fontBody, onView }: IndividualCardProps) {
  const rateLabel = item.hourly_rate || item.daily_rate ? `Rate: ${item.hourly_rate || item.daily_rate || '—'}` : 'Contact for rate';
  const expLabel = item.experience_years != null
    ? `${EXPERIENCE_LABELS[item.experience_level] || item.experience_level} · ${item.experience_years} yrs`
    : (EXPERIENCE_LABELS[item.experience_level] || item.experience_level || '—');

  const handleView = React.useCallback(() => {
    onView(item.user_id);
  }, [onView, item.user_id]);

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}>
      <View style={styles.cardHeader}>
        {item.profile_image ? (
          <Image source={{ uri: item.profile_image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.icon + '30' }]}>
            <Ionicons name="person" size={32} color={colors.icon} />
          </View>
        )}
        <View style={styles.cardHeaderText}>
          <RNText style={[styles.cardTitle, { color: colors.text }, { fontFamily: fontHeading as any }]} numberOfLines={1}>{item.name}</RNText>
          {item.primary_category ? <RNText style={[styles.cardSubtitle, { color: colors.icon }]}>{item.primary_category}</RNText> : null}
        </View>
      </View>
      {item.tagline ? <RNText style={[styles.cardDesc, { color: colors.text }]} numberOfLines={2}>{item.tagline}</RNText> : null}
      {item.top_skills.length > 0 && (
        <View style={styles.skillsRow}>
          {item.top_skills.slice(0, 4).map((s, i) => (
            <View key={i} style={[styles.skillChip, { backgroundColor: colors.tint + '20' }]}>
              <RNText style={[styles.skillChipText, { color: colors.tint }, { fontFamily: fontBody as any }]} numberOfLines={1}>{s}</RNText>
            </View>
          ))}
        </View>
      )}
      <RNText style={[styles.cardMeta, { color: colors.icon }]}>{expLabel}</RNText>
      {(item.rating != null || item.reviews_count > 0) && (
        <RNText style={[styles.cardMeta, { color: colors.icon }]}>Rating: {item.rating ?? '—'} ({item.reviews_count} reviews)</RNText>
      )}
      <RNText style={[styles.cardMeta, { color: colors.text }]}>{rateLabel}</RNText>
      {item.location ? <RNText style={[styles.cardMeta, { color: colors.icon }]}>{item.location}</RNText> : null}
      <View style={[styles.cardFooter, { borderTopColor: colors.icon + '30' }]}>
        <Pressable onPress={handleView} style={[styles.viewBtn, { borderColor: colors.tint }]}>
          <RNText style={[styles.viewBtnText, { color: colors.tint }, { fontFamily: fontBody as any }]}>View Profile</RNText>
        </Pressable>
        <Pressable style={[styles.contactBtn, { backgroundColor: BRAND_BLUE }]}>
          <RNText style={[styles.contactBtnText, { fontFamily: fontBody as any }]}>Hire / Contact</RNText>
        </Pressable>
      </View>
    </View>
  );
}

export default React.memo(IndividualCardComponent);
