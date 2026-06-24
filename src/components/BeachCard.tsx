import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BeachReport } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AppImages } from '../constants/images';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';
import { formatRelativeDate } from '../utils/helpers';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface BeachCardProps {
  report: BeachReport;
  onPress: () => void;
}

export function BeachCard({ report, onPress }: BeachCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      {report.imageUrls[0] ? (
        <Image source={{ uri: report.imageUrls[0] }} style={styles.image} contentFit="cover" />
      ) : (
        <Image source={AppImages.reportKit} style={styles.image} contentFit="cover" />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{report.title}</Text>
        <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} /> {report.locationName}
        </Text>
        <View style={styles.badges}>
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
        </View>
        <View style={styles.footer}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatRelativeDate(report.createdAt)}</Text>
          <View style={styles.stats}>
            <Ionicons name="heart" size={14} color={colors.error} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{report.likes}</Text>
            <Ionicons name="checkmark-circle" size={14} color={colors.secondary} style={{ marginLeft: 8 }} />
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{report.confirmations}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: 'hidden', elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
  image: { width: '100%', height: 140 },
  content: { padding: Spacing.md },
  title: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  location: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  badges: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: FontSize.xs },
});
