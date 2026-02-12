'use client';

import React, { type ReactNode } from 'react';
import { AuthProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * REDUNDANT: Use AuthProvider directly instead.
 * Keeping this as a thin wrapper for backward compatibility if needed, 
 * but updating it to use the new AuthProvider.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}