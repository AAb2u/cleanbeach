import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserProfile } from '../types';
import { computeBadges } from '../utils/helpers';
import { registerForPushNotifications } from '../services/notificationService';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const defaultProfile = (uid: string, email: string, displayName: string): UserProfile => ({
  uid, email, displayName, reportsCount: 0, contributionPoints: 0, badges: [], isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      setProfile({
        uid, email: data.email, displayName: data.displayName,
        reportsCount: data.reportsCount ?? 0, contributionPoints: data.contributionPoints ?? 0,
        badges: data.badges ?? [], isAdmin: data.isAdmin ?? false, expoPushToken: data.expoPushToken,
      });
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u.uid);
        const token = await registerForPushNotifications();
        if (token) await updateDoc(doc(db, 'users', u.uid), { expoPushToken: token });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const p = defaultProfile(cred.user.uid, email, displayName);
    await setDoc(doc(db, 'users', cred.user.uid), { ...p, createdAt: serverTimestamp() });
    setProfile(p);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export async function incrementUserStats(userId: string, points = 10) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const reportsCount = (data.reportsCount ?? 0) + 1;
  const contributionPoints = (data.contributionPoints ?? 0) + points;
  const badges = computeBadges(contributionPoints, reportsCount);
  await updateDoc(ref, { reportsCount, contributionPoints, badges });
}
