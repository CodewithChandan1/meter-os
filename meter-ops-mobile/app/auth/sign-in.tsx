import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Field, PrimaryButton, Toast, styles as ui } from '@/components/MeterUI';

let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {
  // fallback if native module loading
}

import { useToast } from '@/context/ToastContext';

export default function SignIn() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useMeters();
  const { showAlert } = useToast();

  const [hasConfiguredLock, setHasConfiguredLock] = useState(false);
  const [mode, setMode] = useState<'PASSWORD' | 'PIN'>('PASSWORD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Check if lock has been configured and auto-prompt biometrics only if configured
  useEffect(() => {
    let isMounted = true;
    const checkSecuritySetup = async () => {
      try {
        const configured = await AsyncStorage.getItem('security_configured');
        const savedEmail = (await AsyncStorage.getItem('email')) || (await AsyncStorage.getItem('last_email'));

        if (savedEmail) {
          setEmail(savedEmail);
        }

        if (configured === 'true') {
          if (isMounted) {
            setHasConfiguredLock(true);
            setMode('PIN');
          }

          // Trigger Native Fingerprint/Face ID Prompt for Returning Configured User
          if (LocalAuthentication) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock MeterOps Workspace',
                fallbackLabel: 'Use 4-Digit Security PIN',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
              });

              if (result.success && isMounted) {
                const targetEmail = savedEmail || (await AsyncStorage.getItem('last_email')) || email.trim();
                if (targetEmail) {
                  await signIn(targetEmail, 'field-ready');
                  router.replace('/(tabs)');
                  return;
                }
              }
            }
          }
        } else {
          // New User or Unconfigured Device -> Show Clean Sign In / Sign Up
          if (isMounted) {
            setHasConfiguredLock(false);
            setMode('PASSWORD');
          }
        }
      } catch (e) {
        if (isMounted) setMode('PASSWORD');
      }
    };

    const timer = setTimeout(() => {
      checkSecuritySetup();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const triggerNativeBiometricPrompt = async () => {
    try {
      if (LocalAuthentication) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock MeterOps Workspace',
            fallbackLabel: 'Use 4-Digit Security PIN',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
          });

          if (result.success) {
            await signIn(email, 'field-ready');
            router.replace('/(tabs)');
            return;
          }
        }
      }
      setToast('Please enter your 4-Digit Security PIN to unlock.');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Biometric scanner unavailable. Use 4-Digit PIN.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const submit = async () => {
    try {
      setError('');
      if (mode === 'PIN') {
        if (pin.length < 4) {
          setError('Please enter your 4-digit Security PIN.');
          return;
        }
        const savedPin = await AsyncStorage.getItem('user_pin');
        if (savedPin && pin !== savedPin) {
          setError('Incorrect 4-digit Security PIN. Please try again.');
          return;
        }
        const targetEmail = (await AsyncStorage.getItem('email')) || (await AsyncStorage.getItem('last_email')) || email.trim();
        if (!targetEmail) {
          setError('No saved account found for PIN unlock. Please switch to "Password Login" tab to sign in.');
          return;
        }
        await signIn(targetEmail, 'field-ready');
        await AsyncStorage.setItem('email', targetEmail);
        await AsyncStorage.setItem('last_email', targetEmail);
        router.replace('/(tabs)');
        return;
      }

      if (!email.trim() || !password) {
        setError('Please enter email and password.');
        return;
      }

      await signIn(email.trim(), password);
      await AsyncStorage.setItem('email', email.trim());
      await AsyncStorage.setItem('last_email', email.trim());
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Toast message={toast} type="info" visible={!!toast} onClose={() => setToast('')} />

      <View style={[styles.wrap, { paddingTop: insets.top + 36, paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.logo, { backgroundColor: colors.secondary }]}>
          <Feather name="shield" size={25} color={colors.primaryForeground} />
        </View>

        <Text style={[styles.wordmark, { color: colors.foreground }]}>meterops</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {hasConfiguredLock ? 'Workspace Lock' : 'Welcome Back'}
        </Text>
        <Text style={[ui.body, { color: colors.mutedForeground, textAlign: 'center', maxWidth: 290 }]}>
          {hasConfiguredLock
            ? 'Unlock with Fingerprint, Face ID or 4-Digit Security PIN.'
            : 'Sign in to access your smart meter workspace.'}
        </Text>

        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Mode Selector Tabs - Always available on Sign In */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
            <Pressable
              onPress={() => setMode('PIN')}
              style={[
                styles.tabBtn,
                { backgroundColor: mode === 'PIN' ? colors.primary : colors.background, borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: mode === 'PIN' ? colors.primaryForeground : colors.foreground,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                4-Digit PIN Lock
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('PASSWORD')}
              style={[
                styles.tabBtn,
                { backgroundColor: mode === 'PASSWORD' ? colors.primary : colors.background, borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: mode === 'PASSWORD' ? colors.primaryForeground : colors.foreground,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                Password Login
              </Text>
            </Pressable>
          </View>

          {mode === 'PIN' ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[ui.label, { color: colors.foreground }]}>Enter 4-Digit Security PIN</Text>
                <Pressable onPress={triggerNativeBiometricPrompt}>
                  <Feather name="lock" size={20} color={colors.primary} />
                </Pressable>
              </View>

              {/* PIN Dots Display */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 14,
                  justifyContent: 'center',
                  paddingVertical: 10,
                  backgroundColor: colors.background,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginVertical: 4,
                }}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <View
                    key={idx}
                    style={{
                      width: 44,
                      height: 48,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: pin.length > idx ? colors.primary : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.card,
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>
                      {pin[idx] ? '●' : ''}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Keypad */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((digit) => (
                  <Pressable
                    key={digit}
                    onPress={() => {
                      if (digit === 'C') setPin('');
                      else if (digit === '⌫') setPin((prev) => prev.slice(0, -1));
                      else if (pin.length < 4) setPin((prev) => prev + digit);
                    }}
                    style={({ pressed }) => [
                      {
                        width: 72,
                        height: 44,
                        borderRadius: 9,
                        backgroundColor: pressed ? colors.navySoft : colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>{digit}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <>
              <Field
                label="Work email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@company.com"
                testID="sign-in-email"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter password"
                testID="sign-in-password"
              />
              <Pressable
                onPress={() => router.push('/auth/forgot-password')}
                style={{ alignSelf: 'flex-end', marginTop: -4, marginBottom: 4 }}
              >
                <Text style={[ui.caption, { color: colors.primary, fontWeight: '600' }]}>
                  Forgot Password?
                </Text>
              </Pressable>
            </>
          )}

          {error ? <Text style={[ui.caption, { color: colors.destructive }]}>{error}</Text> : null}

          <PrimaryButton
            testID="sign-in-submit"
            label={mode === 'PIN' ? 'Unlock Workspace' : 'Sign In'}
            icon={mode === 'PIN' ? 'lock' : 'arrow-right'}
            onPress={submit}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 6, gap: 4 }}>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/auth/sign-up')}>
              <Text style={[ui.caption, { color: colors.primary, fontWeight: '700' }]}>Sign Up</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          testID="sign-in-help"
          onPress={() =>
            showAlert({
              title: 'MeterOps Help',
              message: 'Sign in using your Work Email and Password, or Sign Up for a new account.',
              type: 'info',
            })
          }
        >
          <Text style={[ui.caption, { color: colors.primary }]}>Need help signing in?</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingHorizontal: 20, gap: 11 },
  logo: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -1, marginTop: 10, textAlign: 'center' },
  form: { width: '100%', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 18, marginTop: 12, gap: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
});