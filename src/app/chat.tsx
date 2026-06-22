import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bird, Send } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStudy } from '@/contexts/study-context';
import { sendMessageToOpenAI, ChatMessage } from '@/utils/openai';

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { userName } = useStudy();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello${userName ? ' ' + userName : ''}! I'm Percy, your personal digital coach. I'm here to support you in becoming more prosocial and achieving your change goals. How are you feeling today?`,
      timestamp: new Date(),
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

    // Fallbacks for Android since it doesn't support WillShow/WillHide
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

  // Auto scroll to bottom when messages list updates or keyboard shows
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isKeyboardVisible]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessageToOpenAI([...messages, userMessage]);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to get bot response:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme.background === '#0A0A0A';

  // Dynamic spacer when keyboard is not visible, to clear the floating bottom tab bar
  const bottomSpacing = isKeyboardVisible 
    ? (Platform.OS === 'ios' ? 8 : 16) 
    : Math.max(insets.bottom, 16) + 84;

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isBot = item.role === 'assistant';
    
    return (
      <View style={[
        styles.messageRow,
        isBot ? styles.messageRowLeft : styles.messageRowRight
      ]}>
        <View style={[
          styles.messageBubble,
          isBot 
            ? [styles.messageBubbleLeft, { backgroundColor: theme.card, borderColor: theme.border }]
            : [styles.messageBubbleRight, { backgroundColor: isDark ? '#262626' : '#E8DCC8' }]
        ]}>
          <ThemedText style={[
            styles.messageText,
            isBot 
              ? { color: theme.text, fontFamily: Fonts.serif } // Bot speaks in serif font per design
              : { color: theme.text, fontFamily: Fonts.sans }
          ]}>
            {item.content}
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
            <Bird size={24} color={isDark ? '#171717' : '#ffffff'} />
          </View>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Percy</ThemedText>
            <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
              Personal digital coach
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Keyboard Avoiding Container for message stream and input docking */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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

        {/* Loading Indicator for Percy's typing */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={isDark ? theme.primary : theme.accent} />
            <ThemedText style={styles.loadingText} themeColor="textSecondary">
              Percy is typing...
            </ThemedText>
          </View>
        )}

        {/* Input Bar Section */}
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
              placeholder="Type your message..."
              placeholderTextColor={isDark ? '#7a7a7a' : '#7A6F5D'}
              value={inputValue}
              onChangeText={setInputValue}
              multiline={false}
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
});
