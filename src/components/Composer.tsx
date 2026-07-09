import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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

import { colors, radius, spacing } from '@/lib/theme';
import { uploadAttachment, type LocalAttachment } from '@/services/storage';
import type { AttachmentType } from '@/types/database';

interface SendAttachmentArgs {
  path: string;
  type: AttachmentType;
  name: string;
}

interface Props {
  conversationId: string;
  onSendText: (text: string) => void;
  onSendAttachment: (args: SendAttachmentArgs) => void;
}

export function Composer({ conversationId, onSendText, onSendAttachment }: Props) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    onSendText(trimmed);
  };

  const upload = async (file: LocalAttachment, type: AttachmentType) => {
    setUploading(true);
    try {
      const path = await uploadAttachment(conversationId, file);
      onSendAttachment({ path, type, name: file.name });
    } catch (e) {
      Alert.alert('Envoi impossible', (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission requise', "L'accès aux photos est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await upload(
      {
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      },
      'image',
    );
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await upload(
      {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      },
      'file',
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.iconButton}
        onPress={pickImage}
        disabled={uploading}
        hitSlop={8}
      >
        <Text style={styles.icon}>🖼️</Text>
      </Pressable>
      <Pressable
        style={styles.iconButton}
        onPress={pickDocument}
        disabled={uploading}
        hitSlop={8}
      >
        <Text style={styles.icon}>📎</Text>
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder="Message…"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        editable={!uploading}
      />

      {uploading ? (
        <View style={styles.sendButton}>
          <ActivityIndicator color={colors.textInverse} size="small" />
        </View>
      ) : (
        <Pressable
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSendText}
          disabled={!text.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.border },
  sendIcon: { color: colors.textInverse, fontSize: 18, transform: [{ rotate: '0deg' }] },
});
