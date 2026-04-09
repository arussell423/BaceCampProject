import { db } from '../components/Firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export const BUILT_IN_DRILLS = [
  // Speed
  { id: 'sp1', category: 'Speed', name: 'Cone Sprint Drill', defaultSets: 6, defaultReps: 5, defaultRest: '30s', defaultDuration: '20 min', description: 'Set up 5 cones 2m apart. Sprint forward and back x5. Rest 30s. Repeat.' },
  { id: 'sp2', category: 'Speed', name: 'T-Drill Agility', defaultSets: 8, defaultReps: 1, defaultRest: '45s', defaultDuration: '15 min', description: 'Classic T-drill: forward 5m, left 2.5m, right 5m, back to centre, retreat.' },
  { id: 'sp3', category: 'Speed', name: '20m Shuttle Run', defaultSets: 6, defaultReps: 1, defaultRest: '60s', defaultDuration: '10 min', description: 'Shuttle runs at maximal effort. Record your best time.' },
  { id: 'sp4', category: 'Speed', name: 'Reaction Ball Drill', defaultSets: 4, defaultReps: 10, defaultRest: '30s', defaultDuration: '15 min', description: 'Drop reaction ball and sprint to catch before second bounce.' },
  // Strength
  { id: 'st1', category: 'Strength', name: 'Core Stability Circuit', defaultSets: 3, defaultReps: 12, defaultRest: '45s', defaultDuration: '20 min', description: 'Plank (60s), Side Plank (30s each), Dead Bug (12), Bird Dog (10).' },
  { id: 'st2', category: 'Strength', name: 'Upper Body Strength', defaultSets: 4, defaultReps: 12, defaultRest: '60s', defaultDuration: '30 min', description: 'Push-ups (15), Dumbbell Rows (12), Shoulder Press (10), Bicep Curls (12).' },
  { id: 'st3', category: 'Strength', name: 'Leg Power Builder', defaultSets: 3, defaultReps: 15, defaultRest: '60s', defaultDuration: '25 min', description: 'Squats (15), Lunges (12 each), Calf Raises (20), Glute Bridges (15).' },
  { id: 'st4', category: 'Strength', name: 'Rotator Cuff Strengthening', defaultSets: 3, defaultReps: 15, defaultRest: '30s', defaultDuration: '15 min', description: 'Band external rotation, internal rotation, scarecrow, face pulls.' },
  // Power
  { id: 'pw1', category: 'Power', name: 'Plyometric Jump Circuit', defaultSets: 4, defaultReps: 8, defaultRest: '60s', defaultDuration: '20 min', description: 'Box Jumps (8), Broad Jumps (6), Jump Squats (10), Lateral Bounds (8 each).' },
  { id: 'pw2', category: 'Power', name: 'Medicine Ball Throws', defaultSets: 3, defaultReps: 10, defaultRest: '45s', defaultDuration: '15 min', description: 'Rotational throws focusing on core rotation and shoulder drive.' },
  { id: 'pw3', category: 'Power', name: 'Explosive Serve Drill', defaultSets: 3, defaultReps: 15, defaultRest: '60s', defaultDuration: '20 min', description: 'Shadow serve with resistance band. Focus on trophy position to contact acceleration.' },
  // Footwork
  { id: 'fw1', category: 'Footwork', name: 'Ladder Drills', defaultSets: 5, defaultReps: 1, defaultRest: '30s', defaultDuration: '20 min', description: 'In-out, side-step, Ali shuffle, single-leg hops through agility ladder.' },
  { id: 'fw2', category: 'Footwork', name: 'Split Step Practice', defaultSets: 4, defaultReps: 15, defaultRest: '30s', defaultDuration: '15 min', description: 'Split step timing with partner feeding balls. Focus on explosive first step.' },
  { id: 'fw3', category: 'Footwork', name: 'Spider Drill', defaultSets: 5, defaultReps: 1, defaultRest: '45s', defaultDuration: '20 min', description: 'Touch all 6 tennis court positions in sequence. Record time. Beat your best.' },
  { id: 'fw4', category: 'Footwork', name: 'Crossover Step Drill', defaultSets: 4, defaultReps: 10, defaultRest: '30s', defaultDuration: '15 min', description: 'Side-to-side crossover steps along baseline. Keep low centre of gravity.' },
  // Flexibility
  { id: 'fl1', category: 'Flexibility', name: 'Full Body Stretch Routine', defaultSets: 1, defaultReps: 1, defaultRest: '0s', defaultDuration: '20 min', description: 'Hold each 30s: hip flexor, hamstring, quad, shoulder, chest, thoracic rotation.' },
  { id: 'fl2', category: 'Flexibility', name: 'Hip Mobility Flow', defaultSets: 1, defaultReps: 1, defaultRest: '0s', defaultDuration: '15 min', description: 'Pigeon pose, 90/90 stretch, hip circles, deep squat hold.' },
  { id: 'fl3', category: 'Flexibility', name: 'Shoulder & Rotator Cuff', defaultSets: 2, defaultReps: 1, defaultRest: '30s', defaultDuration: '10 min', description: 'Band external rotation, cross-body stretch, doorway stretch, sleeper stretch.' },
  { id: 'fl4', category: 'Flexibility', name: 'Dynamic Warm-Up', defaultSets: 1, defaultReps: 10, defaultRest: '0s', defaultDuration: '10 min', description: 'Leg swings, arm circles, hip rotations, walking lunges, high knees. Pre-session.' },
];

export async function getCoachDrills(coachUid) {
  if (!coachUid) return [];
  const snap = await getDocs(collection(db, 'coachDrills', coachUid, 'drills'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), custom: true }));
}

export async function saveCoachDrill(coachUid, drill) {
  return addDoc(collection(db, 'coachDrills', coachUid, 'drills'), {
    ...drill,
    createdAt: serverTimestamp(),
  });
}

export async function deleteCoachDrill(coachUid, drillId) {
  return deleteDoc(doc(db, 'coachDrills', coachUid, 'drills', drillId));
}

export async function getTemplates(coachUid) {
  if (!coachUid) return [];
  const snap = await getDocs(collection(db, 'programTemplates', coachUid, 'templates'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveTemplate(coachUid, template) {
  return addDoc(collection(db, 'programTemplates', coachUid, 'templates'), {
    ...template,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTemplate(coachUid, templateId) {
  return deleteDoc(doc(db, 'programTemplates', coachUid, 'templates', templateId));
}
