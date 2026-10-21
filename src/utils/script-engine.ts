/**
 * Turns a scripted Percy session plus the participant's saved answers into
 * the list of chat bubbles to show. Pure and deterministic, so a session can
 * be resumed (or reviewed later) exactly as it happened.
 */
import type { ChatEvent } from './participant-data';
import type { ScriptSegment } from './schema';

export type ChatBubble =
  | { id: string; role: 'percy' | 'participant'; kind: 'text'; text: string }
  | { id: string; role: 'percy'; kind: 'media'; mediaId: string; segment: number };

export interface Transcript {
  bubbles: ChatBubble[];
  /** Segment index waiting for the participant's answer, or null when the session is finished. */
  waitingAt: number | null;
}

export function answersFromEvents(events: ChatEvent[]): Map<number, string> {
  const answers = new Map<number, string>();
  for (const e of events) {
    if (e.kind === 'choice' || e.kind === 'text') answers.set(e.segment, e.value);
  }
  return answers;
}

export function buildTranscript(segments: ScriptSegment[], events: ChatEvent[]): Transcript {
  const answers = answersFromEvents(events);
  const bubbles: ChatBubble[] = [];
  const say = (i: number, suffix: string, text: string) => {
    if (text.trim()) bubbles.push({ id: `${i}-${suffix}`, role: 'percy', kind: 'text', text });
  };

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const type = seg.type ?? 'message';

    if (type === 'message') {
      say(i, 'm', seg.content);
      continue;
    }

    if (type === 'video' || type === 'audio') {
      say(i, 'm', seg.content);
      if (seg.mediaId) bubbles.push({ id: `${i}-media`, role: 'percy', kind: 'media', mediaId: seg.mediaId, segment: i });
      continue;
    }

    // choice / input: ask, then wait for an answer
    say(i, 'q', seg.content);
    const answer = answers.get(i);
    if (answer === undefined) return { bubbles, waitingAt: i };
    bubbles.push({ id: `${i}-a`, role: 'participant', kind: 'text', text: answer });
    const reply = (type === 'choice' ? seg.replies?.[answer] : undefined) ?? seg.reply;
    if (reply) say(i, 'r', reply);
  }

  return { bubbles, waitingAt: null };
}
