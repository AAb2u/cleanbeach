import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, BeachReport, BeachStatus, PollutionSeverity } from '../types';
import { useTheme } from '../context/ThemeContext';
import { subscribeToReports } from '../services/beachService';
import { BeachCard } from '../components/BeachCard';
import { EmptyState } from '../components/EmptyState';
import { AppImages } from '../constants/images';
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
          <ImageBackground source={AppImages.reportKit} style={styles.banner} imageStyle={styles.bannerImage} resizeMode="cover">
            <LinearGradient colors={['rgba(2, 19, 30, 0.14)', 'rgba(2, 19, 30, 0.72)']} style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>Explorer les signalements</Text>
              <Text style={styles.bannerText}>{filtered.length} plage(s) trouvee(s)</Text>
            </LinearGradient>
          </ImageBackground>

          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher une plage..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
          <View style={styles.filters}>
            {(['all', 'low', 'medium', 'high'] as const).map((s) => (
              <FilterChip
                key={s}
                label={s === 'all' ? 'Tous' : SEVERITY_LABELS[s]}
                active={severityFilter === s}
                onPress={() => setSeverityFilter(s)}
                colors={colors}
              />
            ))}
          </View>
          <View style={styles.filters}>
            {(['all', 'polluted', 'cleaning', 'cleaned'] as const).map((s) => (
              <FilterChip
                key={s}
                label={s === 'all' ? 'Statut' : STATUS_LABELS[s]}
                active={statusFilter === s}
                onPress={() => setStatusFilter(s)}
                colors={colors}
              />
            ))}
          </View>
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
        { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '20' : colors.surface },
      ]}
    >
      <Text style={{ color: active ? colors.primary : colors.text, fontSize: FontSize.xs, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md, flexGrow: 1 },
  header: { marginBottom: Spacing.sm },
  banner: { minHeight: 150, marginBottom: Spacing.md, overflow: 'hidden', borderRadius: BorderRadius.lg },
  bannerImage: { borderRadius: BorderRadius.lg },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: Spacing.md },
  bannerTitle: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800' },
  bannerText: { color: '#fff', fontSize: FontSize.sm, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.xs },
  chip: { borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 6 },
});
