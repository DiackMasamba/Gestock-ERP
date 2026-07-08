import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { avatarColor, colors, initials } from '@/lib/theme';

interface AvatarProps {
  name: string | null | undefined;
  uri?: string | null;
  seed?: string;
  size?: number;
}

export function Avatar({ name, uri, seed, size = 44 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={dimension} contentFit="cover" />;
  }

  return (
    <View
      style={[
        styles.fallback,
        dimension,
        { backgroundColor: avatarColor(seed ?? name ?? '?') },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textInverse,
    fontWeight: '700',
  },
});
