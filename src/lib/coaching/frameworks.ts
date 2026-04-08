/**
 * HabitOS Phase 3 — Wizard Frameworks
 *
 * Pure data definitions for the three coaching wizards. The UI layer (owned
 * by the builder role in parallel) consumes this module; this file must stay
 * free of React / DOM imports so it is safe to import on both the server and
 * the client.
 *
 * Research citations are baked into every helpText so the wizard feels
 * educational rather than a form. See RESEARCH-FOUNDATION.md for the full
 * evidence base.
 */

export type FrameworkSlug = 'GROW' | 'WOOP' | 'IDENTITY'

export type WizardInputType =
  | 'text'
  | 'longtext'
  | 'select'
  | 'multiselect'
  | 'scale'

export interface WizardStepOption {
  value: string
  label: string
}

export interface WizardStep {
  /** Stable id used as the Record<string, unknown> key in wizard answers. */
  id: string
  framework: FrameworkSlug
  order: number
  /** User-facing title of the question. */
  title: string
  /** Optional subtitle giving the research rationale in one sentence. */
  subtitle?: string
  inputType: WizardInputType
  required: boolean
  placeholder?: string
  /** Research-backed hint shown beneath the input. */
  helpText?: string
  /** Options for select / multiselect. */
  options?: WizardStepOption[]
  /** Minimum words for longtext prompts (e.g. identity needs ≥20 words). */
  minWords?: number
  /** Maximum words for longtext prompts. */
  maxWords?: number
}

export interface FrameworkDefinition {
  slug: FrameworkSlug
  name: string
  description: string
  /** e.g. "Whitmore (1992), adapted by ICF coaching standard" */
  researchCitation: string
  /** Habit categories this framework is best-suited for. */
  recommendedFor: string[]
  /** Rough minutes-to-complete estimate shown to the user before they begin. */
  estimatedMinutes: number
  steps: WizardStep[]
}

// ---------------------------------------------------------------------------
// Shared option lists
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: WizardStepOption[] = [
  { value: 'health', label: 'Health & Fitness' },
  { value: 'career', label: 'Career & Work' },
  { value: 'finance', label: 'Finance & Money' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'growth', label: 'Personal Growth' },
  { value: 'mindset', label: 'Mindset & Mental Health' },
  { value: 'creativity', label: 'Creativity & Craft' },
]

// ---------------------------------------------------------------------------
// GROW — Goal, Reality, Options, Will  (Whitmore 1992 / ICF standard)
// ---------------------------------------------------------------------------

const GROW_STEPS: WizardStep[] = [
  {
    id: 'grow_category',
    framework: 'GROW',
    order: 1,
    title: 'Which area of life are we coaching?',
    subtitle: 'Scoping the life domain lets your coach reference relevant research.',
    inputType: 'select',
    required: true,
    options: CATEGORY_OPTIONS,
    helpText:
      'Pick one domain — research shows narrow, well-defined goals out-perform vague ambitions (Locke & Latham, 2002).',
  },
  {
    id: 'grow_goal',
    framework: 'GROW',
    order: 2,
    title: 'What do you want to achieve?',
    subtitle: 'GROW starts with the G: a specific, owned goal.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. Run a 10K without stopping by September',
    helpText:
      'State it in your own words, present-tense, under 200 characters. Whitmore (1992) argues the Goal must feel yours — not inherited.',
  },
  {
    id: 'grow_success_metric',
    framework: 'GROW',
    order: 3,
    title: 'How will you measure success?',
    subtitle:
      'GROW requires a concrete end-state so you can tell the difference between progress and drift.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. Sub-60-minute 10K on a measured loop',
    helpText:
      'A measurable metric converts a wish into a goal (Locke & Latham, 2002, goal-setting theory).',
  },
  {
    id: 'grow_reality',
    framework: 'GROW',
    order: 4,
    title: 'Where are you right now?',
    subtitle: 'R is for Reality — an honest baseline.',
    inputType: 'longtext',
    required: true,
    placeholder: 'Current fitness level, time available, energy, recent attempts...',
    minWords: 20,
    helpText:
      'Be specific about your starting line. Whitmore (1992): coaching cannot help without an accurate Reality check.',
  },
  {
    id: 'grow_blockers',
    framework: 'GROW',
    order: 5,
    title: 'What has blocked you so far?',
    subtitle: 'Name the obstacles you already know about.',
    inputType: 'multiselect',
    required: true,
    options: [
      { value: 'time', label: 'Not enough time' },
      { value: 'energy', label: 'Low energy' },
      { value: 'motivation', label: 'Motivation fades' },
      { value: 'knowledge', label: 'Not sure how' },
      { value: 'environment', label: 'Environment / setup' },
      { value: 'social', label: 'Social pressure or lack of support' },
      { value: 'money', label: 'Cost' },
      { value: 'fear', label: 'Fear or self-doubt' },
    ],
    helpText:
      'Pick up to 3. Naming obstacles up-front enables implementation intentions later (Gollwitzer & Sheeran, 2006).',
  },
  {
    id: 'grow_options',
    framework: 'GROW',
    order: 6,
    title: 'What options do you have?',
    subtitle: 'O is for Options — brainstorm possible paths before committing.',
    inputType: 'longtext',
    required: true,
    placeholder:
      'List 2-5 different approaches you could try. One per line.',
    minWords: 15,
    helpText:
      'Whitmore (1992) insists on generating Options BEFORE choosing one. More paths = more agency = more intrinsic motivation (Deci & Ryan, 2000).',
  },
  {
    id: 'grow_first_action',
    framework: 'GROW',
    order: 7,
    title: 'What is your first action this week?',
    subtitle: 'W is for Will — the smallest committed step.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. Lay out running shoes by the door tonight',
    helpText:
      'Keep it ≤ 2 minutes. Fogg (2019): tiny behaviours beat heroic willpower because they bypass the motivation bottleneck.',
  },
]

// ---------------------------------------------------------------------------
// WOOP — Wish, Outcome, Obstacle, Plan (Oettingen 2014, mental contrasting)
// ---------------------------------------------------------------------------

const WOOP_STEPS: WizardStep[] = [
  {
    id: 'woop_wish',
    framework: 'WOOP',
    order: 1,
    title: 'What is your wish?',
    subtitle:
      'State one meaningful, challenging-but-feasible wish for the coming weeks.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. Sleep 7 hours every night',
    helpText:
      'Oettingen (2014): mental contrasting only works when the wish is both important AND feels attainable. Under 200 characters.',
  },
  {
    id: 'woop_outcome',
    framework: 'WOOP',
    order: 2,
    title: 'What is the best possible outcome if you succeed?',
    subtitle: 'Imagine it vividly — the felt sense, not just the facts.',
    inputType: 'longtext',
    required: true,
    placeholder:
      'Close your eyes. What does Monday morning feel like one month in?',
    minWords: 25,
    helpText:
      'Oettingen calls this "positive elaboration". The brain needs to taste the reward before the contrasting step (Oettingen, 2014).',
  },
  {
    id: 'woop_obstacle',
    framework: 'WOOP',
    order: 3,
    title: 'What is the main inner obstacle in your way?',
    subtitle:
      'Not the calendar or other people — the feeling, habit, or belief inside you.',
    inputType: 'longtext',
    required: true,
    placeholder:
      'e.g. "I scroll my phone in bed because it feels like the only time that belongs to me."',
    minWords: 15,
    helpText:
      'WOOP is specifically about the INNER obstacle. External blockers are worked around; inner obstacles need if-then plans (Oettingen & Gollwitzer, 2010).',
  },
  {
    id: 'woop_if',
    framework: 'WOOP',
    order: 4,
    title: 'IF the obstacle shows up, what is the cue?',
    subtitle:
      'Describe the exact trigger — a time, place, feeling, or preceding action.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. When I get into bed and pick up my phone',
    helpText:
      'Concrete cues beat vague ones. Wood & Neal (2007): habits are triggered by specific contextual features, not by intentions.',
  },
  {
    id: 'woop_then',
    framework: 'WOOP',
    order: 5,
    title: 'THEN what will you do instead?',
    subtitle:
      'This completes your if-then plan — the P in WOOP.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. I will put the phone in the next room and open my book',
    helpText:
      'Gollwitzer & Sheeran (2006): implementation intentions deliver d = 0.65 on goal attainment. One primary if-then is enough to start.',
  },
  {
    id: 'woop_backups',
    framework: 'WOOP',
    order: 6,
    title: 'Want to add 1-2 backup if-then plans?',
    subtitle: 'Optional: additional triggers covering edge cases.',
    inputType: 'longtext',
    required: false,
    placeholder:
      'e.g. "If I am travelling, then I leave my phone charging in the hotel bathroom."',
    helpText:
      'Optional but powerful — layered if-then plans increase robustness across contexts (Gollwitzer, 1999).',
  },
]

// ---------------------------------------------------------------------------
// IDENTITY — Clear (2018), Fogg (2019), Wood & Neal (2007)
// ---------------------------------------------------------------------------

const IDENTITY_STEPS: WizardStep[] = [
  {
    id: 'identity_core_values',
    framework: 'IDENTITY',
    order: 1,
    title: 'Which 3 values matter most to you right now?',
    subtitle:
      'Identity-based habits stick when they connect to deeply held values.',
    inputType: 'multiselect',
    required: true,
    options: [
      { value: 'health', label: 'Health & vitality' },
      { value: 'family', label: 'Family' },
      { value: 'craft', label: 'Craft & mastery' },
      { value: 'freedom', label: 'Freedom & autonomy' },
      { value: 'service', label: 'Service to others' },
      { value: 'growth', label: 'Growth & learning' },
      { value: 'adventure', label: 'Adventure' },
      { value: 'integrity', label: 'Integrity' },
      { value: 'creativity', label: 'Creativity' },
      { value: 'wealth', label: 'Wealth / security' },
      { value: 'connection', label: 'Connection' },
      { value: 'peace', label: 'Peace & presence' },
    ],
    helpText:
      'Pick 3. Verplanken & Sui (2019): habits aligned with self-identity produce cognitive self-integration and sustain without external rewards.',
  },
  {
    id: 'identity_ideal_self',
    framework: 'IDENTITY',
    order: 2,
    title: 'Write your ideal-self statement.',
    subtitle: 'One sentence in the present tense. "I am the kind of person who…"',
    inputType: 'longtext',
    required: true,
    placeholder:
      'e.g. I am the kind of person who moves my body every day because it is an act of self-respect.',
    minWords: 20,
    maxWords: 60,
    helpText:
      'Clear (2018): "Every action is a vote for the person you wish to become." Your identity statement is the ballot.',
  },
  {
    id: 'identity_votes',
    framework: 'IDENTITY',
    order: 3,
    title: 'Name 3 tiny identity votes you can cast this week.',
    subtitle:
      'Each vote should take under 2 minutes and feel undeniably YOU.',
    inputType: 'longtext',
    required: true,
    placeholder:
      '1) Put on running shoes after breakfast\n2) Drink a glass of water before coffee\n3) Write one sentence in my journal at night',
    minWords: 15,
    helpText:
      'Fogg (2019) tiny habits + Clear (2018) identity voting. Small, frequent wins reinforce the identity circuit faster than rare large wins.',
  },
  {
    id: 'identity_social_proof',
    framework: 'IDENTITY',
    order: 4,
    title: 'Whose tribe would someone with this identity belong to?',
    subtitle:
      'Name a group, community, or role-model cluster you want to feel part of.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. Early-morning runners in my neighbourhood',
    helpText:
      'Clear (2018): "The most effective way to change your habits is to join a culture where the desired behaviour is the normal behaviour."',
  },
  {
    id: 'identity_environment',
    framework: 'IDENTITY',
    order: 5,
    title: 'Design your environment: what 1 thing will you add and 1 thing will you remove?',
    subtitle:
      'Make the identity vote obvious; make the anti-identity vote invisible.',
    inputType: 'longtext',
    required: true,
    placeholder:
      'ADD: running shoes visible by the front door\nREMOVE: phone charger from bedside table',
    minWords: 10,
    helpText:
      'Wood & Neal (2007): habits are context-driven. Environment design reshapes the contextual cues basal ganglia respond to — much cheaper than willpower.',
  },
  {
    id: 'identity_first_vote',
    framework: 'IDENTITY',
    order: 6,
    title: 'Which identity vote will you cast today?',
    subtitle: 'One action. Under 2 minutes. Today.',
    inputType: 'text',
    required: true,
    placeholder: 'e.g. Put my running shoes by the door before bed',
    helpText:
      'Fogg (2019): the best habit is the one you can start in the next 24 hours. Celebrate the vote out loud — dopamine rewards the identity, not just the action.',
  },
]

// ---------------------------------------------------------------------------
// Exported framework map
// ---------------------------------------------------------------------------

export const FRAMEWORKS: Record<FrameworkSlug, FrameworkDefinition> = {
  GROW: {
    slug: 'GROW',
    name: 'GROW',
    description:
      'A 4-stage coaching model — Goal, Reality, Options, Will — for clear goal-setting and committed action.',
    researchCitation: 'Whitmore (1992), adopted as the ICF coaching standard.',
    recommendedFor: ['career', 'finance', 'growth', 'creativity'],
    estimatedMinutes: 8,
    steps: GROW_STEPS,
  },
  WOOP: {
    slug: 'WOOP',
    name: 'WOOP',
    description:
      'Wish, Outcome, Obstacle, Plan — mental contrasting with implementation intentions for habit change under pressure.',
    researchCitation:
      'Oettingen (2014) mental contrasting + Gollwitzer & Sheeran (2006) implementation intentions meta-analysis (d=0.65).',
    recommendedFor: ['health', 'mindset', 'relationships'],
    estimatedMinutes: 6,
    steps: WOOP_STEPS,
  },
  IDENTITY: {
    slug: 'IDENTITY',
    name: 'Identity-Based Habits',
    description:
      'Vote for the person you want to become with tiny, value-aligned behaviours and environment design.',
    researchCitation:
      'Clear (2018) Atomic Habits + Fogg (2019) Tiny Habits + Wood & Neal (2007) context-dependent automaticity + Verplanken & Sui (2019) identity integration.',
    recommendedFor: ['growth', 'mindset', 'creativity', 'health'],
    estimatedMinutes: 7,
    steps: IDENTITY_STEPS,
  },
}

/** Returns steps in order for a given framework. */
export function getFrameworkSteps(slug: FrameworkSlug): WizardStep[] {
  return [...FRAMEWORKS[slug].steps].sort((a, b) => a.order - b.order)
}

/** Safe lookup returning null for unknown slugs (e.g. from untrusted input). */
export function getFramework(slug: string): FrameworkDefinition | null {
  if (slug === 'GROW' || slug === 'WOOP' || slug === 'IDENTITY') {
    return FRAMEWORKS[slug]
  }
  return null
}
