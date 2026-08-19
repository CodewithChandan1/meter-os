import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMeters } from '@/context/MeterContext';
import { AuthWaveHeader } from '@/components/AuthWaveHeader';
import { AuthUnderlineInput } from '@/components/AuthUnderlineInput';
import { getApiBaseUrl, fetchWithTimeout } from '@/lib/api-config';

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const { signIn, updateUser } = useMeters();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
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
    if (!agreeTerms) {
      setError('Please agree with Terms & Conditions to proceed.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const baseUrl = getApiBaseUrl();
      const res = await fetchWithTimeout(
        `${baseUrl}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName.trim(),
            email: email.trim(),
            role: 'Field Specialist',
          }),
        },
        8000
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      await signIn(email.trim(), password, fullName.trim());
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('email', email.trim());
      updateUser({ name: fullName.trim(), email: email.trim(), role: 'Field Specialist' });

      router.replace('/auth/security-setup');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to create account. Please check server connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 30 }}>
        {/* Top Wave Graphic Header */}
        <AuthWaveHeader />

        <View style={styles.content}>
          {/* Top Right Header Tab Switcher */}
          <View style={styles.tabHeaderRow}>
            <View style={styles.tabActiveWrapper}>
              <Text style={[styles.tabText, styles.tabActive]}>Sign up</Text>
              <View style={styles.tabIndicator} />
            </View>
            <Pressable onPress={() => router.push('/auth/sign-in')}>
              <Text style={[styles.tabText, styles.tabInactive]}>Sign in</Text>
            </Pressable>
          </View>

          {/* Form Underline Fields */}
          <View style={{ marginVertical: 12 }}>
            <AuthUnderlineInput
              label="Full name"
              iconName="user"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              testID="sign-up-name"
            />

            <AuthUnderlineInput
              label="E-mail"
              iconName="mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="E-mail address"
              testID="sign-up-email"
            />

            <AuthUnderlineInput
              label="Password"
              iconName="lock"
              isPassword
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 6 chars)"
              testID="sign-up-password"
            />

            <AuthUnderlineInput
              label="Confirm Password"
              iconName="lock"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              testID="sign-up-confirm-password"
            />
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Checkbox: Agree with Terms & Conditions */}
          <Pressable
            onPress={() => setAgreeTerms(!agreeTerms)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Feather name="check" size={13} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Agree with <Text style={styles.boldBlueText}>Terms & Conditions</Text>
            </Text>
          </Pressable>

          {/* Pill Action Button: Sign up */}
          <Pressable
            testID="sign-up-submit"
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => [
              styles.pillButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.pillButtonText}>
              {loading ? 'Creating account…' : 'Sign up'}
            </Text>
          </Pressable>

          {/* Bottom Switch Link */}
          <Pressable
            onPress={() => router.push('/auth/sign-in')}
            style={styles.bottomLinkPress}
          >
            <Text style={styles.bottomLinkText}>I'm already a member</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 28,
    paddingTop: 10,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 22,
    marginBottom: 8,
  },
  tabText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  tabInactive: {
    color: '#94A3B8',
  },
  tabActive: {
    color: '#0052D4',
  },
  tabActiveWrapper: {
    alignItems: 'center',
  },
  tabIndicator: {
    width: 24,
    height: 3,
    backgroundColor: '#0052D4',
    borderRadius: 2,
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0052D4',
    borderColor: '#0052D4',
  },
  checkboxLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#475569',
  },
  boldBlueText: {
    color: '#0052D4',
    fontFamily: 'Inter_600SemiBold',
  },
  pillButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0052D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0052D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  pillButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  bottomLinkPress: {
    alignItems: 'center',
    marginTop: 22,
  },
  bottomLinkText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#0052D4',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#EF4444',
    marginTop: 4,
  },
});
