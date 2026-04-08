import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, FlatList, Text,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { auth, db } from '../components/Firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

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

const LEVEL_COLOURS = {
  Beginner: '#4CAF50',
  Intermediate: '#FF9800',
  Advanced: '#F44336',
  'All Levels': '#2196F3',
};

class WorkoutCard extends Component {
  state = { completed: false, rating: null };

  complete = () => {
    const { workout } = this.props;
    this.setState({ completed: true });
    // Show motivational message and related workout suggestion
    const related = Object.values(WORKOUTS).flat().filter(
      (w) => w.id !== workout.id && w.level === workout.level
    );
    const suggestion = related[Math.floor(Math.random() * related.length)];
    setTimeout(() => {
      Alert.alert(
        '🎉 Great Work!',
        suggestion
          ? `Well done on completing "${workout.title}"!\n\nYou might also enjoy:\n"${suggestion.title}" (${suggestion.duration})`
          : `Well done on completing "${workout.title}"! Keep building that momentum!`
      );
    }, 400);
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
        <Text style={cardStyles.duration}>⏱ {workout.duration}</Text>
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
                <TouchableOpacity onPress={() => this.setState({ rating: 'like' })} style={cardStyles.ratingBtn}>
                  <MaterialCommunityIcons name="thumb-up-outline" size={28} color="#008000" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.setState({ rating: 'dislike' })} style={cardStyles.ratingBtn}>
                  <MaterialCommunityIcons name="thumb-down-outline" size={28} color="#e53935" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ color: '#555', marginTop: 6 }}>
                {rating === 'like' ? 'Great work! Keep it up!' : 'No worries — try a different workout next time.'}
              </Text>
            )}
          </View>
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

export class TrainingScreen extends Component {
  state = { activeCategory: 'Strength', coachWorkouts: [], loadingCoach: false };

  componentDidMount() {
    this.loadCoachWorkouts();
  }

  loadCoachWorkouts = async () => {
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ loadingCoach: true });
    try {
      const snap = await getDocs(query(collection(db, 'coachTraining', user.uid, 'sessions'), orderBy('timestamp', 'desc'), limit(10)));
      const coachWorkouts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      this.setState({ coachWorkouts, loadingCoach: false });
    } catch (e) {
      this.setState({ loadingCoach: false });
    }
  };

  render() {
    const { activeCategory, coachWorkouts, loadingCoach } = this.state;
    const workouts = WORKOUTS[activeCategory] || [];

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Training" homeScreen="HomeScreen" />

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => this.setState({ activeCategory: cat })}
            >
              <Text style={[styles.catLabel, activeCategory === cat && styles.catLabelActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Coach-assigned section */}
          {coachWorkouts.length > 0 && (
            <View style={styles.coachSection}>
              <Text style={styles.coachSectionTitle}>Coach Assigned</Text>
              {coachWorkouts.map((cw) => (
                <View key={cw.id} style={styles.coachCard}>
                  <View style={styles.coachCardHeader}>
                    <Text style={styles.coachCardTitle}>{cw.title}</Text>
                    {cw.category ? (
                      <View style={styles.coachCatBadge}>
                        <Text style={styles.coachCatText}>{cw.category}</Text>
                      </View>
                    ) : null}
                  </View>
                  {cw.description ? <Text style={styles.coachCardDesc}>{cw.description}</Text> : null}
                  {cw.videoUrl ? <Text style={styles.coachCardVideo}>[Video] {cw.videoUrl}</Text> : null}
                </View>
              ))}
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
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  categoryBar: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F4F6FA' },
  catChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  catLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  catLabelActive: { color: 'white', fontWeight: 'bold' },
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  coachSection: { marginBottom: 20 },
  coachSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#9C27B0', marginBottom: 12 },
  coachCard: {
    backgroundColor: '#f3e5f5', borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: '#9C27B0',
  },
  coachCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  coachCardTitle: { fontSize: 14, fontWeight: '700', color: '#4A148C', flex: 1 },
  coachCatBadge: { backgroundColor: '#9C27B0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  coachCatText: { color: 'white', fontSize: 11, fontWeight: '600' },
  coachCardDesc: { fontSize: 13, color: '#555', lineHeight: 19 },
  coachCardVideo: { fontSize: 12, color: '#2196F3', marginTop: 6 },
});

export default TrainingScreen;
