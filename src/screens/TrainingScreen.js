import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, FlatList, Text, Alert, TextInput, Linking, Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../components/Firebase';
import {
  collection, query, orderBy, limit, getDocs, doc, setDoc, updateDoc, serverTimestamp, onSnapshot,
} from 'firebase/firestore';

const CATEGORIES = ['Strength', 'Power', 'Speed', 'Footwork', 'Flexibility'];

const WORKOUTS = {
  Strength: [
    { id: 's1', title: 'Core Stability Circuit', duration: '20 min', level: 'Intermediate', desc: '3 sets: Plank (60s), Side Plank (30s each), Dead Bug (12 reps), Bird Dog (10 reps).' },
    { id: 's2', title: 'Upper Body Strength', duration: '30 min', level: 'Advanced', desc: '4 sets: Push-ups (15), Dumbbell Rows (12), Shoulder Press (10), Bicep Curls (12).' },
    { id: 's3', title: 'Leg Power Builder', duration: '25 min', level: 'Intermediate', desc: '3 sets: Squats (15), Lunges (12 each), Calf Raises (20), Glute Bridges (15).' },
  ],
  Power: [
    { id: 'p1', title: 'Plyometric Jumps', duration: '20 min', level: 'Advanced', desc: '4 sets: Box Jumps (8), Broad Jumps (6), Jump Squats (10), Lateral Bounds (8 each).' },
    { id: 'p2', title: 'Serve Power Drill', duration: '15 min', level: 'Intermediate', desc: 'Medicine ball throws focusing on rotation and shoulder rotation. 3 sets of 10 reps.' },
  ],
  Speed: [
    { id: 'sp1', title: 'Cone Sprint Drill', duration: '20 min', level: 'All Levels', desc: 'Set up 5 cones 2m apart. Sprint forward and back x5. Rest 30s. Repeat x6.' },
    { id: 'sp2', title: 'T-Drill Agility', duration: '15 min', level: 'Intermediate', desc: 'Classic T-drill: forward 5m, left 2.5m, right 5m, back to centre, retreat. 8 reps.' },
    { id: 'sp3', title: '20m Shuttle Run', duration: '10 min', level: 'All Levels', desc: 'Shuttle runs at maximal effort. Record your best time. 6 reps with 60s rest.' },
  ],
  Footwork: [
    { id: 'f1', title: 'Ladder Drills', duration: '20 min', level: 'All Levels', desc: 'In-out, side-step, Ali shuffle and single-leg hops through an agility ladder. 5 rounds.' },
    { id: 'f2', title: 'Split Step Practice', duration: '15 min', level: 'Beginner', desc: 'Practice split step timing with a partner feeding balls. Focus on explosive first step.' },
  ],
  Flexibility: [
    { id: 'fl1', title: 'Full Body Stretch Routine', duration: '20 min', level: 'All Levels', desc: 'Hold each stretch for 30s: hip flexor, hamstring, quad, shoulder, chest, thoracic rotation.' },
    { id: 'fl2', title: 'Hip Mobility Flow', duration: '15 min', level: 'All Levels', desc: 'Pigeon pose, 90/90 stretch, hip circles, deep squat hold. Essential for lateral movement.' },
    { id: 'fl3', title: 'Shoulder & Rotator Cuff', duration: '10 min', level: 'All Levels', desc: 'Resistance band external rotation, cross-body stretch, doorway stretch, sleeper stretch.' },
  ],
};

const LEVEL_COLOURS = { Beginner: '#4CAF50', Intermediate: '#FF9800', Advanced: '#F44336', 'All Levels': '#2196F3' };
const DIFF_COLORS = { Beginner: '#4CAF50', Intermediate: '#FF9800', Advanced: '#F44336' };

class WorkoutCard extends Component {
  state = { completed: false, rating: null };
  setRating = (value) => {
    this.setState({ rating: value });
    const user = auth.currentUser;
    if (!user) return;
    setDoc(doc(db, 'workoutRatings', user.uid, 'ratings', this.props.workout.id), {
      rating: value, workoutTitle: this.props.workout.title, ratedAt: serverTimestamp(),
    }).catch(() => {});
  };
  complete = () => {
    this.setState({ completed: true });
    const related = Object.values(WORKOUTS).flat().filter((w) => w.id !== this.props.workout.id && w.level === this.props.workout.level);
    const suggestion = related[Math.floor(Math.random() * related.length)];
    setTimeout(() => Alert.alert('Great Work!', suggestion ? `Well done on "${this.props.workout.title}"!\n\nYou might also enjoy:\n"${suggestion.title}" (${suggestion.duration})` : `Well done on "${this.props.workout.title}"! Keep it up!`), 400);
  };
  render() {
    const { workout } = this.props;
    const { completed, rating } = this.state;
    return (
      <View style={[cardStyles.card, completed && cardStyles.cardDone]}>
        <View style={cardStyles.row}>
          <Text style={cardStyles.title}>{workout.title}</Text>
          <View style={[cardStyles.levelBadge, { backgroundColor: LEVEL_COLOURS[workout.level] + '22', borderColor: LEVEL_COLOURS[workout.level] }]}>
            <Text style={[cardStyles.levelText, { color: LEVEL_COLOURS[workout.level] }]}>{workout.level}</Text>
          </View>
        </View>
        <Text style={cardStyles.duration}>{workout.duration}</Text>
        <Text style={cardStyles.desc}>{workout.desc}</Text>
        {!completed ? (
          <TouchableOpacity style={cardStyles.completeBtn} onPress={this.complete}>
            <MaterialIcons name="check-circle-outline" size={18} color="#008000" />
            <Text style={cardStyles.completeBtnText}> Mark as Complete</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={cardStyles.doneRow}>
              <MaterialIcons name="check-circle" size={18} color="#008000" />
              <Text style={{ color: '#008000', marginLeft: 4, fontWeight: '600' }}>Completed! Rate it:</Text>
            </View>
            {!rating ? (
              <View style={cardStyles.ratingRow}>
                <TouchableOpacity onPress={() => this.setRating('like')} style={cardStyles.ratingBtn}><MaterialCommunityIcons name="thumb-up-outline" size={28} color="#008000" /></TouchableOpacity>
                <TouchableOpacity onPress={() => this.setRating('dislike')} style={cardStyles.ratingBtn}><MaterialCommunityIcons name="thumb-down-outline" size={28} color="#e53935" /></TouchableOpacity>
              </View>
            ) : (
              <Text style={{ color: '#555', marginTop: 6 }}>{rating === 'like' ? 'Great work! Keep it up!' : "No worries — try a different workout next time."}</Text>
            )}
          </View>
        )}
      </View>
    );
  }
}

class CoachSessionCard extends Component {
  state = { playerNote: '', saving: false, localStatus: null };

  markStatus = async (newStatus) => {
    const { session } = this.props;
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ saving: true });
    try {
      await updateDoc(doc(db, 'coachTraining', user.uid, 'sessions', session.id), {
        status: newStatus,
        completedAt: newStatus === 'done' ? serverTimestamp() : null,
        playerNotes: this.state.playerNote.trim() || null,
      });
      this.setState({ localStatus: newStatus, saving: false });
    } catch (e) {
      Alert.alert('Error', 'Could not update status.');
      this.setState({ saving: false });
    }
  };

  openVideo = (url) => {
    Linking.openURL(url).catch(() => Alert.alert('Cannot open URL'));
  };

  render() {
    const { session } = this.props;
    const { playerNote, saving, localStatus } = this.state;
    const status = localStatus || session.status || 'pending';
    const dc = DIFF_COLORS[session.difficulty] || '#888';
    const exercises = session.exercises || [];
    const isDone = status === 'done';
    const isSkipped = status === 'skipped';

    return (
      <View style={[coachCardStyles.card, isDone && coachCardStyles.cardDone, isSkipped && coachCardStyles.cardSkipped]}>
        {/* Header */}
        <View style={coachCardStyles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={coachCardStyles.title}>{session.title}</Text>
            <View style={coachCardStyles.badgeRow}>
              {session.category ? (
                <View style={coachCardStyles.catBadge}><Text style={coachCardStyles.catBadgeText}>{session.category}</Text></View>
              ) : null}
              {session.difficulty ? (
                <View style={[coachCardStyles.diffBadge, { backgroundColor: dc + '22', borderColor: dc }]}>
                  <Text style={[coachCardStyles.diffBadgeText, { color: dc }]}>{session.difficulty}</Text>
                </View>
              ) : null}
              {session.rpe ? (
                <View style={coachCardStyles.rpeBadge}><Text style={coachCardStyles.rpeBadgeText}>RPE {session.rpe}</Text></View>
              ) : null}
            </View>
          </View>
          <View style={[coachCardStyles.statusBadge, isDone ? coachCardStyles.statusDone : isSkipped ? coachCardStyles.statusSkipped : coachCardStyles.statusPending]}>
            <MaterialIcons name={isDone ? 'check-circle' : isSkipped ? 'skip-next' : 'schedule'} size={14} color={isDone ? '#008000' : isSkipped ? '#FF9800' : '#888'} />
            <Text style={[coachCardStyles.statusText, { color: isDone ? '#008000' : isSkipped ? '#FF9800' : '#888' }]}>{isDone ? 'Done' : isSkipped ? 'Skipped' : 'Pending'}</Text>
          </View>
        </View>

        {/* Scheduled date */}
        {session.scheduledDate ? (
          <Text style={coachCardStyles.dateText}>{new Date(session.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        ) : null}

        {/* Description */}
        {session.description ? <Text style={coachCardStyles.desc}>{session.description}</Text> : null}

        {/* Exercises */}
        {exercises.length > 0 && (
          <View style={coachCardStyles.exSection}>
            <Text style={coachCardStyles.exSectionTitle}>EXERCISES</Text>
            {exercises.map((ex, i) => (
              <View key={i} style={coachCardStyles.exRow}>
                <View style={coachCardStyles.exNum}><Text style={coachCardStyles.exNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={coachCardStyles.exName}>{ex.name}</Text>
                  <Text style={coachCardStyles.exMeta}>
                    {ex.sets}x{ex.reps}{ex.rest ? `  ·  Rest ${ex.rest}` : ''}{ex.duration ? `  ·  ${ex.duration}` : ''}
                  </Text>
                  {ex.notes ? <Text style={coachCardStyles.exNotes}>{ex.notes}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Video */}
        {session.videoUrl ? (
          <TouchableOpacity style={coachCardStyles.videoBtn} onPress={() => this.openVideo(session.videoUrl)}>
            <MaterialCommunityIcons name="youtube" size={16} color="#FF0000" />
            <Text style={coachCardStyles.videoBtnText}> Watch Video</Text>
          </TouchableOpacity>
        ) : null}

        {/* Player notes input */}
        {!isDone && !isSkipped ? (
          <View style={coachCardStyles.noteSection}>
            <TextInput
              style={coachCardStyles.noteInput}
              placeholder="Add notes before completing (optional)..."
              placeholderTextColor="#bbb"
              value={playerNote}
              onChangeText={(t) => this.setState({ playerNote: t })}
              multiline
            />
          </View>
        ) : null}

        {/* Action buttons */}
        {!isDone && !isSkipped ? (
          <View style={coachCardStyles.actionRow}>
            <TouchableOpacity style={coachCardStyles.doneBtn} onPress={() => this.markStatus('done')} disabled={saving}>
              <MaterialIcons name="check-circle-outline" size={16} color="white" />
              <Text style={coachCardStyles.doneBtnText}> Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={coachCardStyles.skipBtn} onPress={() => this.markStatus('skipped')} disabled={saving}>
              <MaterialIcons name="skip-next" size={16} color="#FF9800" />
              <Text style={coachCardStyles.skipBtnText}> Skip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={coachCardStyles.undoBtn} onPress={() => this.setState({ localStatus: 'pending' })}>
            <Text style={coachCardStyles.undoBtnText}>Undo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardDone: { borderLeftWidth: 4, borderLeftColor: '#008000' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { flex: 1, fontWeight: 'bold', fontSize: 15, color: '#222', marginRight: 8 },
  levelBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 11, fontWeight: '600' },
  duration: { color: 'grey', fontSize: 12, marginBottom: 8 },
  desc: { color: '#555', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  completeBtnText: { color: '#008000', fontWeight: '600', fontSize: 14 },
  doneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingRow: { flexDirection: 'row' },
  ratingBtn: { marginRight: 16, padding: 4 },
});

const coachCardStyles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, borderLeftWidth: 4, borderLeftColor: '#9C27B0' },
  cardDone: { borderLeftColor: '#008000' },
  cardSkipped: { borderLeftColor: '#FF9800', opacity: 0.85 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBadge: { backgroundColor: '#EDE7F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  catBadgeText: { color: '#7B1FA2', fontSize: 11, fontWeight: '700' },
  diffBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  diffBadgeText: { fontSize: 11, fontWeight: '700' },
  rpeBadge: { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  rpeBadgeText: { color: '#E65100', fontSize: 11, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 3 },
  statusPending: { backgroundColor: '#F5F5F5' },
  statusDone: { backgroundColor: '#E8F5E9' },
  statusSkipped: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 12, color: '#666', marginBottom: 6 },
  desc: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },
  exSection: { backgroundColor: '#F8F9FB', borderRadius: 10, padding: 10, marginBottom: 10 },
  exSectionTitle: { fontSize: 10, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 8 },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  exNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#9C27B0', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 2 },
  exNumText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  exName: { fontSize: 13, fontWeight: '600', color: '#222' },
  exMeta: { fontSize: 11, color: '#888', marginTop: 1 },
  exNotes: { fontSize: 11, color: '#666', marginTop: 2, fontStyle: 'italic' },
  videoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start', marginBottom: 10 },
  videoBtnText: { color: '#FF0000', fontWeight: '600', fontSize: 13 },
  noteSection: { marginBottom: 10 },
  noteInput: { backgroundColor: '#F8F9FB', borderRadius: 10, borderWidth: 1, borderColor: '#EAECF0', padding: 10, fontSize: 13, color: '#333', minHeight: 50 },
  actionRow: { flexDirection: 'row', gap: 8 },
  doneBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#008000', borderRadius: 10, paddingVertical: 10 },
  doneBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  skipBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FF9800', borderRadius: 10, paddingVertical: 10 },
  skipBtnText: { color: '#FF9800', fontWeight: '700', fontSize: 13 },
  undoBtn: { alignSelf: 'flex-end' },
  undoBtnText: { fontSize: 12, color: '#888', textDecorationLine: 'underline' },
});

export class TrainingScreen extends Component {
  state = { activeCategory: 'Strength', coachWorkouts: [], loadingCoach: false };

  componentDidMount() { this._subscribeCoachWorkouts(); }
  componentWillUnmount() { if (this._unsub) this._unsub(); }

  _subscribeCoachWorkouts = () => {
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ loadingCoach: true });
    this._unsub = onSnapshot(
      query(collection(db, 'coachTraining', user.uid, 'sessions'), orderBy('timestamp', 'desc'), limit(20)),
      (snap) => {
        const coachWorkouts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.setState({ coachWorkouts, loadingCoach: false });
      },
      () => this.setState({ loadingCoach: false })
    );
  };

  render() {
    const { activeCategory, coachWorkouts, loadingCoach } = this.state;
    const workouts = WORKOUTS[activeCategory] || [];

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Training" homeScreen="HomeScreen" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.catChip, activeCategory === cat && styles.catChipActive]} onPress={() => this.setState({ activeCategory: cat })}>
              <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Coach-assigned section */}
          {(loadingCoach || coachWorkouts.length > 0) && (
            <View style={styles.coachSection}>
              <View style={styles.coachSectionHeader}>
                <MaterialCommunityIcons name="whistle" size={18} color="#7B1FA2" />
                <Text style={styles.coachSectionTitle}> Coach Assigned</Text>
                <View style={styles.coachCountBadge}><Text style={styles.coachCountText}>{coachWorkouts.length}</Text></View>
              </View>
              {coachWorkouts.map((cw) => <CoachSessionCard key={cw.id} session={cw} />)}
            </View>
          )}

          <Text style={styles.sectionTitle}>{activeCategory} Workouts</Text>
          {workouts.map((w) => <WorkoutCard key={w.id} workout={w} />)}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
  categoryBar: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F4F6FA' },
  catChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  catLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  catLabelActive: { color: 'white', fontWeight: 'bold' },
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  coachSection: { marginBottom: 20 },
  coachSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  coachSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#7B1FA2', flex: 1 },
  coachCountBadge: { backgroundColor: '#9C27B0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  coachCountText: { color: 'white', fontSize: 12, fontWeight: '700' },
});

export default TrainingScreen;
