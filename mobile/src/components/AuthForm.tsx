import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';
import { AppText } from './ui/AppText';
import { FormField } from './ui/FormField';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

export function AuthForm({ mode, initialReferral }: { mode: 'login' | 'signup'; initialReferral?: string }) {
  const { t } = useLanguage();
  const { login, signup } = useAuth();
  const isSignup = mode === 'signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferral ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (isSignup && name.trim().length < 2) next.name = t.auth.shortName;
    if (!EMAIL_RE.test(email.trim())) next.email = t.auth.invalidEmail;
    if (isSignup ? password.length < 8 : !password) next.password = t.auth.shortPassword;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup({ name: name.trim(), email: email.trim(), password, referralCode: referralCode.trim() || undefined });
      } else {
        await login(email.trim(), password);
      }
      close();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={close} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel={t.close}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>

          <AppText weight="bold" size={26}>
            {isSignup ? t.auth.signupTitle : t.auth.loginTitle}
          </AppText>
          <AppText color={colors.textMuted} style={styles.subtitle}>
            {isSignup ? t.auth.signupSubtitle : t.auth.loginSubtitle}
          </AppText>

          <View style={styles.fields}>
            {isSignup && (
              <FormField label={t.auth.name} value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" />
            )}
            <FormField
              label={t.auth.email}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <FormField
              label={t.auth.password}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              textContentType={isSignup ? 'newPassword' : 'password'}
              onSubmitEditing={isSignup ? undefined : submit}
            />
            {isSignup && (
              <FormField label={t.auth.referralCode} value={referralCode} onChangeText={setReferralCode} autoCapitalize="characters" />
            )}
          </View>

          {serverError && (
            <View style={styles.serverError}>
              <AppText size={13} color={colors.danger}>
                {serverError}
              </AppText>
            </View>
          )}

          <Pressable onPress={submit} disabled={submitting} style={[styles.button, submitting && styles.disabled]} accessibilityRole="button">
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText weight="semibold" size={16} color={colors.white}>
                {isSignup ? t.auth.signup : t.auth.login}
              </AppText>
            )}
          </Pressable>

          <View style={styles.switchRow}>
            <AppText color={colors.textMuted}>{isSignup ? t.auth.haveAccount : t.auth.noAccount}</AppText>
            <Pressable onPress={() => router.replace(isSignup ? '/login' : '/signup')} accessibilityRole="link">
              <AppText weight="semibold" color={colors.primary}>
                {isSignup ? t.auth.login : t.auth.signup}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 24, paddingTop: 12 },
  close: { alignSelf: 'flex-end', marginBottom: 12 },
  subtitle: { marginTop: 4 },
  fields: { gap: 14, marginTop: 24 },
  serverError: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 10, marginTop: 16 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  disabled: { opacity: 0.7 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 18 },
});
