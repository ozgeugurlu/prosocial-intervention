import { useRouter } from 'expo-router';

import { Tutorial } from '@/components/tutorial';

/** Replays the app walkthrough from the Me tab (reminder step omitted; that has its own screen). */
export default function TourScreen() {
  const router = useRouter();
  return <Tutorial askForReminders={false} onDone={() => router.back()} />;
}
