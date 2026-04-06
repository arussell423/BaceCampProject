import React, { Component } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text, Icon, Avatar } from 'react-native-elements';
import firebase from 'firebase';

const NAV_ITEMS = [
  { label: 'AI Coach 🤖', icon: 'psychology', screen: 'AICoachScreen', color: '#9C27B0' },
  { label: 'Speed Drills ⚡', icon: 'speed', screen: 'SpeedTrackingScreen', color: '#F44336' },
  { label: 'Evaluation', icon: 'assignment', screen: 'EvaluationScreen', color: '#4CAF50' },
  { label: 'Training', icon: 'fitness-center', screen: 'TrainingScreen', color: '#2196F3' },
  { label: 'Schedule', icon: 'event', screen: 'ScheduleScreen', color: '#FF9800' },
  { label: 'Dashboard', icon: 'bar-chart', screen: 'DashboardScreen', color: '#9C27B0' },
  { label: 'Match Report', icon: 'description', screen: 'MatchReportScreen', color: '#F44336' },
];

export class HomeScreen extends Component {
  static navigationOptions = { headerShown: false };

  state = { userEmail: '', role: 'player' };

  componentDidMount() {
    const user = firebase.auth().currentUser;
    const role = this.props.navigation.getParam('role', 'player');
    if (user) this.setState({ userEmail: user.email, role });
  }

  logout = () => {
    firebase.auth().signOut().then(() => {
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
