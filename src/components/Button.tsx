import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, Spacing, Gradients } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZES: Record<ButtonSize, { padV: number; padH: number; font: number; minHeight: number; icon: number }> = {
  sm: { padV: Spacing.sm, padH: Spacing.md, font: FontSize.sm, minHeight: 40, icon: 16 },
  md: { padV: Spacing.md, padH: Spacing.lg, font: FontSize.md, minHeight: 52, icon: 18 },
  lg: { padV: Spacing.md + 2, padH: Spacing.xl, font: FontSize.lg, minHeight: 58, icon: 20 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const isDisabled = disabled || loading;
  const dims = SIZES[size];
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  const isFilled = variant === 'primary' || variant === 'secondary' || variant === 'accent';
  const grads = isDark ? Gradients.dark : Gradients.light;

  const sizing: ViewStyle = {
    paddingVertical: dims.padV,
    paddingHorizontal: dims.padH,
    minHeight: dims.minHeight,
  };

  const content = (label: string, color: string) => (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={dims.icon} color={color} style={styles.icon} />}
          <Text style={[styles.text, { color, fontSize: dims.font }]}>{label}</Text>
        </>
      )}
    </View>
  );

  // --- Boutons pleins (dégradé + ombre colorée) ---
  if (isFilled) {
    const grad = variant === 'primary' ? grads.primary : variant === 'secondary' ? grads.secondary : grads.accent;
    const shadow =
      variant === 'primary' ? colors.primaryShadow : variant === 'secondary' ? colors.secondaryShadow : colors.primaryShadow;
    return (
      <Animated.View
        style={[
          styles.wrapper,
          fullWidth && styles.fullWidth,
          { shadowColor: shadow, transform: [{ scale }] },
          isFilled && styles.filledShadow,
          style,
          isDisabled && styles.disabled,
        ]}
      >
        <Pressable
          onPress={onPress}
          disabled={isDisabled}
          onPressIn={() => animateTo(0.96)}
          onPressOut={() => animateTo(1)}
          style={styles.pressable}
        >
          <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradient, sizing]}>
            {content(title, colors.textOnPrimary)}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  // --- Ghost (fond teinté léger) ---
  if (variant === 'ghost') {
    return (
      <Animated.View style={[styles.wrapper, fullWidth && styles.fullWidth, { transform: [{ scale }] }, style, isDisabled && styles.disabled]}>
        <Pressable
          onPress={onPress}
          disabled={isDisabled}
          onPressIn={() => animateTo(0.96)}
          onPressOut={() => animateTo(1)}
          style={[styles.flat, sizing, { backgroundColor: colors.primary + '1A' }]}
        >
          {content(title, colors.primary)}
        </Pressable>
      </Animated.View>
    );
  }

  // --- Outline & Danger ---
  const accentColor = variant === 'danger' ? colors.error : colors.primary;
  return (
    <Animated.View style={[styles.wrapper, fullWidth && styles.fullWidth, { transform: [{ scale }] }, style, isDisabled && styles.disabled]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[styles.flat, sizing, { borderWidth: 2, borderColor: accentColor, backgroundColor: accentColor + '0D' }]}
      >
        {content(title, accentColor)}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  fullWidth: { alignSelf: 'stretch' },
  filledShadow: {
    overflow: 'visible',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  pressable: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  gradient: { alignItems: 'center', justifyContent: 'center' },
  flat: { alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: Spacing.sm },
  text: { fontWeight: '700', letterSpacing: 0.3 },
  disabled: { opacity: 0.5 },
});
