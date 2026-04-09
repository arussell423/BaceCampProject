import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Text, Image, ScrollView, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../components/Firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Coach access code — stored in Firestore at appConfig/settings.coachCode
// Falls back to env var or a default for first-time setup.
// The coach sets this once via Firebase console: appConfig/settings → { coachCode: "your-code" }
const DEFAULT_COACH_CODE = 'BACECAMP-COACH';

export class SelectProfileScreen extends Component {
  state = { saving: false, showCodeModal: false, codeInput: '', codeError: '' };

  componentWillUnmount() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
  }

  selectRole = async (role) => {
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ saving: true });
    try {
      await setDoc(doc(db, 'users', user.uid), {
        role,
        email: user.email,
        ...(user.displayName ? { displayName: user.displayName } : {}),
      }, { merge: true });
      this._saveTimeout = setTimeout(() => this.setState({ saving: false }), 5000);
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
      this.setState({ saving: false });
    }
  };

  handleCoachPress = () => {
    this.setState({ showCodeModal: true, codeInput: '', codeError: '' });
  };

  verifyCoachCode = async () => {
    const { codeInput } = this.state;
    if (!codeInput.trim()) {
      this.setState({ codeError: 'Please enter the coach access code.' });
      return;
    }
    try {
      // Fetch code from Firestore (coach can set it in Firebase console)
      const snap = await getDoc(doc(db, 'appConfig', 'settings'));
      const storedCode = snap.exists() ? (snap.data().coachCode || DEFAULT_COACH_CODE) : DEFAULT_COACH_CODE;
      if (codeInput.trim() === storedCode) {
        this.setState({ showCodeModal: false, codeInput: '', codeError: '' });
        this.selectRole('coach');
      } else {
        this.setState({ codeError: 'Incorrect access code. Contact your administrator.' });
      }
    } catch (e) {
      // If Firestore unreachable, fall back to default code
      if (codeInput.trim() === DEFAULT_COACH_CODE) {
        this.setState({ showCodeModal: false, codeInput: '', codeError: '' });
        this.selectRole('coach');
      } else {
        this.setState({ codeError: 'Incorrect access code.' });
      }
    }
  };

  render() {
    const { saving, showCodeModal, codeInput, codeError } = this.state;
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Image
          source={require('../assets/image/bACE_CAMP-logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>How will you use bACE CAMP?</Text>
        <Text style={styles.subtitle}>Choose your profile type to get started.</Text>

        {saving ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.cardsRow}>
            <TouchableOpacity style={styles.card} onPress={() => this.selectRole('player')}>
              <MaterialIcons name="person" size={60} color="#008000" />
              <Text style={styles.cardTitle}>Player</Text>
              <Text style={styles.cardDesc}>Track performance, training and wellness</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.card, styles.coachCard]} onPress={this.handleCoachPress}>
              <MaterialIcons name="people" size={60} color="#0D47A1" />
              <Text style={[styles.cardTitle, { color: '#0D47A1' }]}>Coach</Text>
              <Text style={styles.cardDesc}>Manage players, send training and feedback</Text>
              <View style={styles.codeBadge}>
                <MaterialIcons name="lock" size={10} color="#0D47A1" />
                <Text style={styles.codeBadgeText}> Access code required</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Coach access code modal */}
        <Modal visible={showCodeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <MaterialIcons name="lock" size={32} color="#0D47A1" style={{ marginBottom: 12 }} />
              <Text style={styles.modalTitle}>Coach Access Code</Text>
              <Text style={styles.modalSubtitle}>
                Enter the access code provided by the platform administrator.
              </Text>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter access code"
                placeholderTextColor="#aaa"
                value={codeInput}
                onChangeText={(t) => this.setState({ codeInput: t, codeError: '' })}
                autoCapitalize="characters"
                autoCorrect={false}
                secureTextEntry={false}
              />
              {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}
              <TouchableOpacity style={styles.modalBtn} onPress={this.verifyCoachCode}>
                <Text style={styles.modalBtnText}>Verify & Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => this.setState({ showCodeModal: false, codeInput: '', codeError: '' })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: '#F4F6FA',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  logo: { width: 120, height: 80, marginBottom: 24, resizeMode: 'contain' },
  title: { fontSize: 22, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 36, fontSize: 14 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  card: {
    flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 20,
    alignItems: 'center', marginHorizontal: 8, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  coachCard: { borderWidth: 1, borderColor: '#BBDEFB' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'center', color: '#222' },
  cardDesc: { color: '#888', textAlign: 'center', fontSize: 12, marginTop: 6 },
  codeBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  codeBadgeText: { fontSize: 9, color: '#0D47A1', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 18 },
  codeInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#222', width: '100%', marginBottom: 8,
    textAlign: 'center', letterSpacing: 2,
  },
  codeError: { color: '#e53935', fontSize: 12, marginBottom: 10, textAlign: 'center' },
  modalBtn: { backgroundColor: '#0D47A1', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', width: '100%', marginBottom: 10, marginTop: 6 },
  modalBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 8 },
  modalCancelText: { color: '#888', fontSize: 14 },
});

export default SelectProfileScreen;
