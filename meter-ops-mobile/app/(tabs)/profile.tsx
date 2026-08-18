import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMeters } from '@/context/MeterContext';
import { Card, Header, PrimaryButton, SecondaryButton, SectionLabel, styles as ui } from '@/components/MeterUI';

import { useToast } from '@/context/ToastContext';

export default function Profile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut, updateUser, workspaceDetails, updateWorkspaceDetails } = useMeters();
  const { showToast, showAlert } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);

  // Profile Edit State
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState(user?.role ?? 'Field Specialist');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Workspace Details Edit State
  const [wsName, setWsName] = useState(workspaceDetails?.name ?? 'North Punjab');
  const [wsRegion, setWsRegion] = useState(workspaceDetails?.region ?? 'Jalandhar, Punjab');

  const saveProfile = () => {
    if (!name.trim() || !email.trim() || !role.trim()) {
      return showToast({ title: 'Missing fields', message: 'Name, email, and role are required.', type: 'error' });
    }
    updateUser({ name: name.trim(), email: email.trim(), role: role.trim() });
    setIsEditingProfile(false);
    showToast({ title: 'Profile updated', message: 'Your profile information has been saved.', type: 'success' });
  };

  const changePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return showToast({ title: 'Missing fields', message: 'Please fill in all password fields.', type: 'error' });
    }
    if (newPassword.length < 6) {
      return showToast({ title: 'Weak password', message: 'New password must be at least 6 characters.', type: 'warning' });
    }
    if (newPassword !== confirmPassword) {
      return showToast({ title: 'Password mismatch', message: 'New password and confirm password do not match.', type: 'error' });
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
    showToast({ title: 'Password Changed', message: 'Your password has been updated successfully!', type: 'success' });
  };

  const saveWorkspace = () => {
    if (!wsName.trim() || !wsRegion.trim()) {
      return showToast({ title: 'Missing fields', message: 'Workspace name and region are required.', type: 'error' });
    }
    updateWorkspaceDetails({
      name: wsName.trim(),
      region: wsRegion.trim(),
    });
    setIsEditingWorkspace(false);
    showToast({ title: 'Workspace updated', message: 'Workspace details have been saved successfully.', type: 'success' });
  };

  const leave = () =>
    showAlert({
      title: 'Sign out?',
      message: 'You can sign back in with your workspace email.',
      type: 'warning',
      buttons: [
        { text: 'Keep working', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/sign-in');
          },
        },
      ],
    });

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(/[._\s]+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Profile & Settings" back />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 100,
          gap: 20,
        }}
      >

        {/* User Card */}
        <Card style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.initials, { color: colors.primaryForeground }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ui.cardTitle, { color: colors.foreground }]}>{user?.name ?? 'Signed out'}</Text>
            <Text style={[ui.caption, { color: colors.mutedForeground, marginTop: 3 }]}>
              {user?.email ?? 'No active session'}
            </Text>
            <Text style={[ui.eyebrow, { color: colors.primary, marginTop: 7 }]}>{user?.role ?? 'Admin'}</Text>
          </View>
        </Card>

        {/* Profile Edit Option */}
        <SectionLabel
          right={
            <Pressable onPress={() => setIsEditingProfile(!isEditingProfile)}>
              <Text style={[ui.caption, { color: colors.primary }]}>
                {isEditingProfile ? 'Cancel' : 'Edit profile'}
              </Text>
            </Pressable>
          }
        >
          Personal Information
        </SectionLabel>

        {isEditingProfile ? (
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>Full Name</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>Email Address</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@company.com"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>Job Role / Designation</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={role}
                onChangeText={setRole}
                placeholder="e.g. Field Specialist"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
                {['Field Specialist', 'Meter Technician', 'Inventory Manager', 'Field Engineer', 'Admin'].map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      backgroundColor: role === r ? colors.primary : colors.background,
                      borderWidth: 1,
                      borderColor: role === r ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: role === r ? colors.primaryForeground : colors.foreground }}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <PrimaryButton label="Save profile changes" icon="check" onPress={saveProfile} />
          </Card>
        ) : null}

        {/* Security & Password Change */}
        <SectionLabel
          right={
            <Pressable onPress={() => setIsChangingPassword(!isChangingPassword)}>
              <Text style={[ui.caption, { color: colors.primary }]}>
                {isChangingPassword ? 'Cancel' : 'Change password'}
              </Text>
            </Pressable>
          }
        >
          Security & Password
        </SectionLabel>

        {isChangingPassword ? (
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>Current Password</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>New Password</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="At least 6 characters"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>Confirm New Password</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter new password"
              />
            </View>

            <PrimaryButton label="Update password" icon="lock" onPress={changePassword} />
          </Card>
        ) : null}

        {/* Workspace Info */}
        <SectionLabel
          right={
            <Pressable onPress={() => setIsEditingWorkspace(!isEditingWorkspace)}>
              <Text style={[ui.caption, { color: colors.primary }]}>
                {isEditingWorkspace ? 'Cancel' : 'Edit workspace'}
              </Text>
            </Pressable>
          }
        >
          Workspace Details
        </SectionLabel>

        {isEditingWorkspace ? (
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>Workspace Name</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={wsName}
                onChangeText={setWsName}
                placeholder="e.g. North Punjab"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[ui.label, { color: colors.inkSoft }]}>Default Field Region</Text>
              <TextInput
                style={[
                  ui.input,
                  { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
                ]}
                value={wsRegion}
                onChangeText={setWsRegion}
                placeholder="e.g. Jalandhar, Punjab"
              />
            </View>

            <PrimaryButton label="Save workspace details" icon="check" onPress={saveWorkspace} />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {[
              ['briefcase', workspaceDetails?.name ?? 'North Punjab', workspaceDetails?.inventoryType ?? 'Meter inventory workspace', true],
              ['map-pin', workspaceDetails?.region ?? 'Jalandhar, Punjab', workspaceDetails?.regionType ?? 'Default field region', true],
              ['shield', 'Local-first storage', 'Instant offline access · Synced to PostgreSQL DB', false],
            ].map(([icon, title, sub, editable]) => (
              <Pressable
                key={title as string}
                onPress={() => editable && setIsEditingWorkspace(true)}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <Feather name={icon as keyof typeof Feather.glyphMap} size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[ui.body, { color: colors.foreground }]}>{title as string}</Text>
                  <Text style={[ui.caption, { color: colors.mutedForeground }]}>{sub as string}</Text>
                </View>
                {editable ? (
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                ) : (
                  <Text style={[ui.eyebrow, { color: colors.success, fontSize: 11 }]}>SYSTEM</Text>
                )}
              </Pressable>
            ))}
          </Card>
        )}

        {/* Sign Out */}
        <SectionLabel>Session</SectionLabel>
        <Pressable
          testID="profile-sign-out"
          onPress={leave}
          style={[styles.signOut, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[ui.buttonText, { color: colors.destructive }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  row: { minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 13 },
  signOut: { minHeight: 50, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});