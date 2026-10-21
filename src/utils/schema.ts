// ─── Study content schema (written by the research team, read-only in the app) ──
// See docs/content-guide.md for how to author each of these in Firestore.

// Loaded from a path like /flashcards/{weekId}/cards/{cardId}
export type Flashcard = {
  front: string;
  back: string;
  type: 'text' | 'image' | 'video';
};

export type FlashcardWeek = {
  name: string;
  description: string;
  week: number; // 0-indexed, so 0 is "Week 1"
  cards: Flashcard[];
};

/**
 * One step of a scripted Percy conversation.
 * Loaded from /scripts/{scriptId}/segments/{segmentId}, ordered by `order`.
 *
 *  - message: Percy says `content`.
 *  - video / audio: Percy says `content` (optional) and shows the media item
 *    `mediaId` in the chat. Showing it unlocks it in the participant's library.
 *  - choice: Percy asks `content`; the participant taps one of `options`.
 *    Percy then says `replies[option]` (or `reply`) if provided.
 *  - input: Percy asks `content`; the participant types a free-text answer.
 *    Percy then says `reply` if provided.
 *
 * Older segments without `type` are treated as plain messages.
 */
export type ScriptSegment = {
  order: number;
  title: string;
  content: string;
  type?: 'message' | 'video' | 'audio' | 'choice' | 'input';
  mediaId?: string;
  options?: string[];
  replies?: Record<string, string>;
  reply?: string;
  placeholder?: string;
};

/**
 * A scripted Percy session. Loaded from /scripts/{scriptId}.
 * `studyDay` (1–63) and `slot` decide when the app offers it.
 */
export type Script = {
  segments: ScriptSegment[];
  createdAt: Date;
  updatedAt: Date;
  name: string;
  studyDay?: number;
  slot?: 'morning' | 'evening';
};

/**
 * An item in the media library. Loaded from /media/{mediaId}.
 * Items appear in the library once unlocked: when Percy sends them in a chat,
 * or automatically from `availableFromDay` if that is set.
 */
export type MediaItem = {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'text';
  /** YouTube video ID (played via youtube-nocookie.com) */
  youtubeId?: string;
  /** Direct https URL to an .mp4 / .m4a / .mp3, e.g. in Firebase Storage */
  url?: string;
  /** Body for informational messages (type "text") */
  body?: string;
  description?: string;
  durationLabel?: string;
  week?: number;
  availableFromDay?: number;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

/** Weekly prosociality survey instrument. Loaded from /surveys/weekly. */
export type WeeklySurveyInstrument = {
  version: string;
  instructions: string;
  scaleMin: number;
  scaleMax: number;
  minLabel: string;
  maxLabel: string;
  items: { id: string; text: string; reverse?: boolean }[];
};

/** Study-wide settings. Loaded from /appConfig/study. */
export type StudyConfig = {
  studyLengthDays: number;
  contactEmail?: string;
  contactPhone?: string;
  irbProtocol?: string;
  irbContact?: string;
  /** How many days the weekly survey stays open, starting each Sunday. Defaults to 3 (Sun–Tue). */
  weeklySurveyOpenDays?: number;
};
