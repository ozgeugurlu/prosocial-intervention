import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Lightbulb, Send, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

interface SupportMessage {
  id: string;
  role: 'user' | 'support';
  content: string;
  timestamp: string;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: '1',
      role: 'support',
      content: "Welcome to the support channel! Our team is here to help with any technical questions or concerns about the app. How can we assist today?",
      timestamp: '13:27',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

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

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isKeyboardVisible]);

  const getFormattedTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: SupportMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Simulate Support response after a short delay
    setTimeout(() => {
      const responseMsg: SupportMessage = {
        id: (Date.now() + 1).toString(),
        role: 'support',
        content: "Thank you for your message. Our technical support team has received your ticket and will respond here shortly. We appreciate your patience!",
        timestamp: getFormattedTime(),
      };
      setMessages((prev) => [...prev, responseMsg]);
      setIsLoading(false);
    }, 2000);
  };

  const isDark = theme.background === '#0A0A0A';

  // Space to account for floating navigation tab bar at the bottom
  const bottomSpacing = isKeyboardVisible
    ? (Platform.OS === 'ios' ? 8 : 16)
    : Math.max(insets.bottom, 16) + 84;

  const renderItem = ({ item }: { item: SupportMessage }) => {
    const isSupport = item.role === 'support';

    return (
      <View style={[
        styles.messageRow,
        isSupport ? styles.messageRowLeft : styles.messageRowRight
      ]}>
        <View style={[
          styles.messageBubble,
          isSupport
            ? [styles.messageBubbleLeft, { backgroundColor: theme.card, borderColor: theme.border }]
            : [styles.messageBubbleRight, { backgroundColor: isDark ? '#262626' : '#E8DCC8' }]
        ]}>
          <ThemedText style={[
            styles.messageText,
            { color: theme.text, fontFamily: Fonts.sans } // Support team uses Sans font
          ]}>
            {item.content}
          </ThemedText>
          <ThemedText style={styles.timestampText} themeColor="textSecondary">
            {item.timestamp}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header Container */}
      <View style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        }
      ]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: isDark ? theme.primary : theme.accent }]}>
            <Users size={22} color={isDark ? '#171717' : '#ffffff'} />
          </View>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Support Team</ThemedText>
            <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
              {"We're here to help"}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Keyboard Avoiding Area */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.flatListContent,
            { paddingBottom: Spacing.four }
          ]}
          onContentSizeChange={() => scrollToBottom(false)}
        />

        {/* Support typing loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={isDark ? theme.primary : theme.accent} />
            <ThemedText style={styles.loadingText} themeColor="textSecondary">
              Support agent is typing...
            </ThemedText>
          </View>
        )}

        {/* Info Box Banner (Replaced emoji with premium Lucide Lightbulb icon per request) */}
        <View style={[
          styles.infoBox,
          {
            backgroundColor: isDark ? '#171717' : '#FAF7F0',
            borderColor: theme.border,
          }
        ]}>
          <Lightbulb size={16} color={isDark ? theme.primary : theme.accent} style={styles.infoIcon} />
          <ThemedText style={styles.infoText} themeColor="textSecondary">
            This channel is for technical support only. For intervention-related questions, please chat with Percy.
          </ThemedText>
        </View>

        {/* Input Dock */}
        <View style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            paddingBottom: bottomSpacing,
            borderTopColor: theme.border,
          }
        ]}>
          <View style={styles.inputInner}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#171717' : '#FAF7F0',
                  color: theme.text,
                  fontFamily: Fonts.sans,
                }
              ]}
              placeholder="Ask a question..."
              placeholderTextColor={isDark ? '#7a7a7a' : '#7A6F5D'}
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable
              style={[
                styles.sendButton,
                {
                  backgroundColor: isDark ? theme.primary : theme.accent,
                }
              ]}
              onPress={handleSend}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send size={18} color={isDark ? '#171717' : '#3D3428'} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
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
  timestampText: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 6,
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
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
});
