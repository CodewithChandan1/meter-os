import React, { ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Meter, MeterHistoryEvent, MeterStatus, statusMeta } from '@/lib/meter-data';

export function AppScreen({ children, scroll = true, contentStyle }: { children: ReactNode; scroll?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const body = <View style={[styles.page, { backgroundColor: colors.background, paddingBottom: insets.bottom + 92 }, contentStyle]}>{children}</View>;
  return scroll ? <View style={{ flex: 1, backgroundColor: colors.background }}>{body}</View> : body;
}

export function Header({ title, subtitle, back, action, actionTestID }: { title: string; subtitle?: string; back?: boolean; action?: ReactNode; actionTestID?: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + (Platform.OS === 'android' ? 10 : 0), Platform.OS === 'android' ? 38 : 16);
  return (
    <View style={[styles.header, { paddingTop: topPadding, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.headerLine}>
        {back ? <Pressable testID="header-back" accessibilityLabel="Go back" onPress={() => require('expo-router').router.back()} style={styles.iconButton}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
          {subtitle ? <Text style={[styles.caption, { color: colors.mutedForeground, marginTop: 3 }]}>{subtitle}</Text> : null}
        </View>
        {action ? <View testID={actionTestID}>{action}</View> : null}
      </View>
    </View>
  );
}

export function Card({ children, style, onPress, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; testID?: string }) {
  const colors = useColors();
  const content = <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
  return onPress ? <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.74 }]}>{content}</Pressable> : content;
}

export function PrimaryButton({ label, icon, onPress, disabled, loading, testID }: { label: string; icon?: keyof typeof Feather.glyphMap; onPress: () => void; disabled?: boolean; loading?: boolean; testID?: string }) {
  const colors = useColors();
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: disabled || loading ? colors.border : pressed ? colors.secondary : colors.primary },
        pressed && !loading && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primaryForeground} />
      ) : (
        <>
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{label}</Text>
          {icon ? <Feather name={icon} size={17} color={colors.primaryForeground} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, icon, onPress, disabled, loading, testID }: { label: string; icon?: keyof typeof Feather.glyphMap; onPress: () => void; disabled?: boolean; loading?: boolean; testID?: string }) {
  const colors = useColors();
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled || loading ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : (
        <>
          <Text style={[styles.buttonText, { color: colors.foreground }]}>{label}</Text>
          {icon ? <Feather name={icon} size={17} color={colors.foreground} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ name, onPress, testID, label, loading }: { name: keyof typeof Feather.glyphMap; onPress: () => void; testID?: string; label: string; loading?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={label}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed || loading ? 0.6 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.foreground} />
      ) : (
        <Feather name={name} size={19} color={colors.foreground} />
      )}
    </Pressable>
  );
}

export function StatusPill({ status, compact = false }: { status: MeterStatus; compact?: boolean }) {
  const colors = useColors();
  const meta = statusMeta[status];
  const toneColors: Record<string, { bg: string; fg: string }> = {
    navy: { bg: colors.navySoft, fg: colors.secondary },
    amber: { bg: colors.warningSoft, fg: colors.warning },
    mint: { bg: colors.successSoft, fg: colors.success },
    red: { bg: colors.warningSoft, fg: colors.destructive },
  };
  const tone = toneColors[meta.tone];
  return <View style={[styles.statusPill, { backgroundColor: tone.bg }, compact && { paddingHorizontal: 8 }]}><View style={[styles.statusDot, { backgroundColor: tone.fg }]} /><Text style={[styles.eyebrow, { color: tone.fg }]}>{compact ? meta.short : meta.label}</Text></View>;
}

export function Field({ label, error, secureTextEntry, ...props }: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  const [hideText, setHideText] = React.useState(secureTextEntry ?? false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: colors.inkSoft }]}>{label}</Text>
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          {...props}
          secureTextEntry={hideText}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { color: colors.foreground, backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.border },
            secureTextEntry && { paddingRight: 40 },
          ]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHideText(!hideText)}
            hitSlop={10}
            style={{ position: 'absolute', right: 12, top: 12 }}
          >
            <Feather name={hideText ? 'eye-off' : 'eye'} size={20} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.caption, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  const colors = useColors();
  return <View style={styles.sectionLabel}><Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{children.toUpperCase()}</Text>{right}</View>;
}

export function MeterCard({
  meter,
  onPress,
  onAccept,
  onReject,
}: {
  meter: Meter;
  onPress: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const colors = useColors();
  const isPendingApproval =
    meter.status === 'ASSIGNMENT_PENDING' || meter.status === 'RETURN_PENDING';

  return (
    <Card testID={`meter-card-${meter.id}`} onPress={onPress} style={styles.meterCard}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{meter.customerName}</Text>
          <Text style={[styles.caption, { color: colors.mutedForeground, marginTop: 3 }]}>
            {meter.acNumber} · {meter.serialNumber}
          </Text>
        </View>
        <StatusPill status={meter.status} compact />
      </View>
      <View style={styles.meterMeta}>
        <Feather name="map-pin" size={14} color={colors.mutedForeground} />
        <Text style={[styles.caption, { color: colors.mutedForeground, flex: 1 }]} numberOfLines={1}>
          {meter.address}
        </Text>
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      </View>
      {meter.assignedTo ? (
        <View style={[styles.assignedLine, { borderTopColor: colors.border }]}>
          <Feather name="user" size={13} color={colors.primary} />
          <Text style={[styles.caption, { color: colors.inkSoft }]}>With {meter.assignedTo}</Text>
        </View>
      ) : null}

      {isPendingApproval && (onAccept || onReject) ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          {onAccept ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 8,
                borderRadius: 6,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Feather name="check" size={15} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, { color: colors.primaryForeground, fontSize: 13 }]}>Accept</Text>
            </Pressable>
          ) : null}

          {onReject ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onReject();
              }}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.destructive,
                paddingVertical: 8,
                borderRadius: 6,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Feather name="x" size={15} color={colors.destructive} />
              <Text style={[styles.buttonText, { color: colors.destructive, fontSize: 13 }]}>Decline</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export function ActivityTimeline({ events }: { events: MeterHistoryEvent[] }) {
  const colors = useColors();
  const toneMap: Record<string, string> = { navy: colors.primary, amber: colors.warning, mint: colors.success, red: colors.destructive };
  return (
    <View>
      {events.map((event, index) => {
        const itemKey = event.id || `timeline-item-${index}`;
        const tone = event.tone || 'navy';
        const iconName = (event.icon as keyof typeof Feather.glyphMap) || 'circle';
        const actionText = event.action || (event as any).title || 'Activity Event';
        const detailText = event.detail || (event as any).note || '';
        const byText = event.by ? `${event.by} · ` : '';
        const dateText = event.date || (event as any).timestamp?.split('T')[0] || '';

        return (
          <View key={itemKey} style={styles.activityRow}>
            <View style={styles.activityRail}>
              <View style={[styles.activityIcon, { backgroundColor: colors.background, borderColor: toneMap[tone] || colors.primary }]}>
                <Feather name={iconName} size={14} color={toneMap[tone] || colors.primary} />
              </View>
              {index < events.length - 1 ? <View style={[styles.activityLine, { backgroundColor: colors.border }]} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 24 }}>
              <Text style={[styles.body, { color: colors.foreground }]}>{actionText}</Text>
              {detailText ? <Text style={[styles.caption, { color: colors.mutedForeground, marginTop: 3 }]}>{detailText}</Text> : null}
              <Text style={[styles.eyebrow, { color: colors.mutedForeground, marginTop: 6 }]}>
                {byText}{dateText}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: keyof typeof Feather.glyphMap; title: string; body: string; action?: ReactNode }) {
  const colors = useColors();
  return <Card style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.navySoft }]}><Feather name={icon} size={25} color={colors.primary} /></View><Text style={[styles.cardTitle, { color: colors.foreground, textAlign: 'center' }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground, textAlign: 'center', maxWidth: 280 }]}>{body}</Text>{action}</Card>;
}

export function Toast({ message, type = 'success', visible, onClose }: { message: string; type?: 'success' | 'error' | 'info'; visible: boolean; onClose?: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const accentColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 99999,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 10,
        overflow: 'hidden',
      }}
    >
      {/* Colored Left Accent Bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: accentColor,
        }}
      />

      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${accentColor}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={18} color={accentColor} />
      </View>

      <Text style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', lineHeight: 19 }}>
        {message}
      </Text>

      {onClose ? (
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.caption, { color: colors.mutedForeground }]}>Loading workspace…</Text></View>;
}

export const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLine: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, lineHeight: 30, letterSpacing: -0.7 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22, letterSpacing: -0.15 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15, letterSpacing: 0.15 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 17 },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 20 },
  primaryButton: { minHeight: 48, borderRadius: 999, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryButton: { minHeight: 48, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  meterCard: { gap: 14 },
  meterMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  assignedLine: { flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 9, fontFamily: 'Inter_400Regular', fontSize: 15 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  activityRow: { flexDirection: 'row', gap: 12 },
  activityRail: { width: 28, alignItems: 'center' },
  activityIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activityLine: { width: 1, flex: 1, marginVertical: 4 },
  loading: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 10 },
});