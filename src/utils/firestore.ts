import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Flashcard, FlashcardWeek, Script, ScriptSegment } from './schema';

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
      const segData = docSnap.data();
      segments.push({
        content: segData.content || '',
        order: typeof segData.order === 'number' ? segData.order : 0,
        title: segData.title || '',
      });
    });

    return {
      name: scriptData.name || '',
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
        const segData = segDoc.data();
        segments.push({
          content: segData.content || '',
          order: typeof segData.order === 'number' ? segData.order : 0,
          title: segData.title || '',
        });
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
