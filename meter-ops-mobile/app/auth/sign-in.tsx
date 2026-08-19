import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { AuthWaveHeader } from '@/components/AuthWaveHeader';
import { AuthUnderlineInput } from '@/components/AuthUnderlineInput';
import { Toast } from '@/components/MeterUI';
import { useToast } from '@/context/ToastContext';

let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {
  // fallback
}

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
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let isMounted = true;
    const checkSecuritySetup = async () => {
      try {
        const configured = await AsyncStorage.getItem('security_configured');
        const savedEmail =
          (await AsyncStorage.getItem('email')) || (await AsyncStorage.getItem('last_email'));

        if (savedEmail) {
          setEmail(savedEmail);
        }

        if (configured === 'true') {
          if (isMounted) {
            setHasConfiguredLock(true);
            setMode('PIN');
          }

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
                const targetEmail =
                  savedEmail || (await AsyncStorage.getItem('last_email')) || email.trim();
                if (targetEmail) {
                  await signIn(targetEmail, 'field-ready');
                  router.replace('/(tabs)');
                  return;
                }
              }
            }
          }
        } else {
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
        const targetEmail =
          (await AsyncStorage.getItem('email')) ||
          (await AsyncStorage.getItem('last_email')) ||
          email.trim();
        if (!targetEmail) {
          setError(
            'No saved account found for PIN unlock. Switch to Password Login to sign in.'
          );
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
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <Toast message={toast} type="info" visible={!!toast} onClose={() => setToast('')} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 30 }}>
        {/* Top Wave Graphic Header */}
        <AuthWaveHeader />

        <View style={styles.content}>
          {/* Top Right Header Tab Switcher */}
          <View style={styles.tabHeaderRow}>
            <Pressable onPress={() => router.push('/auth/sign-up')}>
              <Text style={[styles.tabText, styles.tabInactive]}>Sign up</Text>
            </Pressable>
            <View style={styles.tabActiveWrapper}>
              <Text style={[styles.tabText, styles.tabActive]}>Sign in</Text>
              <View style={styles.tabIndicator} />
            </View>
          </View>

          {/* Subheader Title */}
          <View style={{ marginTop: 24, marginBottom: 16 }}>
            <Text style={styles.heroTitle}>
              {hasConfiguredLock ? 'Workspace Lock' : 'Welcome Back'}
            </Text>
            <Text style={styles.heroSub}>
              {hasConfiguredLock
                ? 'Unlock MeterOps with PIN or Biometrics'
                : 'Sign in to manage household smart meters'}
            </Text>
          </View>

          {/* Lock Mode Switcher (PIN vs Password) */}
          <View style={styles.modeToggleRow}>
            <Pressable
              onPress={() => setMode('PASSWORD')}
              style={[
                styles.modeToggleChip,
                mode === 'PASSWORD' && styles.modeToggleChipActive,
              ]}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  mode === 'PASSWORD' && styles.modeToggleTextActive,
                ]}
              >
                Password Login
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('PIN')}
              style={[styles.modeToggleChip, mode === 'PIN' && styles.modeToggleChipActive]}
            >
              <Text
                style={[
                  styles.modeToggleText,
                  mode === 'PIN' && styles.modeToggleTextActive,
                ]}
              >
                4-Digit PIN
              </Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          {mode === 'PIN' ? (
            <View style={{ marginVertical: 14, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1e293b' }}>
                  Enter 4-Digit Security PIN
                </Text>
                <Pressable onPress={triggerNativeBiometricPrompt}>
                  <Feather name="shield" size={20} color="#0052D4" />
                </Pressable>
              </View>

              {/* PIN Dots */}
              <View style={styles.pinDotsRow}>
                {[0, 1, 2, 3].map((idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pinDotBox,
                      pin.length > idx && { borderColor: '#0052D4', backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: '#0052D4' }}>
                      {pin[idx] ? '●' : ''}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Keypad */}
              <View style={styles.keypadGrid}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((digit) => (
                  <Pressable
                    key={digit}
                    onPress={() => {
                      if (digit === 'C') setPin('');
                      else if (digit === '⌫') setPin((prev) => prev.slice(0, -1));
                      else if (pin.length < 4) setPin((prev) => prev + digit);
                    }}
                    style={({ pressed }) => [
                      styles.keypadBtn,
                      pressed && { backgroundColor: '#E2E8F0' },
                    ]}
                  >
                    <Text style={styles.keypadText}>{digit}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ marginVertical: 8 }}>
              <AuthUnderlineInput
                label="E-mail"
                iconName="mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@company.com"
                testID="sign-in-email"
              />

              <AuthUnderlineInput
                label="Password"
                iconName="lock"
                isPassword
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                testID="sign-in-password"
              />

              <Pressable
                onPress={() => router.push('/auth/forgot-password')}
                style={{ alignSelf: 'flex-end', marginTop: 4 }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#0052D4' }}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          )}

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Remember Me Checkbox */}
          <Pressable
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Feather name="check" size={13} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Remember me & <Text style={styles.boldBlueText}>Keep signed in</Text>
            </Text>
          </Pressable>

          {/* Large Pill Action Button */}
          <Pressable
            testID="sign-in-submit"
            onPress={submit}
            style={({ pressed }) => [
              styles.pillButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.pillButtonText}>
              {mode === 'PIN' ? 'Unlock Workspace' : 'Sign in'}
            </Text>
          </Pressable>

          {/* Bottom Switch Link */}
          <Pressable
            onPress={() => router.push('/auth/sign-up')}
            style={styles.bottomLinkPress}
          >
            <Text style={styles.bottomLinkText}>Need a new account? <Text style={{ color: '#0052D4', fontFamily: 'Inter_700Bold' }}>Sign up</Text></Text>
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
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 4,
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  modeToggleChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeToggleChipActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  modeToggleText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  modeToggleTextActive: {
    color: '#0052D4',
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    marginVertical: 6,
  },
  pinDotBox: {
    width: 48,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  keypadBtn: {
    width: 76,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
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
    marginTop: 8,
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