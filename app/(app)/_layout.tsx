import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/lib/theme';
import { registerForPushNotifications } from '@/services/push';

export default function AppLayout() {
  const { session } = useAuth();
  const router = useRouter();

  // Enregistre le token push une fois connecté.
  useEffect(() => {
    if (session) {
      void registerForPushNotifications(session.user.id);
    }
  }, [session]);

  // Ouvre la conversation quand on tape sur une notification.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const conversationId = response.notification.request.content.data?.conversationId;
      if (typeof conversationId === 'string') {
        router.push(`/chat/${conversationId}`);
      }
    });
    return () => sub.remove();
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Discussions' }} />
      <Stack.Screen name="new" options={{ title: 'Nouvelle discussion', presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: 'Profil' }} />
      <Stack.Screen name="chat/[id]" options={{ title: '' }} />
    </Stack>
  );
}
