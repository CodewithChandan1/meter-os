import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Card, LoadingState, PrimaryButton, StatusPill, styles as ui } from '@/components/MeterUI';
import { useToast } from '@/context/ToastContext';

type TempFilter = 'ALL' | 'ACTIVE_TEMP' | 'REPLACED';

export default function TemporaryMetersList() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { meters, isHydrated, updateMeter } = useMeters();
  const { showToast, showAlert } = useToast();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TempFilter>('ALL');

  // Filter temporary meters safely
  const tempMeters = useMemo(() => {
    return meters.filter((m) => Boolean(m.isTemporary) || m.status === 'TEMPORARY' || m.status === 'REPLACED');
  }, [meters]);

  const activeCount = useMemo(
    () => tempMeters.filter((m) => m.status === 'TEMPORARY' || (Boolean(m.isTemporary) && m.status !== 'REPLACED')).length,
    [tempMeters]
  );
  const replacedCount = useMemo(() => tempMeters.filter((m) => m.status === 'REPLACED').length, [tempMeters]);

  const filteredMeters = useMemo(() => {
    return tempMeters.filter((m) => {
      let matchesFilter = true;
      if (filter === 'ACTIVE_TEMP') {
        matchesFilter = m.status === 'TEMPORARY' || (Boolean(m.isTemporary) && m.status !== 'REPLACED');
      } else if (filter === 'REPLACED') {
        matchesFilter = m.status === 'REPLACED';
      }

      const matchesQuery = [m.customerName, m.acNumber, m.serialNumber, m.address, m.replacedByMeterAc]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [tempMeters, filter, query]);

  if (!isHydrated) return <LoadingState />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: insets.bottom + 40, gap: 15 }}>
        {/* Header Action Row */}
        <View style={ui.rowBetween}>
          <View>
            <Text style={[ui.headerTitle, { color: colors.foreground, fontSize: 20 }]}>Temporary Meters</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
              {activeCount} active temporary · {replacedCount} replaced
            </Text>
          </View>
          <Pressable
            testID="add-temp-btn"
            onPress={() => router.push('/meter/add-temp')}
            style={[styles.addBtn, { backgroundColor: colors.warning }]}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>+ Temp Meter</Text>
          </Pressable>
        </View>

        {/* Metric Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={[styles.statBox, { flex: 1, backgroundColor: colors.warningSoft, borderColor: '#fcd34d' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="zap" size={16} color={colors.warning} />
              <Text style={[ui.caption, { color: colors.warning, fontWeight: '700' }]}>ACTIVE TEMP</Text>
            </View>
            <Text style={[ui.headerTitle, { fontSize: 24, marginTop: 4, color: colors.foreground }]}>{activeCount}</Text>
          </Card>

          <Card style={[styles.statBox, { flex: 1, backgroundColor: colors.navySoft, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="check-circle" size={16} color={colors.primary} />
              <Text style={[ui.caption, { color: colors.primary, fontWeight: '700' }]}>REPLACED</Text>
            </View>
            <Text style={[ui.headerTitle, { fontSize: 24, marginTop: 4, color: colors.foreground }]}>{replacedCount}</Text>
          </Card>
        </View>

        {/* Search Bar */}
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search temp AC, customer or permanent AC..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { key: 'ALL', label: `All (${tempMeters.length})` },
            { key: 'ACTIVE_TEMP', label: `Active (${activeCount})` },
            { key: 'REPLACED', label: `Replaced (${replacedCount})` },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key as TempFilter)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.foreground : colors.card,
                    borderColor: active ? colors.foreground : colors.border,
                  },
                ]}
              >
                <Text style={[ui.eyebrow, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List of Temporary Meters */}
        {filteredMeters.length === 0 ? (
          <Card style={{ padding: 24, alignItems: 'center', gap: 10 }}>
            <Feather name="zap-off" size={32} color={colors.mutedForeground} />
            <Text style={[ui.cardTitle, { color: colors.foreground }]}>No Temporary Meters Found</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground, textAlign: 'center' }]}>
              {tempMeters.length === 0
                ? 'No temporary field meters recorded yet.'
                : 'No temporary meters match your search filter.'}
            </Text>
            <Pressable
              onPress={() => router.push('/meter/add-temp')}
              style={[styles.addBtn, { backgroundColor: colors.primary, marginTop: 8, paddingHorizontal: 16, height: 42 }]}
            >
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Add Temporary Meter</Text>
            </Pressable>
          </Card>
        ) : (
          filteredMeters.map((meter) => (
            <Pressable
              key={meter.id}
              onPress={() => router.push({ pathname: '/meter/[id]', params: { id: meter.id } })}
            >
              <Card style={{ gap: 12, borderColor: meter.status === 'REPLACED' ? colors.border : '#fcd34d' }}>
                <View style={ui.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="zap" size={18} color={meter.status === 'REPLACED' ? colors.mutedForeground : colors.warning} />
                    <Text style={[ui.cardTitle, { color: colors.foreground }]}>{meter.acNumber}</Text>
                  </View>
                  <StatusPill status={meter.status} />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={[ui.body, { fontWeight: '600', color: colors.foreground }]}>{meter.customerName}</Text>
                  <Text style={[ui.caption, { color: colors.mutedForeground }]}>{meter.address}</Text>
                </View>

                {/* Replacement Mapping Info */}
                <View style={{ padding: 10, borderRadius: 8, backgroundColor: colors.secondary, gap: 4 }}>
                  <Text style={[ui.eyebrow, { color: colors.inkSoft }]}>PERMANENT REPLACEMENT METER</Text>
                  {meter.replacedByMeterAc ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="refresh-cw" size={14} color={colors.primary} />
                      <Text style={[ui.body, { color: colors.primary, fontWeight: '600' }]}>
                        {meter.replacedByMeterAc}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[ui.caption, { color: colors.mutedForeground, fontStyle: 'italic' }]}>
                      Not mapped yet. Tap to assign permanent meter.
                    </Text>
                  )}
                </View>

                {/* Quick Action */}
                {meter.status !== 'REPLACED' ? (
                  <PrimaryButton
                    label={meter.replacedByMeterAc ? `Mark Replaced By ${meter.replacedByMeterAc}` : 'Replace With Permanent Meter'}
                    icon="check-circle"
                    onPress={() => {
                      showAlert({
                        title: 'Confirm Meter Replacement?',
                        message: `Mark temporary meter ${meter.acNumber} as REPLACED${meter.replacedByMeterAc ? ` by permanent meter ${meter.replacedByMeterAc}` : ''}?`,
                        type: 'warning',
                        buttons: [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Confirm Replacement',
                            onPress: () => {
                              updateMeter(meter.id, { status: 'REPLACED' });
                              showToast({ title: 'Temporary Meter Replaced', message: `${meter.acNumber} updated to REPLACED.`, type: 'success' });
                            },
                          },
                        ],
                      });
                    }}
                  />
                ) : null}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statBox: { padding: 14, borderRadius: 12, borderWidth: 1 },
  search: {
    minHeight: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
