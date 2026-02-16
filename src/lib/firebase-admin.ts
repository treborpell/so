
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

// This function initializes Firebase Admin and returns the app instance.
export const initFirebaseAdmin = (): App => {
  // If the app is already initialized, return the existing instance.
  if (getApps().length) {
    return getApps()[0];
  }

  // Otherwise, create a new app instance using the service account credentials
  // from environment variables.
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
  };

  const app = initializeApp({
    credential: cert(serviceAccount),
  });

  return app;
};
