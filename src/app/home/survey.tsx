import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing, MaxContentWidth } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { saveDailySurvey } from '@/utils/participant-data';
import { computeAverageScore, storage } from '@/utils/storage';
import { SURVEY_EMOTIONS } from '@/constants/survey';

const EMOTIONS = SURVEY_EMOTIONS;

export default function SurveyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uid, currentDay, updateProgress } = useStudy();
  const [saveError, setSaveError] = useState<string | null>(null);

  // State
  const [currentStep, setCurrentStep] = useState(0); // 0: Adherence Check, 1: Intro/Instructions, 2: Emotion Ratings
  const [adherence, setAdherence] = useState<'yes' | 'no' | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleRating = (index: number, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [index]: score,
    }));
  };

  const isFormValid = adherence !== null && Object.keys(ratings).length === EMOTIONS.length;

  const handleSubmit = async () => {
    if (!isFormValid || !adherence) return;
    setSaveError(null);

    // Ratings in SURVEY_EMOTIONS order (index 0..15).
    const ratingValues = EMOTIONS.map((_, i) => ratings[i]);
    const average = computeAverageScore(ratingValues);
    try {
      if (uid) {
        await saveDailySurvey(uid, { day: currentDay, adherence, ratings: ratingValues, average });
      }
      await storage.setDayScore(currentDay, average);
      await updateProgress(currentDay, 'night survey', true);
      setSubmitted(true);
    } catch (e) {
      console.warn('Daily survey save failed', e);
      setSaveError('We could not save your reflection. Please check your connection and try again.');
    }
  };

  const isDark = theme.isDark;

  if (submitted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.successContent}>
          <CheckCircle2 size={80} color="#79D2A9" strokeWidth={1.5} />
          <ThemedText style={styles.successTitle}>Reflection Saved</ThemedText>
          <ThemedText style={styles.successSubtitle} themeColor="textSecondary">
            {"Thank you for completing today's check-in! Your response helps track your journey."}
          </ThemedText>
          <Pressable
            style={[styles.submitButton, { backgroundColor: theme.cta }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.submitButtonText, { color: theme.onCta }]}>
              Go Back Home
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Custom Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: theme.card,
            borderBottomColor: 'transparent',
          },
        ]}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (currentStep > 0) {
              setCurrentStep((prev) => prev - 1);
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Daily Reflection</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <View
        style={[
          styles.progressContainer,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <ThemedText style={styles.progressText} themeColor="textSecondary">
            {currentStep === 0 && 'Step 1 of 3: Adherence Check'}
            {currentStep === 1 && 'Step 2 of 3: Instructions'}
            {currentStep === 2 && 'Step 3 of 3: Emotional Experience'}
          </ThemedText>
        </View>
        <View style={styles.progressBar}>
          {[0, 1, 2].map((stepIndex) => {
            const isActive = stepIndex === currentStep;
            const isCompleted = stepIndex < currentStep;
            return (
              <View
                key={stepIndex}
                style={[
                  styles.progressBarSegment,
                  {
                    backgroundColor: isCompleted
                      ? (theme.cta)
                      : isActive
                      ? theme.textSecondary
                      : theme.border,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + Spacing.six },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentMaxWidth}>
          {currentStep === 0 && (
            <>
              {/* SECTION 1: Adherence Check */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>Adherence Check</ThemedText>
                <ThemedText style={styles.questionText}>
                  Did you complete the assigned activity today?
                </ThemedText>
                <View style={styles.adherenceOptions}>
                  <Pressable
                    style={[
                      styles.optionButton,
                      { borderColor: theme.border },
                      adherence === 'yes' && {
                        backgroundColor: theme.cta,
                        borderColor: 'transparent',
                      },
                    ]}
                    onPress={() => setAdherence('yes')}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        adherence === 'yes' && { color: theme.onCta, fontWeight: '700' },
                      ]}
                    >
                      Yes
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.optionButton,
                      { borderColor: theme.border },
                      adherence === 'no' && {
                        backgroundColor: theme.destructive,
                        borderColor: 'transparent',
                      },
                    ]}
                    onPress={() => setAdherence('no')}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        adherence === 'no' && { color: theme.destructiveForeground, fontWeight: '700' },
                      ]}
                    >
                      No
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.cta },
                  adherence === null && [styles.disabledButton, { borderColor: theme.textSecondary }],
                ]}
                onPress={() => setCurrentStep(1)}
                disabled={adherence === null}
              >
                <ThemedText
                  style={[
                    styles.submitButtonText,
                    { color: theme.onCta },
                    adherence === null && { color: theme.textSecondary },
                  ]}
                >
                  Next Step
                </ThemedText>
              </Pressable>
            </>
          )}

          {currentStep === 1 && (
            <>
              {/* SECTION 2: Emotional Experience (Intro) */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ThemedText style={styles.sectionTitle}>Emotional Experience</ThemedText>
                <ThemedText style={styles.instructionText} themeColor="textSecondary">
                  Please think back on the experiences you had today, and think about the feelings and
                  emotions you felt. Below there are 16 groups of words. Each group has three words that
                  describe very similar emotions or feelings. For each group please mark the number to show
                  how much of the emotions or feelings you felt today.
                </ThemedText>

                <View style={styles.likertLegend}>
                  <ThemedText style={styles.legendText}>1 = Not at all</ThemedText>
                  <ThemedText style={styles.legendText}>5 = Extremely</ThemedText>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.navButtonSecondary, { borderColor: theme.border }]}
                  onPress={() => setCurrentStep(0)}
                >
                  <ThemedText style={[styles.navButtonSecondaryText, { color: theme.text }]}>
                    Back
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.navButtonPrimary, { backgroundColor: theme.cta }]}
                  onPress={() => setCurrentStep(2)}
                >
                  <ThemedText style={[styles.navButtonPrimaryText, { color: theme.onCta }]}>
                    Continue
                  </ThemedText>
                </Pressable>
              </View>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Emotion Group Rows */}
              {EMOTIONS.map((group, index) => {
                const currentRating = ratings[index];
                return (
                  <View
                    key={index}
                    style={[
                      styles.emotionCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <ThemedText style={styles.emotionGroupWords}>{group.label}</ThemedText>
                    
                    <View style={styles.scaleRow}>
                      {[1, 2, 3, 4, 5].map((score) => {
                        const isSelected = currentRating === score;
                        return (
                          <Pressable
                            key={score}
                            style={[
                              styles.scaleBubble,
                              {
                                backgroundColor: theme.inputBackground,
                                borderColor: theme.border,
                              },
                              isSelected && {
                                backgroundColor: theme.cta,
                                borderColor: 'transparent',
                              },
                            ]}
                            onPress={() => handleRating(index, score)}
                          >
                            <ThemedText
                              style={[
                                styles.scaleBubbleText,
                                isSelected && {
                                  color: theme.onCta,
                                  fontWeight: '700',
                                },
                              ]}
                            >
                              {score}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {saveError && (
                <ThemedText style={{ color: theme.destructive, textAlign: 'center' }}>{saveError}</ThemedText>
              )}
              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.navButtonSecondary, { borderColor: theme.border }]}
                  onPress={() => setCurrentStep(1)}
                >
                  <ThemedText style={[styles.navButtonSecondaryText, { color: theme.text }]}>
                    Back
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.navButtonPrimary,
                    { backgroundColor: theme.cta },
                    !isFormValid && [styles.disabledButton, { borderColor: theme.textSecondary }],
                  ]}
                  onPress={handleSubmit}
                  disabled={!isFormValid}
                >
                  <ThemedText
                    style={[
                      styles.navButtonPrimaryText,
                      { color: theme.onCta },
                      !isFormValid && { color: theme.textSecondary },
                    ]}
                  >
                    Submit Reflection
                  </ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 52,
  },
  progressContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  progressHeader: {
    marginBottom: 8,
  },
  progressText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  progressBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollContainer: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  contentMaxWidth: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.two,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  likertLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61, 52, 40, 0.08)',
    paddingTop: 12,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adherenceOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  optionButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  optionText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '600',
  },
  emotionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  emotionGroupWords: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  scaleBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  scaleBubbleText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    width: '100%',
  },
  navButtonSecondary: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonSecondaryText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  navButtonPrimary: {
    flex: 2,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  navButtonPrimaryText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  // Not ready yet: an outlined button that is still clearly readable on navy.
  disabledButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    gap: 16,
  },
  successTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  successSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.four,
    maxWidth: 320,
  },
});
