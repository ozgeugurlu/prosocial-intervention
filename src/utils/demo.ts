/**
 * Demo / preview mode (EXPO_PUBLIC_DEMO=1).
 *
 * Runs the whole app with sample data held in memory, without Firebase, so the
 * design and flow can be reviewed in a browser. Nothing is saved or sent anywhere;
 * reloading the page starts over. Never enable this for a real participant build.
 *
 * Two personas:
 *  - "Sign in" with any study ID  -> a participant on Day 11 (week 2) with history.
 *  - "Create account"             -> a brand-new participant (onboarding, tour, countdown).
 */
import sample from '../../scripts/admin/sample-content.json';
import type {
  ChatEvent,
  DailySurveyRecord,
  ParticipantProfile,
  SupportMessage,
  TeamFeedback,
  WeeklyGoal,
  WeeklySurveyRecord,
} from './participant-data';
import type { FlashcardWeek, MediaItem, Script, ScriptSegment } from './schema';
import { storage, type DailyProgress } from './storage';

export const DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n: number) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
};

interface Store {
  profile: ParticipantProfile;
  days: Record<number, DailyProgress>;
  daily: DailySurveyRecord[];
  weekly: WeeklySurveyRecord[];
  goals: WeeklyGoal[];
  chats: Record<string, { events: ChatEvent[]; completed: boolean }>;
  unlocks: Set<string>;
  support: SupportMessage[];
  feedback: TeamFeedback[];
}

const stores: Record<string, Store> = {};
const listeners: Record<string, ((m: SupportMessage[]) => void)[]> = {};

function freshStore(studyId: string): Store {
  return {
    profile: { studyId, startDate: null, onboarded: false, tutorialCompleted: false, reminders: null, timezone: null },
    days: {},
    daily: [],
    weekly: [],
    goals: [],
    chats: {},
    unlocks: new Set(),
    support: [],
    feedback: [],
  };
}

/** A participant 10 days into the program (today is Day 11). */
function seasonedStore(studyId: string): Store {
  const s = freshStore(studyId);
  const today = daysAgo(0);
  const start = daysAgo(10);
  s.profile = {
    studyId,
    startDate: start.toISOString(),
    onboarded: true,
    tutorialCompleted: true,
    reminders: { morning: '08:30', evening: '20:00' },
    timezone: 'America/New_York',
  };
  // Mostly complete history with a couple of partial days and one missed day.
  const pattern = ['full', 'full', 'partial', 'full', 'missed', 'full', 'full', 'full', 'partial', 'full'];
  pattern.forEach((p, i) => {
    const day = i + 1;
    if (p === 'missed') return;
    s.days[day] = {
      'morning chat': true,
      'morning video': p === 'full',
      'night chat': p === 'full',
      'night survey': p === 'full',
    };
    if (p === 'full') {
      const base = 3 + ((day * 7) % 10) / 10;
      s.daily.push({ day, adherence: day % 4 === 0 ? 'no' : 'yes', ratings: [], average: Math.round(base * 100) / 100 });
    }
  });
  s.days[11] = { 'morning chat': true, 'morning video': true, 'night chat': false, 'night survey': false };

  const weekOf = (d: Date) => key(new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()));
  s.weekly = [{ weekOf: weekOf(daysAgo(3)), week: 1, responses: {}, score: 3.4, instrumentVersion: 'demo' }];
  s.goals = [
    {
      weekOf: weekOf(today),
      goal: 'Reach out to a friend I have not talked to in a while',
      ifThen: { if: 'I finish lunch on Wednesday', then: 'I will text Sam to ask how they are doing' },
    },
    {
      weekOf: weekOf(daysAgo(7)),
      goal: 'Offer help to a coworker without being asked',
      ifThen: { if: 'I see someone carrying a lot', then: 'I will offer a hand' },
    },
  ];
  s.chats['d11-morning'] = {
    completed: true,
    events: [
      { kind: 'choice', segment: 1, value: 'Pretty good', at: today.toISOString() },
      { kind: 'text', segment: 3, value: 'Bring coffee to my lab mate', at: today.toISOString() },
      { kind: 'completed', at: today.toISOString() },
    ],
  };
  s.unlocks = new Set(['why-kindness-matters', 'evening-wind-down']);
  s.support = [
    { id: 's1', from: 'participant', text: 'Hi! Can I change my evening reminder to 9 pm?', createdAt: daysAgo(4) },
    { id: 's2', from: 'team', text: 'Of course! Go to Me, then Reminder settings, and set the evening time.', createdAt: daysAgo(4) },
  ];
  s.feedback = [
    { week: 1, message: 'You checked in almost every day in your first week. Lovely start, keep it going!', createdAt: daysAgo(3) },
  ];
  return s;
}

let current: string | null = null;
const store = (uid: string) => (stores[uid] ??= freshStore('P-DEMO'));

// ─── Auth ────────────────────────────────────────────────────────────────────

export function demoSignIn(studyId: string, isNew: boolean) {
  const uid = `demo-${isNew ? 'new' : 'returning'}`;
  stores[uid] = isNew ? freshStore(studyId) : stores[uid] ?? seasonedStore(studyId);
  current = uid;
  // The returning persona already chose a nickname during onboarding.
  if (!isNew) storage.setItem('@percy_username', 'Alex');
  return { uid, email: `${studyId.toLowerCase()}@peach-study.invalid` };
}
export const demoCurrentUid = () => current;
export function demoSignOut() {
  current = null;
}

// ─── Participant data ───────────────────────────────────────────────────────

export const demoData = {
  getProfile: async (uid: string) => ({ ...store(uid).profile }),
  updateProfile: async (uid: string, patch: Partial<ParticipantProfile>) => {
    Object.assign(store(uid).profile, patch);
  },
  saveDayTask: async (uid: string, day: number, task: keyof DailyProgress, done: boolean) => {
    const s = store(uid);
    s.days[day] = {
      ...(s.days[day] ?? { 'morning chat': false, 'morning video': false, 'night chat': false, 'night survey': false }),
      [task]: done,
    };
  },
  getAllDays: async (uid: string) => ({ ...store(uid).days }),
  saveDailySurvey: async (uid: string, r: DailySurveyRecord) => {
    store(uid).daily.push(r);
  },
  getDailySurveys: async (uid: string) => [...store(uid).daily],
  saveWeeklySurvey: async (uid: string, r: WeeklySurveyRecord) => {
    store(uid).weekly.push({ ...r, submittedAt: new Date() });
  },
  getWeeklySurveys: async (uid: string) => [...store(uid).weekly],
  saveGoal: async (uid: string, g: WeeklyGoal) => {
    const s = store(uid);
    s.goals = [{ ...g, updatedAt: new Date() }, ...s.goals.filter((x) => x.weekOf !== g.weekOf)];
  },
  getGoals: async (uid: string) => [...store(uid).goals].sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1)),
  saveChatLog: async (uid: string, id: string, d: { events: ChatEvent[]; completed: boolean }) => {
    store(uid).chats[id] = { events: d.events, completed: d.completed };
  },
  getChatLog: async (uid: string, id: string) => store(uid).chats[id] ?? null,
  unlockMedia: async (uid: string, mediaId: string) => {
    store(uid).unlocks.add(mediaId);
  },
  getUnlockedMediaIds: async (uid: string) => new Set(store(uid).unlocks),
  watchSupport: (uid: string, cb: (m: SupportMessage[]) => void) => {
    (listeners[uid] ??= []).push(cb);
    cb([...store(uid).support]);
    return () => {
      listeners[uid] = (listeners[uid] ?? []).filter((x) => x !== cb);
    };
  },
  sendSupport: async (uid: string, text: string) => {
    const s = store(uid);
    const emit = () => (listeners[uid] ?? []).forEach((cb) => cb([...s.support]));
    s.support.push({ id: `p${Date.now()}`, from: 'participant', text, createdAt: new Date() });
    emit();
    setTimeout(() => {
      s.support.push({
        id: `t${Date.now()}`,
        from: 'team',
        text: '(Preview) In the real app, the research team replies here.',
        createdAt: new Date(),
      });
      emit();
    }, 1500);
  },
  getTeamFeedback: async (uid: string) => [...store(uid).feedback],
};

// ─── Study content ──────────────────────────────────────────────────────────

type SampleScript = { name: string; studyDay: number; slot: 'morning' | 'evening'; segments: Omit<ScriptSegment, 'order'>[] };
const sampleScripts = sample.scripts as unknown as Record<string, SampleScript>;

export const demoContent = {
  /** The preview reuses the Day 1 example scripts for every day. */
  getSessionScript: async (_day: number, slot: 'morning' | 'evening'): Promise<(Script & { id: string }) | null> => {
    const id = `day01-${slot}`;
    const s = sampleScripts[id];
    if (!s) return null;
    return {
      id,
      name: s.name,
      studyDay: s.studyDay,
      slot: s.slot,
      createdAt: new Date(),
      updatedAt: new Date(),
      segments: s.segments.map((seg, i) => ({ ...seg, order: i }) as ScriptSegment),
    };
  },
  getMediaItems: async (): Promise<MediaItem[]> =>
    Object.entries(sample.media).map(([id, m]) => ({ ...(m as Omit<MediaItem, 'id'>), id, youtubeId: undefined, url: 'demo' })),
  getMediaItem: async (id: string): Promise<MediaItem | null> => {
    const m = (sample.media as Record<string, Omit<MediaItem, 'id'>>)[id];
    return m ? { ...m, id, youtubeId: undefined, url: 'demo' } : null;
  },
  getFlashcardWeeks: async (): Promise<(FlashcardWeek & { id: string })[]> => [
    {
      id: 'w1',
      name: 'Why kindness matters',
      description: '',
      week: 0,
      cards: [
        { front: 'True or false: helping others can lower stress.', back: 'True. Helping others is linked to lower stress and better mood.', type: 'text' },
        { front: 'What is an if-then plan?', back: 'A plan that links a situation to an action: "If X happens, then I will do Y."', type: 'text' },
      ],
    },
    {
      id: 'w2',
      name: 'Small acts, big effects',
      description: '',
      week: 1,
      cards: [{ front: 'Name one two-minute kind act.', back: 'Holding a door, a thank-you text, or offering your seat.', type: 'text' }],
    },
  ],
};
