import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WebView
        key={html}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string };
            const report = payload.id ? reportsById.get(payload.id) : undefined;
            if (payload.type === 'report' && report) onReportPress(report);
          } catch {
            // Ignore messages not emitted by the embedded map.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
