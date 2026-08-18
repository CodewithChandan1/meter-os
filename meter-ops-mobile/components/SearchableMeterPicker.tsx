import React, { useState, useMemo } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Meter } from '@/lib/meter-data';
import { styles as ui } from '@/components/MeterUI';

export function SearchableMeterPicker({
  label = "Permanent Replacement Meter",
  meters,
  selectedMeterId,
  selectedMeterAc,
  onSelect,
}: {
  label?: string;
  meters: Meter[];
  selectedMeterId?: string;
  selectedMeterAc?: string;
  onSelect: (meter: { id: string; acNumber: string; customerName: string } | null) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMeter = useMemo(
    () => meters.find((m) => m.id === selectedMeterId || m.acNumber === selectedMeterAc),
    [meters, selectedMeterId, selectedMeterAc]
  );

  const availableMeters = useMemo(() => {
    return meters.filter((m) => !m.isTemporary && m.status !== 'CANCELLED');
  }, [meters]);

  const filteredMeters = useMemo(() => {
    if (!searchQuery.trim()) return availableMeters;
    const q = searchQuery.toLowerCase().trim();
    return availableMeters.filter(
      (m) =>
        m.acNumber.toLowerCase().includes(q) ||
        m.serialNumber.toLowerCase().includes(q) ||
        m.customerName.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q)
    );
  }, [availableMeters, searchQuery]);

  return (
    <View style={{ gap: 6 }}>
      <Text style={[ui.label, { color: colors.inkSoft }]}>{label}</Text>

      {/* Trigger Box / Dropdown Button */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[
          styles.triggerBox,
          {
            backgroundColor: colors.card,
            borderColor: selectedMeter || selectedMeterAc ? colors.primary : colors.border,
          },
        ]}
      >
        <Feather
          name="refresh-cw"
          size={18}
          color={selectedMeter || selectedMeterAc ? colors.primary : colors.mutedForeground}
        />

        <View style={{ flex: 1 }}>
          {selectedMeter || selectedMeterAc ? (
            <View>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>
                {selectedMeter?.acNumber || selectedMeterAc}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
                {selectedMeter ? `${selectedMeter.customerName} · ${selectedMeter.company}` : 'Selected Replacement'}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
              Tap to search & select permanent meter...
            </Text>
          )}
        </View>

        {selectedMeter || selectedMeterAc ? (
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            style={styles.clearBtn}
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
        )}
      </Pressable>

      {/* Searchable Modal Sheet Dropdown */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />

          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            {/* Handle Indicator */}
            <View style={styles.handleBar}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[ui.cardTitle, { color: colors.foreground, fontSize: 17 }]}>
                  Select Replacement Meter
                </Text>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                  {availableMeters.length} stock meters available
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.closeIcon, { backgroundColor: colors.background }]}
              >
                <Feather name="x" size={18} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Search Bar Input */}
            <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search AC number, serial, customer..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                autoFocus
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            {/* Meter Items List */}
            <ScrollView contentContainerStyle={{ gap: 10, paddingVertical: 6 }} keyboardShouldPersistTaps="handled">
              {filteredMeters.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
                  <Feather name="box" size={32} color={colors.mutedForeground} />
                  <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                    No matching meters found in stock.
                  </Text>
                </View>
              ) : (
                filteredMeters.map((meter) => {
                  const isSelected = selectedMeterId === meter.id || selectedMeterAc === meter.acNumber;
                  return (
                    <Pressable
                      key={meter.id}
                      onPress={() => {
                        onSelect({ id: meter.id, acNumber: meter.acNumber, customerName: meter.customerName });
                        setModalVisible(false);
                      }}
                      style={[
                        styles.itemCard,
                        {
                          backgroundColor: isSelected ? colors.navySoft : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.foreground }}>
                            {meter.acNumber}
                          </Text>
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.primary }}>
                            {meter.company}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground }}>
                          {meter.customerName}
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
                          Serial: {meter.serialNumber} · {meter.address}
                        </Text>
                      </View>

                      {isSelected ? (
                        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <Pressable
              onPress={() => setModalVisible(false)}
              style={[styles.doneBtn, { backgroundColor: colors.secondary }]}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground }}>
                Close Selection
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerBox: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: { padding: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    maxHeight: '85%',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  handleBar: { alignItems: 'center', paddingVertical: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  itemCard: { padding: 14, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  doneBtn: { height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
