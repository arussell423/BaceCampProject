import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey:            extra.firebaseApiKey            || 'AIzaSyCoiO6loHTb747_Uxmv_-8ofeV3uMOLNgA',
  authDomain:        extra.firebaseAuthDomain        || 'bace-camp-project.firebaseapp.com',
  projectId:         extra.firebaseProjectId         || 'bace-camp-project',
  storageBucket:     extra.firebaseStorageBucket     || 'bace-camp-project.appspot.com',
  messagingSenderId: extra.firebaseMessagingSenderId || '425785697698',
  appId:             extra.firebaseAppId             || '1:425785697698:web:e0ef45e7120d61a2a5fefb',
};

let app, auth, db;
let firebaseInitOk = false;
try {
  if (getApps().length === 0) {
    app  = initializeApp(firebaseConfig);
    // Use inMemoryPersistence — pure JS, no native deps, works in all environments
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  } else {
    app  = getApps()[0];
    auth = getAuth(app);
  }
  db = getFirestore(app);
  firebaseInitOk = true;
} catch (e) {
  console.error('Firebase init failed:', e?.message);
  app  = null;
  auth = { currentUser: null, onAuthStateChanged: (cb) => { cb(null); return () => {}; } };
  db   = {};
}

export { auth, db, firebaseInitOk };
export default app;