import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, BeachReport, BeachStatus, PollutionSeverity } from '../types';
import { useTheme } from '../context/ThemeContext';
import { subscribeToReports } from '../services/beachService';
import { BeachCard } from '../components/BeachCard';
import { EmptyState } from '../components/EmptyState';
import { SEVERITY_LABELS, STATUS_LABELS } from '../constants/labels';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BeachListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [reports, setReports] = useState<BeachReport[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<PollutionSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<BeachStatus | 'all'>('all');

  useEffect(() => subscribeToReports(setReports), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.locationName.toLowerCase().includes(q);
      const matchSeverity = severityFilter === 'all' || r.severity === severityFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchSeverity && matchStatus;
    });
  }, [reports, search, severityFilter, statusFilter]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher une plage..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(['all', 'low', 'medium', 'high'] as const).map((s) => (
              <FilterChip
                key={s}
                label={s === 'all' ? 'Toutes gravités' : SEVERITY_LABELS[s]}
                active={severityFilter === s}
                onPress={() => setSeverityFilter(s)}
                colors={colors}
              />
            ))}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(['all', 'polluted', 'cleaning', 'cleaned'] as const).map((s) => (
              <FilterChip
                key={s}
                label={s === 'all' ? 'Tous statuts' : STATUS_LABELS[s]}
                active={statusFilter === s}
                onPress={() => setStatusFilter(s)}
                colors={colors}
              />
            ))}
          </ScrollView>

          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {filtered.length} signalement{filtered.length > 1 ? 's' : ''}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <BeachCard report={item} onPress={() => navigation.navigate('BeachDetails', { beachId: item.id })} />
      )}
      ListEmptyComponent={
        <EmptyState title="Aucun resultat" message="Modifiez vos filtres ou creez un signalement." icon="list-outline" />
      }
    />
  );
}

function FilterChip({
  label, active, onPress, colors,
}: { label: string; active: boolean; onPress: () => void; colors: { primary: string; surface: string; text: string; border: string } }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.surface },
      ]}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontSize: FontSize.xs, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md, flexGrow: 1 },
  header: { marginBottom: Spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: Spacing.sm + 2, fontSize: FontSize.md },
  filterRow: { flexDirection: 'row', gap: Spacing.xs, paddingVertical: 2, paddingRight: Spacing.md },
  chip: { borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 7 },
  count: { fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.sm, marginBottom: Spacing.xs },
});
