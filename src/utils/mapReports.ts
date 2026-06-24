import type { Region } from 'react-native-maps';
import type { DimensionValue } from 'react-native';
import { BeachReport } from '../types';

export type MapFilter = 'all' | 'mine' | 'others';

export interface ReportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function filterMapReports(reports: BeachReport[], filter: MapFilter, userId?: string): BeachReport[] {
  if (filter === 'mine') return userId ? reports.filter((report) => report.userId === userId) : [];
  if (filter === 'others') return userId ? reports.filter((report) => report.userId !== userId) : reports;
  return reports;
}

export function getMapFilterCounts(reports: BeachReport[], userId?: string) {
  const mine = userId ? reports.filter((report) => report.userId === userId).length : 0;
  return {
    all: reports.length,
    mine,
    others: userId ? reports.length - mine : reports.length,
  };
}

export function getReportBounds(reports: BeachReport[]): ReportBounds | null {
  if (reports.length === 0) return null;

  return reports.reduce<ReportBounds>(
    (bounds, report) => ({
      minLat: Math.min(bounds.minLat, report.latitude),
      maxLat: Math.max(bounds.maxLat, report.latitude),
      minLng: Math.min(bounds.minLng, report.longitude),
      maxLng: Math.max(bounds.maxLng, report.longitude),
    }),
    {
      minLat: reports[0].latitude,
      maxLat: reports[0].latitude,
      minLng: reports[0].longitude,
      maxLng: reports[0].longitude,
    },
  );
}

export function getReportsRegion(reports: BeachReport[], fallback: Region): Region {
  const bounds = getReportBounds(reports);
  if (!bounds) return fallback;

  const latDelta = Math.max(0.04, Math.abs(bounds.maxLat - bounds.minLat) * 1.7);
  const lngDelta = Math.max(0.04, Math.abs(bounds.maxLng - bounds.minLng) * 1.7);

  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLng + bounds.maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export function getReportMapPosition(report: BeachReport, bounds: ReportBounds | null): { left: DimensionValue; top: DimensionValue } {
  if (!bounds) return { left: '50%', top: '50%' };

  const lngSpan = Math.max(0.0001, bounds.maxLng - bounds.minLng);
  const latSpan = Math.max(0.0001, bounds.maxLat - bounds.minLat);
  const x = ((report.longitude - bounds.minLng) / lngSpan) * 84 + 8;
  const y = (1 - (report.latitude - bounds.minLat) / latSpan) * 74 + 13;

  return {
    left: `${Math.max(6, Math.min(94, x))}%` as DimensionValue,
    top: `${Math.max(8, Math.min(92, y))}%` as DimensionValue,
  };
}
