import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Card, Field, Header, PrimaryButton, SecondaryButton, styles as ui } from '@/components/MeterUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useToast } from '@/context/ToastContext';

export default function InstallMeter() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeter, installMeter } = useMeters();
  const { showToast } = useToast();
  const meter = getMeter(id ?? '');
  const [notes, setNotes] = useState('');

  if (!meter) return null;

  const submit = () => {
    installMeter(meter.id, notes);
    showToast({ title: 'Installation complete', message: `${meter.acNumber} is now marked installed.`, type: 'success' });
    router.replace(`/meter/${meter.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Complete installation" subtitle={`${meter.acNumber} · ${meter.customerName}`} back />
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 18 }}>
        <Card style={[styles.confirm, { backgroundColor: colors.successSoft }]}>
          <Text style={[ui.eyebrow, { color: colors.success }]}>READY TO CLOSE</Text>
          <Text style={[ui.cardTitle, { color: colors.foreground, marginTop: 6 }]}>Mark this meter as installed?</Text>
          <Text style={[ui.caption, { color: colors.inkSoft, marginTop: 4 }]}>
            This adds an immutable event to the activity timeline.
          </Text>
        </Card>
        <Field
          label="Installation notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Condition, handover notes, follow-up…"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          testID="install-notes"
        />
        <PrimaryButton testID="install-submit" label="Complete installation" icon="check-circle" onPress={submit} />
        <SecondaryButton testID="install-cancel" label="Not yet" onPress={() => router.back()} />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({ confirm: { padding: 18, borderWidth: 0 } });