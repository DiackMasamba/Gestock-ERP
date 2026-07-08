import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSignedUrl } from '@/hooks/useSignedUrl';
import { colors, radius, spacing } from '@/lib/theme';
import type { AttachmentType } from '@/types/database';

interface Props {
  path: string;
  type: AttachmentType;
  name?: string | null;
  mine: boolean;
}

export function AttachmentView({ path, type, name, mine }: Props) {
  const { data: url, isLoading } = useSignedUrl(path);

  if (type === 'image') {
    return (
      <View style={styles.imageWrap}>
        {url ? (
          <Image source={{ uri: url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>{isLoading ? '…' : '⚠️'}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <Pressable
      style={styles.fileCard}
      disabled={!url}
      onPress={() => url && Linking.openURL(url)}
    >
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>📎</Text>
      </View>
      <Text
        style={[styles.fileName, mine && styles.fileNameMine]}
        numberOfLines={1}
      >
        {name ?? 'Fichier'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imageWrap: { borderRadius: radius.md, overflow: 'hidden' },
  image: { width: 220, height: 220, backgroundColor: colors.surface },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 24 },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 220,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: { fontSize: 18 },
  fileName: { flex: 1, fontSize: 14, color: colors.text, textDecorationLine: 'underline' },
  fileNameMine: { color: colors.textInverse },
});
