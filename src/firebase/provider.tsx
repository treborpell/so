'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, DependencyList } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, Auth, signOut, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  auth: Auth;
  db: Firestore;
  firebaseApp: FirebaseApp;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase Precisely
  const app = useMemo(() => getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0], []);
  const auth = useMemo(() => getAuth(app), [app]);
  const db = useMemo(() => getFirestore(app), [app]);

  useEffect(() => {
    // Set robust persistence
    setPersistence(auth, indexedDBLocalPersistence).catch(console.error);

    // Single Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const logout = useCallback(() => signOut(auth), [auth]);

  const getIdToken = useCallback(async () => {
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    auth,
    db,
    firebaseApp: app,
    logout,
    getIdToken
  }), [user, loading, auth, db, app, logout, getIdToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HELPER HOOKS
export const useFirestore = () => useAuth().db;
export const useFirebaseApp = () => useAuth().firebaseApp;
export const useUser = () => {
  const { user, loading } = useAuth();
  return { user, isUserLoading: loading };
};

// UTILITY FOR FIREBASE MEMOIZATION
type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}
