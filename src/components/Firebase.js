import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey:            extra.firebaseApiKey,
  authDomain:        extra.firebaseAuthDomain,
  projectId:         extra.firebaseProjectId,
  storageBucket:     extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId:             extra.firebaseAppId,
};

// Guard: Firebase throws synchronously if apiKey is missing (e.g. env vars
// not available in Expo Go EAS Update context). Wrap to prevent blank screen.
let app, auth, db;
try {
  app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db   = getFirestore(app);
} catch (e) {
  console.error('Firebase init failed:', e?.message, '\nConfig:', JSON.stringify(firebaseConfig));
  // Provide dummy exports so imports don't fail — app will be non-functional
  // but at least renders visibly so the error can be reported.
  app  = null;
  auth = { currentUser: null, onAuthStateChanged: (cb) => { cb(null); return () => {}; } };
  db   = {};
}

export { auth, db };
export default app;