import { doc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';
import {
  FaqItem,
  Flashcard,
  FlashcardWeek,
  MediaItem,
  Script,
  ScriptSegment,
  StudyConfig,
  WeeklySurveyInstrument,
} from './schema';
import { DEFAULT_FAQ, DEFAULT_STUDY_CONFIG, PLACEHOLDER_WEEKLY_SURVEY } from '@/constants/content-defaults';

function toSegment(segData: Record<string, any>): ScriptSegment {
  return {
    content: segData.content || '',
    order: typeof segData.order === 'number' ? segData.order : 0,
    title: segData.title || '',
    type: segData.type,
    mediaId: segData.mediaId,
    options: Array.isArray(segData.options) ? segData.options : undefined,
    replies: segData.replies,
    reply: segData.reply,
    placeholder: segData.placeholder,
  };
}

/**
 * Parses any value to a Javascript Date object.
 * Handles Firestore Timestamp, date strings, and Date objects.
 */
function parseDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') {
    return val.toDate(); // Firestore Timestamp
  }
  const date = new Date(val);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Loads a FlashcardWeek document along with all its flashcards subcollection.
 * Path: /flashcards/{weekId}/cards/{cardId}
 */
export async function getFlashcardWeek(weekId: string): Promise<FlashcardWeek | null> {
  try {
    const weekRef = doc(db, 'flashcards', weekId);
    const weekSnap = await getDoc(weekRef);

    if (!weekSnap.exists()) {
      return null;
    }

    const weekData = weekSnap.data();

    // Load the subcollection of cards
    const cardsRef = collection(db, 'flashcards', weekId, 'cards');
    const cardsSnap = await getDocs(cardsRef);
    const cards: Flashcard[] = [];

    cardsSnap.forEach((docSnap) => {
      const cardData = docSnap.data();
      cards.push({
        front: cardData.front || '',
        back: cardData.back || '',
        type: cardData.type === 'text' || cardData.type === 'image' || cardData.type === 'video' 
          ? cardData.type 
          : 'text',
      });
    });

    return {
      name: weekData.name || '',
      description: weekData.description || '',
      week: typeof weekData.week === 'number' ? weekData.week : 0,
      cards,
    };
  } catch (error) {
    console.error(`Error loading FlashcardWeek with ID "${weekId}":`, error);
    throw error;
  }
}

/**
 * Helper to fetch all FlashcardWeeks, including their nested cards.
 */
export async function getFlashcardWeeks(): Promise<(FlashcardWeek & { id: string })[]> {
  try {
    const weeksRef = collection(db, 'flashcards');
    const weeksSnap = await getDocs(weeksRef);
    
    const weeks: (FlashcardWeek & { id: string })[] = [];
    for (const weekDoc of weeksSnap.docs) {
      const weekData = weekDoc.data();
      const weekId = weekDoc.id;

      // Load nested cards
      const cardsRef = collection(db, 'flashcards', weekId, 'cards');
      const cardsSnap = await getDocs(cardsRef);
      const cards: Flashcard[] = [];

      cardsSnap.forEach((cardDoc) => {
        const cardData = cardDoc.data();
        cards.push({
          front: cardData.front || '',
          back: cardData.back || '',
          type: cardData.type === 'text' || cardData.type === 'image' || cardData.type === 'video' 
            ? cardData.type 
            : 'text',
        });
      });

      weeks.push({
        id: weekId,
        name: weekData.name || '',
        description: weekData.description || '',
        week: typeof weekData.week === 'number' ? weekData.week : 0,
        cards,
      });
    }

    // Sort by week number
    return weeks.sort((a, b) => a.week - b.week);
  } catch (error) {
    console.error('Error loading all FlashcardWeeks:', error);
    throw error;
  }
}

/**
 * Loads a Script document along with all its segments subcollection.
 * Path: /scripts/{scriptId}/segments/{segmentId}
 * Segments are ordered by the `order` field.
 */
export async function getScript(scriptId: string): Promise<Script | null> {
  try {
    const scriptRef = doc(db, 'scripts', scriptId);
    const scriptSnap = await getDoc(scriptRef);

    if (!scriptSnap.exists()) {
      return null;
    }

    const scriptData = scriptSnap.data();

    // Load and sort script segments
    const segmentsRef = collection(db, 'scripts', scriptId, 'segments');
    const q = query(segmentsRef, orderBy('order', 'asc'));
    const segmentsSnap = await getDocs(q);
    const segments: ScriptSegment[] = [];

    segmentsSnap.forEach((docSnap) => {
      segments.push(toSegment(docSnap.data()));
    });

    return {
      name: scriptData.name || '',
      studyDay: scriptData.studyDay,
      slot: scriptData.slot,
      createdAt: parseDate(scriptData.createdAt),
      updatedAt: parseDate(scriptData.updatedAt),
      segments,
    };
  } catch (error) {
    console.error(`Error loading Script with ID "${scriptId}":`, error);
    throw error;
  }
}

/**
 * Helper to fetch all Scripts, including their ordered segments.
 */
export async function getScripts(): Promise<(Script & { id: string })[]> {
  try {
    const scriptsRef = collection(db, 'scripts');
    const scriptsSnap = await getDocs(scriptsRef);

    const scripts: (Script & { id: string })[] = [];
    for (const scriptDoc of scriptsSnap.docs) {
      const scriptData = scriptDoc.data();
      const scriptId = scriptDoc.id;

      // Load segments for this script ordered by 'order'
      const segmentsRef = collection(db, 'scripts', scriptId, 'segments');
      const q = query(segmentsRef, orderBy('order', 'asc'));
      const segmentsSnap = await getDocs(q);
      const segments: ScriptSegment[] = [];

      segmentsSnap.forEach((segDoc) => {
        segments.push(toSegment(segDoc.data()));
      });

      scripts.push({
        id: scriptId,
        name: scriptData.name || '',
        createdAt: parseDate(scriptData.createdAt),
        updatedAt: parseDate(scriptData.updatedAt),
        segments,
      });
    }

    return scripts;
  } catch (error) {
    console.error('Error loading all Scripts:', error);
    throw error;
  }
}

/**
 * Finds the scripted Percy session for a study day and time slot
 * (scripts with matching `studyDay` and `slot` fields).
 */
export async function getSessionScript(
  studyDay: number,
  slot: 'morning' | 'evening',
): Promise<(Script & { id: string }) | null> {
  const q = query(collection(db, 'scripts'), where('studyDay', '==', studyDay), where('slot', '==', slot));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  const script = await getScript(first.id);
  return script ? { ...script, id: first.id } : null;
}

export async function getMediaItems(): Promise<MediaItem[]> {
  const snap = await getDocs(collection(db, 'media'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<MediaItem, 'id'>), id: d.id }));
}

export async function getMediaItem(id: string): Promise<MediaItem | null> {
  const snap = await getDoc(doc(db, 'media', id));
  return snap.exists() ? { ...(snap.data() as Omit<MediaItem, 'id'>), id: snap.id } : null;
}

export async function getFaq(): Promise<FaqItem[]> {
  try {
    const snap = await getDocs(collection(db, 'faq'));
    const items = snap.docs.map((d) => ({ ...(d.data() as Omit<FaqItem, 'id'>), id: d.id }));
    return items.length ? items.sort((a, b) => a.order - b.order) : DEFAULT_FAQ;
  } catch {
    return DEFAULT_FAQ;
  }
}

export async function getWeeklyInstrument(): Promise<WeeklySurveyInstrument> {
  try {
    const snap = await getDoc(doc(db, 'surveys', 'weekly'));
    return snap.exists() ? (snap.data() as WeeklySurveyInstrument) : PLACEHOLDER_WEEKLY_SURVEY;
  } catch {
    return PLACEHOLDER_WEEKLY_SURVEY;
  }
}

export async function getStudyConfig(): Promise<StudyConfig> {
  try {
    const snap = await getDoc(doc(db, 'appConfig', 'study'));
    return snap.exists() ? { ...DEFAULT_STUDY_CONFIG, ...(snap.data() as StudyConfig) } : DEFAULT_STUDY_CONFIG;
  } catch {
    return DEFAULT_STUDY_CONFIG;
  }
}
