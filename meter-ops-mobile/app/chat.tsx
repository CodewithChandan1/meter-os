import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { teamMembers, useMeters } from '@/context/MeterContext';
import { styles as ui } from '@/components/MeterUI';

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name: paramName } = useLocalSearchParams<{ name?: string }>();
  const { messages, sendMessage, user } = useMeters();

  const activePartner = paramName || 'Rahul Sharma';
  const partnerInfo = teamMembers.find((m) => m.name === activePartner);

  const [input, setInput] = useState('');

  // Filter messages between current user and active partner
  const chatHistory = messages.filter(
    (m) =>
      (m.senderName === user?.name && m.receiverName === activePartner) ||
      (m.senderName === activePartner && m.receiverName === user?.name)
  );

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(activePartner, input);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }}>
        {/* Partner Info Banner */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground }}>
            Chatting with {activePartner}
          </Text>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#10B981' }}>Online</Text>
        </View>

        {/* Message Thread */}
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            paddingBottom: insets.bottom + 80,
          }}
        >
          {chatHistory.length ? (
            chatHistory.map((msg) => {
              const isMe = msg.senderName === user?.name;
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.bubbleWrapper,
                    { alignItems: isMe ? 'flex-end' : 'flex-start' },
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isMe ? colors.primary : colors.card,
                        borderColor: isMe ? colors.primary : colors.border,
                        borderBottomRightRadius: isMe ? 2 : 16,
                        borderBottomLeftRadius: isMe ? 16 : 2,
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        ui.body,
                        { color: isMe ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        ui.caption,
                        {
                          color: isMe ? colors.primaryForeground : colors.mutedForeground,
                          opacity: 0.75,
                          fontSize: 10,
                          alignSelf: 'flex-end',
                          marginTop: 4,
                        },
                      ]}
                    >
                      {msg.timestamp}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ alignItems: 'center', marginTop: 40, gap: 8 }}>
              <Feather name="message-square" size={32} color={colors.mutedForeground} />
              <Text style={[ui.body, { color: colors.mutedForeground }]}>
                No messages yet. Say hi to {activePartner}!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* WhatsApp style Input Box */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            testID="chat-input"
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${activePartner.split(' ')[0]}...`}
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
            ]}
          />
          <Pressable
            testID="chat-send"
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="send" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleWrapper: {
    width: '100%',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
