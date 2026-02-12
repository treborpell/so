'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, DependencyList } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, Auth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  auth: Auth;
  db: Firestore;
  firebaseApp: FirebaseApp;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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
    // Set persistence to IndexedDB (more stable in framed environments)
    setPersistence(auth, indexedDBLocalPersistence).catch(console.error);

    // 1. Handle Redirect Results GLOBALLY
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Global AuthProvider: Redirect success for", result.user.email);
        }
      } catch (error: any) {
        console.error("Global AuthProvider: Redirect processing error", error);
      }
    };
    handleRedirect();

    // 2. Main Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithRedirect(auth, provider);
  };

  const logout = () => signOut(auth);

  const value = useMemo(() => ({
    user,
    loading,
    auth,
    db,
    firebaseApp: app,
    loginWithGoogle,
    logout
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
