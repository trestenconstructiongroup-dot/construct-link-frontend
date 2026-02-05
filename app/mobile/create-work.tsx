import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/theme';
import { Text } from '../../components/Text';
import {
  createJob,
  JobMode,
  JobStatus,
} from '../../services/api';

const JOB_CATEGORIES = [
  'Mason',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Roofer',
  'General Contractor',
  'Interior Decor',
  'Engineer',
  'Architect',
];

const PREDEFINED_SKILLS = [
  'Bricklaying',
  'Concrete finishing',
  'Wiring',
  'Conduit bending',
  'Panel installation',
  'Piping',
  'Leak detection',
  'Framing',
  'Finishing carpentry',
  'Wall painting',
  'Surface preparation',
  'Roof installation',
  'Waterproofing',
  'Site supervision',
  'Project management',
  'Interior design',
  'Structural design',
  'Design drafting',
  'Plan interpretation',
  'Health & Safety',
];

const CATEGORY_SKILL_SUGGESTIONS: Record<string, string[]> = {
  Mason: ['Bricklaying', 'Concrete finishing'],
  Electrician: ['Wiring', 'Conduit bending', 'Panel installation'],
  Plumber: ['Piping', 'Leak detection'],
  Carpenter: ['Framing', 'Finishing carpentry'],
  Painter: ['Wall painting', 'Surface preparation'],
  Roofer: ['Roof installation', 'Waterproofing'],
  'General Contractor': ['Site supervision', 'Project management'],
  'Interior Decor': ['Interior design', 'Finishing carpentry'],
  Engineer: ['Structural design', 'Site supervision'],
  Architect: ['Design drafting', 'Plan interpretation'],
};

type JobType = 'one_time' | 'short_project' | 'long_term';
type PaymentType = 'fixed' | 'hourly' | 'negotiable';

export default function CreateWorkPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user, token } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const isCompany = !!user?.is_company;

  const [jobModeForCompany, setJobModeForCompany] = useState<JobMode>('company_hiring');

  const [step, setStep] = useState(0);
  const totalSteps = 3;

  const [jobTitle, setJobTitle] = useState('');
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

  const validateForPublish = () => {
    if (!jobTitle.trim()) return 'Job title is required.';
    if (!categories.length) return 'At least one category is required.';
    if (!location.trim()) return 'Location is required.';
    if (!description.trim()) return 'Please add a short job description.';
    if (!paymentType) return 'Payment type is required.';
    return null;
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    setCategories(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomCategory('');
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill],
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (!requiredSkills.includes(trimmed)) {
      setRequiredSkills(prev => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const goToStep = (next: number) => {
    if (next < 0 || next > totalSteps - 1) return;
    setStep(next);
    setError(null);
  };

  const handleNextStep = () => {
    if (step < totalSteps - 1) {
      // When moving from basics to skills, prefill skills from categories
      if (step === 0 && categories.length) {
        setRequiredSkills(prev => {
          const next = new Set(prev);
          categories.forEach(cat => {
            const suggestions = CATEGORY_SKILL_SUGGESTIONS[cat.trim()];
            suggestions?.forEach(skill => next.add(skill));
          });
          return Array.from(next);
        });
      }
      goToStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 0) goToStep(step - 1);
  };

  const handleSubmit = async (status: JobStatus) => {
    try {
      if (!token) {
        Alert.alert('Not signed in', 'You need to be logged in to post work.');
        return;
      }

      setSubmitting(status);
      setError(null);

      if (status === 'published') {
        const validationError = validateForPublish();
        if (validationError) {
          setError(validationError);
          setSubmitting(null);
          Alert.alert('Missing details', validationError);
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
        payload.role_requirements = categories.map(cat => ({
          skill_category: cat,
          quantity_required: 1,
        }));
      }

      if (isCompany) {
        payload.job_mode = jobModeForCompany;
      }

      const created = await createJob(token, payload);

      // Simple success feedback
      Alert.alert(
        status === 'published' ? 'Job published' : 'Draft saved',
        `“${created.job_title}” has been saved.`,
      );

      router.push('/profile');
    } catch (e: any) {
      const msg =
        e?.data?.detail ||
        e?.message ||
        'Failed to save job. Please try again.';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>
        {isCompany ? 'Create Job' : 'Post Work'}
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.text }]}>
        Step {step + 1} of {totalSteps}
      </Text>

      {/* Step 1: basics */}
      {step === 0 && (
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff' },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Basic information
          </Text>
          {isCompany && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                What are you posting?
              </Text>
              <View style={styles.row}>
                {[
                  { key: 'company_hiring', label: 'Hiring workers' },
                  { key: 'company_project', label: 'Project / subcontract' },
                ].map(option => {
                  const active = jobModeForCompany === option.key;
                  return (
                    <Pressable
                      key={option.key}
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
                      onPress={() =>
                        setJobModeForCompany(option.key as JobMode)
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? '#ffffff' : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Job title</Text>
          <TextInput
            style={[styles.input, styles.inputSingleLine, { color: colors.text }]}
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder="e.g. Electrician for wiring"
            placeholderTextColor="#9ca3af"
            numberOfLines={1}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Categories
          </Text>
          <View style={styles.chipRow}>
            {JOB_CATEGORIES.map(cat => {
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
              style={[styles.input, styles.customInput, styles.inputSingleLine, { color: colors.text }]}
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Other (e.g. Tiling)"
              placeholderTextColor="#9ca3af"
              numberOfLines={1}
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

          <Text style={[styles.label, { color: colors.text }]}>Job type</Text>
          <View style={styles.radioColumn}>
            {[
              { key: 'one_time', label: 'One-time Task' },
              { key: 'short_project', label: 'Short Project' },
              { key: 'long_term', label: 'Long-term Engagement' },
            ].map(option => (
              <Pressable
                key={option.key}
                style={styles.radioRowItem}
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
                <Text style={[styles.radioLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Step 2: skills + description */}
      {step === 1 && (
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff' },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Skills & description
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Skills required
          </Text>
          <Text style={[styles.helper, { color: colors.text, opacity: 0.8 }]}>
            Choose the main skills or trades needed for this job.
          </Text>

          <View style={styles.chipRow}>
            {PREDEFINED_SKILLS.map(skill => {
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
              style={[styles.input, styles.customInput, styles.inputSingleLine, { color: colors.text }]}
              value={customSkill}
              onChangeText={setCustomSkill}
              placeholder="Other (e.g. Scaffolding)"
              placeholderTextColor="#9ca3af"
              numberOfLines={1}
              onSubmitEditing={handleAddCustomSkill}
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

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Job description
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe work and what you expect."
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>
      )}

      {/* Step 3: location & payment */}
      {step === 2 && (
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff' },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Location & payment
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <TextInput
            style={[styles.input, styles.inputSingleLine, { color: colors.text }]}
            value={location}
            onChangeText={setLocation}
            placeholder="City or site"
            placeholderTextColor="#9ca3af"
            numberOfLines={1}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Start date (optional)
          </Text>
          <TextInput
            style={[styles.input, styles.inputSingleLine, { color: colors.text }]}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            numberOfLines={1}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Deadline (optional)
          </Text>
          <TextInput
            style={[styles.input, styles.inputSingleLine, { color: colors.text }]}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            numberOfLines={1}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Payment type
          </Text>
          <View style={styles.radioColumn}>
            {[
              { key: 'fixed', label: 'Fixed price' },
              { key: 'hourly', label: 'Hourly rate' },
              { key: 'negotiable', label: 'Negotiable' },
            ].map(option => (
              <Pressable
                key={option.key}
                style={styles.radioRowItem}
                onPress={() => setPaymentType(option.key as PaymentType)}
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
                <Text style={[styles.radioLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {(paymentType === 'fixed' || paymentType === 'hourly') && (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Budget min
                </Text>
                <TextInput
                  style={[styles.input, styles.inputSingleLine, { color: colors.text }]}
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  placeholder="Min (e.g. 10000)"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                  numberOfLines={1}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Budget max
                </Text>
                <TextInput
                  style={[styles.input, styles.inputSingleLine, { color: colors.text }]}
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  placeholder="Max (e.g. 25000)"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                  numberOfLines={1}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Error + navigation buttons */}
      {error && (
        <Text style={[styles.errorText, { color: '#f97373' }]}>{error}</Text>
      )}

      <View style={styles.actionsRow}>
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
                {submitting === 'published' ? 'Publishing…' : 'Publish job'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'web' ? 120 : 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Knucklehead',
  },
  stepSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.85,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(15,23,42,0.35)' as any,
      },
      default: {
        borderWidth: 0,
      },
    }),
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 6,
  },
  helper: {
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  inputSingleLine: {
    maxHeight: 44,
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
    fontSize: 14,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  radioColumn: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  radioRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgb(0, 130, 201)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
});
