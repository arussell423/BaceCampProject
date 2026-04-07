import React, { Component } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, StatusBar, Text,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../components/Firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const NAV_ITEMS = [
  { label: 'Evaluation',   icon: 'clipboard-list',  type: 'material-community', tab: 'Evaluation',  screen: 'EvaluationScreen',    color: '#1B5E20', bg: '#E8F5E9' },
  { label: 'Training',     icon: 'dumbbell',        type: 'material-community', tab: 'Training',    screen: 'TrainingScreen',      color: '#0D47A1', bg: '#E3F2FD' },
  { label: 'Schedule',     icon: 'calendar-month',  type: 'material-community', tab: 'Schedule',    screen: 'ScheduleScreen',      color: '#E65100', bg: '#FFF3E0' },
  { label: 'Dashboard',    icon: 'chart-bar',       type: 'material-community', tab: null,          screen: 'DashboardScreen',     color: '#4A148C', bg: '#F3E5F5' },
  { label: 'Match Report', icon: 'file-document',   type: 'material-community', tab: null,          screen: 'MatchReportScreen',   color: '#B71C1C', bg: '#FFEBEE' },
  { label: 'Speed Drills', icon: 'timer-outline',   type: 'material-community', tab: null,          screen: 'SpeedTrackingScreen', color: '#006064', bg: '#E0F7FA' },
  { label: 'AI Coach',     icon: 'robot-outline',   type: 'material-community', tab: null,          screen: 'AICoachScreen',       color: '#33691E', bg: '#F1F8E9' },
  { label: 'Profile',      icon: 'account-circle',  type: 'material-community', tab: null,          screen: 'ProfileScreen',       color: '#37474F', bg: '#ECEFF1' },
];

export class HomeScreen extends Component {
  state = { userEmail: '', displayName: '', role: 'player' };

  componentDidMount() {
    const user = auth.currentUser;
    if (!user) return;
    // Read displayName from Firestore so profile edits are reflected immediately
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      const firestoreName = snap.exists() ? snap.data().displayName : null;
      this.setState({
        userEmail: user.email,
        displayName: firestoreName || user.displayName || user.email?.split('@')[0] || 'Athlete',
      });
    }).catch(() => {
      this.setState({
        userEmail: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Athlete',
      });
    });
  }

  logout = () => { signOut(auth); };

  render() {
    const { displayName, role } = this.state;
    const initials = displayName ? displayName[0].toUpperCase() : '?';

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#006400" />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <View style={styles.hero}>
            <Image
              source={require('../assets/image/bACE_CAMP-logo-light.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.heroTextRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroGreeting}>Welcome back,</Text>
                <Text style={styles.heroName}>{displayName}</Text>
              </View>
              <TouchableOpacity onPress={() => this.props.navigation.navigate('ProfileScreen')} style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role === 'coach' ? 'Coach' : 'Player'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Access</Text>

          <View style={styles.grid}>
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.card, { backgroundColor: item.bg }]}
                onPress={() => {
                    if (item.tab) {
                      this.props.navigation.navigate(item.tab);
                    } else {
                      this.props.navigation.navigate(item.screen);
                    }
                  }}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                  <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
                </View>
                <Text style={[styles.cardLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.coachBanner} onPress={() => this.props.navigation.navigate('AICoachScreen')} activeOpacity={0.85}>
            <View style={styles.coachIconWrap}>
              <MaterialCommunityIcons name="robot" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>AI Virtual Coach</Text>
              <Text style={styles.coachMsg}>Get personalised training advice based on your evaluations</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#1B5E20" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={this.logout}>
            <MaterialCommunityIcons name="logout" size={15} color="#999" />
            <Text style={styles.logoutText}>  Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
  container: { paddingBottom: 40, flexGrow: 1 },
  hero: {
    backgroundColor: '#006400', paddingTop: 24, paddingHorizontal: 20,
    paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  logo: { width: 220, height: 72, marginBottom: 20 },
  heroTextRow: { flexDirection: 'row', alignItems: 'center' },
  heroGreeting: { color: '#A5D6A7', fontSize: 13, fontWeight: '500' },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatarWrap: { marginLeft: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#2E7D32', borderWidth: 2, borderColor: '#A5D6A7',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 14,
  },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 20, marginTop: 24, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  card: {
    width: '44%', borderRadius: 16, padding: 18, margin: '3%',
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  coachBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9',
    borderRadius: 16, marginHorizontal: 20, marginTop: 8, padding: 16,
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  coachIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  coachTitle: { fontSize: 14, fontWeight: '700', color: '#1B5E20', marginBottom: 3 },
  coachMsg: { fontSize: 12, color: '#388E3C', lineHeight: 17 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 8 },
  logoutText: { color: '#999', fontSize: 14 },
});

export default HomeScreen;
