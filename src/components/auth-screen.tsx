import { Bird } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { AuthError, useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { DEMO } from '@/utils/demo';

type Mode = 'signIn' | 'signUp';

export function AuthScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signUp');
  const [studyId, setStudyId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isDark = theme.isDark;
  const buttonBg = theme.cta;
  const buttonFg = theme.onCta;

  const submit = async () => {
    setError(null);
    if (mode === 'signUp' && password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signUp') await signUp(studyId, password);
      else await signIn(studyId, password);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
  ];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.six }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.logo, { backgroundColor: `${theme.primary}25` }]}>
            <Bird size={36} color={theme.primary} strokeWidth={1.8} />
          </View>
          <ThemedText style={styles.title}>{mode === 'signUp' ? 'Welcome to PEACH' : 'Welcome back'}</ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            {mode === 'signUp'
              ? 'Create your account with the study ID you received from the research team.'
              : 'Sign in with your study ID and password.'}
          </ThemedText>

          {DEMO && (
            <View style={[styles.demo, { backgroundColor: `${theme.primary}22`, borderColor: theme.primary }]}>
              <ThemedText style={styles.demoText}>
                Preview mode: type any study ID and password. &quot;Create account&quot; shows a new participant
                (welcome chat, app tour, countdown to Sunday). &quot;Sign in&quot; shows someone on Day 11 with history.
                Nothing is saved.
              </ThemedText>
            </View>
          )}

          <View style={styles.form}>
            <ThemedText style={styles.label}>Study ID</ThemedText>
            <TextInput
              value={studyId}
              onChangeText={setStudyId}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="e.g. P-0042"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
              accessibilityLabel="Study ID"
            />

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder={mode === 'signUp' ? 'At least 8 characters' : ''}
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
              textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
              accessibilityLabel="Password"
            />

            {mode === 'signUp' && (
              <>
                <ThemedText style={styles.label}>Confirm password</ThemedText>
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                  style={inputStyle}
                  textContentType="newPassword"
                  accessibilityLabel="Confirm password"
                />
              </>
            )}

            {error && (
              <ThemedText style={[styles.error, { color: theme.destructive }]} accessibilityRole="alert">
                {error}
              </ThemedText>
            )}

            <Pressable
              style={[styles.button, { backgroundColor: buttonBg }, busy && { opacity: 0.6 }]}
              onPress={submit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={buttonFg} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: buttonFg }]}>
                  {mode === 'signUp' ? 'Create account' : 'Sign in'}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setMode(mode === 'signUp' ? 'signIn' : 'signUp');
                setError(null);
              }}
              style={styles.switch}
            >
              <ThemedText style={styles.switchText} themeColor="textSecondary">
                {mode === 'signUp' ? 'Already have an account? Sign in' : 'New to the study? Create an account'}
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.privacy} themeColor="textSecondary">
            We never ask for your name, email or phone number. Your study ID is the only identifier
            stored with your responses. Forgot your password? Contact the research team and they will reset it.
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, alignItems: 'center' },
  logo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.serif, fontSize: 32, lineHeight: 38, fontWeight: '700', marginTop: Spacing.three, textAlign: 'center' },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: Spacing.two, maxWidth: 340 },
  form: { width: '100%', maxWidth: 400, marginTop: Spacing.five, gap: Spacing.two },
  label: { fontSize: 14, fontWeight: '600', marginTop: Spacing.two },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: Fonts.sans },
  error: { fontSize: 14, lineHeight: 20, marginTop: Spacing.two },
  button: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.three },
  buttonText: { fontSize: 16, fontWeight: '700' },
  switch: { alignItems: 'center', paddingVertical: Spacing.three },
  switchText: { fontSize: 14 },
  demo: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: Spacing.four, maxWidth: 400 },
  demoText: { fontSize: 13, lineHeight: 19 },
  privacy: { fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 360, marginTop: Spacing.four },
});
