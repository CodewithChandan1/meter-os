import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { EmptyState, MeterCard, styles as ui } from '@/components/MeterUI';

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { meters, user, acceptAssignment, rejectAssignment, acceptReturn, rejectReturn } = useMeters();

  // Filter pending requests for current user
  const pendingRequests = meters.filter((m) => {
    return (
      (m.status === 'ASSIGNMENT_PENDING' && m.assignedTo === user?.name) ||
      (m.status === 'RETURN_PENDING' && (m.assignedBy === user?.name || !m.assignedBy))
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          gap: 16,
        }}
      >
        <Text style={[ui.caption, { color: colors.mutedForeground }]}>
          {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'} requiring your approval
        </Text>

        {/* Requests List */}
        {pendingRequests.length > 0 ? (
          pendingRequests.map((meter) => {
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
          <EmptyState
            icon="bell-off"
            title="All caught up!"
            body="You have no pending handover or return requests at the moment."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
