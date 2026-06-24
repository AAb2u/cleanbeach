import { BeachStatus, PollutionSeverity } from '../types';

export const SEVERITY_LABELS: Record<PollutionSeverity, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
};

export const STATUS_LABELS: Record<BeachStatus, string> = {
  polluted: 'Polluée',
  cleaning: 'Nettoyage en cours',
  cleaned: 'Nettoyée',
};

export const BADGES = [
  { id: 'first_report', name: 'Premier pas', description: 'Premier signalement', minPoints: 10 },
  { id: 'eco_warrior', name: 'Guerrier écolo', description: '5 signalements', minPoints: 50 },
  { id: 'beach_guardian', name: 'Gardien des plages', description: '10 signalements', minPoints: 100 },
  { id: 'community_hero', name: 'Héros communautaire', description: '500 points', minPoints: 500 },
  { id: 'ocean_savior', name: 'Sauveur des océans', description: '1000 points', minPoints: 1000 },
];
