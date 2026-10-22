/**
 * Percy: scripted coaching chat.
 *
 * Percy's messages come from research-team scripts in Firestore
 * (/scripts, matched by studyDay + slot). There is no AI model: the
 * participant answers with buttons or short typed replies, and everything is
 * saved only to the study's own Firestore (participants/{uid}/chatLogs).
 */
import { Bird, Lock, Send } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MediaPlayer } from '@/components/media-player';
import { PrestartCard } from '@/components/prestart-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EVENING_OPENS_AT_HOUR, formatHour } from '@/constants/study';
import { Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useTheme } from '@/hooks/use-theme';
import { getMediaItem, getSessionScript } from '@/utils/firestore';
import { getChatLog, getUnlockedMediaIds, saveChatLog, unlockMedia, type ChatEvent } from '@/utils/participant-data';
import type { MediaItem, Script } from '@/utils/schema';
import { buildTranscript, type ChatBubble } from '@/utils/script-engine';

type Slot = 'morning' | 'evening';

const TYPING_DELAY_MS = 900;

const defaultSlot = (): Slot => (new Date().getHours() >= EVENING_OPENS_AT_HOUR ? 'evening' : 'morning');

export default function ChatScreen() {
  const { currentDay, hasStarted } = useStudy();
  const [slot, setSlot] = useState<Slot>(defaultSlot);
  if (!hasStarted) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', padding: Spacing.four }}>
        <PrestartCard compact />
      </ThemedView>
    );
  }
  // Keyed so all session state resets when the day or slot changes.
  return <ChatSession key={`d${currentDay}-${slot}`} slot={slot} onSlotChange={setSlot} />;
}

function ChatSession({ slot, onSlotChange }: { slot: Slot; onSlotChange: (s: Slot) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const { uid, currentDay, userName, updateProgress } = useStudy();
  const listRef = useRef<FlatList>(null);
  const [script, setScript] = useState<(Script & { id: string }) | null | undefined>(undefined);
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [input, setInput] = useState('');
  const [media, setMedia] = useState<Record<string, MediaItem | null>>({});
  const unlockedRef = useRef<Set<string>>(new Set());
  const requestedRef = useRef<Set<string>>(new Set());

  const sessionId = `d${currentDay}-${slot}`;
  const eveningLocked = slot === 'evening' && new Date().getHours() < EVENING_OPENS_AT_HOUR && events.length === 0;
  const isDark = theme.background === '#0A0A0A';
  const accent = isDark ? theme.primary : theme.accent;
  const onAccent = isDark ? '#171717' : '#3D3428';

  // ── Persist + complete ─────────────────────────────────────────────────
  const persist = useCallback(
    (s: Script & { id: string }, evts: ChatEvent[], done: boolean) => {
      if (!uid) return;
      saveChatLog(uid, sessionId, { scriptId: s.id, day: currentDay, slot, events: evts, completed: done }).catch((e) =>
        console.warn('Chat log save failed', e),
      );
    },
    [uid, sessionId, currentDay, slot],
  );

  // Marks the session done once its last message has been shown.
  const finishRef = useRef<((s: Script & { id: string }, evts: ChatEvent[]) => void) | null>(null);
  useEffect(() => {
    finishRef.current = (s, evts) => {
      const finalEvents: ChatEvent[] = [...evts, { kind: 'completed', at: new Date().toISOString() }];
      setCompleted(true);
      setEvents(finalEvents);
      persist(s, finalEvents, true);
      updateProgress(currentDay, slot === 'morning' ? 'morning chat' : 'night chat', true);
    };
  }, [persist, updateProgress, currentDay, slot]);

  // ── Load the session ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, log, unlocked] = await Promise.all([
          getSessionScript(currentDay, slot),
          uid ? getChatLog(uid, sessionId) : Promise.resolve(null),
          uid ? getUnlockedMediaIds(uid) : Promise.resolve(new Set<string>()),
        ]);
        if (cancelled) return;
        unlockedRef.current = unlocked;
        const priorEvents = log?.events ?? [];
        setScript(s);
        setEvents(priorEvents);
        setCompleted(!!log?.completed);
        // Resumed sessions appear instantly; brand-new sessions are "typed" out.
        if (s && priorEvents.length > 0) {
          const t = buildTranscript(s.segments, priorEvents);
          setRevealed(t.bubbles.length);
          // App was closed after the last answer but before the session was marked done.
          if (t.waitingAt == null && !log?.completed) finishRef.current?.(s, priorEvents);
        }
      } catch (e) {
        console.warn('Could not load Percy session', e);
        if (!cancelled) setScript(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, currentDay, slot, sessionId]);

  const transcript = useMemo(
    () => (script ? buildTranscript(script.segments, events) : { bubbles: [] as ChatBubble[], waitingAt: null }),
    [script, events],
  );
  const visible = transcript.bubbles.slice(0, revealed);
  const isTyping = !eveningLocked && !!script && revealed < transcript.bubbles.length;
  const waitingSegment =
    !isTyping && script && transcript.waitingAt != null ? script.segments[transcript.waitingAt] : null;

  // ── Reveal new bubbles one at a time ───────────────────────────────────
  useEffect(() => {
    if (!isTyping || !script) return;
    const next = transcript.bubbles[revealed];
    const delay = next?.role === 'participant' ? 0 : TYPING_DELAY_MS;
    const t = setTimeout(() => {
      const count = revealed + 1;
      setRevealed(count);
      if (count === transcript.bubbles.length && transcript.waitingAt == null && !completed) {
        finishRef.current?.(script, events);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [isTyping, revealed, transcript, script, events, completed]);

  // ── Load + unlock any media Percy has sent ─────────────────────────────
  useEffect(() => {
    for (const b of visible) {
      if (b.kind !== 'media') continue;
      if (!requestedRef.current.has(b.mediaId)) {
        requestedRef.current.add(b.mediaId);
        getMediaItem(b.mediaId)
          .then((item) => setMedia((m) => ({ ...m, [b.mediaId]: item })))
          .catch(() => undefined);
      }
      if (uid && !unlockedRef.current.has(b.mediaId)) {
        unlockedRef.current.add(b.mediaId);
        unlockMedia(uid, b.mediaId, sessionId).catch((e) => console.warn('Unlock failed', e));
      }
    }
  }, [visible, uid, sessionId]);

  const answer = (value: string, kind: 'choice' | 'text') => {
    if (transcript.waitingAt == null || !value.trim()) return;
    const next: ChatEvent[] = [
      ...events,
      { kind, segment: transcript.waitingAt, value: value.trim(), at: new Date().toISOString() },
    ];
    setEvents(next);
    setInput('');
    if (script) persist(script, next, false);
  };

  const onMediaPlay = (bubble: Extract<ChatBubble, { kind: 'media' }>) => {
    const next: ChatEvent[] = [
      ...events,
      { kind: 'video', segment: bubble.segment, mediaId: bubble.mediaId, at: new Date().toISOString() },
    ];
    setEvents(next);
    if (script) persist(script, next, completed);
    if (slot === 'morning') updateProgress(currentDay, 'morning video', true);
  };

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [revealed, keyboardVisible, waitingSegment]);

  // ── Rendering ──────────────────────────────────────────────────────────
  const bubbleWidth = Math.min(Dimensions.get('window').width * 0.75, 420);

  const renderItem = ({ item }: { item: ChatBubble }) => {
    if (item.kind === 'media') {
      const m = media[item.mediaId];
      return (
        <View style={styles.rowLeft}>
          {m ? (
            <View style={{ gap: 6 }}>
              <MediaPlayer item={m} width={bubbleWidth} onPlay={() => onMediaPlay(item)} />
              <ThemedText style={styles.mediaCaption} themeColor="textSecondary">
                Saved to your Library
              </ThemedText>
            </View>
          ) : (
            <ActivityIndicator color={accent} />
          )}
        </View>
      );
    }
    const isPercy = item.role === 'percy';
    const text = isPercy
      ? userName
        ? item.text.replace(/\{name\}/g, userName)
        : item.text.replace(/[ ,]*\{name\}/g, '')
      : item.text;
    return (
      <View style={isPercy ? styles.rowLeft : styles.rowRight}>
        <View
          style={[
            styles.bubble,
            isPercy
              ? [styles.bubbleLeft, { backgroundColor: theme.card, borderColor: theme.border }]
              : { backgroundColor: isDark ? '#262626' : '#E8DCC8' },
          ]}
        >
          <ThemedText style={[styles.messageText, { fontFamily: isPercy ? Fonts.serif : Fonts.sans }]}>{text}</ThemedText>
        </View>
      </View>
    );
  };

  const bottomSpacing = keyboardVisible ? (Platform.OS === 'ios' ? 8 : 16) : Math.max(insets.bottom, 16) + 84;

  let footer: React.ReactNode = null;
  if (script === undefined) {
    footer = <ActivityIndicator color={accent} />;
  } else if (eveningLocked) {
    footer = (
      <View style={styles.notice}>
        <Lock size={18} color={theme.textSecondary} />
        <ThemedText themeColor="textSecondary" style={styles.noticeText}>
          {`Your evening chat with Percy opens at ${formatHour(EVENING_OPENS_AT_HOUR)}.`}
        </ThemedText>
      </View>
    );
  } else if (script === null) {
    footer = (
      <ThemedText themeColor="textSecondary" style={styles.noticeText}>
        {`There's no ${slot} session with Percy today. Check back ${slot === 'morning' ? 'this evening' : 'tomorrow morning'}!`}
      </ThemedText>
    );
  } else if (completed && !isTyping) {
    footer = (
      <ThemedText themeColor="textSecondary" style={styles.noticeText}>
        {`You finished this ${slot}'s session. Nice work!`}
      </ThemedText>
    );
  } else if (waitingSegment?.type === 'choice') {
    footer = (
      <View style={styles.choices}>
        {(waitingSegment.options ?? []).map((opt) => (
          <Pressable
            key={opt}
            onPress={() => answer(opt, 'choice')}
            style={({ pressed }) => [styles.choice, { borderColor: accent, backgroundColor: pressed ? accent : theme.card }]}
          >
            <ThemedText style={styles.choiceText}>{opt}</ThemedText>
          </Pressable>
        ))}
      </View>
    );
  }

  const showTextInput = waitingSegment?.type === 'input';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: accent }]}>
            <Bird size={24} color={isDark ? '#171717' : '#ffffff'} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.headerTitle}>Percy</ThemedText>
            <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
              Your coach · Day {currentDay}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.segmented, { backgroundColor: theme.background }]}>
          {(['morning', 'evening'] as Slot[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => onSlotChange(s)}
              style={[styles.segment, slot === s && { backgroundColor: accent }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: slot === s }}
            >
              <ThemedText style={[styles.segmentText, slot === s && { color: onAccent, fontWeight: '700' }]}>
                {s === 'morning' ? 'Morning' : 'Evening'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={eveningLocked ? [] : visible}
          renderItem={renderItem}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View style={{ gap: Spacing.three }}>
              {isTyping && (
                <View style={styles.typing}>
                  <ActivityIndicator size="small" color={accent} />
                  <ThemedText style={styles.typingText} themeColor="textSecondary">
                    Percy is typing…
                  </ThemedText>
                </View>
              )}
              {footer}
            </View>
          }
        />

        <View style={[styles.inputBar, { backgroundColor: theme.card, paddingBottom: bottomSpacing, borderTopColor: theme.border }]}>
          {showTextInput ? (
            <View style={styles.inputInner}>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? '#171717' : '#FAF7F0', color: theme.text }]}
                placeholder={waitingSegment?.placeholder ?? 'Type your answer…'}
                placeholderTextColor={theme.textSecondary}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => answer(input, 'text')}
                returnKeyType="send"
                maxLength={1000}
              />
              <Pressable
                style={[styles.sendButton, { backgroundColor: accent }, !input.trim() && { opacity: 0.5 }]}
                onPress={() => answer(input, 'text')}
                disabled={!input.trim()}
                accessibilityLabel="Send"
              >
                <Send size={18} color={onAccent} />
              </Pressable>
            </View>
          ) : (
            <ThemedText style={styles.inputHint} themeColor="textSecondary">
              {waitingSegment?.type === 'choice' ? 'Tap an answer above' : ' '}
            </ThemedText>
          )}
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12, borderBottomWidth: 1, gap: 12, zIndex: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.four, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '700', lineHeight: 26 },
  headerSubtitle: { fontSize: 13, lineHeight: 16 },
  segmented: { flexDirection: 'row', marginHorizontal: Spacing.four, borderRadius: 14, padding: 4 },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentText: { fontSize: 14 },
  listContent: { paddingVertical: Spacing.four, paddingHorizontal: Spacing.four, gap: Spacing.three },
  rowLeft: { flexDirection: 'row', justifyContent: 'flex-start' },
  rowRight: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', padding: 16, borderRadius: 20 },
  bubbleLeft: { borderWidth: 1 },
  messageText: { fontSize: 16, lineHeight: 24 },
  mediaCaption: { fontSize: 12 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, fontStyle: 'italic' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  noticeText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  choices: { gap: 10, alignItems: 'flex-end' },
  choice: { borderWidth: 1.5, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 16, maxWidth: '85%' },
  choiceText: { fontSize: 15, lineHeight: 20 },
  inputBar: { paddingTop: 12, paddingHorizontal: Spacing.four, borderTopWidth: 1 },
  inputInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textInput: { flex: 1, height: 48, borderRadius: 24, paddingHorizontal: 16, fontSize: 15, fontFamily: Fonts.sans },
  sendButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  inputHint: { fontSize: 13, textAlign: 'center', paddingVertical: 6 },
});
