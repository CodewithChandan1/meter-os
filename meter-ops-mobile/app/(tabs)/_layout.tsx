import React from 'react';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { useMeters } from '@/context/MeterContext';

let BlurViewComponent: any = null;
try {
  BlurViewComponent = require('expo-blur').BlurView;
} catch {
  // Safe fallback if expo-blur is omitted in Metro resolution
}

function HeaderRightIcons() {
  const colors = useColors();
  const { stats } = useMeters();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 10 }}>
      {/* Notification Bell Icon */}
      <Pressable
        testID="header-notifications"
        onPress={() => router.push('/notifications')}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Feather name="bell" size={18} color={colors.foreground} />
        {stats.pending > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: colors.destructive,
              borderRadius: 8,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
              borderWidth: 1.5,
              borderColor: colors.card,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{stats.pending}</Text>
          </View>
        ) : null}
      </Pressable>

      {/* Profile Avatar */}
      <Pressable
        testID="header-profile"
        onPress={() => router.push('/(tabs)/profile')}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.primaryForeground, fontSize: 13, fontWeight: '700' }}>CM</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84, paddingBottom: 34 } : {}),
        },
        tabBarBackground: () =>
          isIOS && BlurViewComponent ? (
            <BlurViewComponent
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.card },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
          headerRight: () => <HeaderRightIcons />,
          tabBarIcon: ({ color }: { color: string }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meters"
        options={{
          title: 'Meters',
          headerShown: true,
          headerRight: () => <HeaderRightIcons />,
          tabBarIcon: ({ color }: { color: string }) => <Feather name="list" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          headerShown: false,
          tabBarIcon: ({ color }: { color: string }) => <Feather name="plus-circle" size={22} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/meter/add-choice');
          },
        }}
      />
      <Tabs.Screen
        name="temp-meters"
        options={{
          title: 'Temp Meters',
          headerShown: true,
          headerRight: () => <HeaderRightIcons />,
          tabBarIcon: ({ color }: { color: string }) => <Feather name="zap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          headerShown: true,
          headerRight: () => <HeaderRightIcons />,
          tabBarIcon: ({ color }: { color: string }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
