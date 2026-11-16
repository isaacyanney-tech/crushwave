export type Gender = 'man' | 'woman' | 'nonbinary';
export type LookingFor = 'dating' | 'friendship' | 'study_partner';
export type ReportReason =
  | 'fake_profile'
  | 'harassment'
  | 'nudity'
  | 'scam'
  | 'under_18'
  | 'threats'
  | 'other';

export const GENDERS: { value: Gender; label: string; plural: string }[] = [
  { value: 'woman', label: 'Woman', plural: 'Women' },
  { value: 'man', label: 'Man', plural: 'Men' },
  { value: 'nonbinary', label: 'Non-binary', plural: 'Non-binary people' },
];

export const LOOKING_FOR: { value: LookingFor; label: string }[] = [
  { value: 'dating', label: 'Dating' },
  { value: 'friendship', label: 'New friends' },
  { value: 'study_partner', label: 'Study partner' },
];

export const LEVELS: { value: number; label: string }[] = [
  { value: 100, label: 'Level 100' },
  { value: 200, label: 'Level 200' },
  { value: 300, label: 'Level 300' },
  { value: 400, label: 'Level 400' },
  { value: 500, label: 'Postgrad' },
];

export const INTERESTS = [
  'Afrobeats', 'Amapiano', 'Hiplife', 'Gospel', 'Football', 'Basketball', 'Gym',
  'Dancing', 'Gaming', 'Movies', 'Series', 'Anime', 'Reading', 'Writing', 'Fashion',
  'Photography', 'Art', 'Cooking', 'Foodie', 'Travel', 'Beach', 'Church', 'Mosque',
  'Tech', 'Business', 'Investing', 'Volunteering', 'Debate', 'Podcasts', 'Karaoke',
];

export const PROMPTS = [
  'My go-to Osu spot is…',
  'Best lecturer story…',
  'The way to my heart is…',
  'A perfect Saturday on campus looks like…',
  'Jollof or waakye, and why…',
  'I’m looking for someone who…',
  'My hidden talent is…',
  'Two truths and a lie…',
  'After exams, you’ll find me…',
  'The song I can’t stop playing…',
];

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'fake_profile', label: 'Fake profile or not a student' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'scam', label: 'Asking for money or a scam' },
  { value: 'under_18', label: 'Might be under 18' },
  { value: 'threats', label: 'Threats or feeling unsafe' },
  { value: 'other', label: 'Something else' },
];

export const COMMUNITY_RULES = [
  { title: 'Be yourself', body: 'Use your real first name, real age and recent photos of you.' },
  { title: 'Respect a no', body: 'If someone isn’t interested, move on. No pressure, no insults.' },
  { title: 'No nudity', body: 'No sexual photos or messages, and never share anyone’s private pictures.' },
  { title: 'No money requests', body: 'Never ask for MoMo, airtime or gifts. Never send money to someone you met here.' },
  { title: 'Report anything that feels wrong', body: 'Reports are private. We review every one, and you can block anyone at any time.' },
];

export const VERIFICATION_POSES = [
  'Hold up a peace sign next to your face',
  'Give a thumbs up next to your chin',
  'Touch your nose with one finger',
  'Cover one eye with your hand',
  'Wave at the camera with your hand open',
];

// Set this to the safety contact email before launch (app stores require one).
export const SUPPORT_EMAIL = '';

export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 6;
