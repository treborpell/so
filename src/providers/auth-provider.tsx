"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // 1. Process redirect results immediately on load
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Redirect success:", result.user.email);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential) {
            setAccessToken(credential.accessToken || null);
            // Optional: Store in session storage if needed across refreshes, 
            // but for security, keeping it in memory is better.
            if (credential.accessToken) {
              sessionStorage.setItem('google_access_token', credential.accessToken);
            }
          }
        }
      })
      .catch((error) => console.error("Redirect handler error:", error));

    // 2. Main auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // Try to recover token from session storage if state lost on refresh
      if (!accessToken) {
        const stored = sessionStorage.getItem('google_access_token');
        if (stored) setAccessToken(stored);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [accessToken]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.setCustomParameters({ prompt: "select_account" });
    // Use Redirect as it's the only stable method for this environment
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    sessionStorage.removeItem('google_access_token');
    setAccessToken(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
