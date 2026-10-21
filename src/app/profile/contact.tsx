/**
 * Contact the research team. Messages are stored at participants/{uid}/support
 * in the study's Firestore. The team reads and replies with
 * `node scripts/admin/peach-admin.mjs unread` / `reply` (or the Firebase console).
 */
import { Mail, Phone, Send, ShieldAlert } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useTheme } from '@/hooks/use-theme';
import { getStudyConfig } from '@/utils/firestore';
import { sendSupportMessage, watchSupportMessages, type SupportMessage } from '@/utils/participant-data';
import type { StudyConfig } from '@/utils/schema';

export default function ContactScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  const { uid } = useStudy();
  const listRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<StudyConfig | null>(null);

  useEffect(() => {
    getStudyConfig().then(setConfig);
    if (!uid) return;
    return watchSupportMessages(uid, setMessages);
  }, [uid]);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages, keyboard]);

  const send = async () => {
    if (!uid || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendSupportMessage(uid, text.trim().slice(0, 2000));
      setText('');
    } catch {
      setError('Message not sent. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const isDark = theme.background === '#0A0A0A';
  const accent = isDark ? theme.primary : theme.accent;

  const intro = (
    <View style={{ gap: Spacing.three, marginBottom: Spacing.three }}>
      <View style={[styles.info, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText style={styles.infoText} themeColor="textSecondary">
          Send the research team a message about anything: a technical problem, a question about the study, or if you want
          to stop participating. We usually reply within one business day, here in this chat.
        </ThemedText>
        {(config?.contactEmail || config?.contactPhone) && (
          <View style={styles.links}>
            {config?.contactEmail ? (
              <Pressable style={styles.link} onPress={() => Linking.openURL(`mailto:${config.contactEmail}`)}>
                <Mail size={16} color={theme.primary} />
                <ThemedText style={styles.linkText}>{config.contactEmail}</ThemedText>
              </Pressable>
            ) : null}
            {config?.contactPhone ? (
              <Pressable style={styles.link} onPress={() => Linking.openURL(`tel:${config.contactPhone}`)}>
                <Phone size={16} color={theme.primary} />
                <ThemedText style={styles.linkText}>{config.contactPhone}</ThemedText>
              </Pressable>
            ) : null}
          </View>
        )}
        {config?.irbContact ? (
          <ThemedText style={styles.irb} themeColor="textSecondary">
            Questions about your rights as a participant: {config.irbContact}
            {config.irbProtocol ? ` (protocol ${config.irbProtocol})` : ''}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.crisis, { borderColor: theme.destructive }]}>
        <ShieldAlert size={18} color={theme.destructive} />
        <ThemedText style={styles.crisisText}>
          This chat is not monitored around the clock. If you are in crisis or thinking about harming yourself, call or text 988
          (US) or your local emergency number.
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Research team" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          ListHeaderComponent={intro}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.from === 'participant';
            return (
              <View style={[styles.row, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
                <View
                  style={[
                    styles.bubble,
                    mine ? { backgroundColor: isDark ? '#262626' : '#E8DCC8' } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
                  ]}
                >
                  {!mine && <ThemedText style={styles.from}>Research team</ThemedText>}
                  <ThemedText style={styles.msg}>{item.text}</ThemedText>
                  {item.createdAt && (
                    <ThemedText themeColor="textSecondary" style={styles.time}>
                      {item.createdAt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </ThemedText>
                  )}
                </View>
              </View>
            );
          }}
        />
        {error && <ThemedText style={{ color: theme.destructive, textAlign: 'center', paddingBottom: 6 }}>{error}</ThemedText>}
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: keyboard ? 8 : Math.max(insets.bottom, 16) }]}>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#171717' : '#FAF7F0', color: theme.text }]}
            placeholder="Write a message…"
            placeholderTextColor={theme.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={[styles.send, { backgroundColor: accent }, (sending || !text.trim()) && { opacity: 0.5 }]}
            accessibilityLabel="Send message"
          >
            <Send size={18} color={isDark ? '#171717' : '#3D3428'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.four, gap: Spacing.two, maxWidth: 680, width: '100%', alignSelf: 'center' },
  info: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  infoText: { fontSize: 14, lineHeight: 20 },
  links: { gap: 6 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { fontSize: 14, fontWeight: '600' },
  irb: { fontSize: 12, lineHeight: 17 },
  crisis: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: Spacing.three, alignItems: 'flex-start' },
  crisisText: { flex: 1, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 12, gap: 4 },
  from: { fontSize: 12, fontWeight: '700' },
  msg: { fontSize: 15, lineHeight: 22 },
  time: { fontSize: 11 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 10, paddingHorizontal: Spacing.four, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: Fonts.sans },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
