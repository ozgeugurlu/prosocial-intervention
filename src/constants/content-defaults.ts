/**
 * Fallback content used until the research team uploads the real versions to
 * Firestore (see scripts/admin/sample-content.json and docs/content-guide.md).
 *
 * RESEARCH TEAM: anything here marked [CONFIRM] describes study policy and must
 * match your IRB-approved consent form before launch. The live versions in
 * Firestore (/faq, /surveys/weekly, /appConfig/study) override these.
 */
import type { FaqItem, StudyConfig, WeeklySurveyInstrument } from '@/utils/schema';

export const DEFAULT_STUDY_CONFIG: StudyConfig = {
  studyLengthDays: 63,
  weeklySurveyOpenDays: 3,
};

/**
 * PLACEHOLDER ONLY. Replace with the study's validated prosociality measure by
 * writing it to Firestore at /surveys/weekly. These items are generic stand-ins
 * so the screen can be built and tested; they are not a validated scale.
 */
export const PLACEHOLDER_WEEKLY_SURVEY: WeeklySurveyInstrument = {
  version: 'placeholder-v0',
  instructions:
    'Think about the past seven days. How often did you do each of the following? (Placeholder items: the research team will replace these.)',
  scaleMin: 1,
  scaleMax: 5,
  minLabel: 'Never',
  maxLabel: 'Very often',
  items: [
    { id: 'p1', text: 'Helped someone with a task or errand' },
    { id: 'p2', text: 'Listened to someone who needed to talk' },
    { id: 'p3', text: 'Shared something of mine with another person' },
    { id: 'p4', text: 'Reached out to check on someone' },
    { id: 'p5', text: 'Did something kind for a stranger' },
  ],
};

export const DEFAULT_FAQ: FaqItem[] = [
  {
    id: 'what',
    order: 1,
    question: 'What happens each day?',
    answer:
      'Each morning Percy, your coach, checks in with a short chat and video. From 5 pm, your evening chat and a quick reflection open. Most days take about 10 minutes in total.',
  },
  {
    id: 'percy',
    order: 2,
    question: 'Is Percy a real person or an AI?',
    answer:
      'Neither. Percy is a scripted coach written by the research team. Percy\'s messages are pre-written, and your answers are not sent to any AI service.',
  },
  {
    id: 'goal',
    order: 3,
    question: 'How do the weekly goal and if-then plan work?',
    answer:
      'Every Sunday you set one goal for the week and an if-then plan ("If [situation], then I will [action]"). They stay on your Reminders board so you can see them all week. You can edit them at any time.',
  },
  {
    id: 'missed',
    order: 4,
    question: 'What if I miss a day?',
    answer:
      'That is okay. Just pick up with the current day. Your streak restarts, but your overall progress is kept.',
  },
  {
    id: 'reminders',
    order: 5,
    question: 'How do I change my reminder times?',
    answer: 'Go to the Me tab, then Reminder settings, and choose new morning and evening times.',
  },
  {
    id: 'privacy',
    order: 6,
    question: 'Who can see my answers? [CONFIRM]',
    answer:
      'Only the approved research team. Your responses are stored with your study ID, not your name, in a secured database the research team controls. Percy\'s scripts and your replies are never shared with an AI company or advertiser.',
  },
  {
    id: 'withdraw',
    order: 7,
    question: 'Can I stop participating? [CONFIRM]',
    answer:
      'Yes. Participation is voluntary and you can withdraw at any time. Use Contact the research team in the Me tab, and the team will explain what happens to your data under the study\'s consent form.',
  },
  {
    id: 'password',
    order: 8,
    question: 'I forgot my password.',
    answer:
      'Because we never collect your email, the app cannot send a reset link. Contact the research team and they will reset it for you.',
  },
];
