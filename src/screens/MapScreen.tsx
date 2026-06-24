import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, UIManager, View } from 'react-native';
import type { Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BeachReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { subscribeToReports } from '../services/beachService';
import { MapFilterBar } from '../components/MapFilterBar';
import { InteractiveReportMap } from '../components/InteractiveReportMap';
import { STATUS_LABELS } from '../constants/labels';
import { BorderRadius, Spacing } from '../constants/theme';
import { getMarkerColor } from '../utils/helpers';
import { isExpoGo } from '../utils/expoEnvironment';
import {
  MapFilter,
  filterMapReports,
  getMapFilterCounts,
  getReportsRegion,
} from '../utils/mapReports';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MapsModule = typeof import('react-native-maps');

const DEFAULT_REGION: Region = {
  latitude: 43.2965,
  longitude: 5.3698,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

function hasNativeMapView() {
  try {
    return Platform.OS !== 'web' && !isExpoGo && UIManager.hasViewManagerConfig('AIRMap');
  } catch {
    return false;
  }
}

const nativeMapViewAvailable = hasNativeMapView();
const maps = nativeMapViewAvailable ? (require('react-native-maps') as MapsModule) : null;
const MapView = maps?.default;
const Marker = maps?.Marker;
const Callout = maps?.Callout;

export function MapScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState<BeachReport[]>([]);
  const [filter, setFilter] = useState<MapFilter>('all');

  useEffect(() => subscribeToReports(setReports), []);

  const counts = useMemo(() => getMapFilterCounts(reports, user?.uid), [reports, user?.uid]);
  const visibleReports = useMemo(() => filterMapReports(reports, filter, user?.uid), [reports, filter, user?.uid]);
  const region = useMemo(() => getReportsRegion(visibleReports, DEFAULT_REGION), [visibleReports]);

  if (!MapView || !Marker || !Callout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.filters}>
          <MapFilterBar value={filter} counts={counts} onChange={setFilter} />
        </View>
        <InteractiveReportMap
          reports={visibleReports}
          onReportPress={(report) => navigation.navigate('BeachDetails', { beachId: report.id })}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        key={`${filter}-${visibleReports.length}-${region.latitude}-${region.longitude}`}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {visibleReports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{ latitude: report.latitude, longitude: report.longitude }}
            pinColor={getMarkerColor(report.severity, report.status)}
            onCalloutPress={() => navigation.navigate('BeachDetails', { beachId: report.id })}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{report.title}</Text>
                <Text>{report.locationName}</Text>
                <Text>{STATUS_LABELS[report.status]}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.filterOverlay, { backgroundColor: colors.background + 'F2' }]}>
        <MapFilterBar value={filter} counts={counts} onChange={setFilter} />
      </View>

      <View style={[styles.legend, { backgroundColor: colors.surface }]}>
        <LegendDot color="#22C55E" label="Faible / nettoyee" textColor={colors.text} />
        <LegendDot color="#F97316" label="Moyenne / nettoyage" textColor={colors.text} />
        <LegendDot color="#EF4444" label="Elevee" textColor={colors.text} />
      </View>
    </View>
  );
}

function LegendDot({ color, label, textColor }: { color: string; label: string; textColor: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ color: textColor, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  filters: { padding: Spacing.md, paddingBottom: 0 },
  filterOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    elevation: 4,
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: BorderRadius.lg,
    elevation: 4,
    gap: Spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  callout: { maxWidth: 220, gap: 3 },
  calloutTitle: { fontWeight: '700' },
});
