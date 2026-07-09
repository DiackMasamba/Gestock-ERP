import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/ui';
import { queryKeys } from '@/hooks/queryKeys';
import { useColleagues } from '@/hooks/useConversations';
import { colors, radius, spacing } from '@/lib/theme';
import {
  createDirectConversation,
  createGroupConversation,
} from '@/services/conversations';

export default function NewConversationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: colleagues, isLoading } = useColleagues();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const isGroup = selected.size > 1;

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreate = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (isGroup && groupName.trim().length < 2) {
      Alert.alert('Nom du groupe', 'Merci de nommer le groupe.');
      return;
    }
    setCreating(true);
    try {
      const conversationId = isGroup
        ? await createGroupConversation(groupName.trim(), ids)
        : await createDirectConversation(ids[0]);
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      router.replace(`/chat/${conversationId}`);
    } catch (e) {
      Alert.alert('Création impossible', (e as Error).message);
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isGroup && (
        <View style={styles.groupNameWrap}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Nom du groupe"
            placeholderTextColor={colors.textMuted}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>
      )}

      <Text style={styles.sectionLabel}>
        {selected.size === 0
          ? 'Sélectionnez un ou plusieurs collègues'
          : `${selected.size} sélectionné(s)`}
      </Text>

      <View style={styles.list}>
        {(colleagues ?? []).map((c) => {
          const active = selected.has(c.id);
          return (
            <Pressable key={c.id} style={styles.row} onPress={() => toggle(c.id)}>
              <Avatar name={c.full_name} uri={c.avatar_url} seed={c.id} />
              <Text style={styles.name}>{c.full_name ?? 'Collègue'}</Text>
              <View style={[styles.checkbox, active && styles.checkboxActive]}>
                {active && <Text style={styles.check}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
        {(colleagues ?? []).length === 0 && (
          <Text style={styles.emptyText}>
            {"Aucun collègue pour l'instant. Invitez vos collaborateurs à créer un compte."}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={isGroup ? 'Créer le groupe' : 'Démarrer la discussion'}
          onPress={handleCreate}
          loading={creating}
          disabled={selected.size === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  groupNameWrap: { padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  groupNameInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  name: { flex: 1, fontSize: 16, color: colors.text },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.textInverse, fontSize: 15, fontWeight: '800' },
  emptyText: { padding: spacing.xl, color: colors.textMuted, textAlign: 'center' },
  footer: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
