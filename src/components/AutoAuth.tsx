
'use client';

import { useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase/provider';

/**
 * Silently signs the user in anonymously if they aren't authenticated.
 * This removes the need for a manual login step.
 */
export function AutoAuth() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error("AutoAuth: Background sign-in failed", error);
      });
    }
  }, [auth, user, isUserLoading]);

  return null;
}
