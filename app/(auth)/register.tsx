import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Field, PrimaryButton } from '@/components/ui';
import { colors, spacing } from '@/lib/theme';

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (fullName.trim().length < 2) {
      Alert.alert('Nom requis', 'Merci d\'indiquer votre nom complet.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Au moins 6 caractères.');
      return;
    }
    try {
      await signUp(email, password, fullName);
      Alert.alert(
        'Compte créé',
        'Vous pouvez maintenant vous connecter. Si la confirmation par email est activée, vérifiez votre boîte mail.',
      );
    } catch (e) {
      Alert.alert('Inscription échouée', (e as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>{"Rejoignez la messagerie de l'entreprise"}</Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Nom complet"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholder="Awa Diack"
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="prenom.nom@entreprise.com"
            />
            <Field
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Au moins 6 caractères"
            />
            <PrimaryButton label="Créer le compte" onPress={handleRegister} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Link href="/(auth)/login" style={styles.link}>
              Se connecter
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.xs },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted },
  form: { gap: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '700' },
});
