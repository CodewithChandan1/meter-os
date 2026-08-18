import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Card, PrimaryButton, SectionLabel, styles as ui } from '@/components/MeterUI';

export default function Dashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { meters, stats, user, isHydrated } = useMeters();
  const recent = meters.flatMap((meter) => meter.history.map((event) => ({ meter, event }))).slice(0, 3);
  if (!isHydrated) return <View style={[ui.loading, { backgroundColor: colors.background }]}><Text style={[ui.caption, { color: colors.mutedForeground }]}>Preparing workspace…</Text></View>;
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: insets.bottom + 100, gap: 22 }}>
      <View style={{ gap: 4 }}>
        <Text style={[ui.eyebrow, { color: colors.primary }]}>NORTH PUNJAB / METEROPS</Text>
        <Text style={[dashStyles.title, { color: colors.foreground }]}>Good afternoon, {user?.name.split(' ')[0] ?? 'there'}.</Text>
        <Text style={[ui.body, { color: colors.mutedForeground }]}>Keep the field moving.</Text>
      </View>
      <Card style={[dashStyles.hero, { backgroundColor: colors.secondary, borderColor: colors.secondary }]}><View style={dashStyles.heroTop}><View><Text style={[ui.eyebrow, { color: colors.accent }]}>TODAY'S BOARD</Text><Text style={[dashStyles.heroNumber, { color: colors.primaryForeground }]}>{stats.total}</Text><Text style={[ui.body, { color: colors.primaryForeground, opacity: 0.78 }]}>meters in your workspace</Text></View><View style={[dashStyles.heroMark, { backgroundColor: colors.primary }]}><Feather name="activity" size={24} color={colors.primaryForeground} /></View></View><View style={[dashStyles.heroFoot, { borderTopColor: colors.primaryForeground }]}><Text style={[ui.caption, { color: colors.primaryForeground, opacity: 0.82 }]}>{stats.pending} awaiting installation</Text><Text style={[ui.caption, { color: colors.primaryForeground, opacity: 0.82 }]}>{stats.available} ready to assign</Text></View></Card>
      {/* Stat Grid Layout: Total Meters Full Width (Equal to 2 Cards), Lower 4 Cards in 2x2 Grid */}
      <View style={{ gap: 10 }}>
        {/* Full-width Total Meters Card */}
        <Card style={{ padding: 16, gap: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 4 }}>
            <Text style={[ui.eyebrow, { color: colors.primary }]}>WORKSPACE INVENTORY</Text>
            <Text style={[dashStyles.statNumber, { color: colors.foreground, fontSize: 32 }]}>{stats.total}</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground }]}>Total Meters</Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="box" size={22} color={colors.primaryForeground} />
          </View>
        </Card>

        {/* 2x2 Grid for Available, Assigned, Handed out, Installed */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            ['Available', stats.available, 'check-circle'],
            ['Assigned to you', stats.assigned, 'arrow-up-right'],
            ['Handed out', stats.pending, 'clock'],
            ['Installed', stats.installed, 'zap'],
          ].map(([label, value, icon]) => (
            <Card key={String(label)} style={{ width: '48.5%', padding: 14, gap: 6, minHeight: 96 }}>
              <Feather name={icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
              <Text style={[dashStyles.statNumber, { color: colors.foreground }]}>{value}</Text>
              <Text style={[ui.caption, { color: colors.mutedForeground }]}>{label}</Text>
            </Card>
          ))}
        </View>

        {/* Temporary Field Meters Quick Card */}
        <Pressable onPress={() => router.push('/meter/temp-meters')}>
          <Card style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.warningSoft, borderColor: '#fcd34d' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name="zap" size={20} color={colors.warning} />
              <View>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground }}>Temporary Field Meters</Text>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.inkSoft }}>View & manage temporary installations</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.warning} />
          </Card>
        </Pressable>
      </View>
      <PrimaryButton testID="dashboard-add-meter" label="Add a meter" icon="plus" onPress={() => router.push('/(tabs)/add')} />
      <View style={dashStyles.section}>
        <SectionLabel
          right={
            <Pressable testID="dashboard-view-meters" onPress={() => router.push('/(tabs)/meters')}>
              <Text style={[ui.caption, { color: colors.primary }]}>View all</Text>
            </Pressable>
          }
        >
          Recent activity
        </SectionLabel>
        {recent.map(({ meter, event }, index) => {
          const itemKey = event?.id || `${meter.id}-activity-${index}`;
          const actionText = event?.action || (event as any)?.title || 'Meter status updated';
          const dateText = event?.date || (event as any)?.timestamp?.split('T')[0] || 'Recently';
          const tone = event?.tone || 'navy';
          return (
            <Pressable
              testID={`activity-${itemKey}`}
              key={itemKey}
              onPress={() => router.push(`/meter/${meter.id}`)}
              style={[dashStyles.activity, { borderBottomColor: colors.border }]}
            >
              <View
                style={[
                  dashStyles.activityDot,
                  {
                    backgroundColor:
                      tone === 'mint'
                        ? colors.success
                        : tone === 'amber'
                        ? colors.warning
                        : colors.primary,
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={[ui.body, { color: colors.foreground }]}>{actionText}</Text>
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                  {meter.customerName} · {dateText}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  </View>;
}
const dashStyles = StyleSheet.create({ top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, title: { fontFamily: 'Inter_700Bold', fontSize: 25, lineHeight: 30, letterSpacing: -0.7, marginTop: 8 }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, hero: { padding: 20, gap: 20 }, heroTop: { flexDirection: 'row', justifyContent: 'space-between' }, heroNumber: { fontFamily: 'Inter_700Bold', fontSize: 48, lineHeight: 52, letterSpacing: -1.8, marginTop: 5 }, heroMark: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, heroFoot: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 13 }, statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, stat: { width: '48%', minHeight: 112, gap: 7 }, statNumber: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.8 }, section: { gap: 2 }, activity: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth }, activityDot: { width: 8, height: 8, borderRadius: 4 } });