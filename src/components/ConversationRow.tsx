import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { conversationTitle, directPeer, formatRelative, messagePreview } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { ConversationSummary } from '@/types/database';
import { Avatar } from './Avatar';

interface Props {
  conversation: ConversationSummary;
  currentUserId: string;
}

export function ConversationRow({ conversation, currentUserId }: Props) {
  const title = conversationTitle(conversation, currentUserId);
  const peer = directPeer(conversation.members, currentUserId);
  const unread = conversation.unread_count;

  return (
    <Link href={`/chat/${conversation.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {conversation.type === 'group' ? (
          <View style={[styles.groupAvatar]}>
            <Text style={styles.groupIcon}>#</Text>
          </View>
        ) : (
          <Avatar name={peer?.full_name} uri={peer?.avatar_url} seed={peer?.id} />
        )}

        <View style={styles.body}>
          <View style={styles.topLine}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {conversation.last_message && (
              <Text style={styles.time}>
                {formatRelative(conversation.last_message.created_at)}
              </Text>
            )}
          </View>
          <View style={styles.bottomLine}>
            <Text
              style={[styles.preview, unread > 0 && styles.previewUnread]}
              numberOfLines={1}
            >
              {messagePreview(conversation.last_message)}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  pressed: { backgroundColor: colors.surface },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIcon: { color: colors.textInverse, fontSize: 22, fontWeight: '700' },
  body: { flex: 1, gap: 2 },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted, marginLeft: spacing.sm },
  bottomLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { flex: 1, fontSize: 14, color: colors.textMuted },
  previewUnread: { color: colors.text, fontWeight: '500' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  badgeText: { color: colors.textInverse, fontSize: 12, fontWeight: '700' },
});
