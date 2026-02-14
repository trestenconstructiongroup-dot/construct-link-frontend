/**
 * Landing page constants – kept at module scope to avoid redefining on every render.
 */

export const CONSTRUCTION_CATEGORIES = [
  'Plumbing',
  'Architect',
  'Electrician',
  'Carpenter',
  'Masonry',
  'Roofing',
  'HVAC',
  'Concrete',
] as const;

export const FAQ_ITEMS = [
  {
    question: 'How do I find reliable workers for my project?',
    answer:
      'Create a job post with your location, trade and timeline, then use our filters to shortlist workers by experience, rating and recent activity before messaging them directly.',
  },
  {
    question: 'Can workers and companies both use Tresten Construction Group Inc?',
    answer:
      'Yes. Workers can build profiles and apply to jobs, while companies can post openings, manage applicants and build shortlists of trusted crews.',
  },
  {
    question: 'Is there a cost to get started?',
    answer:
      'Creating an account and browsing opportunities is free. We only charge when you choose premium features like boosted listings or highlighted profiles.',
  },
  {
    question: 'How do I know if a worker is available?',
    answer:
      'Each profile shows current availability and preferred start dates. You can also send a quick message or invite to confirm timings before you book.',
  },
  {
    question: 'Can I manage multiple projects in one place?',
    answer:
      'Yes. Your dashboard lets you post and track multiple projects, manage conversations and keep notes on workers you have already hired.',
  },
  {
    question: 'What happens after I post a job?',
    answer:
      'Workers that match your requirements get notified and can apply. You review applications, chat with candidates and choose who to hire—all from your dashboard.',
  },
] as const;

export type FaqItemEntry = (typeof FAQ_ITEMS)[number];

export const HOW_IT_WORKS_STEPS = [
  {
    icon: 'briefcase-outline',
    title: 'Post a Job',
    description:
      'Describe the work, set your budget, and choose the trades you need.',
  },
  {
    icon: 'people-outline',
    title: 'Get Matched',
    description:
      'Workers that fit your requirements get notified and apply directly.',
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Hire & Build',
    description:
      'Review profiles, chat with candidates, and start building.',
  },
] as const;

/* ── Page Loader ── */
export const LOADER_WORDS = [
  'Building',
  'Connecting',
  'Creating',
  'Hiring',
  'Construct Link',
] as const;

/* ── Stats Counter ── */
export const STATS = [
  { label: 'Active Workers', value: 500, suffix: '+' },
  { label: 'Companies', value: 200, suffix: '+' },
  { label: 'Jobs Posted', value: 1000, suffix: '+' },
  { label: 'Trades Covered', value: 50, suffix: '+' },
] as const;

/* ── Testimonials ── */
export const TESTIMONIALS = [
  {
    quote:
      'Construct Link helped us fill three electrician positions in under a week. The quality of applicants was outstanding.',
    name: 'David Kamau',
    role: 'Site Manager, Apex Builders',
  },
  {
    quote:
      'As a freelance plumber, I used to spend days hunting for work. Now I get matched to jobs that fit my schedule and skills.',
    name: 'Sarah Njeri',
    role: 'Licensed Plumber',
  },
  {
    quote:
      'The platform is straightforward — post a job, review profiles, hire. No middlemen, no delays.',
    name: 'James Ochieng',
    role: 'Project Director, KenBuild Ltd',
  },
  {
    quote:
      'I moved from word-of-mouth referrals to a proper pipeline of vetted workers. Game changer for our roofing division.',
    name: 'Amina Wanjiku',
    role: 'Operations Lead, Summit Roofing',
  },
] as const;
