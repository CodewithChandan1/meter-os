import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { teamMembers, useMeters } from '@/context/MeterContext';
import { Card, Header, PrimaryButton, SecondaryButton, styles as ui } from '@/components/MeterUI';
import { useToast } from '@/context/ToastContext';

export default function AssignMeter() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeter, assignMeter, user } = useMeters();
  const { showToast } = useToast();
  const meter = getMeter(id ?? '');

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [selected, setSelected] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [customName, setCustomName] = useState('');

  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  if (!meter) return null;

  const handleTouchStart = (evt: any) => {
    setScrollEnabled(false);
    const { locationX, locationY } = evt.nativeEvent;
    setCurrentPath(`M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
  };

  const handleTouchMove = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    if (currentPath) {
      setCurrentPath((prev) => `${prev} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
    }
  };

  const handleTouchEnd = () => {
    setScrollEnabled(true);
    if (currentPath) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath('');
    }
  };

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const hasSignature = paths.length > 0 || currentPath.length > 0;

  const submit = () => {
    const targetName = isOther ? customName.trim() : selected;

    if (!targetName) {
      return showToast({ title: 'Recipient name required', message: 'Please select a team member or enter recipient name.', type: 'warning' });
    }

    // Rules:
    // 1. If Receiver signs right now on phone -> Directly ASSIGNED
    // 2. If Receiver does NOT sign right now -> Sent as ASSIGNMENT_PENDING request for receiver to accept/sign later
    assignMeter(meter.id, targetName, hasSignature);

    if (hasSignature) {
      showToast({ title: 'Assigned', message: `Meter assigned to ${targetName} with signature!`, type: 'success' });
    } else {
      showToast({ title: 'Request Sent', message: `Assignment request sent to ${targetName}.`, type: 'info' });
    }

    router.replace(`/meter/${meter.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Assign meter" subtitle={`${meter.acNumber} · ${meter.customerName}`} back />
      <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 18 }}>
        <Text style={[ui.body, { color: colors.mutedForeground }]}>
          Choose a field teammate or enter another recipient name.
        </Text>

        {/* Team Members List */}
        <View style={{ gap: 9 }}>
          {teamMembers
            .filter((m) => m.name !== user?.name)
            .map((member) => (
              <Pressable
                testID={`assignee-${member.id}`}
                key={member.id}
                onPress={() => {
                  setSelected(member.name);
                  setIsOther(false);
                }}
                style={[
                  styles.member,
                  {
                    backgroundColor: colors.card,
                    borderColor: !isOther && selected === member.name ? colors.primary : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        member.color === 'amber'
                          ? colors.warningSoft
                          : member.color === 'mint'
                          ? colors.successSoft
                          : colors.purple,
                    },
                  ]}
                >
                  <Text style={[ui.buttonText, { color: colors.secondary }]}>{member.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ui.cardTitle, { color: colors.foreground }]}>{member.name}</Text>
                  <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                    {member.role} · {member.assigned} assigned
                  </Text>
                </View>
                {!isOther && selected === member.name ? (
                  <Feather name="check-circle" size={21} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}

          {/* Other Recipient Option */}
          <Pressable
            testID="assignee-other"
            onPress={() => {
              setIsOther(true);
              setSelected('');
            }}
            style={[
              styles.member,
              {
                backgroundColor: colors.card,
                borderColor: isOther ? colors.primary : colors.border,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Feather name="user-plus" size={18} color={colors.primaryForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ui.cardTitle, { color: colors.foreground }]}>Other (Enter Name)</Text>
              <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                Assign to person outside quick list
              </Text>
            </View>
            {isOther ? <Feather name="check-circle" size={21} color={colors.primary} /> : null}
          </Pressable>

          {/* Custom Name Input Box when Other is selected */}
          {isOther ? (
            <Card style={{ gap: 6, marginTop: 4 }}>
              <Text style={[ui.caption, { color: colors.mutedForeground }]}>Enter recipient full name</Text>
              <TextInput
                testID="assignee-custom-input"
                value={customName}
                onChangeText={setCustomName}
                placeholder="Enter full name / contractor details"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
              />
            </Card>
          ) : null}
        </View>

        {/* Realtime Finger Touch Signature Board Canvas */}
        <Card style={{ gap: 12 }}>
          <View style={styles.sigHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[ui.cardTitle, { color: colors.foreground }]}>Receiver Signature (Optional)</Text>
              <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 3 }]}>
                Sign with finger OR send request to accept later
              </Text>
            </View>
            {hasSignature ? (
              <Pressable onPress={clearSignature} style={[styles.clearBtn, { backgroundColor: `${colors.destructive}15` }]}>
                <Feather name="refresh-cw" size={13} color={colors.destructive} />
                <Text style={{ color: colors.destructive, fontSize: 12, fontWeight: '600' }}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Interactive Touch Drawing Canvas */}
          <View
            style={[
              styles.signatureCanvas,
              {
                backgroundColor: colors.card,
                borderColor: hasSignature ? colors.primary : colors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onStartShouldSetResponderCapture={() => true}
            onMoveShouldSetResponderCapture={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
            onResponderTerminationRequest={() => false}
          >
            <Svg style={StyleSheet.absoluteFill}>
              {paths.map((p, idx) => (
                <Path key={idx} d={p} stroke={colors.primary} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {currentPath ? (
                <Path d={currentPath} stroke={colors.primary} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
            </Svg>

            {!hasSignature ? (
              <View style={styles.placeholderOverlay} pointerEvents="none">
                <Feather name="edit-3" size={24} color={colors.mutedForeground} />
                <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 6 }]}>
                  Sign here with finger (Optional now)
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        <PrimaryButton
          testID="assign-submit"
          label={hasSignature ? 'Confirm assignment (Signed)' : 'Send assignment request'}
          icon={hasSignature ? 'check-circle' : 'arrow-up-right'}
          onPress={submit}
        />
        <SecondaryButton testID="assign-cancel" label="Go back" onPress={() => router.back()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  member: {
    minHeight: 68,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  signatureCanvas: {
    height: 160,
    borderWidth: 1.5,
    borderRadius: 10,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
});