import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Card, Field, Header, PrimaryButton, SecondaryButton, styles as ui } from '@/components/MeterUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useToast } from '@/context/ToastContext';

export default function CancelMeter() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeter, cancelMeter } = useMeters();
  const { showToast } = useToast();
  const meter = getMeter(id ?? '');
  const [reason, setReason] = useState('');

  if (!meter) return null;

  const submit = () => {
    if (!reason.trim()) {
      return showToast({ title: 'Reason required', message: 'Add a short reason before cancelling.', type: 'warning' });
    }
    cancelMeter(meter.id, reason.trim());
    showToast({ title: 'Meter cancelled', message: 'The cancellation has been recorded.', type: 'warning' });
    router.replace(`/meter/${meter.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Cancel meter" subtitle={`${meter.acNumber} · ${meter.customerName}`} back />
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 18 }}>
        <Card style={[styles.warning, { backgroundColor: colors.warningSoft }]}>
          <Text style={[ui.eyebrow, { color: colors.warning }]}>THIS CANNOT BE UNDONE</Text>
          <Text style={[ui.body, { color: colors.inkSoft, marginTop: 7 }]}>
            Cancelling preserves the record, but removes it from the active field queue.
          </Text>
        </Card>
        <Field
          label="Why are you cancelling?"
          value={reason}
          onChangeText={setReason}
          placeholder="Customer postponed the connection…"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          testID="cancel-reason"
        />
        <PrimaryButton testID="cancel-submit" label="Cancel meter" icon="x-circle" onPress={submit} />
        <SecondaryButton testID="cancel-back" label="Keep meter" onPress={() => router.back()} />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({ warning: { padding: 18, borderWidth: 0 } });