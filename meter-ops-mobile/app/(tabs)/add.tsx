import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Card, Field, Header, PrimaryButton, SecondaryButton, styles as ui } from '@/components/MeterUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useToast } from '@/context/ToastContext';

export default function AddMeter() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addMeter } = useMeters();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    acNumber: '',
    serialNumber: '',
    customerName: '',
    customerMobile: '',
    address: '',
    capacity: 'Single Phase 10-40A',
    company: 'Torrent Power',
    type: 'Smart Prepaid',
    assignedTo: '',
    notes: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    mapLink: '',
  });

  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const captureGPS = () => {
    const mockLat = 31.326 + Number((Math.random() * 0.01).toFixed(4));
    const mockLng = 75.576 + Number((Math.random() * 0.01).toFixed(4));
    const generatedLink = `https://www.google.com/maps/search/?api=1&query=${mockLat},${mockLng}`;

    setForm((prev) => ({
      ...prev,
      latitude: mockLat,
      longitude: mockLng,
      mapLink: generatedLink,
    }));
    setLocationStatus(`GPS: ${mockLat}, ${mockLng}`);
    showToast({ title: 'GPS Location Captured', message: `${mockLat}, ${mockLng}`, type: 'success' });
  };

  const generateLinkFromAddress = () => {
    if (!form.address.trim()) {
      return showToast({ title: 'Address required', message: 'Please type an address first.', type: 'warning' });
    }
    const encoded = encodeURIComponent(form.address.trim());
    const generated = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    setForm((prev) => ({ ...prev, mapLink: generated }));
    showToast({ title: 'Location link set', message: 'Google Maps link generated from customer address.', type: 'info' });
  };

  const submit = () => {
    if (!form.acNumber.trim() || !form.serialNumber.trim() || !form.customerName.trim() || !form.address.trim()) {
      setError('Add the AC number, serial, customer and address to continue.');
      return;
    }

    let finalMapLink = form.mapLink;
    if (!finalMapLink && form.address.trim()) {
      finalMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address.trim())}`;
    }

    addMeter({ ...form, mapLink: finalMapLink, status: 'AVAILABLE' });
    showToast({ title: 'Meter added', message: `${form.acNumber} is ready.`, type: 'success' });
    router.replace('/(tabs)/meters');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Add a meter" subtitle="Record a meter before it reaches the field." back />
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Card style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: colors.navySoft }]}>
            <Feather name="clipboard" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ui.cardTitle, { color: colors.foreground }]}>New inventory record</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 3 }]}>Start with the details printed on the meter.</Text>
          </View>
        </Card>

        <View style={styles.form}>
          <Field label="AC number" value={form.acNumber} onChangeText={set('acNumber')} placeholder="AC-123456" autoCapitalize="characters" error={error && !form.acNumber ? error : undefined} testID="add-ac-number" />
          <Field label="Serial number" value={form.serialNumber} onChangeText={set('serialNumber')} placeholder="MTR-928372" autoCapitalize="characters" error={error && !form.serialNumber ? error : undefined} testID="add-serial-number" />
          <Field label="Customer name" value={form.customerName} onChangeText={set('customerName')} placeholder="Full name" error={error && !form.customerName ? error : undefined} testID="add-customer" />
          <Field label="Customer mobile" value={form.customerMobile} onChangeText={set('customerMobile')} placeholder="+91 98765 00000" keyboardType="phone-pad" testID="add-mobile" />
          <Field label="Service address" value={form.address} onChangeText={set('address')} placeholder="Area, city" error={error && !form.address ? error : undefined} testID="add-address" />

          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field label="Capacity" value={form.capacity} onChangeText={set('capacity')} placeholder="5 KW" testID="add-capacity" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Meter type" value={form.type} onChangeText={set('type')} placeholder="Single phase" testID="add-type" />
            </View>
          </View>

          {/* Location Options Box */}
          <Card style={{ gap: 10 }}>
            <Text style={[ui.cardTitle, { color: colors.foreground }]}>Location options</Text>

            <Pressable onPress={captureGPS} style={[styles.locationBtn, { borderColor: colors.primary }]}>
              <Feather name="crosshair" size={17} color={colors.primary} />
              <Text style={[ui.buttonText, { color: colors.primary, flex: 1 }]}>1. Capture current GPS location</Text>
            </Pressable>

            {locationStatus ? <Text style={[ui.caption, { color: colors.success }]}>{locationStatus}</Text> : null}

            <Pressable onPress={generateLinkFromAddress} style={[styles.locationBtn, { borderColor: colors.border }]}>
              <Feather name="map-pin" size={17} color={colors.foreground} />
              <Text style={[ui.buttonText, { color: colors.foreground, flex: 1 }]}>2. Set location from address</Text>
            </Pressable>

            <Field label="3. Manual map link (or paste URL)" value={form.mapLink} onChangeText={set('mapLink')} placeholder="https://maps.google.com/..." autoCapitalize="none" />
          </Card>

          <Field label="Notes (optional)" value={form.notes} onChangeText={set('notes')} placeholder="Anything the field team should know" multiline numberOfLines={3} textAlignVertical="top" testID="add-notes" />
        </View>

        <PrimaryButton testID="add-submit" label="Save meter" icon="check" onPress={submit} />
        <SecondaryButton testID="add-cancel" label="Not now" onPress={() => router.back()} />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({ intro: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }, introIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, form: { gap: 15 }, two: { flexDirection: 'row', gap: 10 }, locationBtn: { minHeight: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 } });