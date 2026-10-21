import { Bird, Check, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { VideoPlayer } from '@/components/video-player';
import { Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';

interface OnboardingFlowProps {
  onDone: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  type?: 'text' | 'video';
  timestamp: Date;
}

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { setUserName } = useStudy();
  const flatListRef = useRef<FlatList>(null);

  // States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<'name' | 'welcome' | 'expectations' | 'video' | 'ready'>('name');
  const [videoWatched, setVideoWatched] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Keyboard listeners for dynamic bottom spacing
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardVisible(false);
    });

    const showSubscriptionAndroid = Keyboard.addListener('keyboardDidShow', () => {
      if (Platform.OS === 'android') setKeyboardVisible(true);
    });
    const hideSubscriptionAndroid = Keyboard.addListener('keyboardDidHide', () => {
      if (Platform.OS === 'android') setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      showSubscriptionAndroid.remove();
      hideSubscriptionAndroid.remove();
    };
  }, []);

  // Initial welcome message from Percy
  useEffect(() => {
    const startFlow = async () => {
      setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Welcome! I am your personal digital coach, Percy. I'm excited to be working together.",
          timestamp: new Date(),
        },
      ]);

      setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setMessages((prev) => [
        ...prev,
        {
          id: '2',
          role: 'assistant',
          content: 'Before we get started, what would you like me to call you? A nickname is perfect. It stays on your phone and is never sent to the research team.',
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    };

    startFlow();
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, isKeyboardVisible]);

  // Handle name submission
  const handleSendName = async () => {
    const trimmed = inputValue.trim();
    const name = trimmed.replace(/^(hello|my name is|i'm|call me|the name is)\s+/i, '');
    const finalName = name.trim();
    if (!finalName) return;

    Keyboard.dismiss();
    await setUserName(finalName);

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setStep('welcome');

    // Trigger Percy replies
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const welcome1: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Hi ${finalName}, welcome! I am your personal digital coach, Percy. I'm excited to be working together.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, welcome1]);

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const welcome2: ChatMessage = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      content: `Over the next few weeks, we are going to be working toward an important goal: helping you become the kind of person you want to be.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, welcome2]);

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const welcome3: ChatMessage = {
      id: (Date.now() + 3).toString(),
      role: 'assistant',
      content: `To make the changes you desire, it will be important to take a close look at some of your current behaviors and to consciously learn some new and desired behaviors. I will support you in this!`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, welcome3]);

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const welcome4: ChatMessage = {
      id: (Date.now() + 4).toString(),
      role: 'assistant',
      content: `So that you can practice your desired behaviors, I will suggest useful and personally tailored exercises for you every week.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, welcome4]);
    setIsTyping(false);
  };

  // Next steps button triggers
  const handleProceedToExpectations = async () => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'What should I expect?',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStep('expectations');

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const expectationsMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `You'll hear from me twice a day. I will do a short check-in every morning, and ask you to complete a brief reflection in the evenings. Most days it'll take just a few minutes.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, expectationsMsg]);
    setIsTyping(false);
  };

  const handleProceedToVideo = async () => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Sounds good. What is next?',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStep('video');

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const videoIntroMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `To begin, I'd like to show you a video about the importance of being kind, generous, and helpful. In this video, you'll learn how small changes in your behavior can boost your well-being, your health, and your relationships.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, videoIntroMsg]);

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Append video card as a special message
    const videoCardMsg: ChatMessage = {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      type: 'video',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, videoCardMsg]);
    setIsTyping(false);
  };

  const startVideoPlayback = () => {
    setIsPlayingVideo(true);
  };

  const handleVideoComplete = () => {
    setIsPlayingVideo(false);
    handleFinishVideo();
  };

  const handleFinishVideo = async () => {
    setVideoWatched(true);
    setStep('ready');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Finished watching the video.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const finalMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Excellent! You are all set to start. Let's head over to your daily dashboard.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, finalMsg]);
    setIsTyping(false);
  };

  // Render message items
  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isBot = item.role === 'assistant';

    if (item.type === 'video') {
      return (
        <View style={styles.messageRowLeft}>
          <View
            style={[
              styles.videoContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <ThemedText style={styles.videoIntroText}>
              Tap below to play the video:
            </ThemedText>
            <VideoCard
              title="Importance of Kindness & Generosity"
              metadata="Intro Video • 3:15"
              onPress={startVideoPlayback}
            />
            {videoWatched && (
              <View style={styles.watchedIndicator}>
                <Check size={16} color="#4CAF50" strokeWidth={3} />
                <ThemedText style={styles.watchedText}>Watched</ThemedText>
              </View>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isBot ? styles.messageRowLeft : styles.messageRowRight]}>
        <View
          style={[
            styles.messageBubble,
            isBot
              ? [styles.messageBubbleLeft, { backgroundColor: theme.card, borderColor: theme.border }]
              : [styles.messageBubbleRight, { backgroundColor: theme.background === '#0A0A0A' ? '#262626' : '#E8DCC8' }],
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              isBot
                ? { color: theme.text, fontFamily: Fonts.serif }
                : { color: theme.text, fontFamily: Fonts.sans },
            ]}
          >
            {item.content}
          </ThemedText>
        </View>
      </View>
    );
  };

  const isDark = theme.background === '#0A0A0A';
  const bottomPadding = isKeyboardVisible
    ? (Platform.OS === 'ios' ? 8 : 16)
    : Math.max(insets.bottom, 16) + 12;

  return (
    <ThemedView style={styles.container}>
      {/* Header Panel */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: isDark ? theme.primary : theme.accent }]}>
            <Bird size={24} color={isDark ? '#171717' : '#ffffff'} />
          </View>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Coach Percy</ThemedText>
            <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
              Personal Digital Coach
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Main Chat Stream */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.flatListContent, { paddingBottom: Spacing.four }]}
          onContentSizeChange={() => scrollToBottom(false)}
        />

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={isDark ? theme.primary : theme.accent} />
            <ThemedText style={styles.loadingText} themeColor="textSecondary">
              Percy is typing...
            </ThemedText>
          </View>
        )}

        {/* Control inputs / Action buttons dock */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          {step === 'name' && (
            <View style={styles.inputInner}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#171717' : '#FAF7F0',
                    color: theme.text,
                    fontFamily: Fonts.sans,
                  },
                ]}
                placeholder="A nickname is fine..."
                placeholderTextColor={isDark ? '#7a7a7a' : '#7A6F5D'}
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleSendName}
                returnKeyType="done"
              />
              <Pressable
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: isDark ? theme.primary : theme.accent,
                  },
                ]}
                onPress={handleSendName}
                disabled={!inputValue.trim()}
              >
                <Send size={18} color={isDark ? '#171717' : '#3D3428'} />
              </Pressable>
            </View>
          )}

          {step === 'welcome' && !isTyping && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: isDark ? theme.primary : theme.accent }]}
              onPress={handleProceedToExpectations}
            >
              <ThemedText style={[styles.actionButtonText, { color: isDark ? '#171717' : '#3D3428' }]}>
                What to expect
              </ThemedText>
            </Pressable>
          )}

          {step === 'expectations' && !isTyping && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: isDark ? theme.primary : theme.accent }]}
              onPress={handleProceedToVideo}
            >
              <ThemedText style={[styles.actionButtonText, { color: isDark ? '#171717' : '#3D3428' }]}>
                Continue
              </ThemedText>
            </Pressable>
          )}

          {step === 'video' && !isTyping && !videoWatched && (
            <Pressable
              style={[
                styles.actionButton,
                styles.disabledButton,
                { backgroundColor: theme.muted },
              ]}
              disabled
            >
              <ThemedText style={[styles.actionButtonText, { color: theme.mutedForeground }]}>
                Tap video card above to play
              </ThemedText>
            </Pressable>
          )}

          {step === 'ready' && !isTyping && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: isDark ? theme.primary : theme.accent }]}
              onPress={onDone}
            >
              <ThemedText style={[styles.actionButtonText, { color: isDark ? '#171717' : '#3D3428' }]}>
                Get Started
              </ThemedText>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {isPlayingVideo && (
        <View style={styles.videoPlayerOverlay}>
          <View style={styles.videoPlayerCard}>
            <View style={styles.videoPlayerHeader}>
              <ThemedText style={styles.videoPlayerTitle}>Playing Video</ThemedText>
              <ThemedText style={styles.videoPlayerSubtitle} themeColor="textSecondary">
                Kindness & Generosity Introduction
              </ThemedText>
            </View>

            <VideoPlayer
              videoId="6RypXcD_u1w"
              width={Math.min(Dimensions.get('window').width - Spacing.four * 4, 368)}
            />

            <Pressable
              style={[styles.videoCompleteButton, { backgroundColor: isDark ? '#262626' : '#E8DCC8' }]}
              onPress={handleVideoComplete}
            >
              <ThemedText style={styles.videoCompleteText}>Skip to End</ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  flatListContent: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
    width: '100%',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  messageBubbleLeft: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  messageBubbleRight: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  videoContainer: {
    width: '85%',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
  },
  videoIntroText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  watchedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  watchedText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingTop: 12,
    paddingHorizontal: Spacing.four,
    borderTopWidth: 1,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  actionButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  videoPlayerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    zIndex: 999,
  },
  videoPlayerCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#171717',
    borderRadius: 24,
    padding: Spacing.four,
    gap: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  videoPlayerHeader: {
    alignItems: 'center',
    gap: 4,
  },
  videoPlayerTitle: {
    color: '#ffffff',
    fontFamily: Fonts.serif,
    fontSize: 20,
    fontWeight: '700',
  },
  videoPlayerSubtitle: {
    color: '#a1a1a1',
    fontSize: 14,
    textAlign: 'center',
  },
  videoCompleteButton: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  videoCompleteText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
