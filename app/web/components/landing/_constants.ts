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
    question: 'Can workers and companies both use ConstructionLink?',
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
