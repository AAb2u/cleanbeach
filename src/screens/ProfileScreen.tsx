import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { BADGES } from '../constants/labels';
import { FontSize, Spacing, BorderRadius, Gradients } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, logout } = useAuth();
  const { colors, isDark, toggleTheme, mode } = useTheme();
  const headerGradient = isDark ? Gradients.dark.primary : Gradients.light.primary;

  const initials = (profile?.displayName ?? 'U')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.displayName ?? 'Utilisateur'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </LinearGradient>

      <View style={styles.stats}>
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{profile?.reportsCount ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Signalements</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.secondary }]}>{profile?.contributionPoints ?? 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges</Text>
      <View style={styles.badges}>
        {BADGES.map((b) => {
          const earned = profile?.badges.includes(b.id);
          return (
            <View key={b.id} style={[styles.badge, { backgroundColor: colors.surface, opacity: earned ? 1 : 0.45 }]}>
              <Ionicons name={earned ? 'ribbon' : 'ribbon-outline'} size={24} color={earned ? colors.secondary : colors.textSecondary} />
              <View style={styles.badgeText}>
                <Text style={[styles.badgeName, { color: colors.text }]}>{b.name}</Text>
                <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>{b.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.settings}>
        <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 0 }]}>Parametres</Text>
        <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.surface }]} onPress={toggleTheme}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
          <Text style={[styles.settingText, { color: colors.text }]}>
            Theme : {mode === 'system' ? 'Systeme' : isDark ? 'Sombre' : 'Clair'}
          </Text>
        </TouchableOpacity>
        {profile?.isAdmin && (
          <Button title="Tableau de bord admin" onPress={() => navigation.navigate('Admin')} icon="shield-checkmark" style={{ marginTop: Spacing.md }} />
        )}
        <Button title="Se deconnecter" onPress={logout} variant="danger" icon="log-out" style={{ marginTop: Spacing.md }} />
      </View>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.xl + Spacing.lg, paddingHorizontal: Spacing.lg },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.xxl, fontWeight: '800' },
  name: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800', marginTop: Spacing.sm, textAlign: 'center' },
  email: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, textAlign: 'center', marginTop: 2 },
  stats: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md, marginTop: -Spacing.lg },
  statBox: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, elevation: 2 },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  badges: { padding: Spacing.md, gap: Spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm },
  badgeText: { flex: 1 },
  badgeName: { fontWeight: '700' },
  badgeDesc: { fontSize: FontSize.xs, marginTop: 2 },
  settings: { padding: Spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm },
  settingText: { fontSize: FontSize.md, flex: 1 },
});
