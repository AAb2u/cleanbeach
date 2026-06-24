import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  if (variant === 'primary' || variant === 'secondary') {
    const grad = (variant === 'primary' ? [colors.primary, colors.primaryDark] : [colors.secondary, colors.secondaryDark]) as [string, string];
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8} style={[styles.wrapper, style, isDisabled && styles.disabled]}>
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const outlineStyle: ViewStyle = {
    borderWidth: 2,
    borderColor: variant === 'danger' ? colors.error : colors.primary,
    backgroundColor: 'transparent',
  };
  const textStyle: TextStyle = { color: variant === 'danger' ? colors.error : colors.primary };

  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}
      style={[styles.wrapper, styles.outline, outlineStyle, style, isDisabled && styles.disabled]}>
      {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.outlineText, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  gradient: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  text: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  outline: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 48, borderRadius: BorderRadius.md },
  outlineText: { fontSize: FontSize.md, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
