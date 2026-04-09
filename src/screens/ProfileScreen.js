import React, { Component } from 'react';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Alert, ScrollView, ActivityIndicator, Text,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { auth, db } from '../components/Firebase';
import { doc, getDoc, setDoc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { triggerRoleChange } from '../components/roleManager';

export class ProfileScreen extends Component {
  state = {
    displayName: '',
    email: '',
    role: 'player',
    isAdmin: false,
    saving: false,
    switching: false,
    loading: true,
    // Join-a-coach flow
    joinCode: '',
    joiningCoach: false,
    linkedCoachName: null,
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
            isAdmin: data.isAdmin === true,
            linkedCoachName: data.coachUid ? (data.coachName || 'A coach') : null,
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
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), { displayName: this.state.displayName }, { merge: true }),
        updateProfile(user, { displayName: this.state.displayName }),
      ]);
      Alert.alert('Saved', 'Profile updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save changes.');
    }
    this.setState({ saving: false });
  };

  switchRole = async () => {
    const { role, isAdmin, switching } = this.state;
    if (switching) return;
    // Admins can switch freely between coach and player for testing
    // Regular coaches can only preview player mode (one-way unless admin)
    // Players cannot switch to coach at all (unless admin)
    if (role !== 'coach' && !isAdmin) {
      Alert.alert('Access Restricted', 'Only coaches or admins can switch roles.');
      return;
    }
    const newRole = role === 'coach' ? 'player' : 'coach';
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ switching: true });
    try {
      await setDoc(doc(db, 'users', user.uid), { role: newRole }, { merge: true });
      // Directly update App.js state — no need to wait for onSnapshot
      triggerRoleChange(newRole);
      this.setState({ role: newRole, switching: false });
    } catch (e) {
      Alert.alert('Error', 'Could not switch role. Please try again.');
      this.setState({ switching: false });
    }
  };

  changePassword = () => {
    const user = auth.currentUser;
    if (!user) return;
    sendPasswordResetEmail(auth, user.email)
      .then(() => Alert.alert('Email Sent', 'Password reset email sent!'))
      .catch(() => Alert.alert('Error', 'Could not send reset email.'));
  };

  changeEmail = () => {
    Alert.prompt(
      'Change Email',
      'Enter your new email address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Verification',
          onPress: async (newEmail) => {
            if (!newEmail || !newEmail.includes('@')) {
              Alert.alert('Invalid Email', 'Please enter a valid email address.');
              return;
            }
            const user = auth.currentUser;
            if (!user) return;
            try {
              await verifyBeforeUpdateEmail(user, newEmail.trim());
              Alert.alert('Verification Sent', `A verification email has been sent to ${newEmail}. Your email will update once you verify it.`);
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not send verification email. Please re-login and try again.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  joinCoach = async () => {
    const { joinCode } = this.state;
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the 6-character code from your coach.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ joiningCoach: true });
    try {
      // Look up the roster code
      const codeSnap = await getDoc(doc(db, 'rosterCodes', code));
      if (!codeSnap.exists()) {
        Alert.alert('Code Not Found', 'That code doesn\'t match any coach. Check with your coach and try again.');
        this.setState({ joiningCoach: false });
        return;
      }
      const { coachUid, coachName } = codeSnap.data();
      if (!coachUid) {
        Alert.alert('Invalid Code', 'This code is no longer valid.');
        this.setState({ joiningCoach: false });
        return;
      }
      // Check if already linked to this coach
      const existingSnap = await getDoc(doc(db, 'users', user.uid));
      if (existingSnap.exists() && existingSnap.data().coachUid === coachUid) {
        Alert.alert('Already Linked', `You're already on ${coachName || 'this coach'}\'s roster!`);
        this.setState({ joiningCoach: false });
        return;
      }
      const sanitizedEmail = user.email.replace(/[.#$[\]]/g, '_');
      const displayName = user.displayName || user.email;
      // Run the same linking batch as linkingService.js
      const batch = writeBatch(db);
      // 1. Add to coach roster as active player
      batch.set(
        doc(db, 'playerRosters', coachUid, 'players', sanitizedEmail),
        { uid: user.uid, name: displayName, email: user.email, invited: false, linkedAt: serverTimestamp() },
        { merge: true },
      );
      // 2. Store coachUid on player's profile
      batch.set(
        doc(db, 'users', user.uid),
        { coachUid, coachName: coachName || '' },
        { merge: true },
      );
      // 3. Create a linkRequest record for audit trail
      batch.set(
        doc(collection(db, 'linkRequests'), `${user.uid}-${coachUid}`),
        {
          coachUid,
          playerEmail: user.email,
          playerUid: user.uid,
          status: 'accepted',
          playerInitiated: true,
          linkedAt: serverTimestamp(),
        },
      );
      await batch.commit();
      this.setState({ joiningCoach: false, joinCode: '', linkedCoachName: coachName || 'Your coach' });
      Alert.alert('✅ Joined!', `You've been added to ${coachName || 'your coach'}\'s roster. They can now see your progress and assign training.`);
    } catch (e) {
      Alert.alert('Error', 'Could not join. Please check your connection and try again.');
      this.setState({ joiningCoach: false });
    }
  };

  logout = () => {
    signOut(auth).catch(() => {});
  };

  render() {
    const { displayName, email, role, isAdmin, saving, switching, loading, joinCode, joiningCoach, linkedCoachName } = this.state;
    const initials = (displayName || email || '?')[0].toUpperCase();
    const isCoach = role === 'coach';
    const canSwitchRole = isCoach || isAdmin;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Profile" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              {/* Avatar + role */}
              <View style={styles.avatarSection}>
                <View style={{width:60,height:60,borderRadius:30,backgroundColor:'#008000',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff',fontWeight:'bold',fontSize:24}}>{initials}</Text></View>
                <View style={[styles.roleBadge, isCoach && styles.roleBadgeCoach]}>
                  <MaterialIcons name={isCoach ? 'people' : 'person'} size={13} color={isCoach ? '#0D47A1' : '#008000'} />
                  <Text style={[styles.roleText, isCoach && styles.roleTextCoach]}>  {isCoach ? 'Coach' : 'Player'}</Text>
                </View>
              </View>

              {/* Email (read-only) */}
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

              {/* Save */}
              <TouchableOpacity
                style={[styles.btn, styles.btnGreen, saving && styles.btnDisabled]}
                onPress={this.saveChanges}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={styles.btnText}>Save Changes</Text>}
              </TouchableOpacity>

              {/* Change Password */}
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={this.changePassword}>
                <Text style={styles.btnOutlineText}>Change Password</Text>
              </TouchableOpacity>

              {/* Change Email */}
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={this.changeEmail}>
                <Text style={styles.btnOutlineText}>Change Email</Text>
              </TouchableOpacity>

              {/* Switch Role — coaches/admins only */}
              {canSwitchRole && (
                <TouchableOpacity
                  style={[styles.btn, styles.btnSwitch, switching && styles.btnDisabled]}
                  onPress={this.switchRole}
                  disabled={switching}
                >
                  {switching ? (
                    <ActivityIndicator size="small" color="#0D47A1" />
                  ) : (
                    <>
                      <MaterialIcons name={isCoach ? 'person' : 'people'} size={16} color="#0D47A1" />
                      <Text style={styles.btnSwitchText}>
                        {'  '}{isAdmin
                          ? `Switch to ${isCoach ? 'Player' : 'Coach'} Mode`
                          : 'Preview Player Mode'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Join a Coach — players only */}
              {!isCoach && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <MaterialIcons name="people" size={16} color="#008000" />{'  '}Join a Coach
                  </Text>
                  {linkedCoachName ? (
                    <View style={styles.linkedCoachBanner}>
                      <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                      <Text style={styles.linkedCoachText}>{'  '}Linked to {linkedCoachName}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.joinHint}>
                    Enter the 6-character code from your coach to join their roster instantly.
                  </Text>
                  <TextInput
                    style={styles.codeInput}
                    value={joinCode}
                    onChangeText={(t) => this.setState({ joinCode: t.toUpperCase() })}
                    placeholder="e.g. AB3X9Z"
                    placeholderTextColor="#aaa"
                    autoCapitalize="characters"
                    maxLength={6}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGreen, joiningCoach && styles.btnDisabled]}
                    onPress={this.joinCoach}
                    disabled={joiningCoach}
                  >
                    {joiningCoach
                      ? <ActivityIndicator size="small" color="white" />
                      : <Text style={styles.btnText}>Join Coach's Roster</Text>}
                  </TouchableOpacity>
                </View>
              )}

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
            </ScrollView>

            {/* Logout pinned at bottom — always visible */}
            <TouchableOpacity style={styles.logoutBar} onPress={this.logout}>
              <MaterialCommunityIcons name="logout" size={18} color="#D32F2F" />
              <Text style={styles.logoutText}>  Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  container: { padding: 20, paddingBottom: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e8f5e9', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 10,
  },
  roleBadgeCoach: { backgroundColor: '#E3F2FD' },
  roleText: { color: '#008000', fontWeight: 'bold', fontSize: 13 },
  roleTextCoach: { color: '#0D47A1' },
  field: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  fieldLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  fieldValue: { fontSize: 15, color: '#333' },
  input: { fontSize: 15, color: '#333', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 4 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12, elevation: 1 },
  btnGreen: { backgroundColor: '#008000' },
  btnOutline: { borderWidth: 2, borderColor: '#008000', backgroundColor: 'white' },
  btnSwitch: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#E3F2FD', borderWidth: 1.5, borderColor: '#0D47A1',
  },
  btnSwitchText: { color: '#0D47A1', fontWeight: 'bold', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  btnOutlineText: { color: '#008000', fontWeight: 'bold', fontSize: 15 },
  section: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 8, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  linkedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  linkedName: { fontSize: 14, color: '#333' },
  connectBtn: { borderWidth: 1, borderColor: '#008000', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  connectBtnText: { color: '#008000', fontWeight: '600', fontSize: 13 },
  // Pinned logout bar
  logoutBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  logoutText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 15 },
  // Join a coach
  joinHint: { fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 18 },
  codeInput: {
    borderWidth: 2, borderColor: '#008000', borderRadius: 12, padding: 14,
    fontSize: 22, fontWeight: '800', color: '#1B5E20', textAlign: 'center',
    letterSpacing: 6, marginBottom: 12, backgroundColor: '#F1F8E9',
  },
  linkedCoachBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9',
    borderRadius: 8, padding: 10, marginBottom: 10,
  },
  linkedCoachText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
});

export default ProfileScreen;
