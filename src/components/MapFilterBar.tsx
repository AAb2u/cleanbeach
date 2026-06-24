import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';
import { MapFilter } from '../utils/mapReports';

interface MapFilterBarProps {
  value: MapFilter;
  counts: Record<MapFilter, number>;
  onChange: (value: MapFilter) => void;
}

const FILTERS: { key: MapFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'mine', label: 'Mes signalements' },
  { key: 'others', label: 'Autres' },
];

export function MapFilterBar({ value, counts, onChange }: MapFilterBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const active = value === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            onPress={() => onChange(filter.key)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: active ? '#fff' : colors.text }]} numberOfLines={1}>
              {filter.label}
            </Text>
            <Text style={[styles.count, { color: active ? '#fff' : colors.textSecondary }]}>
              {counts[filter.key]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: Spacing.xs },
  chip: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center' },
  count: { fontSize: 10, fontWeight: '700', marginTop: 1 },
});
