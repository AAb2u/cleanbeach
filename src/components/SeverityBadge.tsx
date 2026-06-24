import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PollutionSeverity } from '../types';
import { SEVERITY_LABELS } from '../constants/labels';
import { getSeverityColor } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

export function SeverityBadge({ severity }: { severity: PollutionSeverity }) {
  const { isDark } = useTheme();
  const color = getSeverityColor(severity, isDark);
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{SEVERITY_LABELS[severity]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  text: { fontSize: FontSize.xs, fontWeight: '600' },
});
