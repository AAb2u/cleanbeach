import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BeachReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { subscribeToReports } from '../services/beachService';
import { MapFilterBar } from '../components/MapFilterBar';
import { InteractiveReportMap } from '../components/InteractiveReportMap';
import { MapFilter, filterMapReports, getMapFilterCounts } from '../utils/mapReports';
import { Spacing } from '../constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MapScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState<BeachReport[]>([]);
  const [filter, setFilter] = useState<MapFilter>('all');

  useEffect(() => subscribeToReports(setReports), []);

  const counts = useMemo(() => getMapFilterCounts(reports, user?.uid), [reports, user?.uid]);
  const visibleReports = useMemo(() => filterMapReports(reports, filter, user?.uid), [reports, filter, user?.uid]);

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { padding: Spacing.md, paddingBottom: 0 },
});
