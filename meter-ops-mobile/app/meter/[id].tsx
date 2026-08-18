import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { ActivityTimeline, Card, Header, IconButton, PrimaryButton, SectionLabel, SecondaryButton, StatusPill, styles as ui } from '@/components/MeterUI';
import { useToast } from '@/context/ToastContext';

export default function MeterDetail() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMeter, updateMeter, returnMeter, deleteMeter, acceptAssignment, rejectAssignment, requestReturn, acceptReturn, rejectReturn, user } = useMeters();
  const { showToast, showAlert } = useToast();
  const meter = getMeter(id ?? '');

  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    acNumber: '',
    serialNumber: '',
    customerName: '',
    customerMobile: '',
    address: '',
    capacity: '',
    company: '',
    type: '',
    notes: '',
    mapLink: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  React.useEffect(() => {
    if (meter) {
      setForm({
        acNumber: meter.acNumber || '',
        serialNumber: meter.serialNumber || '',
        customerName: meter.customerName || '',
        customerMobile: meter.customerMobile || '',
        address: meter.address || '',
        capacity: meter.capacity || '5 KW',
        company: meter.company || 'Genus Power',
        type: meter.type || 'Single phase',
        notes: meter.notes || '',
        mapLink: meter.mapLink || '',
        latitude: meter.latitude,
        longitude: meter.longitude,
      });
    }
  }, [meter?.id]);

  const [locationStatus, setLocationStatus] = React.useState('');
  if (!meter) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Meter Detail" back />
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={[ui.body, { color: colors.mutedForeground }]}>Meter record not found.</Text>
        </View>
      </View>
    );
  }

  const canAssign = meter.status === 'AVAILABLE' || meter.status === 'RETURNED';
  const canInstall = meter.status === 'ASSIGNED' || meter.status === 'INSTALLATION_PENDING';
  const canCancel = meter.status !== 'INSTALLED' && meter.status !== 'CANCELLED';

  const setField = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const captureGPS = () => {
    const mockLat = 31.326 + Number((Math.random() * 0.01).toFixed(4));
    const mockLng = 75.576 + Number((Math.random() * 0.01).toFixed(4));
    const generatedLink = `https://www.google.com/maps/search/?api=1&query=${mockLat},${mockLng}`;

    setForm((prev) => ({
      ...prev,
      latitude: mockLat,
      longitude: mockLng,
      mapLink: generatedLink,
    }));

    showToast({ title: 'GPS Captured', message: `${mockLat}, ${mockLng}`, type: 'success' });
  };

  const generateLinkFromAddress = () => {
    if (!form.address.trim()) {
      return showToast({ title: 'Address required', message: 'Please type an address first.', type: 'warning' });
    }
    const encoded = encodeURIComponent(form.address.trim());
    const generated = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    setForm((prev) => ({ ...prev, mapLink: generated }));
    showToast({ title: 'Location link generated', message: 'Google Maps link generated.', type: 'info' });
  };

  const saveEdits = () => {
    if (!form.customerName.trim() || !form.address.trim()) {
      return showToast({ title: 'Missing fields', message: 'Customer name and address are required.', type: 'error' });
    }
    let finalMapLink = form.mapLink;
    if (!finalMapLink && form.address.trim()) {
      finalMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address.trim())}`;
    }

    updateMeter(meter.id, {
      ...form,
      mapLink: finalMapLink,
    });

    setIsEditing(false);
    showToast({ title: 'Meter updated', message: 'Meter details updated successfully.', type: 'success' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title={meter.acNumber}
        subtitle={meter.customerName}
        back
        action={
          <IconButton
            testID="detail-edit-toggle"
            label="Edit meter"
            name={isEditing ? 'x' : 'edit-2'}
            onPress={() => setIsEditing(!isEditing)}
          />
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 18 }}>
        <View style={styles.statusRow}>
          <StatusPill status={meter.status} />
          <Text style={[ui.caption, { color: colors.mutedForeground }]}>{meter.company} · {meter.capacity}</Text>
        </View>

        {/* Temporary Meter Special Card */}
        {meter.isTemporary || meter.status === 'TEMPORARY' ? (
          <Card style={{ backgroundColor: colors.warningSoft, borderColor: '#fcd34d', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="zap" size={20} color={colors.warning} />
              <Text style={[ui.cardTitle, { color: colors.foreground, fontSize: 16 }]}>
                Temporary Field Meter
              </Text>
            </View>
            <Text style={[ui.body, { color: colors.inkSoft, fontSize: 14 }]}>
              This is a temporary meter installed at customer site.
              {meter.replacedByMeterAc ? ` Scheduled to be replaced by permanent meter: ${meter.replacedByMeterAc}` : ' No permanent replacement meter selected yet.'}
            </Text>

            {meter.status !== 'REPLACED' ? (
              <PrimaryButton
                label={meter.replacedByMeterAc ? `Mark Replaced By ${meter.replacedByMeterAc}` : "Select & Replace with Permanent Meter"}
                icon="refresh-cw"
                onPress={() => {
                  showAlert({
                    title: 'Replace Temporary Meter?',
                    message: `Mark temporary meter ${meter.acNumber} as REPLACED${meter.replacedByMeterAc ? ` by permanent meter ${meter.replacedByMeterAc}` : ''}?`,
                    type: 'warning',
                    buttons: [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm Replacement',
                        onPress: () => {
                          updateMeter(meter.id, { status: 'REPLACED' });
                          showToast({ title: 'Meter Replaced', message: `Temporary meter ${meter.acNumber} marked as REPLACED.`, type: 'success' });
                        },
                      },
                    ],
                  });
                }}
              />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Feather name="check-circle" size={16} color={colors.success} />
                <Text style={[ui.caption, { color: colors.success, fontFamily: 'Inter_600SemiBold' }]}>
                  Successfully replaced with permanent meter {meter.replacedByMeterAc || ''}
                </Text>
              </View>
            )}
          </Card>
        ) : null}

        {!isEditing ? (
          <>
            {/* Action Buttons with 2-Way Handshake */}
            <View style={{ gap: 10 }}>
              {/* Accept / Reject Assignment Buttons */}
              {meter.status === 'ASSIGNMENT_PENDING' ? (
                <View style={{ gap: 8 }}>
                  <PrimaryButton
                    testID="detail-accept-assignment"
                    label="Accept Meter Assignment"
                    icon="check-circle"
                    onPress={() => {
                      acceptAssignment(meter.id);
                      showToast({ title: 'Accepted', message: 'You have accepted this meter assignment.', type: 'success' });
                    }}
                  />
                  <SecondaryButton
                    testID="detail-reject-assignment"
                    label="Decline Assignment"
                    icon="x-circle"
                    onPress={() => {
                      rejectAssignment(meter.id);
                      showToast({ title: 'Declined', message: 'Meter assignment declined. Returned to stock.', type: 'warning' });
                    }}
                  />
                </View>
              ) : null}

              {/* Accept / Reject Return Buttons */}
              {meter.status === 'RETURN_PENDING' ? (
                <View style={{ gap: 8 }}>
                  <PrimaryButton
                    testID="detail-accept-return"
                    label="Accept Returned Meter Into Stock"
                    icon="rotate-ccw"
                    onPress={() => {
                      acceptReturn(meter.id);
                      showToast({ title: 'Return Accepted', message: 'Meter returned back to stock inventory.', type: 'success' });
                    }}
                  />
                  <SecondaryButton
                    testID="detail-reject-return"
                    label="Decline Return Request"
                    icon="x-circle"
                    onPress={() => {
                      rejectReturn(meter.id);
                      showToast({ title: 'Declined', message: 'Return request declined.', type: 'warning' });
                    }}
                  />
                </View>
              ) : null}

              {canAssign ? (
                <PrimaryButton
                  testID="detail-assign"
                  label="Assign meter"
                  icon="arrow-up-right"
                  onPress={() => router.push({ pathname: '/meter/assign', params: { id: meter.id } })}
                />
              ) : null}

              {canInstall ? (
                <PrimaryButton
                  testID="detail-install"
                  label="Mark as installed"
                  icon="check-circle"
                  onPress={() => router.push({ pathname: '/meter/install', params: { id: meter.id } })}
                />
              ) : null}

              {/* Request Return / Recall to Stock */}
              {meter.status === 'ASSIGNED' ? (
                <SecondaryButton
                  testID="detail-return"
                  label={meter.assignedBy === user?.name ? "Recall meter back to stock" : "Request Return to stock"}
                  icon="rotate-ccw"
                  onPress={() => {
                    showAlert({
                      title: meter.assignedBy === user?.name ? 'Recall Meter?' : 'Request Return?',
                      message: meter.assignedBy === user?.name 
                        ? `Send return recall request for ${meter.acNumber} to ${meter.assignedTo}?` 
                        : `Send return request for ${meter.acNumber} back to stock? Assigner will accept it into stock.`,
                      type: 'warning',
                      buttons: [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Confirm',
                          style: 'default',
                          onPress: () => {
                            requestReturn(meter.id);
                            showToast({ title: 'Return Requested', message: 'Meter set to RETURN_PENDING for 2-way approval.', type: 'info' });
                          },
                        },
                      ],
                    });
                  }}
                />
              ) : null}

              {canCancel ? (
                <SecondaryButton
                  testID="detail-cancel"
                  label="Cancel meter"
                  icon="x-circle"
                  onPress={() => router.push({ pathname: '/meter/cancel', params: { id: meter.id } })}
                />
              ) : null}

              <SecondaryButton
                testID="detail-edit"
                label="Edit meter details & location"
                icon="edit"
                onPress={() => setIsEditing(true)}
              />

              <Pressable
                testID="detail-delete"
                onPress={() => {
                  showAlert({
                    title: 'Delete Meter Record?',
                    message: `Are you sure you want to permanently delete meter ${meter.acNumber} (${meter.customerName})? This action cannot be undone.`,
                    type: 'error',
                    buttons: [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          deleteMeter(meter.id);
                          showToast({ title: 'Meter Deleted', message: `Meter ${meter.acNumber} has been removed.`, type: 'warning' });
                          router.replace('/(tabs)/meters');
                        },
                      },
                    ],
                  });
                }}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { borderColor: colors.destructive, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="trash-2" size={17} color={colors.destructive} />
                <Text style={[ui.buttonText, { color: colors.destructive }]}>Delete meter record</Text>
              </Pressable>
            </View>

            <SectionLabel>Customer & meter specifications</SectionLabel>
            <Card style={styles.infoCard}>
              {[
                ['user', 'Customer name', meter.customerName],
                ['phone', 'Customer mobile', meter.customerMobile || 'Not provided'],
                ['hash', 'AC number', meter.acNumber],
                ['cpu', 'Serial number', meter.serialNumber],
                ['briefcase', 'Manufacturer / Company', meter.company || 'Genus Power'],
                ['activity', 'Capacity (KW)', meter.capacity || '5 KW'],
                ['zap', 'Meter phase / Type', meter.type || 'Single phase'],
                ['user-check', 'Assigned to (Field Tech)', meter.assignedTo || 'Unassigned (In Stock)'],
                ['arrow-up-right', 'Assigned by', meter.assignedBy || 'Stock Admin'],
              ].map(([icon, label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Feather name={icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>{label}</Text>
                    <Text style={[ui.body, { color: colors.foreground, marginTop: 2 }]}>{value}</Text>
                  </View>
                </View>
              ))}
            </Card>

            <SectionLabel
              right={
                meter.mapLink ? (
                  <Pressable testID="detail-open-map" onPress={() => Linking.openURL(meter.mapLink ?? '')}>
                    <Text style={[ui.caption, { color: colors.primary }]}>Open map</Text>
                  </Pressable>
                ) : null
              }
            >
              Location
            </SectionLabel>
            <Card style={{ gap: 10 }}>
              <View style={styles.location}>
                <Feather name="map-pin" size={19} color={colors.primary} />
                <Text style={[ui.body, { color: colors.foreground, flex: 1 }]}>{meter.address}</Text>
              </View>
              {meter.mapLink ? (
                <Text style={[ui.caption, { color: colors.primary }]}>
                  Map URL: {meter.mapLink}
                </Text>
              ) : null}
              {meter.latitude ? (
                <Text style={[ui.caption, { color: colors.mutedForeground }]}>
                  Captured GPS · {meter.latitude}, {meter.longitude}
                </Text>
              ) : null}
            </Card>

            {meter.notes ? (
              <Card style={{ gap: 7 }}>
                <Text style={[ui.eyebrow, { color: colors.mutedForeground }]}>FIELD NOTE</Text>
                <Text style={[ui.body, { color: colors.foreground }]}>{meter.notes}</Text>
              </Card>
            ) : null}

            <SectionLabel>Activity</SectionLabel>
            <ActivityTimeline events={meter.history} />
          </>
        ) : (
          /* Inline Edit Form Mode */
          <View style={{ gap: 15 }}>
            <Card style={{ padding: 14, backgroundColor: colors.navySoft, borderColor: colors.primary }}>
              <Text style={[ui.cardTitle, { color: colors.foreground }]}>Edit Meter & Location</Text>
              <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 3 }]}>
                Update customer details, meter specifications, or location information.
              </Text>
            </Card>

            <View style={{ gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={[ui.label, { color: colors.inkSoft }]}>Customer name</Text>
                <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.customerName} onChangeText={setField('customerName')} />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[ui.label, { color: colors.inkSoft }]}>Customer mobile</Text>
                <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.customerMobile} onChangeText={setField('customerMobile')} keyboardType="phone-pad" />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[ui.label, { color: colors.inkSoft }]}>AC number</Text>
                <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.acNumber} onChangeText={setField('acNumber')} autoCapitalize="characters" />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[ui.label, { color: colors.inkSoft }]}>Serial number</Text>
                <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.serialNumber} onChangeText={setField('serialNumber')} autoCapitalize="characters" />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[ui.label, { color: colors.inkSoft }]}>Manufacturer / Company</Text>
                <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.company} onChangeText={setField('company')} placeholder="Genus Power / Secure" />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[ui.label, { color: colors.inkSoft }]}>Capacity</Text>
                  <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.capacity} onChangeText={setField('capacity')} placeholder="5 KW" />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[ui.label, { color: colors.inkSoft }]}>Meter type</Text>
                  <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.type} onChangeText={setField('type')} placeholder="Single phase / 3 Phase" />
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[ui.label, { color: colors.inkSoft }]}>Service address</Text>
                <TextInput style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} value={form.address} onChangeText={setField('address')} placeholder="Address, area, city" />
              </View>

              {/* Location options during edit */}
              <Card style={{ gap: 12 }}>
                <Text style={[ui.cardTitle, { color: colors.foreground }]}>Location options</Text>
                
                <Pressable
                  onPress={captureGPS}
                  style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
                >
                  <Feather name="crosshair" size={18} color={colors.primary} />
                  <Text style={[ui.buttonText, { color: colors.primary, flex: 1 }]}>
                    1. Capture current GPS location
                  </Text>
                </Pressable>

                {locationStatus ? (
                  <Text style={[ui.caption, { color: colors.success }]}>{locationStatus}</Text>
                ) : null}

                <Pressable
                  onPress={generateLinkFromAddress}
                  style={[styles.locationBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name="map-pin" size={18} color={colors.foreground} />
                  <Text style={[ui.buttonText, { color: colors.foreground, flex: 1 }]}>
                    2. Set location from address
                  </Text>
                </Pressable>

                <View style={{ gap: 6 }}>
                  <Text style={[ui.label, { color: colors.inkSoft }]}>3. Manual map link (or paste URL)</Text>
                  <TextInput
                    style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    value={form.mapLink}
                    onChangeText={setField('mapLink')}
                    placeholder="https://maps.google.com/..."
                    autoCapitalize="none"
                  />
                </View>
              </Card>

              <View style={{ gap: 6 }}>
                <Text style={[ui.label, { color: colors.inkSoft }]}>Field notes</Text>
                <TextInput
                  style={[ui.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, minHeight: 80 }]}
                  value={form.notes}
                  onChangeText={setField('notes')}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <PrimaryButton testID="save-edit" label="Save changes" icon="check" onPress={saveEdits} />
              <SecondaryButton testID="cancel-edit" label="Cancel edit" onPress={() => setIsEditing(false)} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  infoCard: { gap: 17 },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  location: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  locationBtn: {
    minHeight: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
});