import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Text, Icon, Avatar } from 'react-native-elements';
import { auth, db } from '../components/Firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';

export class ProfileScreen extends Component {
  state = {
    displayName: '',
    email: '',
    role: 'player',
    saving: false,
    loading: true,
  };

  componentDidMount() {
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ email: user.email, displayName: user.displayName || '' });
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          this.setState({
            displayName: data.displayName || user.displayName || '',
            role: data.role || 'player',
            loading: false,
          });
        } else {
          this.setState({ loading: false });
        }
      })
      .catch(() => this.setState({ loading: false }));
  }

  saveChanges = async () => {
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ saving: true });
    try {
      // Save to Firestore AND Firebase Auth profile so all screens see the update
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), { displayName: this.state.displayName }, { merge: true }),
        updateProfile(user, { displayName: this.state.displayName }),
      ]);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save changes.');
    }
    this.setState({ saving: false });
  };

  switchRole = () => {
    const { role } = this.state;
    const newRole = role === 'coach' ? 'player' : 'coach';
    const label = newRole === 'coach' ? 'Coach' : 'Player';
    Alert.alert(
      'Switch Role',
      `Switch your account to ${label} mode? The app will reload to the ${label} interface.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Switch to ${label}`,
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
              await setDoc(doc(db, 'users', user.uid), { role: newRole }, { merge: true });
              // App.js onSnapshot will detect the role change and switch navigators
            } catch (e) {
              Alert.alert('Error', 'Could not switch role. Please try again.');
            }
          },
        },
      ]
    );
  };

  changePassword = () => {
    const user = auth.currentUser;
    if (!user) return;
    sendPasswordResetEmail(auth, user.email)
      .then(() => Alert.alert('Email Sent', 'Password reset email sent!'))
      .catch(() => Alert.alert('Error', 'Could not send reset email.'));
  };

  logout = () => {
    signOut(auth).catch(() => {});
  };

  render() {
    const { displayName, email, role, saving, loading } = this.state;
    const initials = (displayName || email || '?')[0].toUpperCase();

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Profile" homeScreen="HomeScreen" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.container}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Avatar
                rounded
                title={initials}
                size="large"
                containerStyle={{ backgroundColor: '#008000' }}
              />
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role === 'coach' ? '‍ Coach' : ' Player'}</Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{email}</Text>
            </View>

            {/* Display Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={(t) => this.setState({ displayName: t })}
                placeholder="Enter your name"
                placeholderTextColor="#aaa"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, styles.btnGreen, saving && styles.btnDisabled]}
              onPress={this.saveChanges}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.btnText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={this.changePassword}>
              <Text style={styles.btnOutlineText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSwitch]} onPress={this.switchRole}>
              <Icon
                name={role === 'coach' ? 'person' : 'people'}
                type="material"
                size={16}
                color="#0D47A1"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.btnSwitchText}>
                Switch to {role === 'coach' ? 'Player' : 'Coach'} Mode
              </Text>
            </TouchableOpacity>

            {/* Linked Apps */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Linked Apps</Text>
              {['MyFitnessPal', 'Strava', 'Apple Health'].map((app) => (
                <View key={app} style={styles.linkedRow}>
                  <Text style={styles.linkedName}>{app}</Text>
                  <TouchableOpacity
                    style={styles.connectBtn}
                    onPress={() => Alert.alert('Coming Soon', `${app} integration coming soon!`)}
                  >
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={this.logout}>
              <Text style={styles.btnText}>Log Out</Text>
            </TouchableOpacity>
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
    padding: 16, backgroundColor: 'white', elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  container: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  roleBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 4, marginTop: 10,
  },
  roleText: { color: '#008000', fontWeight: 'bold', fontSize: 13 },
  field: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  fieldLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  fieldValue: { fontSize: 15, color: '#333' },
  input: {
    fontSize: 15, color: '#333', borderBottomWidth: 1,
    borderBottomColor: '#ddd', paddingVertical: 4,
  },
  btn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    marginBottom: 12, elevation: 1,
  },
  btnSwitch: { backgroundColor: '#E3F2FD', borderWidth: 1.5, borderColor: '#0D47A1', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnSwitchText: { color: '#0D47A1', fontWeight: 'bold', fontSize: 15 },
  btnGreen: { backgroundColor: '#008000' },
  btnRed: { backgroundColor: '#D32F2F' },
  btnOutline: { borderWidth: 2, borderColor: '#008000', backgroundColor: 'white' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  btnOutlineText: { color: '#008000', fontWeight: 'bold', fontSize: 15 },
  section: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  linkedRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  linkedName: { fontSize: 14, color: '#333' },
  connectBtn: {
    borderWidth: 1, borderColor: '#008000', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  connectBtnText: { color: '#008000', fontWeight: '600', fontSize: 13 },
});

export default ProfileScreen;
