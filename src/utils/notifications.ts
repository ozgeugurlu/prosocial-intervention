/**
 * Morning and evening reminders, scheduled on the device at the times the
 * participant chooses. These are local notifications: no push service and no
 * device token is involved, so nothing leaves the phone. Text is kept generic
 * so a lock screen never reveals study content.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { ReminderTimes } from './participant-data';

const CHANNEL_ID = 'study-reminders';
const IDS = { morning: 'peach-morning', evening: 'peach-evening' } as const;

export const DEFAULT_REMINDERS: ReminderTimes = { morning: '08:30', evening: '20:00' };

let configured = false;
export function configureNotifications() {
  if (configured || Platform.OS === 'web') return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission if needed. Returns true if reminders can be shown. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted;
}

export function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 8, minute: Number.isFinite(m) ? m : 0 };
}

export function formatTime(hhmm: string): string {
  const { hour, minute } = parseTime(hhmm);
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** Replaces any existing study reminders with ones at the given times. */
export async function scheduleReminders(times: ReminderTimes): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  configureNotifications();
  const ok = await ensureNotificationPermission();
  await cancelReminders();
  if (!ok) return false;

  const morning = parseTime(times.morning);
  const evening = parseTime(times.evening);
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.morning,
    content: { title: 'Good morning ☀️', body: 'Percy has your morning check-in ready.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...morning, channelId: CHANNEL_ID },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.evening,
    content: { title: 'Time to reflect 🌙', body: 'Your evening chat and reflection are open.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...evening, channelId: CHANNEL_ID },
  });
  return true;
}

export async function cancelReminders() {
  if (Platform.OS === 'web') return;
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(IDS.morning).catch(() => undefined),
    Notifications.cancelScheduledNotificationAsync(IDS.evening).catch(() => undefined),
  ]);
}
