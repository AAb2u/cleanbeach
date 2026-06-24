import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy,
  where, arrayUnion, arrayRemove, increment, serverTimestamp, Timestamp, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BeachReport, BeachStats, BeachStatus, Comment, PollutionSeverity } from '../types';
import { incrementUserStats } from '../context/AuthContext';
import { notifyNearbyUsersNewReport, notifyNearbyUsersStatusChange } from './notificationService';

const REPORTS = 'reports';
const COMMENTS = 'comments';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapReport(id: string, data: Record<string, unknown>): BeachReport {
  return {
    id, title: data.title as string, description: data.description as string,
    severity: data.severity as PollutionSeverity, status: (data.status as BeachStatus) ?? 'polluted',
    latitude: data.latitude as number, longitude: data.longitude as number,
    locationName: data.locationName as string, imageUrls: (data.imageUrls as string[]) ?? [],
    userId: data.userId as string, userName: data.userName as string,
    createdAt: toDate(data.createdAt), likes: (data.likes as number) ?? 0,
    confirmations: (data.confirmations as number) ?? 0,
    likedBy: (data.likedBy as string[]) ?? [], confirmedBy: (data.confirmedBy as string[]) ?? [],
  };
}

export async function createReport(
  data: Omit<BeachReport, 'id' | 'createdAt' | 'likes' | 'confirmations' | 'likedBy' | 'confirmedBy' | 'status'>,
): Promise<string> {
  const ref = await addDoc(collection(db, REPORTS), {
    ...data, status: 'polluted', likes: 0, confirmations: 0, likedBy: [], confirmedBy: [],
    imageUrls: [], createdAt: serverTimestamp(),
  });
  await incrementUserStats(data.userId);
  const report = mapReport(ref.id, { ...data, status: 'polluted', imageUrls: [], likes: 0, confirmations: 0, likedBy: [], confirmedBy: [], createdAt: new Date() });
  await notifyNearbyUsersNewReport(report);
  return ref.id;
}

export async function getReport(id: string): Promise<BeachReport | null> {
  const snap = await getDoc(doc(db, REPORTS, id));
  if (!snap.exists()) return null;
  return mapReport(snap.id, snap.data());
}

export async function getAllReports(): Promise<BeachReport[]> {
  const q = query(collection(db, REPORTS), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReport(d.id, d.data()));
}

export function subscribeToReports(callback: (reports: BeachReport[]) => void): () => void {
  const q = query(collection(db, REPORTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => mapReport(d.id, d.data())));
  });
}

export async function updateReportStatus(reportId: string, status: BeachStatus): Promise<void> {
  await updateDoc(doc(db, REPORTS, reportId), { status });
  const report = await getReport(reportId);
  if (report) await notifyNearbyUsersStatusChange(report, status);
}

export async function deleteReport(reportId: string): Promise<void> {
  await deleteDoc(doc(db, REPORTS, reportId));
}

export async function toggleLike(reportId: string, userId: string): Promise<void> {
  const ref = doc(db, REPORTS, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const likedBy = (snap.data().likedBy as string[]) ?? [];
  const already = likedBy.includes(userId);
  await updateDoc(ref, {
    likedBy: already ? arrayRemove(userId) : arrayUnion(userId),
    likes: increment(already ? -1 : 1),
  });
}

export async function toggleConfirm(reportId: string, userId: string): Promise<void> {
  const ref = doc(db, REPORTS, reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const confirmedBy = (snap.data().confirmedBy as string[]) ?? [];
  const already = confirmedBy.includes(userId);
  await updateDoc(ref, {
    confirmedBy: already ? arrayRemove(userId) : arrayUnion(userId),
    confirmations: increment(already ? -1 : 1),
  });
}

export async function addComment(reportId: string, userId: string, userName: string, text: string): Promise<void> {
  await addDoc(collection(db, REPORTS, reportId, COMMENTS), {
    reportId, userId, userName, text, createdAt: serverTimestamp(),
  });
}

export async function getComments(reportId: string): Promise<Comment[]> {
  const q = query(collection(db, REPORTS, reportId, COMMENTS), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id, reportId, userId: data.userId, userName: data.userName,
      text: data.text, createdAt: toDate(data.createdAt),
    };
  });
}

export function subscribeToComments(reportId: string, callback: (comments: Comment[]) => void): () => void {
  const q = query(collection(db, REPORTS, reportId, COMMENTS), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, reportId, userId: data.userId, userName: data.userName, text: data.text, createdAt: toDate(data.createdAt) };
    }));
  });
}

export async function getBeachStats(): Promise<BeachStats> {
  const reports = await getAllReports();
  return {
    total: reports.length,
    polluted: reports.filter((r) => r.status === 'polluted').length,
    cleaning: reports.filter((r) => r.status === 'cleaning').length,
    cleaned: reports.filter((r) => r.status === 'cleaned').length,
    highSeverity: reports.filter((r) => r.severity === 'high').length,
  };
}

export async function getReportsByStatus(status: BeachStatus): Promise<BeachReport[]> {
  const q = query(collection(db, REPORTS), where('status', '==', status), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReport(d.id, d.data()));
}
