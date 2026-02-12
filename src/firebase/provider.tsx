'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, DependencyList } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, Auth, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  auth: Auth;
  db: Firestore;
  firebaseApp: FirebaseApp;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase precisely
  const app = useMemo(() => getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0], []);
  const auth = useMemo(() => getAuth(app), [app]);
  const db = useMemo(() => getFirestore(app), [app]);

  useEffect(() => {
    // 1. Main Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("AuthProvider: Auth state changed. User:", firebaseUser?.email || "none");
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const value = useMemo(() => ({
    user,
    loading,
    auth,
    db,
    firebaseApp: app
  }), [user, loading, auth, db, app]);

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
