/**
 * Find Workers – individual result card. Memoized for list performance.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Image, ImageStyle, Pressable, Text as RNText, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { Colors } from '../../../../constants/theme';
import type { WorkerSearchResultIndividual } from '../../../../services/api';

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

const AVAILABILITY_COLORS: Record<string, string> = {
  available: '#16a34a',
  busy: '#f59e0b',
  available_soon: '#3b82f6',
  unavailable: '#ef4444',
};
const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  available_soon: 'Available Soon',
  unavailable: 'Unavailable',
};

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 300, maxWidth: 480, padding: 20, borderRadius: 12, borderWidth: 1 } as ViewStyle,
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
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 } as ViewStyle,
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 4, alignSelf: 'flex-start' } as ViewStyle,
  availabilityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 } as ViewStyle,
  availabilityText: { fontSize: 11, fontWeight: '600' } as TextStyle,
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, gap: 12 } as ViewStyle,
  viewBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 } as ViewStyle,
  viewBtnText: { fontSize: 14, fontWeight: '600' } as TextStyle,
  contactBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 } as ViewStyle,
  contactBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' } as TextStyle,
});

function IndividualCardComponent({ item, colors, fontHeading, fontBody, onView }: IndividualCardProps) {
  const rateLabel = item.hourly_rate
    ? `$${item.hourly_rate}/hr`
    : item.daily_rate
    ? `$${item.daily_rate}/day`
    : 'Contact for rate';
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
      {item.rating != null && (
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(item.rating!) ? 'star' : 'star-outline'}
              size={14}
              color="#f59e0b"
            />
          ))}
          <RNText style={[styles.cardMeta, { color: colors.icon, marginLeft: 4, marginTop: 0 }]}>
            {item.rating.toFixed(1)} ({item.reviews_count})
          </RNText>
        </View>
      )}
      <RNText style={[styles.cardMeta, { color: colors.text }]}>{rateLabel}</RNText>
      {item.availability && AVAILABILITY_COLORS[item.availability] && (
        <View style={[styles.availabilityBadge, { backgroundColor: AVAILABILITY_COLORS[item.availability] + '18' }]}>
          <View style={[styles.availabilityDot, { backgroundColor: AVAILABILITY_COLORS[item.availability] }]} />
          <RNText style={[styles.availabilityText, { color: AVAILABILITY_COLORS[item.availability] }]}>
            {AVAILABILITY_LABELS[item.availability] || item.availability}
          </RNText>
        </View>
      )}
      {item.location ? <RNText style={[styles.cardMeta, { color: colors.icon }]}>{item.location}</RNText> : null}
      <View style={[styles.cardFooter, { borderTopColor: colors.icon + '30' }]}>
        <Pressable onPress={handleView} style={[styles.viewBtn, { borderColor: colors.tint }]}>
          <RNText style={[styles.viewBtnText, { color: colors.tint }, { fontFamily: fontBody as any }]}>View Profile</RNText>
        </Pressable>
        <Pressable style={[styles.contactBtn, { backgroundColor: '#F99324' }]}>
          <RNText style={[styles.contactBtnText, { fontFamily: fontBody as any }]}>Hire / Contact</RNText>
        </Pressable>
      </View>
    </View>
  );
}

export default React.memo(IndividualCardComponent);
