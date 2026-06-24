import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BeachStatus } from '../types';
import { STATUS_LABELS } from '../constants/labels';
import { getStatusColor } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

export function StatusBadge({ status }: { status: BeachStatus }) {
  const { isDark } = useTheme();
  const color = getStatusColor(status, isDark);
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  text: { fontSize: FontSize.xs, fontWeight: '600' },
});
