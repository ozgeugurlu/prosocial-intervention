/**
 * Percy's introduction to each week's theme, shown at the top of the weekly
 * if-then plan screen. `{name}` becomes the participant's nickname.
 *
 * Only Week 2 is filled in for now (presentation). Add the other weeks from the
 * intervention scripts ("Week's Intervention Introduction" sections).
 */
export interface WeeklyIntro {
  theme: string;
  intro: string;
}

export const WEEKLY_INTROS: Record<number, WeeklyIntro> = {
  2: {
    theme: 'Gratitude',
    intro:
      'Hi {name}. This week, please try to express your gratitude to people whenever you can and as often as you can. You could tell them how much you appreciate them for a specific reason face-to-face or through texting, social media, or a thank-you note.',
  },
};

export const IF_THEN_INSTRUCTION = "Let's create this week's if-then plan.";
