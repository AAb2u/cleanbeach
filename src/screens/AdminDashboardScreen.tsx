import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { RootStackParamList, BeachReport, BeachStats } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { getAllReports, getBeachStats, updateReportStatus, deleteReport } from '../services/beachService';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { STATUS_LABELS } from '../constants/labels';
import { BeachStatus } from '../types';
import { FontSize, Spacing, BorderRadius } from '../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

export function AdminDashboardScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [reports, setReports] = useState<BeachReport[]>([]);
  const [stats, setStats] = useState<BeachStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setReports(await getAllReports());
    setStats(await getBeachStats());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeStatus = (id: string, status: BeachStatus) => {
    Alert.alert('Confirmer', `Passer en "${STATUS_LABELS[status]}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => { await updateReportStatus(id, status); await load(); } },
    ]);
  };

  const remove = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer ce signalement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteReport(id); await load(); } },
    ]);
  };

  if (loading || !stats) return <LoadingScreen message="Chargement admin..." />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.statsRow}>
        <StatCard icon="document-text" label="Total" value={stats.total} />
        <StatCard icon="alert-circle" label="Grave" value={stats.highSeverity} color={colors.error} />
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.md }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => navigation.navigate('BeachDetails', { beachId: item.id })}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <View style={styles.badges}><SeverityBadge severity={item.severity} /><StatusBadge status={item.status} /></View>
            </TouchableOpacity>
            <View style={styles.actions}>
              {(['polluted', 'cleaning', 'cleaned'] as BeachStatus[]).map((s) => (
                <TouchableOpacity key={s} style={[styles.chip, { borderColor: colors.primary }]} onPress={() => changeStatus(item.id, s)}>
                  <Text style={{ color: colors.primary, fontSize: 11 }}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.chip, { borderColor: colors.error }]} onPress={() => remove(item.id)}>
                <Text style={{ color: colors.error, fontSize: 11 }}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  card: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  chip: { borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 4 },
});
