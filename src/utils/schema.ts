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
}

// Loaded from a path like /scripts/{scriptId}/segments/{segmentId}
export type ScriptSegment = {
    content: string;
    order: number; // 0-indexed, so 0 is "Segment 1"
    title: string;
};

// Loaded from a path like /scripts/{scriptId}
export type Script = {
    segments: ScriptSegment[];
    createdAt: Date;
    updatedAt: Date;
    name: string;
};

export type VideoSegment = {
    title: string;
    url: string;
};