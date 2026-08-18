import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Card, SectionLabel, styles as ui } from '@/components/MeterUI';
import { useToast } from '@/context/ToastContext';

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  mobile?: string;
};

export default function Team() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, users, meters, workspaceDetails } = useMeters();
  const { showToast } = useToast();

  const [selectedMember, setSelectedMember] = useState<TeamUser | null>(null);

  // Filter registered Neon Postgres users (excluding current logged-in user)
  const colleagues: TeamUser[] = users.filter((u) => u.email !== user?.email && u.id !== user?.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: insets.bottom + 100, gap: 18 }}>
        <View>
          <Text style={[ui.eyebrow, { color: colors.primary }]}>WORKSPACE</Text>
          <Text style={[ui.headerTitle, { color: colors.foreground, marginTop: 6 }]}>Team Members</Text>
          <Text style={[ui.body, { color: colors.mutedForeground, marginTop: 4 }]}>
            Active team members in {workspaceDetails?.name ?? 'Workspace'} registered in Neon database. Tap for contact details.
          </Text>
        </View>

        {/* Capacity Summary */}
        <Card style={[styles.summary, { backgroundColor: colors.secondary, borderColor: colors.secondary }]}>
          <Text style={[ui.eyebrow, { color: colors.accent }]}>ACTIVE FIELD CAPACITY</Text>
          <Text style={[styles.big, { color: colors.primaryForeground }]}>
            {meters.filter((m) => m.status === 'ASSIGNED' || m.status === 'INSTALLATION_PENDING').length}
          </Text>
          <Text style={[ui.body, { color: colors.primaryForeground, opacity: 0.8 }]}>meters currently in the field</Text>
        </Card>

        <SectionLabel>{`Team Members (${colleagues.length})`}</SectionLabel>

        {/* Real Registered Database Users List */}
        {colleagues.length === 0 ? (
          <Card style={{ padding: 24, alignItems: 'center', gap: 10 }}>
            <Feather name="users" size={32} color={colors.mutedForeground} />
            <Text style={[ui.cardTitle, { color: colors.foreground }]}>No Other Team Members Found</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground, textAlign: 'center' }]}>
              No other colleagues have registered in this workspace database yet.
            </Text>
          </Card>
        ) : (
          colleagues.map((member) => {
            const initials = member.name
              ? member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'U';

            return (
              <Pressable key={member.id} onPress={() => setSelectedMember(member)}>
                <Card style={styles.memberCard}>
                  <View style={{ position: 'relative' }}>
                    <View style={[styles.avatar, { backgroundColor: colors.navySoft }]}>
                      <Text style={[ui.buttonText, { color: colors.secondary }]}>{initials}</Text>
                    </View>

                    {/* Online Badge */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 13,
                        height: 13,
                        borderRadius: 6.5,
                        backgroundColor: '#10B981',
                        borderWidth: 2,
                        borderColor: colors.card,
                      }}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[ui.cardTitle, { color: colors.foreground }]}>{member.name}</Text>
                      <Text style={[ui.eyebrow, { color: colors.primary }]}>{member.role || 'Field Specialist'}</Text>
                    </View>

                    {/* Contact Info: Email & Role */}
                    <View style={{ gap: 2, marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="mail" size={12} color={colors.mutedForeground} />
                        <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground }}>
                          {member.email}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: '/chat', params: { name: member.name } });
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="message-square" size={17} color={colors.primaryForeground} />
                  </Pressable>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Member Details Bottom Sheet Modal */}
      <Modal
        visible={Boolean(selectedMember)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMember(null)}
      >
        <Pressable onPress={() => setSelectedMember(null)} style={styles.modalBackdrop}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            {selectedMember ? (
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={[styles.largeAvatar, { backgroundColor: colors.navySoft }]}>
                    <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary }}>
                      {selectedMember.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground }}>
                      {selectedMember.name}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary, marginTop: 2 }}>
                      {selectedMember.role || 'Field Specialist'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#10B981' }}>
                        Registered Neon DB User
                      </Text>
                    </View>
                  </View>

                  <Pressable onPress={() => setSelectedMember(null)} style={styles.closeBtn}>
                    <Feather name="x" size={20} color={colors.foreground} />
                  </Pressable>
                </View>

                {/* Details Section */}
                <View style={{ gap: 10 }}>
                  <View style={[styles.detailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Feather name="mail" size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground }}>
                        EMAIL ADDRESS
                      </Text>
                      <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.foreground, marginTop: 2 }}>
                        {selectedMember.email}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Feather name="shield" size={18} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground }}>
                        ROLE & PERMISSIONS
                      </Text>
                      <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.foreground, marginTop: 2 }}>
                        {selectedMember.role || 'Field Specialist'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Chat Action */}
                <Pressable
                  onPress={() => {
                    const memberName = selectedMember.name;
                    setSelectedMember(null);
                    router.push({ pathname: '/chat', params: { name: memberName } });
                  }}
                  style={[styles.chatBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="message-square" size={18} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                    Open Direct Chat
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { padding: 20, gap: 5 },
  big: { fontFamily: 'Inter_700Bold', fontSize: 40, lineHeight: 45, letterSpacing: -1.5, marginTop: 7 },
  memberCard: { padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  largeAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 6 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  detailBox: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chatBtn: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
});