import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BeachReport, BeachStatus } from '../types';
import { calculateDistance } from '../utils/helpers';
import { STATUS_LABELS } from '../constants/labels';

const NEARBY_RADIUS_KM = 10;

export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

async function getNearbyUserIds(lat: number, lng: number, excludeUserId: string): Promise<string[]> {
  const usersSnap = await getDocs(collection(db, 'users'));
  const ids: string[] = [];
  usersSnap.forEach((d) => {
    const data = d.data();
    if (d.id === excludeUserId || !data.lastLat || !data.lastLng) return;
    if (calculateDistance(lat, lng, data.lastLat, data.lastLng) <= NEARBY_RADIUS_KM) ids.push(d.id);
  });
  return ids;
}

export async function notifyNearbyUsersNewReport(report: BeachReport): Promise<void> {
  const userIds = await getNearbyUserIds(report.latitude, report.longitude, report.userId);
  for (const userId of userIds) {
    await addDoc(collection(db, 'notifications'), {
      userId, title: 'Nouveau signalement', body: `${report.title} — ${report.locationName}`,
      type: 'new_report', reportId: report.id, read: false, createdAt: serverTimestamp(),
    });
  }
}

export async function notifyNearbyUsersStatusChange(
  report: BeachReport, newStatus: BeachStatus,
): Promise<void> {
  const userIds = await getNearbyUserIds(report.latitude, report.longitude, report.userId);
  for (const userId of userIds) {
    await addDoc(collection(db, 'notifications'), {
      userId, title: 'Mise à jour de statut',
      body: `${report.title} est maintenant : ${STATUS_LABELS[newStatus]}`,
      type: 'status_change', reportId: report.id, read: false, createdAt: serverTimestamp(),
    });
  }
}
