import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { Field, PrimaryButton } from '@/components/ui';
import { colors, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const { session, profile, signOut, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (fullName.trim().length < 2) {
      Alert.alert('Nom requis', 'Merci d\'indiquer votre nom.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', session!.user.id);
      if (error) throw error;
      await refreshProfile();
      Alert.alert('Enregistré', 'Votre profil a été mis à jour.');
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar name={profile?.full_name} uri={profile?.avatar_url} seed={profile?.id} size={88} />
        <Text style={styles.email}>{session?.user.email}</Text>
        {profile?.role === 'admin' && <Text style={styles.badge}>Administrateur</Text>}
      </View>

      <View style={styles.form}>
        <Field label="Nom complet" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <PrimaryButton label="Enregistrer" onPress={handleSave} loading={saving} />
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Se déconnecter" variant="ghost" onPress={handleSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.sm },
  email: { fontSize: 15, color: colors.textMuted },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  form: { gap: spacing.lg },
  footer: { marginTop: 'auto' },
});
