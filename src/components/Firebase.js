import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

// Hardcoded fallback for environments where Constants.expoConfig.extra
// is not populated (e.g. Expo Go + EAS Update context).
const firebaseConfig = {
  apiKey:            extra.firebaseApiKey            || 'AIzaSyCoiO6loHTb747_Uxmv_-8ofeV3uMOLNgA',
  authDomain:        extra.firebaseAuthDomain        || 'bace-camp-project.firebaseapp.com',
  projectId:         extra.firebaseProjectId         || 'bace-camp-project',
  storageBucket:     extra.firebaseStorageBucket     || 'bace-camp-project.appspot.com',
  messagingSenderId: extra.firebaseMessagingSenderId || '425785697698',
  appId:             extra.firebaseAppId             || '1:425785697698:web:e0ef45e7120d61a2a5fefb',
};

let app, auth, db;
try {
  app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db   = getFirestore(app);
} catch (e) {
  console.error('Firebase init failed:', e?.message);
  app  = null;
  auth = { currentUser: null, onAuthStateChanged: (cb) => { cb(null); return () => {}; } };
  db   = {};
}

export { auth, db };
export default app;