import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { FontSize, Spacing } from '../constants/theme';

export function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>{message}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: FontSize.md, marginTop: Spacing.md, fontWeight: '500' },
});
