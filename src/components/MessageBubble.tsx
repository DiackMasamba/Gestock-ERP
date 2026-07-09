import { StyleSheet, Text, View } from 'react-native';

import { formatTime } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { MessageWithSender } from '@/types/database';
import { AttachmentView } from './AttachmentView';

interface Props {
  message: MessageWithSender;
  mine: boolean;
  /** Affiche le nom de l'auteur (conversations de groupe, messages des autres). */
  showAuthor: boolean;
}

export function MessageBubble({ message, mine, showAuthor }: Props) {
  const pending = message.id.startsWith('optimistic-');

  return (
    <View style={[styles.container, mine ? styles.containerMine : styles.containerOther]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleOther,
          pending && styles.pending,
        ]}
      >
        {showAuthor && !mine && (
          <Text style={styles.author}>{message.sender?.full_name ?? 'Inconnu'}</Text>
        )}

        {message.attachment_url && message.attachment_type && (
          <AttachmentView
            path={message.attachment_url}
            type={message.attachment_type}
            name={message.attachment_name}
            mine={mine}
          />
        )}

        {!!message.content && (
          <Text style={[styles.text, mine ? styles.textMine : styles.textOther]}>
            {message.content}
          </Text>
        )}

        <Text style={[styles.time, mine ? styles.timeMine : styles.timeOther]}>
          {pending ? 'Envoi…' : formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, marginVertical: 2 },
  containerMine: { alignItems: 'flex-end' },
  containerOther: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  bubbleMine: { backgroundColor: colors.bubbleMine, borderBottomRightRadius: radius.sm },
  bubbleOther: { backgroundColor: colors.bubbleOther, borderBottomLeftRadius: radius.sm },
  pending: { opacity: 0.7 },
  author: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  text: { fontSize: 15, lineHeight: 20 },
  textMine: { color: colors.textInverse },
  textOther: { color: colors.text },
  time: { fontSize: 10, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  timeOther: { color: colors.textMuted },
});
