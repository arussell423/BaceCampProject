/**
 * linkingService.js
 *
 * When a player logs in, checks for pending coach invites addressed to their
 * email and, if found, links their Firebase UID to the coach's roster.
 *
 * The coach already writes playerCoach/{sanitizedEmail} when they send the
 * invite, so the player batch only needs to update the roster entry,
 * their own user profile, and the linkRequest status.
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

      // 2. Store coachUid on player's own Firestore profile
      //    (player owns users/{uid} — this write is allowed by isOwner rule)
      batch.set(
        doc(db, 'users', uid),
        { coachUid },
        { merge: true },
      );

      // 3. Mark invite as accepted and store playerUid for future rule checks
      batch.update(linkDoc.ref, { status: 'accepted', playerUid: uid });

      // NOTE: playerCoach/{sanitizedEmail} is written by the coach on sendInvite
      // and must NOT be written here — the player lacks the isCoach() permission
      // and including it would cause the entire batch to fail silently.

      await batch.commit();
    }
  } catch (e) {
    // Non-critical — silently swallow so login never fails
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('[linkPlayerToCoach]', e);
  }
}
