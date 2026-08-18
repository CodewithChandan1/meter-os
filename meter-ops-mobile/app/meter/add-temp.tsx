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
import { SearchableMeterPicker } from '@/components/SearchableMeterPicker';

export default function AddTemporaryMeter() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { meters, addMeter } = useMeters();
  const { showToast } = useToast();

  const [selectedReplacementMeterId, setSelectedReplacementMeterId] = useState('');
  const [selectedReplacementMeterAc, setSelectedReplacementMeterAc] = useState('');

  const [form, setForm] = useState({
    acNumber: '',
    serialNumber: '',
    customerName: '',
    customerMobile: '',
    address: '',
    capacity: 'Single Phase 5 KW',
    company: 'Genus Power (Temp)',
    type: 'Temporary Meter',
    notes: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    mapLink: '',
  });

  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

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
    setLocationStatus(`GPS captured: ${mockLat}, ${mockLng}`);
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
      setError('Please fill AC Number, Serial Number, Customer Name & Address.');
      return;
    }

    let finalMapLink = form.mapLink;
    if (!finalMapLink && form.address.trim()) {
      finalMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address.trim())}`;
    }

    addMeter({
      ...form,
      type: 'Temporary Meter',
      mapLink: finalMapLink,
      status: 'TEMPORARY',
      isTemporary: true,
      replacedByMeterId: selectedReplacementMeterId || undefined,
      replacedByMeterAc: selectedReplacementMeterAc || undefined,
    });

    showToast({
      title: '⚡ Temporary Meter Added',
      message: selectedReplacementMeterAc
        ? `Temp meter ${form.acNumber} recorded & linked to replace with ${selectedReplacementMeterAc}`
        : `Temp meter ${form.acNumber} recorded at customer site.`,
      type: 'warning',
    });

    router.replace('/(tabs)/temp-meters');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: insets.bottom + 32, gap: 16 }}
      >
        <View style={styles.form}>
          {/* Permanent Replacement Dropdown */}
          <SearchableMeterPicker
            label="Permanent Replacement Meter (Optional)"
            meters={meters}
            selectedMeterId={selectedReplacementMeterId}
            selectedMeterAc={selectedReplacementMeterAc}
            onSelect={(item) => {
              if (item) {
                setSelectedReplacementMeterId(item.id);
                setSelectedReplacementMeterAc(item.acNumber);
              } else {
                setSelectedReplacementMeterId('');
                setSelectedReplacementMeterAc('');
              }
            }}
          />

          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="AC number *"
                value={form.acNumber}
                onChangeText={set('acNumber')}
                placeholder="TEMP-AC-90812"
                autoCapitalize="characters"
                error={error && !form.acNumber ? error : undefined}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Serial number *"
                value={form.serialNumber}
                onChangeText={set('serialNumber')}
                placeholder="MTR-TEMP-77812"
                autoCapitalize="characters"
                error={error && !form.serialNumber ? error : undefined}
              />
            </View>
          </View>

          <Field
            label="Customer name *"
            value={form.customerName}
            onChangeText={set('customerName')}
            placeholder="Full name"
            error={error && !form.customerName ? error : undefined}
          />

          <Field
            label="Customer mobile"
            value={form.customerMobile}
            onChangeText={set('customerMobile')}
            placeholder="+91 98765 00000"
            keyboardType="phone-pad"
          />

          <Field
            label="Service address *"
            value={form.address}
            onChangeText={set('address')}
            placeholder="House no, area, city"
            error={error && !form.address ? error : undefined}
          />

          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="Capacity"
                value={form.capacity}
                onChangeText={set('capacity')}
                placeholder="5 KW"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Company / Make"
                value={form.company}
                onChangeText={set('company')}
                placeholder="Genus / HPL"
              />
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

          <Field
            label="Notes (optional)"
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Reason for temporary installation, etc."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <PrimaryButton label="Save Temporary Meter" icon="check" onPress={submit} />
        <SecondaryButton label="Cancel" onPress={() => router.back()} />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  two: { flexDirection: 'row', gap: 10 },
  locationBtn: { minHeight: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
