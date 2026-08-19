import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface AuthUnderlineInputProps extends TextInputProps {
  label: string;
  iconName?: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
}

export function AuthUnderlineInput({
  label,
  iconName,
  isPassword = false,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  testID,
  ...rest
}: AuthUnderlineInputProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const activeColor = '#0052D4';
  const inactiveColor = colors.border;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isFocused ? activeColor : colors.mutedForeground }]}>
        {label}
      </Text>

      <View
        style={[
          styles.inputRow,
          {
            borderBottomColor: isFocused ? activeColor : inactiveColor,
            borderBottomWidth: isFocused ? 2 : 1.5,
          },
        ]}
      >
        {iconName ? (
          <Feather
            name={iconName}
            size={18}
            color={isFocused ? activeColor : colors.mutedForeground}
            style={{ marginRight: 8 }}
          />
        ) : null}

        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder={placeholder || label}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          testID={testID}
          {...rest}
        />

        {isPassword ? (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    paddingVertical: 2,
  },
});
