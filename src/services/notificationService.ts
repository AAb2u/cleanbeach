import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BeachReport, BeachStatus } from '../types';
import { calculateDistance } from '../utils/helpers';
import { isExpoGo } from '../utils/expoEnvironment';
import { STATUS_LABELS } from '../constants/labels';

type NotificationsModule = typeof import('expo-notifications');

function loadNotifications(): NotificationsModule | null {
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('Push notifications are unavailable in this runtime.', error);
    return null;
  }
}

const notifications = isExpoGo ? null : loadNotifications();

if (notifications) {
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
      shouldShowBanner: true, shouldShowList: true,
    }),
  });
}

const NEARBY_RADIUS_KM = 10;

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice || !notifications) return null;

  try {
    const { status: existing } = await notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync('default', {
        name: 'CleanBeach', importance: notifications.AndroidImportance.MAX,
      });
    }
    const token = await notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.warn('Push notifications are unavailable in this runtime.', error);
    return null;
  }
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
