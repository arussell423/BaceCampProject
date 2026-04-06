import React, { Component } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, StatusBar,
} from 'react-native';
import { Text, Icon, Avatar } from 'react-native-elements';
import { auth } from '../components/Firebase';
import { signOut } from 'firebase/auth';

const NAV_ITEMS = [
  { label: 'Evaluation',   icon: 'clipboard-list',    type: 'material-community', screen: 'EvaluationScreen',    color: '#1B5E20', bg: '#E8F5E9' },
  { label: 'Training',     icon: 'dumbbell',          type: 'material-community', screen: 'TrainingScreen',      color: '#0D47A1', bg: '#E3F2FD' },
  { label: 'Schedule',     icon: 'calendar-month',    type: 'material-community', screen: 'ScheduleScreen',      color: '#E65100', bg: '#FFF3E0' },
  { label: 'Dashboard',    icon: 'chart-bar',         type: 'material-community', screen: 'DashboardScreen',     color: '#4A148C', bg: '#F3E5F5' },
  { label: 'Match Report', icon: 'file-document',     type: 'material-community', screen: 'MatchReportScreen',   color: '#B71C1C', bg: '#FFEBEE' },
  { label: 'Speed Drills', icon: 'timer-outline',     type: 'material-community', screen: 'SpeedTrackingScreen', color: '#006064', bg: '#E0F7FA' },
  { label: 'AI Coach',     icon: 'robot-outline',     type: 'material-community', screen: 'AICoachScreen',       color: '#33691E', bg: '#F1F8E9' },
  { label: 'Profile',      icon: 'account-circle',    type: 'material-community', screen: 'ProfileScreen',       color: '#37474F', bg: '#ECEFF1' },
];

export class HomeScreen extends Component {
  state = { userEmail: '', displayName: '', role: 'player' };

  componentDidMount() {
    const user = auth.currentUser;
    const role = this.props.route?.params?.role ?? 'player';
    if (user) {
      this.setState({
        userEmail: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Athlete',
        role,
      });
    }
  }

  logout = () => { signOut(auth); };

  render() {
    const { displayName, role } = this.state;
    const initials = displayName ? displayName[0].toUpperCase() : '?';

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#006400" />
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Hero with logo */}
          <View style={styles.hero}>
            <Image
              source={require('../assets/image/bACE_CAMP-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.heroTextRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroGreeting}>Welcome back,</Text>
                <Text style={styles.heroName}>{displayName}</Text>
              </View>
              <TouchableOpacity onPress={() => this.props.navigation.navigate('ProfileScreen')} style={styles.avatarWrap}>
                <Avatar rounded title={initials} size={46} containerStyle={styles.avatar} />
              </TouchableOpacity>
            </View>
            <View style={styles.roleBadge}>
              <Icon name={role === 'coach' ? 'whistle' : 'tennis-ball'} type="material-community" size={13} color="#fff" />
              <Text style={styles.roleText}>{'  '}{role === 'coach' ? 'Coach' : 'Player'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Access</Text>

          {/* Nav Grid — professional icons, no emojis */}
          <View style={styles.grid}>
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.card, { backgroundColor: item.bg }]}
                onPress={() => this.props.navigation.navigate(item.screen)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                  <Icon name={item.icon} type={item.type} size={24} color="#fff" />
                </View>
                <Text style={[styles.cardLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Coach banner */}
          <TouchableOpacity style={styles.coachBanner} onPress={() => this.props.navigation.navigate('AICoachScreen')} activeOpacity={0.85}>
            <View style={styles.coachIconWrap}>
              <Icon name="robot" type="material-community" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>AI Virtual Coach</Text>
              <Text style={styles.coachMsg}>Get personalised training advice based on your evaluations</Text>
            </View>
            <Icon name="chevron-right" type="material-community" size={22} color="#1B5E20" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={this.logout}>
            <Icon name="logout" type="material-community" size={15} color="#999" />
            <Text style={styles.logoutText}>  Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
  container: { paddingBottom: 40 },
  hero: {
    backgroundColor: '#006400', paddingTop: 24, paddingHorizontal: 20,
    paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  logo: { width: 160, height: 52, marginBottom: 20 },
  heroTextRow: { flexDirection: 'row', alignItems: 'center' },
  heroGreeting: { color: '#A5D6A7', fontSize: 13, fontWeight: '500' },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatarWrap: { marginLeft: 12 },
  avatar: { backgroundColor: '#2E7D32', borderWidth: 2, borderColor: '#A5D6A7' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 14,
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

export class HomeScreen extends Component {
  state = { userEmail: '', role: 'player' };

  componentDidMount() {
    const user = auth.currentUser;
    const role = this.props.route?.params?.role ?? 'player';
    if (user) this.setState({ userEmail: user.email, role });
  }

  logout = () => {
    signOut(auth).then(() => {
      this.props.navigation.navigate('LoginScreen');
    });
  };

  render() {
    const { userEmail, role } = this.state;
    const initials = userEmail ? userEmail[0].toUpperCase() : '?';

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back 👋</Text>
              <Text style={styles.email}>{userEmail}</Text>
              <TouchableOpacity onPress={this.logout}>
                <Text style={styles.logoutLink}>Log out</Text>
              </TouchableOpacity>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role === 'coach' ? '🧑‍🏫 Coach' : '🎾 Player'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('ProfileScreen')}>
              <Avatar
                rounded
                title={initials}
                size="medium"
                containerStyle={{ backgroundColor: '#008000' }}
              />
            </TouchableOpacity>
          </View>

          {/* Logo banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>bACE CAMP</Text>
            <Text style={styles.bannerSubtitle}>Your tennis performance hub</Text>
          </View>

          {/* Nav Cards */}
          <View style={styles.grid}>
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.card, { borderTopColor: item.color }]}
                onPress={() => this.props.navigation.navigate(item.screen)}
              >
                <Icon name={item.icon} type="material" size={36} color={item.color} />
                <Text style={styles.cardLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Virtual Coach hint */}
          <View style={styles.coachBanner}>
            <Text style={styles.coachIcon}>🤖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachTitle}>Virtual Coach</Text>
              <Text style={styles.coachMsg}>Complete your evaluation to get personalised feedback!</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  email: { color: 'grey', fontSize: 13, marginTop: 2 },
  logoutLink: { color: '#D32F2F', fontSize: 12, marginTop: 3 },
  roleBadge: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
  roleText: { color: '#008000', fontWeight: 'bold', fontSize: 12 },
  banner: { backgroundColor: '#008000', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center' },
  bannerTitle: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  bannerSubtitle: { color: '#c8e6c9', fontSize: 14, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '47%', backgroundColor: 'white', borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: 16, borderTopWidth: 4,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: { marginTop: 10, fontWeight: '600', fontSize: 14, color: '#333' },
  coachBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff3e0', borderRadius: 14, padding: 16, marginTop: 8,
    borderLeftWidth: 4, borderLeftColor: '#FF9800',
  },
  coachIcon: { fontSize: 36, marginRight: 12 },
  coachTitle: { fontWeight: 'bold', color: '#E65100', fontSize: 15 },
  coachMsg: { color: '#555', fontSize: 13, marginTop: 2 },
});

export default HomeScreen;
