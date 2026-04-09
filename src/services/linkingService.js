import { db } from '../components/Firebase';
import {
  collection, query, where, getDocs, doc, getDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';

export async function linkPlayerToCoach(user) {
  if (!user?.email) return;
  const { uid, email, displayName } = user;
  const sanitizedEmail = email.replace(/[.#$[\]]/g, '_');

  try {
    const linkSnap = await getDocs(query(
      collection(db, 'linkRequests'),
      where('playerEmail', '==', email),
      where('status', '==', 'pending'),
    ));

    if (linkSnap.empty) return;

    for (const linkDoc of linkSnap.docs) {
      const { coachUid } = linkDoc.data();
      if (!coachUid) continue;

      // Fetch coach name for display in player profile
      let coachName = '';
      try {
        const coachSnap = await getDoc(doc(db, 'users', coachUid));
        if (coachSnap.exists()) coachName = coachSnap.data().displayName || coachSnap.data().email || '';
      } catch (e) { /* non-critical */ }

      const batch = writeBatch(db);

      batch.set(
        doc(db, 'playerRosters', coachUid, 'players', sanitizedEmail),
        { uid, name: displayName || email, email, invited: false, linkedAt: serverTimestamp() },
        { merge: true },
      );

      batch.set(
        doc(db, 'users', uid),
        { coachUid, coachName },
        { merge: true },
      );

      batch.update(linkDoc.ref, { status: 'accepted', playerUid: uid });

      await batch.commit();
    }
  } catch (e) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('[linkPlayerToCoach]', e);
  }
}
