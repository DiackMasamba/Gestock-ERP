import { FlashList } from '@shopify/flash-list';
import { Link, Stack } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { ConversationRow } from '@/components/ConversationRow';
import { useConversations } from '@/hooks/useConversations';
import { colors, spacing } from '@/lib/theme';

export default function ConversationsScreen() {
  const { session } = useAuth();
  const { data, isLoading, isError, error, refetch, isRefetching } = useConversations();
  const userId = session?.user.id ?? '';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable hitSlop={8} style={styles.headerButton}>
                <Text style={styles.headerIcon}>⚙️</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      {isLoading ? (
        <Centered>
          <ActivityIndicator size="large" color={colors.primary} />
        </Centered>
      ) : isError ? (
        <Centered>
          <Text style={styles.errorText}>Erreur de chargement</Text>
          <Text style={styles.errorDetail}>{(error as Error).message}</Text>
        </Centered>
      ) : (
        <FlashList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow conversation={item} currentUserId={userId} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <Centered>
              <Text style={styles.emptyTitle}>Aucune discussion</Text>
              <Text style={styles.emptyText}>
                Appuyez sur le bouton + pour démarrer une conversation.
              </Text>
            </Centered>
          }
          contentContainerStyle={(data ?? []).length === 0 ? styles.emptyContainer : undefined}
        />
      )}

      <Link href="/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyContainer: { flexGrow: 1 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 72 },
  headerButton: { paddingHorizontal: spacing.sm },
  headerIcon: { fontSize: 20 },
  errorText: { fontSize: 16, fontWeight: '700', color: colors.danger },
  errorDetail: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabIcon: { color: colors.textInverse, fontSize: 32, lineHeight: 34 },
});
