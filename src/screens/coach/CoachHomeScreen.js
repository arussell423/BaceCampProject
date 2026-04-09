import React, { Component } from 'react';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image, StatusBar, Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../components/Firebase';
import { doc, getDoc, collection, onSnapshot, query, where, limit, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const NAV_CARDS = [
  { label: 'My Players',    icon: 'account-group',      type: 'material-community', screen: 'CoachRosterScreen',   color: '#1B5E20', bg: '#E8F5E9' },
  { label: 'Add Training',  icon: 'dumbbell',            type: 'material-community', screen: 'CoachRosterScreen',   color: '#0D47A1', bg: '#E3F2FD', subtitle: 'Pick a player first' },
  { label: 'Send Feedback', icon: 'comment-text-outline', type: 'material-community', screen: 'CoachRosterScreen',   color: '#E65100', bg: '#FFF3E0', subtitle: 'Pick a player first' },
  { label: 'Schedule',      icon: 'calendar-month',      type: 'material-community', screen: 'CoachCalendarScreen', color: '#4A148C', bg: '#F3E5F5' },
  { label: 'Dashboard',     icon: 'chart-line',          type: 'material-community', screen: 'CoachDashboardScreen', color: '#B71C1C', bg: '#FFEBEE' },
  { label: 'Profile',       icon: 'account-circle',      type: 'material-community', screen: 'ProfileScreen',       color: '#37474F', bg: '#ECEFF1' },
];

export class CoachHomeScreen extends Component {
  state = {
    coachName: '',
    playerCount: 0,
    newEvalCount: 0,
    loading: true,
  };

  componentDidMount() {
    this.loadCoachName();
    this.subscribeRoster();
  }

  componentWillUnmount() {
    if (this._rosterUnsub) this._rosterUnsub();
  }

  loadCoachName = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const coachName = userDoc.exists()
        ? (userDoc.data().displayName || userDoc.data().email || user.email)
        : user.email;
      this.setState({ coachName });
    } catch (e) { /* offline */ }
  };

  subscribeRoster = () => {
    const user = auth.currentUser;
    if (!user) return;
    // Real-time subscription so player count updates immediately when a player links
    this._rosterUnsub = onSnapshot(
      collection(db, 'playerRosters', user.uid, 'players'),
      async (snap) => {
        const activePlayers = snap.docs.filter((d) => !d.data().invited);
        const playerCount = activePlayers.length;

        // Count new evals in last 24h from active players
        const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
        let newEvalCount = 0;
        for (const playerDoc of activePlayers) {
          try {
            const uid = playerDoc.data().uid || playerDoc.id;
            const evalSnap = await getDocs(query(
              collection(db, 'evaluations', uid, 'sessions'),
              where('timestamp', '>=', cutoff),
              limit(1)
            ));
            if (!evalSnap.empty) newEvalCount++;
          } catch (e) { /* ignore per-player errors */ }
        }

        this.setState({ playerCount, newEvalCount, loading: false });
      },
      () => this.setState({ loading: false }),
    );
  };

  render() {
    const { coachName, playerCount, newEvalCount, loading } = this.state;
    const initials = (coachName || '?')[0].toUpperCase();

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#004d00" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

            {/* ── Branded hero ──────────────────────────────────── */}
            <View style={styles.hero}>
              <Image
                source={require('../../assets/image/bACE_CAMP-logo-light.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroGreeting}>Welcome back,</Text>
                  <Text style={styles.heroName}>{coachName}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => this.props.navigation.navigate('ProfileScreen')}
                  style={styles.avatarWrap}
                >
                  <View style={[{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center'},styles.avatar]}><Text style={{color:'#fff',fontWeight:'bold',fontSize:18}}>{initials}</Text></View>
                </TouchableOpacity>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Head Coach</Text>
              </View>
            </View>

            {/* ── Alert banner ──────────────────────────────────── */}
            {newEvalCount > 0 && (
              <View style={styles.alertBanner}>
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#856404" />
                <Text style={styles.alertText}>
                  {'  '}{newEvalCount} player{newEvalCount > 1 ? 's' : ''} submitted new evaluations
                </Text>
              </View>
            )}

            {/* ── Stats row ─────────────────────────────────────── */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.statNum, { color: '#1B5E20' }]}>{playerCount}</Text>
                <Text style={[styles.statLabel, { color: '#2E7D32' }]}>Players</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: newEvalCount > 0 ? '#FFF3E0' : '#ECEFF1' }]}>
                <Text style={[styles.statNum, { color: newEvalCount > 0 ? '#E65100' : '#455A64' }]}>
                  {newEvalCount}
                </Text>
                <Text style={[styles.statLabel, { color: newEvalCount > 0 ? '#BF360C' : '#607D8B' }]}>New Evals</Text>
              </View>
            </View>

            {/* ── Nav grid ──────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.grid}>
              {NAV_CARDS.map((card) => (
                <TouchableOpacity
                  key={card.label}
                  style={[styles.card, { backgroundColor: card.bg }]}
                  onPress={() => this.props.navigation.navigate(card.screen)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconCircle, { backgroundColor: card.color }]}>
                    <MaterialCommunityIcons name={card.icon} size={24} color="#fff" />
                  </View>
                  <Text style={[styles.cardLabel, { color: card.color }]}>{card.label}</Text>
                  {card.subtitle ? (
                    <Text style={[styles.cardSubtitle, { color: card.color }]}>{card.subtitle}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Sign out ──────────────────────────────────────── */}
            <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
              <MaterialCommunityIcons name="logout" size={15} color="#999" />
              <Text style={styles.logoutText}>  Sign Out</Text>
            </TouchableOpacity>

          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
  container: { paddingBottom: 40 },

  // Hero — mirrors player HomeScreen
  hero: {
    backgroundColor: '#004d00',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroLogo: { width: 220, height: 72, marginBottom: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroGreeting: { color: '#A5D6A7', fontSize: 13, fontWeight: '500' },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatarWrap: { marginLeft: 12 },
  avatar: { backgroundColor: '#2E7D32', borderWidth: 2, borderColor: '#A5D6A7' },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 14,
  },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Alert
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14,
    marginHorizontal: 20, marginTop: 16,
    borderLeftWidth: 4, borderLeftColor: '#FFC107',
  },
  alertText: { color: '#5D4037', fontWeight: '600', fontSize: 13 },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 20,
    alignItems: 'center', marginHorizontal: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statNum: { fontSize: 42, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Grid
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  card: {
    width: '44%', borderRadius: 16, padding: 18, margin: '3%',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  cardSubtitle: { fontSize: 10, fontWeight: '400', textAlign: 'center', opacity: 0.7, marginTop: 2 },

  // Sign out
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 8 },
  logoutText: { color: '#999', fontSize: 14 },
});

export default CoachHomeScreen;
