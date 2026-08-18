import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Card, styles as ui } from '@/components/MeterUI';

export default function AddMeterChoiceModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top Handle / Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={styles.headerLine}>
          <Text style={[ui.cardTitle, { color: colors.foreground, fontSize: 18 }]}>
            Which meter to add?
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.closeIcon, { backgroundColor: colors.card }]}
          >
            <Feather name="x" size={18} color={colors.foreground} />
          </Pressable>
        </View>
        <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
          Select the type of meter record you want to create in your inventory.
        </Text>
      </View>

      <View style={{ padding: 18, gap: 14 }}>
        {/* Option 1: Standard Meter */}
        <Pressable
          onPress={() => {
            router.dismiss();
            router.push('/meter/add-standard');
          }}
        >
          <Card style={[styles.choiceCard, { borderColor: colors.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.navySoft }]}>
              <Feather name="box" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground }}>
                Standard Meter
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
                Record permanent stock meter into inventory before it reaches the field.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Card>
        </Pressable>

        {/* Option 2: Temporary Field Meter */}
        <Pressable
          onPress={() => {
            router.dismiss();
            router.push('/meter/add-temp');
          }}
        >
          <Card style={[styles.choiceCard, { borderColor: '#fcd34d', backgroundColor: colors.warningSoft }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
              <Feather name="zap" size={24} color={colors.warning} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground }}>
                Temporary Field Meter ⚡
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.inkSoft }}>
                Record temporary meter installed at customer site & map permanent replacement meter.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.warning} />
          </Card>
        </Pressable>

        {/* Quick link to view list */}
        <Pressable
          onPress={() => {
            router.dismiss();
            router.push('/(tabs)/temp-meters');
          }}
          style={{ paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>
            View Recorded Temporary Field Meters
          </Text>
          <Feather name="arrow-right" size={14} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  headerLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  choiceCard: { padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
