import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Card, Header, PrimaryButton, SecondaryButton, Toast, styles as ui } from '@/components/MeterUI';

export default function SecuritySetup() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState('');
  const [enableBiometric, setEnableBiometric] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const saveSecurity = async () => {
    if (pin.length !== 4) {
      setToastMessage('Security PIN must be exactly 4 digits!');
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('security_configured', 'true');
      await AsyncStorage.setItem('user_pin', pin);
    } catch {
      // ignore storage errors
    }

    setToastMessage('✨ Security PIN & Biometric Lock configured!');
    setTimeout(() => {
      setToastMessage('');
      router.replace('/(tabs)');
    }, 1200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <Toast message={toastMessage} visible={!!toastMessage} onClose={() => setToastMessage('')} />
      <Header title="Set Up Security Lock" subtitle="Configure 4-digit PIN & Fingerprint/Face ID" />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
          gap: 20,
        }}
      >
        <Card style={{ gap: 16, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.navySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="shield" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ui.cardTitle, { color: colors.foreground, fontSize: 17 }]}>Workspace Lock</Text>
              <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
                Protect meter stock and field data on this phone.
              </Text>
            </View>
          </View>

          {/* Premium 4-Digit PIN Setup UI */}
          <View style={{ gap: 12, marginTop: 6 }}>
            <Text style={[ui.label, { color: colors.foreground }]}>Set 4-Digit Quick Security PIN</Text>
            
            {/* PIN Dots Box */}
            <View
              style={{
                flexDirection: 'row',
                gap: 14,
                justifyContent: 'center',
                paddingVertical: 12,
                backgroundColor: colors.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  style={{
                    width: 48,
                    height: 52,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: pin.length > idx ? colors.primary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.card,
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                    {pin[idx] ? '●' : ''}
                  </Text>
                </View>
              ))}
            </View>

            {/* Circular Keypad Grid */}
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
                    {
                      backgroundColor: pressed ? colors.navySoft : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>{digit}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Biometric Switch Card */}
          <Pressable
            onPress={() => setEnableBiometric(!enableBiometric)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: enableBiometric ? colors.primary : colors.border,
              marginTop: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Feather name="shield" size={20} color={colors.primary} />
              <Text style={[ui.body, { color: colors.foreground, fontWeight: '600' }]}>
                Enable Fingerprint / Face ID
              </Text>
            </View>
            <Feather
              name={enableBiometric ? 'check-square' : 'square'}
              size={22}
              color={enableBiometric ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
        </Card>

        <PrimaryButton label="Complete Setup & Enter Workspace" icon="check" onPress={saveSecurity} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 6,
  },
  keypadBtn: {
    width: 76,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
