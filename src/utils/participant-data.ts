/**
 * Participant data layer (Firestore).
 *
 * Every participant record lives under /participants/{uid}, where uid is the
 * Firebase Auth user id. The only identifier stored is the research-issued
 * study ID. No names, emails, phone numbers or device identifiers are written
 * here. The participant's chosen nickname stays on the phone (AsyncStorage).
 *
 *   participants/{uid}                     profile: studyId, startDate, reminder times, flags
 *   participants/{uid}/days/{day}          per-study-day task completion + timestamps
 *   participants/{uid}/dailySurveys/{day}  nightly emotion check-in (raw ratings + adherence)
 *   participants/{uid}/weeklySurveys/{weekOf} weekly prosociality survey (raw responses + score)
 *   participants/{uid}/goals/{weekOf}      weekly goal + if-then plan (weekOf = Sunday's date)
 *   participants/{uid}/chatLogs/{id}       scripted Percy session log (choices + typed replies)
 *   participants/{uid}/unlocks/{mediaId}   media library items unlocked for this participant
 *   participants/{uid}/support/{id}        messages to / from the research team
 *   participants/{uid}/feedback/{week}     research-team-written feedback (read-only in app)
 *
 * Firestore security rules (firestore.rules) restrict each participant to
 * their own subtree and stop them from editing feedback or the research
 * team's replies.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { demoData, DEMO } from './demo';
import { db } from './firebase';
import type { DailyProgress } from './storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReminderTimes {
  /** "HH:MM", 24h, participant's local time */
  morning: string;
  evening: string;
}

export interface ParticipantProfile {
  studyId: string;
  startDate: string | null; // ISO; set when onboarding finishes
  onboarded: boolean;
  tutorialCompleted: boolean;
  reminders: ReminderTimes | null;
  timezone: string | null;
}

export interface DayRecord extends DailyProgress {
  day: number;
}

export interface DailySurveyRecord {
  day: number;
  adherence: 'yes' | 'no';
  ratings: number[]; // in SURVEY_EMOTIONS order
  average: number;
}

export interface WeeklySurveyRecord {
  /** YYYY-MM-DD of the Sunday the survey week starts (document id) */
  weekOf: string;
  /** Study week number when submitted (1-based) */
  week: number;
  responses: Record<string, number>; // itemId -> rating
  score: number;
  instrumentVersion: string;
  submittedAt?: Date;
}

export interface WeeklyGoal {
  weekOf: string; // YYYY-MM-DD of the Sunday that starts the week
  goal: string;
  ifThen: { if: string; then: string };
  updatedAt?: Date;
}

export type ChatEvent =
  | { kind: 'shown'; segment: number; at: string }
  | { kind: 'choice'; segment: number; value: string; at: string }
  | { kind: 'text'; segment: number; value: string; at: string }
  | { kind: 'video'; segment: number; mediaId: string | null; at: string }
  | { kind: 'completed'; at: string };

export interface SupportMessage {
  id: string;
  from: 'participant' | 'team';
  text: string;
  createdAt: Date | null;
}

export interface TeamFeedback {
  week: number;
  message: string;
  createdAt: Date | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const participantRef = (uid: string) => doc(db, 'participants', uid);
const sub = (uid: string, name: string) => collection(db, 'participants', uid, name);

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return null;
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function getProfile(uid: string): Promise<ParticipantProfile | null> {
  if (DEMO) return demoData.getProfile(uid);
  const snap = await getDoc(participantRef(uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    studyId: d.studyId,
    startDate: d.startDate ?? null,
    onboarded: !!d.onboarded,
    tutorialCompleted: !!d.tutorialCompleted,
    reminders: d.reminders ?? null,
    timezone: d.timezone ?? null,
  };
}

export async function updateProfile(uid: string, patch: Partial<ParticipantProfile>) {
  if (DEMO) return demoData.updateProfile(uid, patch);
  await setDoc(participantRef(uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Daily tasks ────────────────────────────────────────────────────────────

export async function saveDayTask(uid: string, day: number, task: keyof DailyProgress, done: boolean) {
  if (DEMO) return demoData.saveDayTask(uid, day, task, done);
  await setDoc(
    doc(sub(uid, 'days'), String(day)),
    { day, [task]: done, [`${task} at`]: done ? serverTimestamp() : null },
    { merge: true },
  );
}

export async function getAllDays(uid: string): Promise<Record<number, DailyProgress>> {
  if (DEMO) return demoData.getAllDays(uid);
  const snap = await getDocs(sub(uid, 'days'));
  const out: Record<number, DailyProgress> = {};
  snap.forEach((s) => {
    const d = s.data();
    out[Number(s.id)] = {
      'morning chat': !!d['morning chat'],
      'morning video': !!d['morning video'],
      'night chat': !!d['night chat'],
      'night survey': !!d['night survey'],
    };
  });
  return out;
}

// ─── Surveys ────────────────────────────────────────────────────────────────

export async function saveDailySurvey(uid: string, record: DailySurveyRecord) {
  if (DEMO) return demoData.saveDailySurvey(uid, record);
  await setDoc(doc(sub(uid, 'dailySurveys'), String(record.day)), {
    ...record,
    submittedAt: serverTimestamp(),
  });
}

export async function getDailySurveys(uid: string): Promise<DailySurveyRecord[]> {
  if (DEMO) return demoData.getDailySurveys(uid);
  const snap = await getDocs(sub(uid, 'dailySurveys'));
  return snap.docs.map((s) => s.data() as DailySurveyRecord);
}

export async function saveWeeklySurvey(uid: string, record: WeeklySurveyRecord) {
  if (DEMO) return demoData.saveWeeklySurvey(uid, record);
  await setDoc(doc(sub(uid, 'weeklySurveys'), record.weekOf), {
    ...record,
    submittedAt: serverTimestamp(),
  });
}

export async function getWeeklySurveys(uid: string): Promise<WeeklySurveyRecord[]> {
  if (DEMO) return demoData.getWeeklySurveys(uid);
  const snap = await getDocs(sub(uid, 'weeklySurveys'));
  return snap.docs
    .map((s) => {
      const d = s.data();
      return { ...(d as WeeklySurveyRecord), submittedAt: toDate(d.submittedAt) ?? undefined };
    })
    .sort((a, b) => (a.weekOf < b.weekOf ? -1 : 1));
}

// ─── Goals ──────────────────────────────────────────────────────────────────

export async function saveGoal(uid: string, goal: WeeklyGoal) {
  if (DEMO) return demoData.saveGoal(uid, goal);
  await setDoc(doc(sub(uid, 'goals'), goal.weekOf), { ...goal, updatedAt: serverTimestamp() });
}

export async function getGoals(uid: string): Promise<WeeklyGoal[]> {
  if (DEMO) return demoData.getGoals(uid);
  const snap = await getDocs(sub(uid, 'goals'));
  return snap.docs
    .map((s) => {
      const d = s.data();
      return { ...(d as WeeklyGoal), updatedAt: toDate(d.updatedAt) ?? undefined };
    })
    .sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1));
}

// ─── Chat logs ──────────────────────────────────────────────────────────────

/** One document per scripted session; events are rewritten as the session progresses. */
export async function saveChatLog(
  uid: string,
  sessionId: string,
  data: { scriptId: string; day: number; slot: string; events: ChatEvent[]; completed: boolean },
) {
  if (DEMO) return demoData.saveChatLog(uid, sessionId, data);
  await setDoc(doc(sub(uid, 'chatLogs'), sessionId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getChatLog(uid: string, sessionId: string): Promise<{ events: ChatEvent[]; completed: boolean } | null> {
  if (DEMO) return demoData.getChatLog(uid, sessionId);
  const snap = await getDoc(doc(sub(uid, 'chatLogs'), sessionId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { events: (d.events ?? []) as ChatEvent[], completed: !!d.completed };
}

// ─── Media unlocks ──────────────────────────────────────────────────────────

export async function unlockMedia(uid: string, mediaId: string, source: string) {
  if (DEMO) return demoData.unlockMedia(uid, mediaId);
  await setDoc(doc(sub(uid, 'unlocks'), mediaId), { source, unlockedAt: serverTimestamp() }, { merge: true });
}

export async function getUnlockedMediaIds(uid: string): Promise<Set<string>> {
  if (DEMO) return demoData.getUnlockedMediaIds(uid);
  const snap = await getDocs(sub(uid, 'unlocks'));
  return new Set(snap.docs.map((s) => s.id));
}

// ─── Support (contact the research team) ────────────────────────────────────

export function watchSupportMessages(uid: string, cb: (msgs: SupportMessage[]) => void): Unsubscribe {
  if (DEMO) return demoData.watchSupport(uid, cb);
  const q = query(sub(uid, 'support'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((s) => {
        const d = s.data({ serverTimestamps: 'estimate' });
        return { id: s.id, from: d.from, text: d.text, createdAt: toDate(d.createdAt) };
      }),
    );
  });
}

export async function sendSupportMessage(uid: string, text: string) {
  if (DEMO) return demoData.sendSupport(uid, text);
  await addDoc(sub(uid, 'support'), { from: 'participant', text, createdAt: serverTimestamp() });
}

// ─── Research-team feedback ─────────────────────────────────────────────────

export async function getTeamFeedback(uid: string): Promise<TeamFeedback[]> {
  if (DEMO) return demoData.getTeamFeedback(uid);
  const snap = await getDocs(sub(uid, 'feedback'));
  return snap.docs
    .map((s) => {
      const d = s.data();
      return { week: Number(d.week ?? s.id), message: d.message ?? '', createdAt: toDate(d.createdAt) };
    })
    .sort((a, b) => b.week - a.week);
}
