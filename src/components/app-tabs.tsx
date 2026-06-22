import { useTheme } from '@/hooks/use-theme';
import { Tabs } from 'expo-router';
import { Calendar, Home, Image as ImageIcon, MessageCircle, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabBarProps {
  state: {
    index: number;
    routes: {
      key: string;
      name: string;
      params?: any;
    }[];
  };
  descriptors: Record<string, {
    options: {
      tabBarLabel?: any;
      title?: string;
      tabBarAccessibilityLabel?: string;
      tabBarTestID?: string;
    };
  }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: any) => void;
  };
}

const getIconComponent = (routeName: string) => {
  switch (routeName) {
    case 'home':
      return Home;
    case 'chat':
      return MessageCircle;
    case 'explore':
      return ImageIcon;
    case 'calendar':
      return Calendar;
    case 'profile':
      return Users;
    default:
      return Home;
  }
};

function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Hide the floating tab bar when the keyboard is open to prevent overlapping
  if (isKeyboardVisible) {
    return null;
  }

  // Position nicely relative to the home indicator (ignoring web since we are shipping to iOS and Android only)
  const bottomOffset = Math.max(insets.bottom, 16);

  const isDark = theme.background === '#0A0A0A';

  // Background of the tab bar itself (card background)
  const barBg = theme.card;

  return (
    <View style={[styles.barContainer, { bottom: bottomOffset }]}>
      <View style={[
        styles.barInner,
        {
          backgroundColor: barBg,
          borderColor: theme.border,
          shadowColor: isDark ? '#000000' : theme.text,
        }
      ]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const IconComponent = getIconComponent(route.name);

          // Style definitions based on active state and light/dark theme
          const buttonBg = isFocused
            ? (isDark ? theme.primary : theme.accent) // gold/mustard in light, white in dark
            : (isDark ? '#171717' : theme.background); // warm sand in light, element background in dark

          const iconColor = isFocused
            ? (isDark ? '#171717' : theme.text) // dark brown/charcoal text color on active gold tab in light
            : theme.textSecondary; // muted text color for inactive

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                {
                  backgroundColor: buttonBg,
                },
                isFocused && styles.activeButtonShadow,
              ]}
            >
              <IconComponent
                size={22}
                color={iconColor}
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props as any} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Gallery',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '92%',
    maxWidth: 380,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 32,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    borderRadius: 20,
  },
  activeButtonShadow: {
    shadowColor: '#3D3428',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
});
