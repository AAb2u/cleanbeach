import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BeachReport } from '../types';
import { useTheme } from '../context/ThemeContext';
import { createReportMapHtml } from '../utils/reportMapHtml';

interface InteractiveReportMapProps {
  reports: BeachReport[];
  onReportPress: (report: BeachReport) => void;
}

export function InteractiveReportMap({ reports, onReportPress }: InteractiveReportMapProps) {
  const { colors } = useTheme();
  const html = useMemo(() => createReportMapHtml(reports), [reports]);
  const reportsById = useMemo(() => new Map(reports.map((report) => [report.id, report])), [reports]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) as { type?: string; id?: string } : event.data;
        const report = payload?.id ? reportsById.get(payload.id) : undefined;
        if (payload?.type === 'report' && report) onReportPress(report);
      } catch {
        // Ignore messages not emitted by the embedded map.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReportPress, reportsById]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <iframe srcDoc={html} title="Carte des signalements" style={styles.iframe} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iframe: {
    borderWidth: 0,
    borderStyle: 'none',
    flex: 1,
    height: '100%',
    width: '100%',
  } as unknown as object,
});
