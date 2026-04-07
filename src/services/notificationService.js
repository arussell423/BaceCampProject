import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../components/Firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Request permissions and return the Expo push token (or null on simulator/web) */
export async function registerForPushNotifications() {
  if (!Device.isDevice) return null; // simulators cannot receive push notifications
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/** Persist the Expo push token to Firestore users/{uid}.expoPushToken */
export async function saveTokenToFirestore(uid, token) {
  if (!uid || !token) return;
  try {
    await setDoc(doc(db, 'users', uid), { expoPushToken: token }, { merge: true });
  } catch (e) { /* non-critical — silently skip */ }
}

/** Send a push notification via the Expo Push API (no backend needed) */
export async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body, data }),
    });
  } catch (e) { /* non-critical */ }
}

/** Get the Expo push token for a player (direct UID lookup) */
export async function getPlayerPushToken(playerUid) {
  if (!playerUid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', playerUid));
    return snap.exists() ? (snap.data().expoPushToken || null) : null;
  } catch (e) { return null; }
}

/**
 * Get the Expo push token for the coach linked to a player.
 * Requires playerCoach/{sanitizedEmail} doc containing { coachUid }.
 */
export async function getCoachPushToken(playerEmail) {
  if (!playerEmail) return null;
  try {
    const sanitizedEmail = playerEmail.replace(/[.#$[\]]/g, '_');
    const snap = await getDoc(doc(db, 'playerCoach', sanitizedEmail));
    if (!snap.exists()) return null;
    const { coachUid } = snap.data();
    if (!coachUid) return null;
    const coachSnap = await getDoc(doc(db, 'users', coachUid));
    return coachSnap.exists() ? (coachSnap.data().expoPushToken || null) : null;
  } catch (e) { return null; }
}
