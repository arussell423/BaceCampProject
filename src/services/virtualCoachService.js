/**
 * virtualCoachService.js
 * Req #46 — Virtual Coach: detects meaningful changes in player evaluation
 * scores and notifies the player with personalised encouragement or advice.
 *
 * Call `checkEvalChangesAndNotify(uid)` after a player logs in or submits
 * a new evaluation section.
 */

import { db } from '../components/Firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

const IMPROVEMENT_THRESHOLD = 1;   // score must rise by this much to praise
const DECLINE_THRESHOLD = 1;       // score must drop by this much to warn

/**
 * Fetch the two most recent evaluation sessions for a given user.
 * Returns [latest, previous] or [] if fewer than 2 sessions exist.
 */
async function fetchLastTwoSessions(uid) {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'evaluations', uid, 'sessions'),
        orderBy('timestamp', 'desc'),
        limit(2)
      )
    );
    if (snap.size < 2) return [];
    return snap.docs.map((d) => d.data());
  } catch {
    return [];
  }
}

/**
 * Compare two flat score objects and return arrays of improved / declined keys.
 */
function diffScores(latest, previous) {
  const improved = [];
  const declined = [];
  for (const key of Object.keys(latest)) {
    const curr = Number(latest[key]);
    const prev = Number(previous[key]);
    if (!isNaN(curr) && !isNaN(prev)) {
      if (curr - prev >= IMPROVEMENT_THRESHOLD) improved.push(key);
      if (prev - curr >= DECLINE_THRESHOLD) declined.push(key);
    }
  }
  return { improved, declined };
}

/**
 * Schedule a local notification to the device.
 */
async function notify(title, body) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null, // immediate
    });
  } catch {
    // Notifications not available in all environments (web)
  }
}

/**
 * Main entry point.
 * Compares the two most recent evaluation sessions and fires a local
 * notification if meaningful score changes are detected.
 */
export async function checkEvalChangesAndNotify(uid) {
  if (!uid) return;
  const [latest, previous] = await fetchLastTwoSessions(uid);
  if (!latest || !previous) return;

  const latestScores = latest.data || {};
  const previousScores = previous.data || {};
  if (!Object.keys(latestScores).length) return;

  const { improved, declined } = diffScores(latestScores, previousScores);

  if (improved.length > 0) {
    const areas = improved.slice(0, 2).join(', ');
    await notify(
      '📈 You\'re Improving!',
      `Great progress in ${areas}. Keep up the momentum — consistency is key!`
    );
  } else if (declined.length > 0) {
    const areas = declined.slice(0, 2).join(', ');
    await notify(
      '💡 Focus Area Detected',
      `Your ${areas} scores dipped. Check in with your AI Coach for targeted drills.`
    );
  }
}
