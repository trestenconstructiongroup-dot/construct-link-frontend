import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TextInput,
    TextStyle,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';
import { Text } from '../../components/Text';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
    createJob,
    getJob,
    JobMode,
    JobStatus,
    updateJob,
    type Job,
} from '../../services/api';
import WebLayout from '../web/layout';
import {
    CATEGORY_SKILL_SUGGESTIONS,
    JOB_CATEGORIES,
    JOB_TYPE_OPTIONS,
    parseDate,
    PREDEFINED_SKILLS,
    type JobType,
    type PaymentType,
} from './components/jobs-create/_constants';

export default function CreateJobWebPage({ editJobId = null }: { editJobId?: number | null }) {
  const { isDark } = useTheme();
  const { user, token } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isLoggedIn = !!token && !!user;

  const isCompany = !!user?.is_company;
  const isIndividual = !!user?.is_worker && !user?.is_company;

  const [jobModeForCompany, setJobModeForCompany] = useState<JobMode>('company_hiring');

  const [jobTitle, setJobTitle] = useState('');
  // Allow multiple high-level categories; we still derive a primary one for the Job.
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [jobType, setJobType] = useState<JobType>('one_time');

  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');

  const [description, setDescription] = useState('');

  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');

  const [paymentType, setPaymentType] = useState<PaymentType>('fixed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const [allowDMs, setAllowDMs] = useState(true);
  const [allowPhone, setAllowPhone] = useState(false);

  const [submitting, setSubmitting] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0..3
  const [loadingJob, setLoadingJob] = useState(!!editJobId && !isNaN(editJobId));

  const totalSteps = 4;

  useEffect(() => {
    if (!editJobId || !token || isNaN(editJobId)) {
      setLoadingJob(false);
      return;
    }
    let cancelled = false;
    setLoadingJob(true);
    getJob(token, editJobId)
      .then((job: Job) => {
        if (cancelled) return;
        setJobTitle(job.job_title);
        setCategories(
          job.role_requirements?.map((r) => r.skill_category) ?? (job.category ? [job.category] : []),
        );
        setJobType((job.job_type as JobType) || 'one_time');
        setRequiredSkills(job.required_skills ?? []);
        setDescription(job.description ?? '');
        setLocation(job.location ?? '');
        setStartDate(parseDate(job.start_date));
        setDeadline(parseDate(job.deadline));
        setPaymentType((job.payment_type as PaymentType) || 'fixed');
        setBudgetMin(job.budget_min ?? '');
        setBudgetMax(job.budget_max ?? '');
        setAllowDMs(job.allow_direct_messages ?? true);
        setAllowPhone(job.allow_phone_contact ?? false);
        if (job.job_mode && (job.job_mode === 'company_hiring' || job.job_mode === 'company_project')) {
          setJobModeForCompany(job.job_mode);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load job.');
      })
      .finally(() => {
        if (!cancelled) setLoadingJob(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editJobId, token]);
  const stepTitles = [
    'Basic information',
    'Skills & description',
    'Location & payment',
    'Review & publish',
  ];

  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill],
    );
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    setCategories((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    );
    setCustomCategory('');
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (!requiredSkills.includes(trimmed)) {
      setRequiredSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const validateForPublish = () => {
    if (!jobTitle.trim()) return 'Job title is required.';
    if (!categories.length) return 'At least one category is required.';
    if (!location.trim()) return 'Location is required.';
    if (!description.trim()) return 'Please add a short job description.';
    if (!paymentType) return 'Payment type is required.';
    return null;
  };

  const handleSubmit = async (status: JobStatus) => {
    try {
      setSubmitting(status);
      setError(null);

      if (status === 'published') {
        const validationError = validateForPublish();
        if (validationError) {
          setError(validationError);
          setSubmitting(null);
          return;
        }
      }

      const primaryCategory = categories[0]?.trim() || '';

      const payload: any = {
        job_title: jobTitle.trim(),
        category: primaryCategory,
        job_type: jobType,
        required_skills: requiredSkills,
        description,
        location,
        start_date: startDate || null,
        deadline: deadline || null,
        payment_type: paymentType,
        budget_min: budgetMin ? budgetMin : null,
        budget_max: budgetMax ? budgetMax : null,
        allow_direct_messages: allowDMs,
        allow_phone_contact: allowPhone,
        status,
      };

      if (categories.length) {
        payload.role_requirements = categories.map((cat) => ({
          skill_category: cat,
          quantity_required: 1,
        }));
      }

      if (isCompany) {
        payload.job_mode = jobModeForCompany;
      }

      if (!token) {
        throw new Error('Missing auth token');
      }

      if (editJobId) {
        await updateJob(token, editJobId, payload);
        router.push('/profile');
      } else {
        await createJob(token, payload);
        router.push('/profile');
      }
    } catch (e: any) {
      const msg =
        e?.data?.detail ||
        e?.message ||
        'Failed to save job. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(null);
    }
  };

  const renderJobModeForCompany = () => {
    if (!isCompany) return null;
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff' },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            What are you posting?
          </Text>
        </View>
        <View style={styles.radioRow}>
          <Pressable
            style={styles.radioItem}
            onPress={() => setJobModeForCompany('company_hiring')}
          >
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    jobModeForCompany === 'company_hiring'
                      ? colors.tint
                      : 'rgba(148,163,184,0.7)',
                },
              ]}
            >
              {jobModeForCompany === 'company_hiring' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.tint },
                  ]}
                />
              )}
            </View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioLabel, { color: colors.text }]}>
                Hiring workers for your company
              </Text>
              <Text
                style={[
                  styles.radioHelp,
                  { color: colors.text, opacity: 0.75 },
                ]}
              >
                Standard job opening (e.g. Site Engineer, Architect).
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.radioItem}
            onPress={() => setJobModeForCompany('company_project')}
          >
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    jobModeForCompany === 'company_project'
                      ? colors.tint
                      : 'rgba(148,163,184,0.7)',
                },
              ]}
            >
              {jobModeForCompany === 'company_project' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: colors.tint },
                  ]}
                />
              )}
            </View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioLabel, { color: colors.text }]}>
                Outsourcing project work
              </Text>
              <Text
                style={[
                  styles.radioHelp,
                  { color: colors.text, opacity: 0.75 },
                ]}
              >
                Subcontract or project opportunity for external crews.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  const goToStep = (next: number) => {
    if (next < 0 || next > totalSteps - 1) return;
    setStep(next);
    setError(null);
  };

  const handleNextStep = () => {
    if (step < totalSteps - 1) {
      // When moving from step 1 (basics) to step 2 (skills), auto-suggest skills
      // based on the chosen categories for better UX.
      if (step === 0 && categories.length) {
        setRequiredSkills((prev) => {
          const next = new Set(prev);
          categories.forEach((cat) => {
            const suggestions = CATEGORY_SKILL_SUGGESTIONS[cat.trim()];
            suggestions?.forEach((skill) => next.add(skill));
          });
          return Array.from(next);
        });
      }
      goToStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 0) {
      goToStep(step - 1);
    }
  };

  // Entrance animation similar to landing page (slide-up + fade-in)
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (loadingJob) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.text }}>Loading job…</Text>
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      {!isLoggedIn ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.text }}>
            You need to be logged in to create a job.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.page,
            { backgroundColor: colors.background },
          ]}
        >
          <Animated.View
            style={[
              styles.mainContent,
              {
                opacity: fade,
                transform: [{ translateY: rise }],
              },
            ]}
          >
          <View style={styles.headerRow}>
            {/* Left: title + sentence + step text */}
            <View style={styles.headerLeft}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>
                {editJobId ? 'Edit Job' : isCompany ? 'Create Job' : 'Post Work'}
              </Text>
              {!isLargeScreen && (
                <Text style={[styles.pageSubtitle, { color: colors.text }]}>
                  Describe the work you need done so the right workers can find it.
                </Text>
              )}
              <View style={styles.stepHeader}>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Step {step + 1} of {totalSteps} · {stepTitles[step]}
                </Text>
              </View>
            </View>

            {/* Right: Lottie only on large screens */}
            {isLargeScreen && (
              <View style={styles.headerLottie}>
                <LottieView
                  source={require('../../assets/images/transparentVideo/Construction.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
              </View>
            )}
          </View>

          {/* Wizard layout: centered step content */}
          <View
            style={[
              styles.wizardRow,
              isLargeScreen && styles.wizardRowRaised,
            ]}
          >
            <View style={styles.formColumn}>
            {/* Step 1: basics */}
            {step === 0 && (
              <>
                {renderJobModeForCompany()}

                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark
                        ? 'rgba(15,23,42,0.9)'
                        : '#ffffff',
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Job basics
                    </Text>
                  </View>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Job title
                  </Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="Need Licensed Electrician for Apartment Wiring"
                    placeholderTextColor="#9ca3af"
                  />

                  <Text style={[styles.label, { color: colors.text }]}>
                    Categories
                  </Text>
                  <View style={styles.chipRow}>
                    {JOB_CATEGORIES.map((cat) => {
                      const active = categories.includes(cat);
                      return (
                        <Pressable
                          key={cat}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: active
                                ? 'rgb(0, 130, 201)'
                                : isDark
                                ? '#0f172a'
                                : '#e5e7eb',
                            },
                          ]}
                          onPress={() => toggleCategory(cat)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: active ? '#ffffff' : colors.text },
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.customRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.customInput,
                        { color: colors.text },
                      ]}
                      value={customCategory}
                      onChangeText={setCustomCategory}
                      placeholder="Add another category (e.g. Tiling, Scaffolding)"
                      placeholderTextColor="#9ca3af"
                      onSubmitEditing={handleAddCustomCategory}
                    />
                    <Pressable
                      style={styles.saveButton}
                      onPress={handleAddCustomCategory}
                    >
                      <Text style={[styles.actionText, { color: '#0f172a' }]}>
                        Add
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Job type
                  </Text>
                  <View style={styles.radioRow}>
                    {JOB_TYPE_OPTIONS.map((option) => (
                      <Pressable
                        key={option.key}
                        style={styles.radioItem}
                        onPress={() => setJobType(option.key as JobType)}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            {
                              borderColor:
                                jobType === option.key
                                  ? colors.tint
                                  : 'rgba(148,163,184,0.7)',
                            },
                          ]}
                        >
                          {jobType === option.key && (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: colors.tint },
                              ]}
                            />
                          )}
                        </View>
                        <Text
                          style={[styles.radioLabel, { color: colors.text }]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Step 2: skills + description */}
            {step === 1 && (
              <>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark
                        ? 'rgba(15,23,42,0.9)'
                        : '#ffffff',
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Skills required
                    </Text>
                  </View>
                  <Text
                    style={[styles.helper, { color: colors.text, opacity: 0.8 }]}
                  >
                    Choose the main skills or trades needed for this job.
                  </Text>

                  <View style={styles.chipRow}>
                    {PREDEFINED_SKILLS.map((skill) => {
                      const active = requiredSkills.includes(skill);
                      return (
                        <Pressable
                          key={skill}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: active
                                ? 'rgb(0, 130, 201)'
                                : isDark
                                ? '#0f172a'
                                : '#e5e7eb',
                            },
                          ]}
                          onPress={() => toggleSkill(skill)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: active ? '#ffffff' : colors.text },
                            ]}
                          >
                            {skill}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.customRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.customInput,
                        { color: colors.text },
                      ]}
                      value={customSkill}
                      onChangeText={setCustomSkill}
                      placeholder="Add another skill (e.g. Scaffolding, Tiling)"
                      placeholderTextColor="#9ca3af"
                    />
                    <Pressable
                      style={styles.saveButton}
                      onPress={handleAddCustomSkill}
                    >
                      <Text style={[styles.actionText, { color: '#0f172a' }]}>
                        Add
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark
                        ? 'rgba(15,23,42,0.9)'
                        : '#ffffff',
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Job description
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.textArea, { color: colors.text }]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={5}
                    placeholder="Explain what work is needed, tools required, site conditions, safety requirements, etc."
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </>
            )}

            {/* Step 3: location + payment + contact */}
            {step === 2 && (
              <>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark
                        ? 'rgba(15,23,42,0.9)'
                        : '#ffffff',
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Location & timing
                    </Text>
                  </View>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Location
                  </Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Nairobi, Industrial Area – On-site"
                    placeholderTextColor="#9ca3af"
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Start date
                      </Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Deadline (optional)
                      </Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={deadline}
                        onChangeText={setDeadline}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark
                        ? 'rgba(15,23,42,0.9)'
                        : '#ffffff',
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Payment & contact
                    </Text>
                  </View>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Payment type
                  </Text>
                  <View style={styles.radioRow}>
                    {[
                      { key: 'fixed', label: 'Fixed Price' },
                      { key: 'hourly', label: 'Hourly Rate' },
                      { key: 'negotiable', label: 'Negotiable' },
                    ].map((option) => (
                      <Pressable
                        key={option.key}
                        style={styles.radioItem}
                        onPress={() =>
                          setPaymentType(option.key as PaymentType)
                        }
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            {
                              borderColor:
                                paymentType === option.key
                                  ? colors.tint
                                  : 'rgba(148,163,184,0.7)',
                            },
                          ]}
                        >
                          {paymentType === option.key && (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: colors.tint },
                              ]}
                            />
                          )}
                        </View>
                        <Text
                          style={[styles.radioLabel, { color: colors.text }]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {paymentType !== 'negotiable' && (
                    <View
                      style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text }]}>
                          Budget min
                        </Text>
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={budgetMin}
                          onChangeText={setBudgetMin}
                          placeholder="e.g. 10000"
                          keyboardType="numeric"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text }]}>
                          Budget max
                        </Text>
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={budgetMax}
                          onChangeText={setBudgetMax}
                          placeholder="e.g. 25000"
                          keyboardType="numeric"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </View>
                  )}

                  <View style={{ marginTop: 12 }}>
                    <Pressable
                      style={styles.checkboxRow}
                      onPress={() => setAllowDMs((prev) => !prev)}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          {
                            borderColor: allowDMs
                              ? colors.tint
                              : 'rgba(148,163,184,0.7)',
                            backgroundColor: allowDMs
                              ? colors.tint
                              : 'transparent',
                          },
                        ]}
                      />
                      <Text
                        style={[styles.checkboxLabel, { color: colors.text }]}
                      >
                        Allow direct messages
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.checkboxRow}
                      onPress={() => setAllowPhone((prev) => !prev)}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          {
                            borderColor: allowPhone
                              ? colors.tint
                              : 'rgba(148,163,184,0.7)',
                            backgroundColor: allowPhone
                              ? colors.tint
                              : 'transparent',
                          },
                        ]}
                      />
                      <Text
                        style={[styles.checkboxLabel, { color: colors.text }]}
                      >
                        Allow phone contact (if your profile has a phone
                        number)
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            {/* Step 4: review */}
            {step === 3 && (
              <>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark
                        ? 'rgba(15,23,42,0.9)'
                        : '#ffffff',
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Review your job
                    </Text>
                  </View>
                  <Text style={[styles.helper, { color: colors.text }]}>
                    Double-check the details before you publish. You can edit
                    later if needed.
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Title
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    {jobTitle || '—'}
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Categories
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    {categories.length ? categories.join(', ') : '—'}
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Location
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    {location || '—'}
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Payment
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    {paymentType === 'fixed'
                      ? 'Fixed price'
                      : paymentType === 'hourly'
                      ? 'Hourly rate'
                      : 'Negotiable'}
                    {budgetMin || budgetMax
                      ? ` · ${budgetMin || '—'} - ${budgetMax || '—'}`
                      : ''}
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Skills
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    {requiredSkills.length
                      ? requiredSkills.join(', ')
                      : '—'}
                  </Text>

                  <Text style={[styles.label, { color: colors.text }]}>
                    Description
                  </Text>
                  <Text style={{ color: colors.text, marginBottom: 8 }}>
                    {description || '—'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Navigation + publish controls (sit under cards, right-aligned) */}
          <View style={styles.actionsRow}>
            {step === 3 && error && (
              <Text style={[styles.errorText, { color: '#f97373' }]}>
                {error}
              </Text>
            )}
            <View style={styles.actionsButtons}>
              {step > 0 && (
                <Pressable
                  style={[
                    styles.secondaryButton,
                    { borderColor: colors.text },
                  ]}
                  disabled={!!submitting}
                  onPress={handlePrevStep}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.text },
                    ]}
                  >
                    Back
                  </Text>
                </Pressable>
              )}

              {step < totalSteps - 1 ? (
                <Pressable
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.tint },
                  ]}
                  disabled={!!submitting}
                  onPress={handleNextStep}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.background },
                    ]}
                  >
                    Next
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      { borderColor: colors.tint },
                    ]}
                    disabled={!!submitting}
                    onPress={() => handleSubmit('draft')}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.tint },
                      ]}
                    >
                      {submitting === 'draft' ? 'Saving…' : 'Save draft'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.tint },
                    ]}
                    disabled={!!submitting}
                    onPress={() => handleSubmit('published')}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: colors.background },
                      ]}
                    >
                      {submitting === 'published'
                        ? 'Publishing…'
                        : 'Publish job'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
          </View>

          </Animated.View>

          {/* Footer section (same as landing) */}
          <View style={styles.footerSection}>
            {width < 900 ? (
              <>
                <View style={[styles.footerColBrand, styles.footerColBrandSmall]}>
                  <RNText style={[styles.footerBrand, { color: colors.text }]}>
                    Tresten Construction Group Inc
                  </RNText>
                  <RNText
                    style={[
                      styles.footerText,
                      styles.footerTextCentered,
                      { color: colors.text },
                    ]}
                  >
                    Connecting construction companies with skilled workers who are
                    ready to build, repair and deliver on real projects.
                  </RNText>
                  <View style={styles.footerContactRow}>
                    <Text
                      style={[
                        styles.footerMeta,
                        styles.footerTextCentered,
                        { color: colors.text },
                      ]}
                    >
                      +254 (7) 9639‑7296 · info@trestenconstruction.com
                    </Text>
                  </View>
                </View>

                <View style={styles.footerColumnsRowSmall}>
                  <View style={styles.footerCol}>
                    <RNText
                      style={[
                        styles.footerColTitle,
                        styles.footerTextCentered,
                        { color: colors.text },
                      ]}
                    >
                      Quick Links
                    </RNText>
                    <Text
                      style={[
                        styles.footerLink,
                        styles.footerLinkCentered,
                        { color: colors.text },
                      ]}
                    >
                      Home
                    </Text>
                    <Text
                      style={[
                        styles.footerLink,
                        styles.footerLinkCentered,
                        { color: colors.text },
                      ]}
                    >
                      Find Jobs
                    </Text>
                    <Text
                      style={[
                        styles.footerLink,
                        styles.footerLinkCentered,
                        { color: colors.text },
                      ]}
                    >
                      Find Workers
                    </Text>
                    <Text
                      style={[
                        styles.footerLink,
                        styles.footerLinkCentered,
                        { color: colors.text },
                      ]}
                    >
                      Post Work
                    </Text>
                  </View>

                  <View style={styles.footerCol}>
                    <RNText
                      style={[
                        styles.footerColTitle,
                        styles.footerTextCentered,
                        { color: colors.text },
                      ]}
                    >
                      Support
                    </RNText>
                    <Text
                      style={[
                        styles.footerLink,
                        styles.footerLinkCentered,
                        { color: colors.text },
                      ]}
                    >
                      Help center
                    </Text>
                    <Text
                      style={[
                        styles.footerLink,
                        styles.footerLinkCentered,
                        { color: colors.text },
                      ]}
                    >
                      Safety tips
                    </Text>
                    <Text
                      style={[
                        styles.footerLink,
                        styles.footerLinkCentered,
                        { color: colors.text },
                      ]}
                    >
                      Terms & privacy
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.footerTopRow}>
                  <View style={styles.footerColBrand}>
                    <RNText
                      style={[styles.footerBrand, { color: colors.text }]}
                    >
                      Tresten Construction Group Inc
                    </RNText>
                    <RNText
                      style={[styles.footerText, { color: colors.text }]}
                    >
                      Connecting construction companies with skilled workers who are
                      ready to build, repair and deliver on real projects.
                    </RNText>
                    <View style={styles.footerContactRow}>
                      <Text
                        style={[styles.footerMeta, { color: colors.text }]}
                      >
                        +254 (7) 9639‑7296 · info@trestenconstruction.com
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footerCol}>
                    <RNText
                      style={[styles.footerColTitle, { color: colors.text }]}
                    >
                      Quick Links
                    </RNText>
                    <Text style={[styles.footerLink, { color: colors.text }]}>
                      Home
                    </Text>
                    <Text style={[styles.footerLink, { color: colors.text }]}>
                      Find Jobs
                    </Text>
                    <Text style={[styles.footerLink, { color: colors.text }]}>
                      Find Workers
                    </Text>
                    <Text style={[styles.footerLink, { color: colors.text }]}>
                      Post Work
                    </Text>
                  </View>

                  <View style={styles.footerCol}>
                    <RNText
                      style={[styles.footerColTitle, { color: colors.text }]}
                    >
                      Support
                    </RNText>
                    <Text style={[styles.footerLink, { color: colors.text }]}>
                      Help center
                    </Text>
                    <Text style={[styles.footerLink, { color: colors.text }]}>
                      Safety tips
                    </Text>
                    <Text style={[styles.footerLink, { color: colors.text }]}>
                      Terms & privacy
                    </Text>
                  </View>
                </View>

                <View style={styles.footerBottomRow}>
                  <Text
                    style={[styles.footerMeta, { color: colors.text }]}
                  >
                    © {new Date().getFullYear()} Tresten Construction Group Inc. All rights
                    reserved.
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'web' ? 120 : 24,
    paddingHorizontal: Platform.OS === 'web' ? 32 : 20,
    paddingBottom: 56,
    gap: 20,
  } as ViewStyle,
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as ViewStyle,
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 40 : 32,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Knucklehead',
  } as TextStyle,
  pageSubtitle: {
    fontSize: 16,
    opacity: 0.85,
    marginBottom: 2,
  } as TextStyle,
  mainContent: {
    gap: 8,
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  } as ViewStyle,
  headerLeft: {
    flexShrink: 0,
    paddingRight: 16,
  } as ViewStyle,
  headerCenter: {
    flex: 1,
    paddingHorizontal: 16,
  } as ViewStyle,
  headerLottie: {
    width: 260,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  lottie: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  stepHeader: {
    marginTop: 4,
    marginBottom: 4,
  } as ViewStyle,
  stepText: {
    fontSize: 13,
    opacity: 0.85,
  } as TextStyle,
  formColumn: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    gap: 20,
  } as ViewStyle,
  wizardRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
  } as ViewStyle,
  wizardRowRaised: {
    marginTop: -220,
  } as ViewStyle,
  card: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(15,23,42,0.35)' as any,
      },
    }),
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  } as ViewStyle,
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 12,
  } as TextStyle,
  helper: {
    fontSize: 13,
    marginBottom: 10,
  } as TextStyle,
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  } as TextStyle,
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'rgba(148,163,184,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 120,
    fontSize: 14,
  } as TextStyle,
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  } as ViewStyle,
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  } as ViewStyle,
  chipText: {
    fontSize: 13,
  } as TextStyle,
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  } as ViewStyle,
  customInput: {
    flex: 1,
  } as TextStyle,
  sectionActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  } as ViewStyle,
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgb(0, 130, 201)',
  } as ViewStyle,
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  radioRow: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  } as ViewStyle,
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  radioTextContainer: {
    flex: 1,
  } as ViewStyle,
  radioLabel: {
    fontSize: 14,
  } as TextStyle,
  radioHelp: {
    fontSize: 12,
    marginTop: 2,
  } as TextStyle,
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  } as ViewStyle,
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
  } as ViewStyle,
  checkboxLabel: {
    fontSize: 14,
  } as TextStyle,
  actionsRow: {
    marginTop: 16,
    marginBottom: 32,
  } as ViewStyle,
  actionsButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  } as ViewStyle,
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
  } as ViewStyle,
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
  } as ViewStyle,
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  errorText: {
    fontSize: 13,
    marginTop: 4,
  } as TextStyle,
  footerSection: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.35)',
  } as ViewStyle,
  footerTopRow: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 40,
    marginBottom: 12,
  } as ViewStyle,
  footerColBrand: {
    flex: 2,
  } as ViewStyle,
  footerColBrandSmall: {
    alignItems: 'center',
  } as ViewStyle,
  footerCol: {
    flex: 1,
  } as ViewStyle,
  footerBrand: {
    fontSize: 46,
    fontWeight: '700',
    marginBottom: 4,
    ...Platform.select({
      web: {
        fontFamily:
          'Knucklehead, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' as any,
      },
      default: {
        fontFamily: 'Knucklehead',
      },
    }),
  } as TextStyle,
  footerText: {
    fontSize: 14,
    opacity: 0.9,
  } as TextStyle,
  footerTextCentered: {
    textAlign: 'center',
  } as TextStyle,
  footerContactRow: {
    marginTop: 14,
  } as ViewStyle,
  footerColTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    ...Platform.select({
      web: {
        fontFamily:
          'Knucklehead, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' as any,
      },
      default: {
        fontFamily: 'Knucklehead',
      },
    }),
  } as TextStyle,
  footerLink: {
    fontSize: 14,
    marginBottom: 4,
  } as TextStyle,
  footerLinkCentered: {
    textAlign: 'center',
  } as TextStyle,
  footerMeta: {
    fontSize: 12,
    opacity: 0.8,
  } as TextStyle,
  footerBottomRow: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.25)',
    paddingTop: 12,
    marginTop: 8,
  } as ViewStyle,
  footerColumnsRowSmall: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  } as ViewStyle,
});

