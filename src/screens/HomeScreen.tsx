import React, { useEffect, useState } from 'react';
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList, BeachReport, BeachStats } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToReports, getBeachStats } from '../services/beachService';
import { BeachCard } from '../components/BeachCard';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { AppImages } from '../constants/images';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [reports, setReports] = useState<BeachReport[]>([]);
  const [stats, setStats] = useState<BeachStats>({ total: 0, polluted: 0, cleaning: 0, cleaned: 0, highSeverity: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToReports(setReports);
    getBeachStats().then(setStats);
    return unsub;
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setStats(await getBeachStats());
    setRefreshing(false);
  };

  const recent = reports.slice(0, 5);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <ImageBackground source={AppImages.homeCleanup} style={styles.hero} resizeMode="cover">
        <LinearGradient colors={['rgba(4, 20, 30, 0.18)', 'rgba(4, 20, 30, 0.76)']} style={styles.heroOverlay}>
          <Text style={styles.greeting}>Bonjour, {profile?.displayName ?? 'Eco-citoyen'}</Text>
          <Text style={styles.heroSub}>Suivez, signalez et nettoyez les plages autour de vous.</Text>
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Report')}>
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={[styles.fabText, { color: colors.primary }]}>Signaler</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.statsBlock}>
        <View style={styles.statsRow}>
          <StatCard icon="document-text" label="Total" value={stats.total} />
          <StatCard icon="warning" label="Polluees" value={stats.polluted} color={colors.error} />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="construct" label="En nettoyage" value={stats.cleaning} color={colors.warning} />
          <StatCard icon="checkmark-circle" label="Nettoyees" value={stats.cleaned} color={colors.secondary} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Signalements recents</Text>
        <TouchableOpacity onPress={() => navigation.navigate('List')} style={[styles.linkPill, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {recent.length === 0 ? (
        <EmptyState title="Aucun signalement" message="Soyez le premier a signaler une plage polluee." />
      ) : (
        recent.map((r) => (
          <View key={r.id} style={styles.cardWrap}>
            <BeachCard report={r} onPress={() => navigation.navigate('BeachDetails', { beachId: r.id })} />
          </View>
        ))
      )}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 250 },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: Spacing.lg, paddingTop: 52 },
  greeting: { color: '#fff', fontSize: FontSize.xxl, fontWeight: '800' },
  heroSub: { color: '#fff', fontSize: FontSize.md, marginTop: Spacing.xs, maxWidth: 310 },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: 6,
  },
  fabText: { fontWeight: '700', fontSize: FontSize.sm },
  statsBlock: { marginTop: -Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  linkPill: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full },
  linkText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardWrap: { paddingHorizontal: Spacing.md },
});
