import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Field, PrimaryButton, styles as ui } from '@/components/MeterUI';
import { getApiBaseUrl, fetchWithTimeout } from '@/lib/api-config';

export default function SignUp() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, updateUser } = useMeters();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Send registration payload to backend API (saves to Neon Postgres)
      const baseUrl = getApiBaseUrl();
      const res = await fetchWithTimeout(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          role: 'Field Specialist',
        }),
      }, 8000);

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }
      console.log('[SIGN-UP API SUCCESS]:', data);

      // Create session & update name (Must succeed, otherwise error caught)
      await signIn(email.trim(), password, fullName.trim());
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('email', email.trim());
      updateUser({ name: fullName.trim(), email: email.trim(), role: 'Field Specialist' });
      
      router.replace('/auth/security-setup');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={[styles.wrap, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 30 }]}>
          <View style={[styles.logo, { backgroundColor: colors.secondary }]}>
            <Feather name="user-plus" size={24} color={colors.primaryForeground} />
          </View>

          <Text style={[styles.wordmark, { color: colors.foreground }]}>meterops</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Create an Account</Text>
          <Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'center', maxWidth: 290 }]}>
            Join your field team workspace to manage & track meters seamlessly.
          </Text>

          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[ui.cardTitle, { color: colors.foreground }]}>Register new field specialist</Text>

            <Field
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
              testID="sign-up-name"
            />

            <Field
              label="Work Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@meterops.co"
              testID="sign-up-email"
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Min. 6 characters"
              testID="sign-up-password"
            />

            <Field
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter password"
              testID="sign-up-confirm-password"
            />

            {error ? <Text style={[ui.caption, { color: colors.destructive }]}>{error}</Text> : null}

            <PrimaryButton testID="sign-up-submit" label="Create Account" icon="arrow-right" loading={loading} onPress={submit} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 4 }}>
              <Text style={[ui.caption, { color: colors.mutedForeground }]}>Already have an account?</Text>
              <Pressable onPress={() => router.push('/auth/sign-in')}>
                <Text style={[ui.caption, { color: colors.primary, fontWeight: '700' }]}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -1, marginTop: 10, textAlign: 'center' },
  form: { width: '100%', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 18, marginTop: 14, gap: 14 },
});
