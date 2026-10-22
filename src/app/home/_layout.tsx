import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="survey" options={{ presentation: 'card' }} />
      <Stack.Screen name="weekly-survey" options={{ presentation: 'card' }} />
      <Stack.Screen name="goal" options={{ presentation: 'card' }} />
    </Stack>
  );
}
