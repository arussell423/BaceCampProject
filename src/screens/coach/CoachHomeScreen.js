import React, { Component } from 'react';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Text, Icon, Avatar } from 'react-native-elements';
import { auth, db } from '../../components/Firebase';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';

const NAV_CARDS = [
  { label: 'My Players', icon: 'people', screen: 'CoachRosterScreen', color: '#4CAF50' },
  { label: 'Add Training', icon: 'fitness-center', screen: 'CoachAddTrainingScreen', color: '#2196F3' },
  { label: 'Send Feedback', icon: 'feedback', screen: 'CoachRosterScreen', color: '#FF9800' },
  { label: 'Schedule', icon: 'event', screen: 'CoachCalendarScreen', color: '#9C27B0' },
  { label: 'Dashboard', icon: 'bar-chart', screen: 'CoachDashboardScreen', color: '#F44336' },
  { label: 'Profile', icon: 'person', screen: 'ProfileScreen', color: '#008000' },
];

export class CoachHomeScreen extends Component {
  state = {
    coachName: '',
    playerCount: 0,
    newEvalCount: 0,
    loading: true,
  };

  componentDidMount() {
    this.loadCoachData();
  }

  loadCoachData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const [userDoc, rosterSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDocs(collection(db, 'playerRosters', user.uid, 'players')),
      ]);

      const coachName = userDoc.exists()
        ? (userDoc.data().displayName || userDoc.data().email || user.email)
        : user.email;

      const playerCount = rosterSnap.size;

      // Check for new evals in last 24h
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let newEvalCount = 0;
      for (const playerDoc of rosterSnap.docs) {
        try {
          const evalSnap = await getDocs(query(collection(db, 'evaluations', playerDoc.id, 'sessions'), where('timestamp', '>=', cutoff), limit(1)));
          if (!evalSnap.empty) newEvalCount++;
        } catch (e) {
          // ignore per-player errors
        }
      }

      this.setState({ coachName, playerCount, newEvalCount, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { coachName, playerCount, newEvalCount, loading } = this.state;
    const initials = (coachName || '?')[0].toUpperCase();

    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.appTitle}>bACE CAMP Coach</Text>
          </View>
          <Avatar
            rounded
            title={initials}
            size="medium"
            containerStyle={{ backgroundColor: '#008000' }}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.container}>
            {/* Welcome */}
            <Text style={styles.welcomeText}>Welcome, {coachName}</Text>

            {/* Alert banner */}
            {newEvalCount > 0 && (
              <View style={styles.alertBanner}>
                <Icon name="alert-circle-outline" type="material-community" size={18} color="#856404" style={{ marginRight: 8 }} />
                <Text style={styles.alertText}>
                  {newEvalCount} player(s) submitted new evaluations
                </Text>
              </View>
            )}

            {/* Stats bar */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{playerCount}</Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNum, { color: newEvalCount > 0 ? '#F44336' : '#008000' }]}>
                  {newEvalCount}
                </Text>
                <Text style={styles.statLabel}>New Evals</Text>
              </View>
            </View>

            {/* Nav grid */}
            <View style={styles.grid}>
              {NAV_CARDS.map((card) => (
                <TouchableOpacity
                  key={card.label}
                  style={[styles.card, { borderTopColor: card.color }]}
                  onPress={() => this.props.navigation.navigate(card.screen)}
                >
                  <Icon name={card.icon} type="material" size={34} color={card.color} />
                  <Text style={styles.cardLabel}>{card.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#008000',
  },
  appTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  container: { padding: 20, paddingBottom: 40 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  alertBanner: {
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF9800',
    flexDirection: 'row', alignItems: 'center',
  },
  alertText: { color: '#E65100', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 20,
    alignItems: 'center', marginHorizontal: 6, elevation: 2,
  },
  statNum: { fontSize: 36, fontWeight: 'bold', color: '#008000' },
  statLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '47%', backgroundColor: 'white', borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: 16, borderTopWidth: 4,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: { marginTop: 10, fontWeight: '600', fontSize: 13, color: '#333', textAlign: 'center' },
});

export default CoachHomeScreen;
