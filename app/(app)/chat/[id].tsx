import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Composer } from '@/components/Composer';
import { MessageBubble } from '@/components/MessageBubble';
import { queryKeys } from '@/hooks/queryKeys';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { conversationTitle } from '@/lib/format';
import { colors, spacing } from '@/lib/theme';
import { getConversation } from '@/services/conversations';
import { markConversationRead } from '@/services/messages';
import type { MessageWithSender } from '@/types/database';

interface Row {
  message: MessageWithSender;
  showAuthor: boolean;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id!;
  const { session } = useAuth();
  const userId = session!.user.id;
  const insets = useSafeAreaInsets();

  const { data: conversation } = useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => getConversation(conversationId),
  });

  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  useRealtimeMessages(conversationId);

  const isGroup = conversation?.type === 'group';
  const title = conversation
    ? conversationTitle(conversation, userId)
    : 'Discussion';

  // Marque comme lu à l'arrivée et à chaque nouveau message.
  useEffect(() => {
    void markConversationRead(conversationId, userId);
  }, [conversationId, userId, messages?.length]);

  // Prépare les lignes (ordre inversé pour la FlashList `inverted`).
  const rows = useMemo<Row[]>(() => {
    const list = messages ?? [];
    const built: Row[] = list.map((message, index) => {
      const prev = list[index - 1];
      const showAuthor = isGroup && message.sender_id !== prev?.sender_id;
      return { message, showAuthor };
    });
    return built.reverse();
  }, [messages, isGroup]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 44}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlashList
            data={rows}
            inverted
            keyExtractor={(item) => item.message.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item.message}
                mine={item.message.sender_id === userId}
                showAuthor={item.showAuthor}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Démarrez la conversation en envoyant un message.
                </Text>
              </View>
            }
          />
        )}

        <Composer
          conversationId={conversationId}
          onSendText={(content) => sendMessage.mutate({ content })}
          onSendAttachment={({ path, type, name }) =>
            sendMessage.mutate({
              attachmentUrl: path,
              attachmentType: type,
              attachmentName: name,
            })
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingVertical: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, transform: [{ scaleY: -1 }] },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
});
