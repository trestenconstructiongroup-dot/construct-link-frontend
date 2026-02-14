/**
 * Worker or company detail page – full display for one worker/company by user_id.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Text as RNText,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import WebLayout from '../layout';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Colors, Fonts } from '../../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import LandingFooter from './landing/LandingFooter';
import {
  getFindWorkerDetail,
  getReviewsForUser,
  type WorkerSearchResultIndividual,
  type WorkerSearchResultCompany,
  type Review,
} from '../../../services/api';

const BRAND_BLUE = Colors.light.accentMuted;
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
  master: 'Master / Veteran',
};
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

function isIndividual(
  r: WorkerSearchResultIndividual | WorkerSearchResultCompany
): r is WorkerSearchResultIndividual {
  return r.type === 'individual';
}

export default function WorkerDetailPage({ userId }: { userId: number | null }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const isLoggedIn = !!token && !!user;
  const isSelf = user?.id != null && userId === user.id;

  const [data, setData] = useState<WorkerSearchResultIndividual | WorkerSearchResultCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);

  const fontHeading = Fonts.display;
  const fontBody = Fonts.body;

  const loadWorker = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setData(null);
      setLoadError('Invalid worker.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getFindWorkerDetail(userId, token || undefined);
      setData(res);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    loadWorker();
  }, [loadWorker]);

  useEffect(() => {
    if (!userId) return;
    getReviewsForUser(userId, token)
      .then((res) => {
        setReviews(res.results);
        setReviewsCount(res.count);
      })
      .catch(() => {});
  }, [userId, token]);

  if (authLoading) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <RNText style={[styles.centerText, { color: colors.text }]}>Loading…</RNText>
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      {!isLoggedIn && (
        <View style={styles.authOverlay}>
          <Pressable style={styles.authBackdrop} onPress={() => router.back()} />
          <View style={[styles.authModal, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Ionicons name="lock-closed-outline" size={36} color={colors.tint} style={{ marginBottom: 12 }} />
            <RNText style={[styles.authTitle, { color: colors.text }]}>Sign in required</RNText>
            <RNText style={[styles.authDesc, { color: colors.icon }]}>
              Sign in to view worker profiles.
            </RNText>
            <Pressable style={[styles.authBtn, { backgroundColor: BRAND_BLUE }]} onPress={() => router.push('/login')}>
              <RNText style={styles.authBtnText}>Sign In</RNText>
            </Pressable>
          </View>
        </View>
      )}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.icon }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <RNText style={[styles.backBtnText, { color: colors.text }, { fontFamily: fontBody as any }]}>Back</RNText>
          </Pressable>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : loadError ? (
            <View style={styles.center}>
              <RNText style={[styles.errorText, { color: colors.text }]}>{loadError}</RNText>
            </View>
          ) : !data ? null : isIndividual(data) ? (
            <View style={[styles.content, { borderColor: colors.icon + '40' }]}>
              {/* ---- Header ---- */}
              <View style={[styles.header, isSmallScreen && { flexDirection: 'column', alignItems: 'center' }]}>
                {data.profile_image ? (
                  <Image source={{ uri: data.profile_image }} style={isSmallScreen ? [styles.avatarLarge, { width: 80, height: 80, borderRadius: 40 }] : styles.avatarLarge} />
                ) : (
                  <View style={[styles.avatarPlaceholderLarge, { backgroundColor: colors.icon + '30' }, isSmallScreen && { width: 80, height: 80, borderRadius: 40 }]}>
                    <Ionicons name="person" size={isSmallScreen ? 40 : 64} color={colors.icon} />
                  </View>
                )}
                <View style={[styles.headerText, isSmallScreen && { alignItems: 'center' }]}>
                  <RNText style={[styles.title, { color: colors.text }, { fontFamily: fontHeading as any }]}>{data.name}</RNText>
                  {data.primary_category ? <RNText style={[styles.subtitle, { color: colors.icon }]}>{data.primary_category}</RNText> : null}
                  {data.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                      <Ionicons name="location-outline" size={14} color={colors.icon} />
                      <RNText style={[styles.meta, { color: colors.icon, marginTop: 0 }]}>{data.location}</RNText>
                    </View>
                  ) : null}
                  {data.availability && AVAILABILITY_COLORS[data.availability] && (
                    <View style={[styles.availabilityBadge, { backgroundColor: AVAILABILITY_COLORS[data.availability] + '18' }]}>
                      <View style={[styles.availabilityDot, { backgroundColor: AVAILABILITY_COLORS[data.availability] }]} />
                      <RNText style={[styles.availabilityText, { color: AVAILABILITY_COLORS[data.availability] }]}>
                        {AVAILABILITY_LABELS[data.availability] || data.availability}
                      </RNText>
                    </View>
                  )}
                </View>
              </View>

              {data.tagline ? <RNText style={[styles.tagline, { color: colors.text }]}>{data.tagline}</RNText> : null}

              {/* ---- Bio ---- */}
              {data.bio ? (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>About</RNText>
                  <RNText style={[styles.bioText, { color: colors.text }]}>{data.bio}</RNText>
                </View>
              ) : null}

              {/* ---- Skills ---- */}
              {data.top_skills.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Skills</RNText>
                  <View style={styles.chipRow}>
                    {data.top_skills.map((s, i) => (
                      <View key={i} style={[styles.chip, { backgroundColor: colors.tint + '20' }]}>
                        <RNText style={[styles.chipText, { color: colors.tint }, { fontFamily: fontBody as any }]}>{s}</RNText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ---- Details grid ---- */}
              <View style={styles.details}>
                <RNText style={[styles.detailLabel, { color: colors.icon }]}>Experience</RNText>
                <RNText style={[styles.detailValue, { color: colors.text }]}>
                  {data.experience_years != null ? `${EXPERIENCE_LABELS[data.experience_level] || data.experience_level} · ${data.experience_years} years` : (EXPERIENCE_LABELS[data.experience_level] || data.experience_level || '—')}
                </RNText>

                {data.rating != null && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Rating</RNText>
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons key={star} name={star <= Math.round(data.rating!) ? 'star' : 'star-outline'} size={16} color="#f59e0b" />
                      ))}
                      <RNText style={[styles.ratingLabel, { color: colors.text }]}>
                        {data.rating.toFixed(1)} ({data.reviews_count} {data.reviews_count === 1 ? 'review' : 'reviews'})
                      </RNText>
                    </View>
                  </>
                )}

                <RNText style={[styles.detailLabel, { color: colors.icon }]}>Rate</RNText>
                <RNText style={[styles.detailValue, { color: colors.text }]}>
                  {data.hourly_rate ? `$${data.hourly_rate}/hr` : data.daily_rate ? `$${data.daily_rate}/day` : 'Contact for rate'}
                </RNText>
              </View>

              {/* ---- Certifications ---- */}
              {data.certifications && data.certifications.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Certifications</RNText>
                  {data.certifications.map((cert: any, i: number) => (
                    <View key={i} style={[styles.certRow, { borderColor: colors.icon + '20' }]}>
                      <Ionicons name="ribbon-outline" size={20} color={colors.tint} />
                      <View style={{ flex: 1 }}>
                        <RNText style={[styles.certName, { color: colors.text }]}>{cert.name}</RNText>
                        {cert.issuer ? <RNText style={[styles.certIssuer, { color: colors.icon }]}>{cert.issuer}{cert.year ? ` · ${cert.year}` : ''}</RNText> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ---- How I Work ---- */}
              {data.work_process && data.work_process.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>How I Work</RNText>
                  {data.work_process.map((step: any, i: number) => (
                    <View key={i} style={styles.stepCard}>
                      <View style={[styles.stepBadge, { backgroundColor: colors.tint }]}>
                        <RNText style={styles.stepBadgeText}>{step.step ?? i + 1}</RNText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <RNText style={[styles.stepTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>{step.title}</RNText>
                        {step.description ? <RNText style={[styles.stepDesc, { color: colors.icon }]}>{step.description}</RNText> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ---- Reviews ---- */}
              {reviewsCount > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
                    Reviews ({reviewsCount})
                  </RNText>
                  {reviews.map((rev) => (
                    <View key={rev.id} style={[styles.reviewCard, { borderColor: colors.icon + '20' }]}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.ratingRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons key={star} name={star <= rev.rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
                          ))}
                        </View>
                        <RNText style={[styles.reviewerName, { color: colors.text }]}>{rev.reviewer_name}</RNText>
                      </View>
                      {rev.comment ? <RNText style={[styles.reviewComment, { color: colors.text }]}>{rev.comment}</RNText> : null}
                      <RNText style={[styles.reviewDate, { color: colors.icon }]}>
                        {new Date(rev.created_at).toLocaleDateString()}
                      </RNText>
                    </View>
                  ))}
                </View>
              )}

              {/* ---- Footer ---- */}
              <View style={[styles.footer, { borderTopColor: colors.icon + '40' }]}>
                {isSelf ? (
                  <Pressable onPress={() => router.push('/profile')} style={[styles.primaryBtn, { backgroundColor: BRAND_BLUE }]}>
                    <RNText style={[styles.primaryBtnText, { fontFamily: fontBody as any }]}>View your profile</RNText>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.secondaryBtn, { borderColor: colors.tint }]}>
                    <RNText style={[styles.secondaryBtnText, { color: colors.tint }, { fontFamily: fontBody as any }]}>Hire / Contact</RNText>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <View style={[styles.content, { borderColor: colors.icon + '40' }]}>
              {/* ---- Company Header ---- */}
              <View style={[styles.header, isSmallScreen && { flexDirection: 'column', alignItems: 'center' }]}>
                {data.company_logo ? (
                  <Image source={{ uri: data.company_logo }} style={isSmallScreen ? [styles.avatarLarge, { width: 80, height: 80, borderRadius: 40 }] : styles.avatarLarge} />
                ) : (
                  <View style={[styles.avatarPlaceholderLarge, { backgroundColor: colors.icon + '30' }, isSmallScreen && { width: 80, height: 80, borderRadius: 40 }]}>
                    <Ionicons name="business" size={isSmallScreen ? 40 : 64} color={colors.icon} />
                  </View>
                )}
                <View style={[styles.headerText, isSmallScreen && { alignItems: 'center' }]}>
                  <RNText style={[styles.title, { color: colors.text }, { fontFamily: fontHeading as any }]}>{data.company_name}</RNText>
                  {data.company_type.length > 0 ? <RNText style={[styles.subtitle, { color: colors.icon }]}>{data.company_type.join(', ')}</RNText> : null}
                  {data.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                      <Ionicons name="location-outline" size={14} color={colors.icon} />
                      <RNText style={[styles.meta, { color: colors.icon, marginTop: 0 }]}>{data.location}</RNText>
                    </View>
                  ) : null}
                </View>
              </View>

              {data.tagline ? <RNText style={[styles.tagline, { color: colors.text }]}>{data.tagline}</RNText> : null}

              {/* ---- Services ---- */}
              {data.services_offered.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Services</RNText>
                  <View style={styles.chipRow}>
                    {data.services_offered.map((s, i) => (
                      <View key={i} style={[styles.chip, { backgroundColor: colors.tint + '20' }]}>
                        <RNText style={[styles.chipText, { color: colors.tint }, { fontFamily: fontBody as any }]}>{s}</RNText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ---- Details ---- */}
              <View style={styles.details}>
                {data.team_size != null && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Team Size</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>{data.team_size}+ workers</RNText>
                  </>
                )}
                {data.founded_year != null && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Founded</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>{data.founded_year}</RNText>
                  </>
                )}
                {data.min_project_budget != null && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Min Project Budget</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>${data.min_project_budget}</RNText>
                  </>
                )}
                {data.rating != null && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Rating</RNText>
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons key={star} name={star <= Math.round(data.rating!) ? 'star' : 'star-outline'} size={16} color="#f59e0b" />
                      ))}
                      <RNText style={[styles.ratingLabel, { color: colors.text }]}>
                        {data.rating.toFixed(1)} ({data.reviews_count} {data.reviews_count === 1 ? 'review' : 'reviews'})
                      </RNText>
                    </View>
                  </>
                )}
              </View>

              {/* ---- Certifications ---- */}
              {data.certifications && data.certifications.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Certifications</RNText>
                  <View style={styles.chipRow}>
                    {data.certifications.map((cert: string, i: number) => (
                      <View key={i} style={[styles.chip, { backgroundColor: colors.tint + '20' }]}>
                        <Ionicons name="ribbon-outline" size={14} color={colors.tint} style={{ marginRight: 4 }} />
                        <RNText style={[styles.chipText, { color: colors.tint }, { fontFamily: fontBody as any }]}>{cert}</RNText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ---- Notable Projects ---- */}
              {data.notable_projects && data.notable_projects.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Notable Projects</RNText>
                  {data.notable_projects.map((proj: any, i: number) => (
                    <View key={i} style={[styles.certRow, { borderColor: colors.icon + '20' }]}>
                      <Ionicons name="construct-outline" size={20} color={colors.tint} />
                      <View style={{ flex: 1 }}>
                        <RNText style={[styles.certName, { color: colors.text }]}>{typeof proj === 'string' ? proj : proj.name}</RNText>
                        {typeof proj !== 'string' && (proj.value || proj.duration) ? (
                          <RNText style={[styles.certIssuer, { color: colors.icon }]}>
                            {[proj.value, proj.duration].filter(Boolean).join(' · ')}
                          </RNText>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ---- Reviews ---- */}
              {reviewsCount > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
                    Reviews ({reviewsCount})
                  </RNText>
                  {reviews.map((rev) => (
                    <View key={rev.id} style={[styles.reviewCard, { borderColor: colors.icon + '20' }]}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.ratingRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons key={star} name={star <= rev.rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
                          ))}
                        </View>
                        <RNText style={[styles.reviewerName, { color: colors.text }]}>{rev.reviewer_name}</RNText>
                      </View>
                      {rev.comment ? <RNText style={[styles.reviewComment, { color: colors.text }]}>{rev.comment}</RNText> : null}
                      <RNText style={[styles.reviewDate, { color: colors.icon }]}>
                        {new Date(rev.created_at).toLocaleDateString()}
                      </RNText>
                    </View>
                  ))}
                </View>
              )}

              {/* ---- Footer ---- */}
              <View style={[styles.footer, { borderTopColor: colors.icon + '40' }]}>
                {isSelf ? (
                  <Pressable onPress={() => router.push('/profile')} style={[styles.primaryBtn, { backgroundColor: BRAND_BLUE }]}>
                    <RNText style={[styles.primaryBtnText, { fontFamily: fontBody as any }]}>View your profile</RNText>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.primaryBtn, { backgroundColor: BRAND_BLUE }]}>
                    <RNText style={[styles.primaryBtnText, { fontFamily: fontBody as any }]}>Hire / Contact</RNText>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      <LandingFooter isSmallScreen={width < 768} colors={colors} />
      </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } as ViewStyle,
  centerText: { marginTop: 12, fontSize: 16 } as TextStyle,
  scrollView: { flex: 1, width: '100%' } as ViewStyle,
  scrollContent: { flexGrow: 1, paddingBottom: 48 } as ViewStyle,
  container: { paddingTop: Platform.OS === 'web' ? 100 : 24, paddingBottom: 24, maxWidth: 700, alignSelf: 'center', paddingHorizontal: 24 } as ViewStyle,
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, alignSelf: 'flex-start' } as ViewStyle,
  backBtnText: { fontSize: 16 } as TextStyle,
  content: { padding: 24, borderRadius: 12, borderWidth: 1 } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 } as ViewStyle,
  avatarLarge: { width: 100, height: 100, borderRadius: 50 } as ViewStyle,
  avatarPlaceholderLarge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  headerText: { flex: 1, minWidth: 0 } as ViewStyle,
  title: { fontSize: 28, fontWeight: '700' } as TextStyle,
  subtitle: { fontSize: 16, marginTop: 4 } as TextStyle,
  meta: { fontSize: 14, marginTop: 4 } as TextStyle,
  tagline: { fontSize: 16, opacity: 0.9, marginBottom: 20 } as TextStyle,
  section: { marginBottom: 20 } as ViewStyle,
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 } as TextStyle,
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as ViewStyle,
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 } as ViewStyle,
  chipText: { fontSize: 14, fontWeight: '600' } as TextStyle,
  details: { marginTop: 8 } as ViewStyle,
  detailLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 } as TextStyle,
  detailValue: { fontSize: 15, fontWeight: '600' } as TextStyle,
  footer: { marginTop: 24, paddingTop: 20, borderTopWidth: 1 } as ViewStyle,
  primaryBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' } as ViewStyle,
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' } as TextStyle,
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', borderWidth: 1 } as ViewStyle,
  secondaryBtnText: { fontSize: 16, fontWeight: '600' } as TextStyle,
  errorText: { fontSize: 16, textAlign: 'center' } as TextStyle,
  bioText: { fontSize: 15, lineHeight: 22, opacity: 0.9 } as TextStyle,
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6, alignSelf: 'flex-start' } as ViewStyle,
  availabilityDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 } as ViewStyle,
  availabilityText: { fontSize: 12, fontWeight: '600' } as TextStyle,
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 } as ViewStyle,
  ratingLabel: { fontSize: 14, fontWeight: '600', marginLeft: 6 } as TextStyle,
  certRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1 } as ViewStyle,
  certName: { fontSize: 15, fontWeight: '600' } as TextStyle,
  certIssuer: { fontSize: 13, marginTop: 2 } as TextStyle,
  stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 } as ViewStyle,
  stepBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  stepBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' } as TextStyle,
  stepTitle: { fontSize: 15, fontWeight: '700' } as TextStyle,
  stepDesc: { fontSize: 14, marginTop: 2, lineHeight: 20 } as TextStyle,
  reviewCard: { paddingVertical: 12, borderBottomWidth: 1 } as ViewStyle,
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 } as ViewStyle,
  reviewerName: { fontSize: 14, fontWeight: '600' } as TextStyle,
  reviewComment: { fontSize: 14, lineHeight: 20, opacity: 0.9, marginBottom: 4 } as TextStyle,
  reviewDate: { fontSize: 12 } as TextStyle,
  authOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  authBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' } as ViewStyle,
  authModal: { width: '90%', maxWidth: 380, borderRadius: 16, padding: 32, alignItems: 'center', ...Platform.select({ web: { boxShadow: '0 16px 48px rgba(0,0,0,0.3)' as any } }) } as ViewStyle,
  authTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 } as TextStyle,
  authDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 } as TextStyle,
  authBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 } as ViewStyle,
  authBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' } as TextStyle,
  authBtnOutline: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 2 } as ViewStyle,
  authBtnOutlineText: { fontSize: 16, fontWeight: '600' } as TextStyle,
});
