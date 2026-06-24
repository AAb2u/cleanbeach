import { BeachStatus, PollutionSeverity } from '../types';
import { BADGES } from '../constants/labels';
import { Colors } from '../constants/theme';

export function getSeverityColor(severity: PollutionSeverity, isDark = false): string {
  const c = isDark ? Colors.dark : Colors.light;
  switch (severity) {
    case 'low': return c.success;
    case 'medium': return c.warning;
    case 'high': return c.error;
  }
}

export function getStatusColor(status: BeachStatus, isDark = false): string {
  const c = isDark ? Colors.dark : Colors.light;
  switch (status) {
    case 'polluted': return c.error;
    case 'cleaning': return c.warning;
    case 'cleaned': return c.secondary;
  }
}

export function getMarkerColor(severity: PollutionSeverity, status?: BeachStatus): string {
  if (status === 'cleaned') return '#22C55E';
  if (status === 'cleaning') return '#F97316';
  switch (severity) {
    case 'low': return '#22C55E';
    case 'medium': return '#F97316';
    case 'high': return '#EF4444';
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function formatRelativeDate(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return formatDate(date);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function computeBadges(points: number, reportsCount: number): string[] {
  const earned: string[] = [];
  if (reportsCount >= 1) earned.push('first_report');
  if (reportsCount >= 5) earned.push('eco_warrior');
  if (reportsCount >= 10) earned.push('beach_guardian');
  for (const badge of BADGES) {
    if (points >= badge.minPoints && !earned.includes(badge.id)) earned.push(badge.id);
  }
  return earned;
}

export function getBadgeName(badgeId: string): string {
  return BADGES.find((b) => b.id === badgeId)?.name ?? badgeId;
}
