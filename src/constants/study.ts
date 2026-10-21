/** Evening chat and reflection open at this local hour (24h). */
export const EVENING_OPENS_AT_HOUR = 17;

export const formatHour = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'pm' : 'am'}`;
