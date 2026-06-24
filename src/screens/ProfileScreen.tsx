import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { AppImages } from '../constants/images';
import { BADGES } from '../constants/labels';
import { FontSize, Spacing, BorderRadius } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, logout } = useAuth();
  const { colors, isDark, toggleTheme, mode } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <ImageBackground source={AppImages.homeCleanup} style={styles.header} resizeMode="cover">
        <LinearGradient colors={['rgba(2, 19, 30, 0.18)', 'rgba(2, 19, 30, 0.76)']} style={styles.headerOverlay}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <Text style={styles.name}>{profile?.displayName ?? 'Utilisateur'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </LinearGradient>
      </ImageBackground>

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
          <Button title="Tableau de bord admin" onPress={() => navigation.navigate('Admin')} style={{ marginTop: Spacing.md }} />
        )}
        <Button title="Se deconnecter" onPress={logout} variant="danger" style={{ marginTop: Spacing.md }} />
      </View>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 230 },
  headerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', padding: Spacing.xl },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(255, 255, 255, 0.94)', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800', marginTop: Spacing.sm, textAlign: 'center' },
  email: { color: '#fff', fontSize: FontSize.sm, textAlign: 'center' },
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
