/**
 * Job create/edit form – shared constants and helpers.
 */

export const JOB_CATEGORIES = [
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
] as const;

export const PREDEFINED_SKILLS = [
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
] as const;

export const CATEGORY_SKILL_SUGGESTIONS: Record<string, string[]> = {
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

export type JobType = 'one_time' | 'short_project' | 'long_term';
export type PaymentType = 'fixed' | 'hourly' | 'negotiable';

export const JOB_TYPE_OPTIONS: { key: JobType; label: string }[] = [
  { key: 'one_time', label: 'One-time Task' },
  { key: 'short_project', label: 'Short Project' },
  { key: 'long_term', label: 'Long-term Engagement' },
];

export function parseDate(s: string | null | undefined): string {
  if (!s) return '';
  try {
    const d = new Date(s);
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}
