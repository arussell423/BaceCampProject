import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCoiO6loHTb747_Uxmv_-8ofeV3uMOLNgA",
  authDomain: "bace-camp-project.firebaseapp.com",
  projectId: "bace-camp-project",
  storageBucket: "bace-camp-project.appspot.com",
  messagingSenderId: "425785697698",
  appId: "1:425785697698:web:e0ef45e7120d61a2a5fefb",
  measurementId: "G-VX7CGLB4TJ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;