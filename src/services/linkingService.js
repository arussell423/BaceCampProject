/**
 * linkingService.js
 *
 * When a player logs in, checks for pending coach invites addressed to their
 * email and, if found, links their Firebase UID to the coach's roster.
 *
 * This solves the data model gap where roster docs are keyed by sanitizedEmail
 * but all player data (evaluations, chats, etc.) is keyed by Firebase UID.
 * After this runs, roster docs carry both the sanitizedEmail doc-ID AND a
 * `uid` field containing the player's Firebase UID.
 */
import { db } from '../components/Firebase';
import {
  collection, query, where, getDocs, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore';

export async function linkPlayerToCoach(user) {
  if (!user?.email) return;
  const { uid, email, displayName } = user;
  const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');

  try {
    // Find any pending invites addressed to this player's email
    const linkSnap = await getDocs(query(
      collection(db, 'linkRequests'),
      where('playerEmail', '==', email),
      where('status', '==', 'pending'),
    ));

    if (linkSnap.empty) return; // nothing to do

    for (const linkDoc of linkSnap.docs) {
      const { coachUid } = linkDoc.data();
      if (!coachUid) continue;

      const batch = writeBatch(db);

      // 1. Update roster doc: add Firebase UID + mark as active (not pending)
      batch.set(
        doc(db, 'playerRosters', coachUid, 'players', sanitizedEmail),
        { uid, name: displayName || email, email, invited: false, linkedAt: serverTimestamp() },
        { merge: true },
      );

      // 2. Store coachUid on player's Firestore profile so Firestore rules
      //    can verify coach-player relationship with a single get() call.
      batch.set(
        doc(db, 'users', uid),
        { coachUid },
        { merge: true },
      );

      // 3. Ensure playerCoach lookup exists (for push notification routing)
      batch.set(
        doc(db, 'playerCoach', sanitizedEmail),
        { coachUid },
        { merge: true },
      );

      // 4. Mark invite as accepted
      batch.update(linkDoc.ref, { status: 'accepted' });

      await batch.commit();
    }
  } catch (e) {
    // Non-critical — silently swallow so login never fails
    if (__DEV__) console.warn('[linkPlayerToCoach]', e);
  }
}
