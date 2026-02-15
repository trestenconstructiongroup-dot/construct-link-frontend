import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Colors, Fonts } from '../../../constants/theme';
import { Text } from '../../../components/Text';
import LandingFooter from './landing/LandingFooter';
import {
  getFullProfile,
  updateIndividualProfile,
  updateCompanyProfile,
  ensureIndividualProfile,
  ensureCompanyProfile,
  createIndividualExperience,
  createIndividualEducation,
  updateIndividualExperience,
  deleteIndividualExperience,
  updateIndividualEducation,
  deleteIndividualEducation,
  createCompanyHiringFocus,
  deleteCompanyHiringFocus,
  listMyJobs,
} from '../../../services/api';
import type { Job } from '../../../services/api';

type Skill = { name: string; standardized?: boolean };

type CertificationEntry = { name: string; issuer?: string; year?: number };
type WorkProcessStep = { step?: number; title: string; description?: string };

type IndividualProfile = {
  id: number;
  name: string;
  headline: string;
  skills: Skill[];
  bio: string;
  experience_years?: number;
  location: string;
  photo_url: string;
  hourly_rate?: string | null;
  daily_rate?: string | null;
  availability?: string;
  certifications?: CertificationEntry[];
  work_process?: WorkProcessStep[];
};

type CompanyProfile = {
  id: number;
  company_name: string;
  company_type: string[];
  description: string;
  website: string;
  team_size?: number;
  location: string;
  logo_url: string;
  founded_year?: number | null;
  certifications?: string[];
  notable_projects?: Array<string | { name: string; value?: string; duration?: string }>;
  min_project_budget?: string | null;
};

type ExperienceItem = {
  id: number;
  profile: number;
  role_title: string;
  company_name: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string;
};

type EducationItem = {
  id: number;
  profile: number;
  institution: string;
  qualification: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
};

type ProfileResponse = {
  user: {
    id: number;
    email: string;
    full_name: string;
    is_worker: boolean;
    is_company: boolean;
  };
  individual_profile: IndividualProfile | null;
  company_profile: CompanyProfile | null;
  individual_experience?: ExperienceItem[];
  individual_education?: EducationItem[];
};

function formatActivityDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString();
}

type ActivitiesSectionProps = {
  token: string | null;
  accountType: 'individual' | 'company' | 'unassigned';
};

function ActivitiesSection({ token, accountType }: ActivitiesSectionProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setJobs([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listMyJobs(token)
      .then((list) => {
        if (!cancelled) {
          const sorted = [...list].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
          setJobs(sorted);
        }
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const activities = jobs.map((job) => ({
    id: String(job.id),
    jobId: job.id,
    type: 'job_created' as const,
    title: job.job_title,
    meta: job.category,
    status: job.status,
    date: job.created_at,
  }));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Activities</Text>
      </View>
      {loading ? (
        <Text style={[styles.bodyText, { color: colors.text }]}>Loading activities…</Text>
      ) : activities.length === 0 ? (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          {accountType === 'company'
            ? 'Your recent job posts and other activity will appear here.'
            : 'Your activity will appear here.'}
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.activitiesScrollContent}
          style={styles.activitiesScroll}
        >
          {activities.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/jobs-edit/${a.jobId}`)}
              style={({ pressed }) => [
                styles.activityCard,
                {
                  backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : colors.accent + '14',
                  borderColor: isDark ? 'rgba(148,163,184,0.25)' : colors.accent + '33',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.activityCardHeader}>
                <Text style={[styles.activityCardType, { color: colors.accent }]}>
                  Job created
                </Text>
                <View style={[styles.activityCardEditHint, { backgroundColor: colors.tint + '20' }]}>
                  <Ionicons name="pencil" size={14} color={colors.tint} />
                  <Text style={[styles.activityCardEditHintText, { color: colors.tint }]}>
                    Edit
                  </Text>
                </View>
              </View>
              <Text style={[styles.activityCardTitle, { color: colors.text }]} numberOfLines={2}>
                {a.title}
              </Text>
              <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
                {a.meta} · {a.status}
              </Text>
              <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.6 }]}>
                {formatActivityDate(a.date)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const PREDEFINED_SKILLS: string[] = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Masonry',
  'Roofing',
  'HVAC',
  'Site supervision',
  'Health & Safety',
];

export default function ProfilePage() {
  const { isDark } = useTheme();
  const { user, token, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();

  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accountType: 'individual' | 'company' | 'unassigned' = useMemo(() => {
    if (user?.is_worker) return 'individual';
    if (user?.is_company) return 'company';
    return 'unassigned';
  }, [user]);

  useEffect(() => {
    if (!token) {
      // Wait for auth state to finish restoring before showing an auth error.
      if (authLoading) return;
      setLoading(false);
      setError('You need to be logged in to view your profile.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let res = await getFullProfile(token);
        // Auto-create a profile record if the user has a role but no profile yet
        if (!cancelled) {
          if (accountType === 'individual' && !res.individual_profile) {
            const created = await ensureIndividualProfile(token);
            res = { ...res, individual_profile: created };
          }
          if (accountType === 'company' && !res.company_profile) {
            const created = await ensureCompanyProfile(token);
            res = { ...res, company_profile: created };
          }
          setData(res);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load profile.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, accountType, authLoading]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading your profile…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{error}</Text>
      </View>
    );
  }

  if (!data) {
    return null;
  }

  const individual = data.individual_profile;
  const company = data.company_profile;
  const experience = data.individual_experience || [];
  const education = data.individual_education || [];
  const companyHiringFocus =
    (data as any).company_hiring_focus || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.page,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>My Profile</Text>

      <ProfileSummaryCard
        accountType={accountType}
        user={data.user}
        individual={individual}
        company={company}
        onSave={async (payload) => {
          if (!token) return;
          if (accountType === 'individual') {
            const next = await updateIndividualProfile(token, payload as any);
            setData((prev) => (prev ? { ...prev, individual_profile: next } : prev));
          } else if (accountType === 'company') {
            const next = await updateCompanyProfile(token, payload as any);
            setData((prev) => (prev ? { ...prev, company_profile: next } : prev));
          }
        }}
      />

      {accountType === 'individual' && individual && (
        <>
          <AboutSection
            profile={individual}
            onSave={async (bio) => {
              if (!token) return;
              const next = await updateIndividualProfile(token, { bio });
              setData((prev) => (prev ? { ...prev, individual_profile: next } : prev));
            }}
          />
          <SkillsSection
            profile={individual}
            onSave={async (skills) => {
              if (!token) return;
              const next = await updateIndividualProfile(token, { skills });
              setData((prev) => (prev ? { ...prev, individual_profile: next } : prev));
            }}
          />
          <RatesAvailabilitySection
            profile={individual}
            onSave={async (payload) => {
              if (!token) return;
              const next = await updateIndividualProfile(token, payload as any);
              setData((prev) => (prev ? { ...prev, individual_profile: next } : prev));
            }}
          />
          <CertificationsSection
            certifications={individual.certifications || []}
            onSave={async (certifications) => {
              if (!token) return;
              const next = await updateIndividualProfile(token, { certifications } as any);
              setData((prev) => (prev ? { ...prev, individual_profile: next } : prev));
            }}
          />
          <WorkProcessSection
            steps={individual.work_process || []}
            onSave={async (work_process) => {
              if (!token) return;
              const next = await updateIndividualProfile(token, { work_process } as any);
              setData((prev) => (prev ? { ...prev, individual_profile: next } : prev));
            }}
          />
          <ExperienceSection
            items={experience}
            onAdd={async (payload) => {
              if (!token) return;
              const created = await createIndividualExperience(token, payload);
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      individual_experience: [
                        ...(prev.individual_experience || []),
                        created as any,
                      ],
                    }
                  : prev,
              );
            }}
            onUpdate={async (id, payload) => {
              if (!token) return;
              const updated = await updateIndividualExperience(token, id, payload as any);
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      individual_experience: (prev.individual_experience || []).map((item) =>
                        item.id === id ? (updated as any) : item,
                      ),
                    }
                  : prev,
              );
            }}
            onDelete={async (id) => {
              if (!token) return;
              await deleteIndividualExperience(token, id);
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      individual_experience: (prev.individual_experience || []).filter(
                        (item) => item.id !== id,
                      ),
                    }
                  : prev,
              );
            }}
          />
          <EducationSection
            items={education}
            onAdd={async (payload) => {
              if (!token) return;
              const created = await createIndividualEducation(token, payload);
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      individual_education: [
                        ...(prev.individual_education || []),
                        created as any,
                      ],
                    }
                  : prev,
              );
            }}
            onUpdate={async (id, payload) => {
              if (!token) return;
              const updated = await updateIndividualEducation(token, id, payload as any);
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      individual_education: (prev.individual_education || []).map((item) =>
                        item.id === id ? (updated as any) : item,
                      ),
                    }
                  : prev,
              );
            }}
            onDelete={async (id) => {
              if (!token) return;
              await deleteIndividualEducation(token, id);
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      individual_education: (prev.individual_education || []).filter(
                        (item) => item.id !== id,
                      ),
                    }
                  : prev,
              );
            }}
          />
        </>
      )}

      {accountType === 'company' && company && (
        <>
          <CompanyAboutSection
            profile={company}
            onSave={async (payload) => {
              if (!token) return;
              const next = await updateCompanyProfile(token, payload as any);
              setData((prev) => (prev ? { ...prev, company_profile: next } : prev));
            }}
          />
          <CompanyDetailsSection
            profile={company}
            hiringFocus={companyHiringFocus}
            onSaveProfile={async (payload) => {
              if (!token) return;
              const next = await updateCompanyProfile(token, payload as any);
              setData((prev) => (prev ? { ...prev, company_profile: next } : prev));
            }}
          />
          <CompanyHiringFocusSection
            items={companyHiringFocus}
            onAdd={async (title) => {
              if (!token) return;
              const created = await createCompanyHiringFocus(token, { title });
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      company_hiring_focus: [
                        ...(((prev as any).company_hiring_focus as any[]) || []),
                        created as any,
                      ],
                    }
                  : prev,
              );
            }}
            onDelete={async (id) => {
              if (!token) return;
              await deleteCompanyHiringFocus(token, id);
              setData((prev) =>
                prev
                  ? {
                      ...prev,
                      company_hiring_focus: (prev as any).company_hiring_focus?.filter(
                        (item: { id: number }) => item.id !== id,
                      ) || [],
                    }
                  : prev,
              );
            }}
          />
          <CompanyExtrasSection
            profile={company}
            onSave={async (payload) => {
              if (!token) return;
              const next = await updateCompanyProfile(token, payload as any);
              setData((prev) => (prev ? { ...prev, company_profile: next } : prev));
            }}
          />
        </>
      )}

      <ActivitiesSection token={token} accountType={accountType} />
      <LandingFooter isSmallScreen={width < 768} colors={colors} />
    </ScrollView>
  );
}

type SummaryProps = {
  accountType: 'individual' | 'company' | 'unassigned';
  user: ProfileResponse['user'];
  individual: IndividualProfile | null;
  company: CompanyProfile | null;
  onSave: (payload: Partial<IndividualProfile | CompanyProfile>) => Promise<void>;
};

function ProfileSummaryCard({
  accountType,
  user,
  individual,
  company,
  onSave,
}: SummaryProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(
    accountType === 'company'
      ? company?.company_name || user.full_name || user.email
      : individual?.name || user.full_name || user.email,
  );
  const [headline, setHeadline] = useState(
    accountType === 'company' ? company?.description || '' : individual?.headline || '',
  );
  const [location, setLocation] = useState(
    (accountType === 'company' ? company?.location : individual?.location) || '',
  );

  const badge =
    accountType === 'individual'
      ? 'Individual'
      : accountType === 'company'
      ? 'Company'
      : 'Choose your role';

  const handleSave = async () => {
    const payload: any =
      accountType === 'company'
        ? { company_name: name, description: headline, location }
        : { name, headline, location };
    await onSave(payload);
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={[styles.summaryRow, isSmallScreen && { flexDirection: 'column', alignItems: 'center', gap: 12 }]}>
        <View style={[styles.summaryAvatar, { backgroundColor: colors.accent }]} />
        <View style={[styles.summaryText, isSmallScreen && { alignItems: 'center' }]}>
          {editing ? (
            <>
              <TextInput
                style={[styles.input, styles.inputPrimary, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Full name or company name"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={headline}
                onChangeText={setHeadline}
                placeholder={
                  accountType === 'company'
                    ? 'What kind of projects do you run?'
                    : 'Your professional headline'
                }
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                placeholderTextColor="#9ca3af"
              />
            </>
          ) : (
            <>
              <Text style={[styles.summaryName, { color: colors.text }]}>
                {name}
              </Text>
              {headline ? (
                <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.85 }]}>
                  {headline}
                </Text>
              ) : null}
              {location ? (
                <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.7 }]}>
                  {location}
                </Text>
              ) : null}
            </>
          )}
        </View>
        {!editing && (
          <View style={styles.summaryBadge}>
            <Text style={[styles.badgeText, { color: '#0f172a' }]}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.summaryActions}>
        <Pressable style={styles.photoButton}>
          <Text style={[styles.actionText, { color: colors.text, opacity: 0.85 }]}>
            Edit profile photo
          </Text>
        </Pressable>
        <Pressable
          style={[styles.editButton, { borderColor: '#ffffff33' }]}
          onPress={() => setEditing((prev) => !prev)}
        >
          <Text style={[styles.actionText, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit summary'}
          </Text>
        </Pressable>
        {editing && (
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={[styles.actionText, { color: '#0f172a' }]}>Save</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

type SkillsProps = {
  profile: IndividualProfile;
  onSave: (skills: Skill[]) => Promise<void>;
};

function SkillsSection({ profile, onSave }: SkillsProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Skill[]>(profile.skills || []);
  const [custom, setCustom] = useState('');

  const toggleSkill = (name: string) => {
    const exists = selected.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setSelected(selected.filter((s) => s.name.toLowerCase() !== name.toLowerCase()));
    } else {
      setSelected([...selected, { name, standardized: PREDEFINED_SKILLS.includes(name) }]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    if (!selected.find((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSelected([...selected, { name: trimmed, standardized: false }]);
    }
    setCustom('');
  };

  const handleSave = async () => {
    await onSave(selected);
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Skills</Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        {selected.length === 0 && !editing ? (
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Add the skills you want companies to find you for.
          </Text>
        ) : null}
        {selected.map((skill) => (
          <View
            key={skill.name}
            style={[
              styles.chip,
              { backgroundColor: isDark ? '#0f172a' : '#e5e7eb' },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isDark ? '#e5e7eb' : '#111827' },
              ]}
            >
              {skill.name}
            </Text>
          </View>
        ))}
      </View>

      {editing && (
        <>
          <View style={styles.chipRow}>
            {PREDEFINED_SKILLS.map((name) => {
              const active = selected.some(
                (s) => s.name.toLowerCase() === name.toLowerCase(),
              );
              return (
                <Pressable
                  key={name}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent : 'transparent',
                      borderColor: 'rgba(148,163,184,0.6)',
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => toggleSkill(name)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? '#ffffff' : colors.text },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.customRow}>
            <TextInput
              style={[styles.input, styles.customInput]}
              value={custom}
              onChangeText={setCustom}
              placeholder="Add another skill"
              placeholderTextColor="#9ca3af"
            />
            <Pressable style={styles.saveButton} onPress={handleAddCustom}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>Add</Text>
            </Pressable>
          </View>
          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>
                Save skills
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

type AboutProps = {
  profile: IndividualProfile;
  onSave: (bio: string) => Promise<void>;
};

function AboutSection({ profile, onSave }: AboutProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');

  const handleSave = async () => {
    await onSave(bio);
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View className="header">
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>About</Text>
          <Pressable onPress={() => setEditing((prev) => !prev)}>
            <Text style={[styles.cardAction, { color: colors.text }]}>
              {editing ? 'Cancel' : 'Edit'}
            </Text>
          </Pressable>
        </View>
      </View>
      {editing ? (
        <>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={5}
            placeholder="Tell companies a bit about your experience, projects and what you’re looking for."
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>
                Save about
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          {bio || 'Use this space to introduce yourself to potential clients and teams.'}
        </Text>
      )}
    </View>
  );
}

type CompanyAboutProps = {
  profile: CompanyProfile;
  onSave: (payload: Partial<CompanyProfile>) => Promise<void>;
};

function CompanyAboutSection({ profile, onSave }: CompanyAboutProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(profile.description || '');

  const handleSave = async () => {
    await onSave({ description });
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          About this company
        </Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>
      {editing ? (
        <>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            placeholder="Describe the kind of work you deliver, your clients and what makes your team different."
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>
                Save
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          {description || 'Share your mission, the type of projects you run and the crews you are looking for.'}
        </Text>
      )}
    </View>
  );
}

type CompanyDetailsProps = {
  profile: CompanyProfile;
  hiringFocus: { id: number; title: string }[];
  onSaveProfile: (payload: Partial<CompanyProfile>) => Promise<void>;
};

const COMPANY_TYPE_OPTIONS = [
  'General Contractor',
  'Developer',
  'Subcontractor',
  'Consultant',
  'Supplier',
];

function CompanyDetailsSection({ profile, hiringFocus, onSaveProfile }: CompanyDetailsProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);

  const [companyTypes, setCompanyTypes] = useState<string[]>(profile.company_type || []);
  const [website, setWebsite] = useState(profile.website || '');
  const [teamSize, setTeamSize] = useState(
    typeof profile.team_size === 'number' ? String(profile.team_size) : '',
  );

  const toggleType = (value: string) => {
    setCompanyTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleSave = async () => {
    const numericTeamSize =
      teamSize.trim() && !Number.isNaN(Number(teamSize.trim()))
        ? Number(teamSize.trim())
        : undefined;
    await onSaveProfile({
      company_type: companyTypes,
      website: website.trim(),
      team_size: numericTeamSize,
    } as any);
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Company details</Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {!editing && (
        <>
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
              Company type
            </Text>
            <View style={[styles.chipRow, { marginTop: 4 }]}>
              {(companyTypes.length ? companyTypes : ['Not set']).map((type) => (
                <View
                  key={type}
                  style={[
                    styles.chip,
                    { backgroundColor: isDark ? '#0f172a' : '#e5e7eb' },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isDark ? '#e5e7eb' : '#111827' },
                    ]}
                  >
                    {type}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
              Website
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {website || 'Add your website so workers can learn more about you.'}
            </Text>
          </View>

          <View>
            <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
              Team size
            </Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {profile.team_size ? `${profile.team_size}+ people` : 'Not specified yet.'}
            </Text>
          </View>

          {!!hiringFocus.length && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
                Currently hiring for
              </Text>
              <View style={[styles.chipRow, { marginTop: 4 }]}>
                {hiringFocus.map((f) => (
                  <View
                    key={f.id}
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#0f172a' : '#e5e7eb' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isDark ? '#e5e7eb' : '#111827' },
                      ]}
                    >
                      {f.title}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {editing && (
        <>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Company type
          </Text>
          <View style={[styles.chipRow, { marginTop: 4, marginBottom: 12 }]}>
            {COMPANY_TYPE_OPTIONS.map((type) => {
              const active = companyTypes.includes(type);
              return (
                <Pressable
                  key={type}
                  onPress={() => toggleType(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent : 'transparent',
                      borderColor: 'rgba(148,163,184,0.6)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? '#ffffff' : colors.text },
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Website
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, marginBottom: 12 }]}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://yourcompany.com"
            placeholderTextColor="#9ca3af"
          />

          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Team size
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, marginBottom: 12 }]}
            value={teamSize}
            onChangeText={setTeamSize}
            placeholder="Approximate number of people (optional)"
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />

          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>Save details</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

type CompanyHiringFocusSectionProps = {
  items: { id: number; title: string }[];
  onAdd: (title: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

function CompanyHiringFocusSection({
  items,
  onAdd,
  onDelete,
}: CompanyHiringFocusSectionProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setTitle('');
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Hiring focus</Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Close' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          Highlight the key roles or trades you regularly hire for (for example:
          Skilled Electricians, HVAC technicians, Site supervisors).
        </Text>
      ) : (
        items.map((focus) => (
          <View
            key={focus.id}
            style={{
              marginBottom: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[styles.bodyText, { color: colors.text }]}>{focus.title}</Text>
            {editing && (
              <Pressable onPress={() => onDelete(focus.id)}>
                <Text style={[styles.cardAction, { color: '#f97373' }]}>Delete</Text>
              </Pressable>
            )}
          </View>
        ))
      )}

      {editing && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Skilled Electricians, Site Supervisors"
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleAdd}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>Add role</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'available_soon', label: 'Available Soon' },
  { value: 'unavailable', label: 'Unavailable' },
];

type RatesAvailabilityProps = {
  profile: IndividualProfile;
  onSave: (payload: Partial<IndividualProfile>) => Promise<void>;
};

function RatesAvailabilitySection({ profile, onSave }: RatesAvailabilityProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(profile.hourly_rate ?? '');
  const [dailyRate, setDailyRate] = useState(profile.daily_rate ?? '');
  const [availability, setAvailability] = useState(profile.availability ?? '');

  const handleSave = async () => {
    await onSave({
      hourly_rate: hourlyRate?.toString().trim() || null,
      daily_rate: dailyRate?.toString().trim() || null,
      availability,
    });
    setEditing(false);
  };

  const currentLabel = AVAILABILITY_OPTIONS.find((o) => o.value === availability)?.label || 'Not set';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Rates & Availability</Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {!editing ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Hourly rate: {profile.hourly_rate ? `$${profile.hourly_rate}/hr` : 'Not set'}
          </Text>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Daily rate: {profile.daily_rate ? `$${profile.daily_rate}/day` : 'Not set'}
          </Text>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Availability: {currentLabel}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>Hourly rate ($)</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={String(hourlyRate ?? '')}
            onChangeText={setHourlyRate}
            placeholder="e.g. 45.00"
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>Daily rate ($)</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={String(dailyRate ?? '')}
            onChangeText={setDailyRate}
            placeholder="e.g. 350.00"
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>Availability</Text>
          <View style={styles.chipRow}>
            {AVAILABILITY_OPTIONS.map((opt) => {
              const active = availability === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setAvailability(opt.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent : 'transparent',
                      borderColor: 'rgba(148,163,184,0.6)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#ffffff' : colors.text }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

type CertificationsSectionProps = {
  certifications: CertificationEntry[];
  onSave: (certifications: CertificationEntry[]) => Promise<void>;
};

function CertificationsSection({ certifications, onSave }: CertificationsSectionProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<CertificationEntry[]>(certifications || []);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [year, setYear] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const entry: CertificationEntry = { name: name.trim() };
    if (issuer.trim()) entry.issuer = issuer.trim();
    if (year.trim() && !Number.isNaN(Number(year))) entry.year = Number(year);
    setItems([...items, entry]);
    setName('');
    setIssuer('');
    setYear('');
  };

  const handleRemove = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    await onSave(items);
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Certifications</Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {items.length === 0 && !editing ? (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          Add certifications like OSHA 30, LEED, PMP, or trade licenses.
        </Text>
      ) : (
        items.map((cert, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryName, { fontSize: 15, color: colors.text }]}>{cert.name}</Text>
              {(cert.issuer || cert.year) ? (
                <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.7 }]}>
                  {[cert.issuer, cert.year].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            {editing && (
              <Pressable onPress={() => handleRemove(i)}>
                <Text style={[styles.cardAction, { color: '#f97373' }]}>Remove</Text>
              </Pressable>
            )}
          </View>
        ))
      )}

      {editing && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Certification name (e.g. OSHA 30)"
            placeholderTextColor="#9ca3af"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 2, color: colors.text }]}
              value={issuer}
              onChangeText={setIssuer}
              placeholder="Issuer (optional)"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              value={year}
              onChangeText={setYear}
              placeholder="Year"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable style={[styles.editButton, { borderColor: 'rgba(148,163,184,0.6)' }]} onPress={handleAdd}>
              <Text style={[styles.actionText, { color: colors.text }]}>+ Add</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>Save certifications</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

type WorkProcessSectionProps = {
  steps: WorkProcessStep[];
  onSave: (steps: WorkProcessStep[]) => Promise<void>;
};

function WorkProcessSection({ steps, onSave }: WorkProcessSectionProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<WorkProcessStep[]>(steps || []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    setItems([...items, { step: items.length + 1, title: title.trim(), description: description.trim() || undefined }]);
    setTitle('');
    setDescription('');
  };

  const handleRemove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 }));
    setItems(next);
  };

  const handleSave = async () => {
    await onSave(items);
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>How I Work</Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {items.length === 0 && !editing ? (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          Outline your work process so clients know what to expect (e.g. 1. Consultation, 2. Estimate, 3. Execution).
        </Text>
      ) : (
        items.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{step.step ?? i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryName, { fontSize: 15, color: colors.text }]}>{step.title}</Text>
              {step.description ? <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.7 }]}>{step.description}</Text> : null}
            </View>
            {editing && (
              <Pressable onPress={() => handleRemove(i)}>
                <Text style={[styles.cardAction, { color: '#f97373' }]}>Remove</Text>
              </Pressable>
            )}
          </View>
        ))
      )}

      {editing && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Step title (e.g. Site Assessment)"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.textArea, { color: colors.text, minHeight: 60 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            placeholder="Brief description (optional)"
            placeholderTextColor="#9ca3af"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable style={[styles.editButton, { borderColor: 'rgba(148,163,184,0.6)' }]} onPress={handleAdd}>
              <Text style={[styles.actionText, { color: colors.text }]}>+ Add step</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>Save work process</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

type CompanyExtrasProps = {
  profile: CompanyProfile;
  onSave: (payload: Partial<CompanyProfile>) => Promise<void>;
};

function CompanyExtrasSection({ profile, onSave }: CompanyExtrasProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [foundedYear, setFoundedYear] = useState(profile.founded_year != null ? String(profile.founded_year) : '');
  const [minBudget, setMinBudget] = useState(profile.min_project_budget ?? '');
  const [certs, setCerts] = useState<string[]>(profile.certifications || []);
  const [certInput, setCertInput] = useState('');
  const [projects, setProjects] = useState<Array<{ name: string; value?: string; duration?: string }>>(
    (profile.notable_projects || []).map((p) => (typeof p === 'string' ? { name: p } : p))
  );
  const [projName, setProjName] = useState('');
  const [projValue, setProjValue] = useState('');
  const [projDuration, setProjDuration] = useState('');

  const handleAddCert = () => {
    if (!certInput.trim()) return;
    setCerts([...certs, certInput.trim()]);
    setCertInput('');
  };

  const handleAddProject = () => {
    if (!projName.trim()) return;
    const entry: { name: string; value?: string; duration?: string } = { name: projName.trim() };
    if (projValue.trim()) entry.value = projValue.trim();
    if (projDuration.trim()) entry.duration = projDuration.trim();
    setProjects([...projects, entry]);
    setProjName('');
    setProjValue('');
    setProjDuration('');
  };

  const handleSave = async () => {
    const yr = foundedYear.trim() ? Number(foundedYear) : null;
    await onSave({
      founded_year: Number.isNaN(yr as number) ? null : yr,
      min_project_budget: minBudget?.toString().trim() || null,
      certifications: certs,
      notable_projects: projects,
    } as any);
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Company Extras</Text>
        <Pressable onPress={() => setEditing((prev) => !prev)}>
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      {!editing ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Founded: {profile.founded_year || 'Not set'}
          </Text>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>
            Min project budget: {profile.min_project_budget ? `$${profile.min_project_budget}` : 'Not set'}
          </Text>
          {certs.length > 0 && (
            <View>
              <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8, marginBottom: 4 }]}>Certifications</Text>
              <View style={styles.chipRow}>
                {certs.map((c, i) => (
                  <View key={i} style={[styles.chip, { backgroundColor: isDark ? '#0f172a' : '#e5e7eb' }]}>
                    <Text style={[styles.chipText, { color: isDark ? '#e5e7eb' : '#111827' }]}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {projects.length > 0 && (
            <View>
              <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8, marginBottom: 4 }]}>Notable Projects</Text>
              {projects.map((p, i) => (
                <Text key={i} style={[styles.bodyText, { color: colors.text }]}>
                  {p.name}{p.value ? ` — ${p.value}` : ''}{p.duration ? ` (${p.duration})` : ''}
                </Text>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>Founded year</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={foundedYear}
            onChangeText={setFoundedYear}
            placeholder="e.g. 2015"
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />

          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>Min project budget ($)</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={String(minBudget ?? '')}
            onChangeText={setMinBudget}
            placeholder="e.g. 50000"
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />

          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8 }]}>Certifications</Text>
          <View style={styles.chipRow}>
            {certs.map((c, i) => (
              <Pressable key={i} onPress={() => setCerts(certs.filter((_, j) => j !== i))}
                style={[styles.chip, { backgroundColor: isDark ? '#0f172a' : '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 4 }]}
              >
                <Text style={[styles.chipText, { color: isDark ? '#e5e7eb' : '#111827' }]}>{c}</Text>
                <Ionicons name="close-circle" size={14} color="#f97373" />
              </Pressable>
            ))}
          </View>
          <View style={styles.customRow}>
            <TextInput
              style={[styles.input, styles.customInput, { color: colors.text }]}
              value={certInput}
              onChangeText={setCertInput}
              placeholder="Add certification"
              placeholderTextColor="#9ca3af"
            />
            <Pressable style={[styles.editButton, { borderColor: 'rgba(148,163,184,0.6)' }]} onPress={handleAddCert}>
              <Text style={[styles.actionText, { color: colors.text }]}>Add</Text>
            </Pressable>
          </View>

          <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.8, marginTop: 4 }]}>Notable Projects</Text>
          {projects.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.bodyText, { color: colors.text, flex: 1 }]}>{p.name}</Text>
              <Pressable onPress={() => setProjects(projects.filter((_, j) => j !== i))}>
                <Text style={[styles.cardAction, { color: '#f97373' }]}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={projName}
            onChangeText={setProjName}
            placeholder="Project name"
            placeholderTextColor="#9ca3af"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              value={projValue}
              onChangeText={setProjValue}
              placeholder="Value (e.g. $2M)"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              value={projDuration}
              onChangeText={setProjDuration}
              placeholder="Duration (e.g. 6 months)"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <Pressable style={[styles.editButton, { borderColor: 'rgba(148,163,184,0.6)', alignSelf: 'flex-start' }]} onPress={handleAddProject}>
            <Text style={[styles.actionText, { color: colors.text }]}>+ Add project</Text>
          </Pressable>

          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>Save extras</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

type ExperienceSectionProps = {
  items: ExperienceItem[];
  onAdd: (payload: {
    role_title: string;
    company_name: string;
    location: string;
    description: string;
  }) => Promise<void>;
  onUpdate: (id: number, payload: {
    role_title: string;
    company_name: string;
    location: string;
    description: string;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

function ExperienceSection({ items, onAdd, onUpdate, onDelete }: ExperienceSectionProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setRoleTitle('');
    setCompanyName('');
    setLocation('');
    setDescription('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!roleTitle.trim()) return;
    const payload = {
      role_title: roleTitle.trim(),
      company_name: companyName.trim(),
      location: location.trim(),
      description: description.trim(),
    };

    if (editingId != null) {
      await onUpdate(editingId, payload);
    } else {
      await onAdd(payload);
    }

    resetForm();
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Experience</Text>
        <Pressable
          onPress={() => {
            setEditing((prev) => !prev);
            if (editing) {
              resetForm();
            }
          }}
        >
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          Add your past roles and projects so companies can see where you’ve worked.
        </Text>
      ) : (
        items.map((exp) => (
          <View key={exp.id} style={{ marginBottom: 12 }}>
            <Text style={[styles.summaryName, { fontSize: 16, color: colors.text }]}>
              {exp.role_title}
            </Text>
            <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.85 }]}>
              {exp.company_name}
              {exp.location ? ` • ${exp.location}` : ''}
            </Text>
            {editing && (
              <View style={{ flexDirection: 'row', marginTop: 4, gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setEditingId(exp.id);
                    setRoleTitle(exp.role_title);
                    setCompanyName(exp.company_name);
                    setLocation(exp.location);
                    setDescription(exp.description || '');
                  }}
                >
                  <Text style={[styles.cardAction, { color: colors.text }]}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await onDelete(exp.id);
                    if (editingId === exp.id) {
                      resetForm();
                    }
                  }}
                >
                  <Text style={[styles.cardAction, { color: '#f97373' }]}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}
      {editing && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={roleTitle}
            onChangeText={setRoleTitle}
            placeholder="Role title (e.g. Site Foreman)"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Company / project name"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Location (optional)"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.textArea, { color: colors.text, marginTop: 4 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholder="Briefly describe the work you did (optional)."
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>
                {editingId != null ? 'Update experience' : 'Save experience'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

type EducationSectionProps = {
  items: EducationItem[];
  onAdd: (payload: {
    institution: string;
    qualification: string;
    field_of_study: string;
    start_year: number | null;
    end_year: number | null;
  }) => Promise<void>;
};

type EducationUpdatePayload = {
  institution: string;
  qualification: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
};

type EducationSectionFullProps = EducationSectionProps & {
  onUpdate: (id: number, payload: EducationUpdatePayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

function EducationSection({ items, onAdd, onUpdate, onDelete }: EducationSectionFullProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [institution, setInstitution] = useState('');
  const [qualification, setQualification] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const resetForm = () => {
    setInstitution('');
    setQualification('');
    setFieldOfStudy('');
    setStartYear('');
    setEndYear('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!institution.trim() || !qualification.trim()) return;
    const start = startYear.trim() ? Number(startYear.trim()) : null;
    const end = endYear.trim() ? Number(endYear.trim()) : null;
    const payload: EducationUpdatePayload = {
      institution: institution.trim(),
      qualification: qualification.trim(),
      field_of_study: fieldOfStudy.trim(),
      start_year: Number.isNaN(start as number) ? null : start,
      end_year: Number.isNaN(end as number) ? null : end,
    };

    if (editingId != null) {
      await onUpdate(editingId, payload);
    } else {
      await onAdd(payload);
    }

    resetForm();
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
          ...(Platform.OS !== 'web' && !isDark
            ? { borderWidth: 1, borderColor: 'rgba(15,23,42,0.12)' }
            : {}),
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Education</Text>
        <Pressable
          onPress={() => {
            setEditing((prev) => !prev);
            if (editing) {
              resetForm();
            }
          }}
        >
          <Text style={[styles.cardAction, { color: colors.text }]}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </Pressable>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.bodyText, { color: colors.text }]}>
          List your trade school, university or certification training.
        </Text>
      ) : (
        items.map((edu) => (
          <View key={edu.id} style={{ marginBottom: 12 }}>
            <Text style={[styles.summaryName, { fontSize: 16, color: colors.text }]}>
              {edu.qualification}
            </Text>
            <Text style={[styles.summaryMeta, { color: colors.text, opacity: 0.85 }]}>
              {edu.institution}
            </Text>
            {editing && (
              <View style={{ flexDirection: 'row', marginTop: 4, gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setEditingId(edu.id);
                    setInstitution(edu.institution);
                    setQualification(edu.qualification);
                    setFieldOfStudy(edu.field_of_study || '');
                    setStartYear(edu.start_year ? String(edu.start_year) : '');
                    setEndYear(edu.end_year ? String(edu.end_year) : '');
                  }}
                >
                  <Text style={[styles.cardAction, { color: colors.text }]}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await onDelete(edu.id);
                    if (editingId === edu.id) {
                      resetForm();
                    }
                  }}
                >
                  <Text style={[styles.cardAction, { color: '#f97373' }]}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}
      {editing && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={institution}
            onChangeText={setInstitution}
            placeholder="Institution"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={qualification}
            onChangeText={setQualification}
            placeholder="Qualification (e.g. Diploma in Civil Engineering)"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={fieldOfStudy}
            onChangeText={setFieldOfStudy}
            placeholder="Field of study (optional)"
            placeholderTextColor="#9ca3af"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              value={startYear}
              onChangeText={setStartYear}
              placeholder="Start year"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={[styles.input, { flex: 1, color: colors.text }]}
              value={endYear}
              onChangeText={setEndYear}
              placeholder="End year (or leave blank)"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.sectionActions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={[styles.actionText, { color: '#0f172a' }]}>
                {editingId != null ? 'Update education' : 'Save education'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  page: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'web' ? 120 : 16,
    paddingHorizontal: Platform.OS === 'web' ? 48 : 16,
    paddingBottom: Platform.OS === 'web' ? 40 : 100,
    gap: 16,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Fonts.display,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(15,23,42,0.12)' as any,
      },
      default: {
        borderWidth: 0,
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  summaryText: {
    flex: 1,
  },
  summaryName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Fonts.heading,
  },
  summaryMeta: {
    fontSize: 14,
    marginTop: 4,
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  photoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: Colors.light.accent,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardAction: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  sectionActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  inputPrimary: {
    fontSize: 18,
    fontWeight: '600',
  },
  customInput: {
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'rgba(148,163,184,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 120,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  activitiesScroll: {
    marginHorizontal: -4,
  },
  activitiesScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
  },
  activityCard: {
    width: 280,
    minWidth: 280,
    marginRight: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityCardType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityCardEditHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityCardEditHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
});

