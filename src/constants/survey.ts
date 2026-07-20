export interface Emotion {
  label: string;
  isPositive: boolean;
}

/** Fixed daily reflection questions — same every study day. */
export const SURVEY_EMOTIONS: readonly Emotion[] = [
  { label: 'Joyful, energetic, enthusiastic', isPositive: true },
  { label: 'Nervous, anxious, worried', isPositive: false },
  { label: 'Awe, amazed, wonder', isPositive: true },
  { label: 'Sad, depressed, down', isPositive: false },
  { label: 'Content, relaxed, peaceful', isPositive: true },
  { label: 'Proud, sense of accomplishment, successful', isPositive: true },
  { label: 'Lonely, isolated, solitary', isPositive: false },
  { label: 'Grateful, appreciative, thankful', isPositive: true },
  { label: 'Angry, irritable, mad', isPositive: false },
  { label: 'Tired, fatigued, low energy', isPositive: false },
  { label: 'Amused, having fun, laughing', isPositive: true },
  { label: 'Curious, interested, wanting to explore', isPositive: true },
  { label: 'Fearful, afraid, scared', isPositive: false },
  { label: 'Compassionate, sympathetic, concern for others', isPositive: true },
  { label: 'Love, affection, warmth', isPositive: true },
  { label: 'Stressed, overburdened, pressured', isPositive: false },
] as const;

export const SURVEY_ADHERENCE_QUESTION =
  'Did you complete the assigned activity today?';

export const SURVEY_EMOTION_INSTRUCTION =
  'Please think back on the experiences you had today, and think about the feelings and emotions you felt. Below there are 16 groups of words. Each group has three words that describe very similar emotions or feelings. For each group please mark the number to show how much of the emotions or feelings you felt today.';
