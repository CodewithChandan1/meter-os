import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { MeterStatus, statusMeta } from '@/lib/meter-data';
import { EmptyState, LoadingState, MeterCard, styles as ui } from '@/components/MeterUI';

type FilterType = 'ALL' | 'REQUESTS' | 'ASSIGNED_TO_ME' | 'AVAILABLE' | 'HANDED_OUT' | 'RETURNED' | 'INSTALLED' | 'CANCELLED';

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'AVAILABLE', label: 'Stock (Available)' },
  { key: 'REQUESTS', label: 'Pending Requests' },
  { key: 'ASSIGNED_TO_ME', label: 'Assigned to me' },
  { key: 'HANDED_OUT', label: 'Handed out' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'INSTALLED', label: 'Installed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function Meters() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { meters, user, isHydrated, acceptAssignment, rejectAssignment, acceptReturn, rejectReturn } = useMeters();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('ALL');

  const result = useMemo(() => {
    return meters.filter((m) => {
      let matchesFilter = true;
      if (filter === 'REQUESTS') {
        matchesFilter =
          m.status === 'ASSIGNMENT_PENDING' ||
          m.status === 'RETURN_PENDING' ||
          m.status === 'INSTALLATION_PENDING';
      } else if (filter === 'ASSIGNED_TO_ME') {
        matchesFilter = m.assignedTo === user?.name && m.status === 'ASSIGNED';
      } else if (filter === 'HANDED_OUT') {
        matchesFilter = m.assignedBy === user?.name && m.assignedTo !== user?.name && m.status === 'ASSIGNED';
      } else if (filter !== 'ALL') {
        matchesFilter = m.status === filter;
      }

      const matchesQuery = [m.customerName, m.acNumber, m.serialNumber, m.address]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [meters, filter, query, user?.name]);

  if (!isHydrated) return <LoadingState />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: insets.bottom + 100, gap: 15 }}>
        <View style={styles.heading}>
          <View>
            <Text style={[ui.eyebrow, { color: colors.primary }]}>INVENTORY</Text>
            <Text style={[ui.headerTitle, { color: colors.foreground, marginTop: 6 }]}>Meters</Text>
          </View>
          <Pressable testID="meters-add" onPress={() => router.push('/(tabs)/add')} style={[styles.add, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={20} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput testID="meters-search" value={query} onChangeText={setQuery} placeholder="Search customer, AC, serial or address" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {filters.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable testID={`filter-${item.key}`} key={item.key} onPress={() => setFilter(item.key)} style={[styles.chip, { backgroundColor: active ? colors.foreground : colors.card, borderColor: active ? colors.foreground : colors.border }]}>
                <Text style={[ui.eyebrow, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[ui.caption, { color: colors.mutedForeground }]}>{result.length} {result.length === 1 ? 'meter' : 'meters'} found</Text>

        {result.length ? (
          result.map((meter) => {
            const isAssignPending = meter.status === 'ASSIGNMENT_PENDING';
            const isReturnPending = meter.status === 'RETURN_PENDING';

            return (
              <MeterCard
                key={meter.id}
                meter={meter}
                onPress={() => router.push(`/meter/${meter.id}`)}
                onAccept={
                  isAssignPending
                    ? () => acceptAssignment(meter.id)
                    : isReturnPending
                      ? () => acceptReturn(meter.id)
                      : undefined
                }
                onReject={
                  isAssignPending
                    ? () => rejectAssignment(meter.id)
                    : isReturnPending
                      ? () => rejectReturn(meter.id)
                      : undefined
                }
              />
            );
          })
        ) : (
          <EmptyState icon="search" title="No meters match" body="Try another search or clear the status filter." action={<Pressable testID="meters-clear" onPress={() => { setQuery(''); setFilter('ALL'); }}><Text style={[ui.buttonText, { color: colors.primary }]}>Clear filters</Text></Pressable>} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  add: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  tempBanner: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  search: { height: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 },
  chip: { minHeight: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 12, justifyContent: 'center' },
});