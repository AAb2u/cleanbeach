import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BeachReport } from '../types';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from './EmptyState';
import { STATUS_LABELS } from '../constants/labels';
import { BorderRadius, FontSize, Spacing } from '../constants/theme';
import { getMarkerColor } from '../utils/helpers';
import { getReportBounds, getReportMapPosition } from '../utils/mapReports';

interface ReportMapFallbackProps {
  reports: BeachReport[];
  onReportPress: (report: BeachReport) => void;
}

export function ReportMapFallback({ reports, onReportPress }: ReportMapFallbackProps) {
  const { colors } = useTheme();
  const bounds = getReportBounds(reports);

  const openInMaps = (report: BeachReport) => {
    Linking.openURL(`https://www.google.com/maps?q=${report.latitude},${report.longitude}`);
  };

  if (reports.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <EmptyState title="Aucun signalement" message="Aucune position ne correspond a ce filtre." icon="map-outline" />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={[styles.mapCard, { backgroundColor: colors.surface }]}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={[styles.mapTitle, { color: colors.text }]}>Carte des positions</Text>
            <Text style={[styles.mapSubtitle, { color: colors.textSecondary }]}>
              {reports.length} marqueur(s) affiches
            </Text>
          </View>
          <Ionicons name="map" size={24} color={colors.primary} />
        </View>

        <LinearGradient colors={[colors.primary + '22', colors.secondary + '18']} style={styles.mapCanvas}>
          <View style={[styles.gridLine, styles.gridVerticalOne]} />
          <View style={[styles.gridLine, styles.gridVerticalTwo]} />
          <View style={[styles.gridLine, styles.gridHorizontalOne]} />
          <View style={[styles.gridLine, styles.gridHorizontalTwo]} />
          {reports.map((report, index) => {
            const position = getReportMapPosition(report, bounds);
            return (
              <TouchableOpacity
                key={report.id}
                onPress={() => onReportPress(report)}
                style={[
                  styles.marker,
                  position,
                  { backgroundColor: getMarkerColor(report.severity, report.status), borderColor: colors.surface },
                ]}
              >
                <Text style={styles.markerText}>{index + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>

        <Text style={[styles.mapNote, { color: colors.textSecondary }]}>
          Positionnement base sur les coordonnees GPS des signalements.
        </Text>
      </View>

      {reports.map((report, index) => (
        <TouchableOpacity
          key={report.id}
          activeOpacity={0.84}
          onPress={() => onReportPress(report)}
          style={[styles.reportCard, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.reportIndex, { backgroundColor: getMarkerColor(report.severity, report.status) }]}>
            <Text style={styles.reportIndexText}>{index + 1}</Text>
          </View>
          <View style={styles.reportContent}>
            <Text style={[styles.reportTitle, { color: colors.text }]} numberOfLines={1}>
              {report.title}
            </Text>
            <Text style={[styles.reportMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              {report.locationName}
            </Text>
            <Text style={[styles.reportMeta, { color: colors.textSecondary }]}>
              {STATUS_LABELS[report.status]}
            </Text>
          </View>
          <TouchableOpacity onPress={() => openInMaps(report)} style={styles.openButton}>
            <Ionicons name="open-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  mapCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, elevation: 2 },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  mapTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  mapSubtitle: { fontSize: FontSize.xs, marginTop: 2 },
  mapCanvas: { height: 300, borderRadius: BorderRadius.md, overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.52)' },
  gridVerticalOne: { top: 0, bottom: 0, left: '33%', width: 1 },
  gridVerticalTwo: { top: 0, bottom: 0, left: '66%', width: 1 },
  gridHorizontalOne: { left: 0, right: 0, top: '34%', height: 1 },
  gridHorizontalTwo: { left: 0, right: 0, top: '68%', height: 1 },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -14 }, { translateY: -14 }],
  },
  markerText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  mapNote: { fontSize: FontSize.xs, marginTop: Spacing.sm },
  reportCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  reportIndex: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  reportIndexText: { color: '#fff', fontWeight: '800', fontSize: FontSize.xs },
  reportContent: { flex: 1 },
  reportTitle: { fontSize: FontSize.md, fontWeight: '700' },
  reportMeta: { fontSize: FontSize.xs, marginTop: 2 },
  openButton: { padding: Spacing.sm },
});
