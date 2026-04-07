import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, TextInput, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { auth, db } from '../../components/Firebase';
import { collection, getDocs, doc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

function evalDotColor(lastEvalDate) {
  if (!lastEvalDate) return '#F44336';
  const diff = (Date.now() - new Date(lastEvalDate).getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 1) return '#4CAF50';
  if (diff <= 7) return '#FF9800';
  return '#F44336';
}

export class CoachRosterScreen extends Component {
  state = {
    players: [],
    pendingInvites: [],
    inviteEmail: '',
    showInviteModal: false,
    loading: true,
  };

  componentDidMount() {
    this.loadRoster();
  }

  loadRoster = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'playerRosters', user.uid, 'players'));

      const players = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pendingInvites = players.filter((p) => p.invited);
      const activePlayers = players.filter((p) => !p.invited);

      this.setState({ players: activePlayers, pendingInvites, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  sendInvite = async () => {
    const { inviteEmail } = this.state;
    if (!inviteEmail.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    const sanitizedEmail = inviteEmail.trim().replace(/[.#$[\]]/g, '_');
    try {
      const batch = writeBatch(db);
      const linkRef = doc(collection(db, 'linkRequests'), String(Date.now()));
      batch.set(linkRef, {
        coachUid: user.uid,
        playerEmail: inviteEmail.trim(),
        status: 'pending',
      });
      const rosterRef = doc(db, 'playerRosters', user.uid, 'players', sanitizedEmail);
      batch.set(rosterRef, {
        email: inviteEmail.trim(),
        name: inviteEmail.trim(),
        invited: true,
        timestamp: serverTimestamp(),
      });
      // Allow player-to-coach push notification lookup
      const playerCoachRef = doc(db, 'playerCoach', sanitizedEmail);
      batch.set(playerCoachRef, { coachUid: user.uid }, { merge: true });
      await batch.commit();
      this.setState({ showInviteModal: false, inviteEmail: '' });
      Alert.alert('Invite Sent', `Invite sent to ${inviteEmail}`);
      this.loadRoster();
    } catch (e) {
      Alert.alert('Error', 'Could not send invite.');
    }
  };

  removePlayer = (player) => {
    Alert.alert(
      'Remove Player',
      `Remove ${player.name || player.email} from your roster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
              await deleteDoc(doc(db, 'playerRosters', user.uid, 'players', player.id));
              this.loadRoster();
            } catch (e) {
              Alert.alert('Error', 'Could not remove player.');
            }
          },
        },
      ]
    );
  };

  render() {
    const { players, pendingInvites, inviteEmail, showInviteModal, loading } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="My Players" homeScreen="CoachHomeScreen" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.container}>
            {players.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No players yet. Invite your first player!</Text>
              </View>
            )}

            {players.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.playerCard}
                onPress={() => this.props.navigation.navigate('CoachPlayerDetailScreen', {
                  playerUid: player.uid || player.id,
                  playerEmail: player.email,
                })}
              >
                <View style={[styles.dot, { backgroundColor: evalDotColor(player.lastEvalDate) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{player.name || player.email}</Text>
                  <Text style={styles.playerEmail}>{player.email}</Text>
                  {player.lastEvalDate && (
                    <Text style={styles.evalDate}>
                      Last eval: {new Date(player.lastEvalDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => this.removePlayer(player)} style={styles.removeBtn}>
                  <Icon name="close" type="material" size={18} color="#aaa" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {pendingInvites.length > 0 && (
              <View style={styles.pendingSection}>
                <Text style={styles.pendingTitle}>Pending Invites</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {pendingInvites.map((p) => (
                    <View key={p.id} style={styles.pendingChip}>
                      <Text style={styles.pendingChipText}>{p.email}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => this.setState({ showInviteModal: true })}
        >
          <Icon name="person-add" type="material" color="white" size={26} />
        </TouchableOpacity>

        {/* Invite Modal */}
        <Modal visible={showInviteModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Invite Player</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Player email address"
                placeholderTextColor="#aaa"
                value={inviteEmail}
                onChangeText={(t) => this.setState({ inviteEmail: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.modalBtn} onPress={this.sendInvite}>
                <Text style={styles.modalBtnText}>Send Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => this.setState({ showInviteModal: false, inviteEmail: '' })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  container: { padding: 16, paddingBottom: 100 },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#aaa', fontSize: 15 },
  playerCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  playerName: { fontSize: 15, fontWeight: '600', color: '#222' },
  playerEmail: { fontSize: 12, color: '#aaa', marginTop: 2 },
  evalDate: { fontSize: 11, color: '#888', marginTop: 2 },
  removeBtn: { padding: 6 },
  pendingSection: { marginTop: 16 },
  pendingTitle: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8 },
  pendingChip: {
    backgroundColor: '#eee', borderRadius: 16, paddingHorizontal: 14,
    paddingVertical: 7, marginRight: 8,
  },
  pendingChipText: { color: '#666', fontSize: 12 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    backgroundColor: '#008000', borderRadius: 30, width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  modalInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#222', marginBottom: 16,
  },
  modalBtn: {
    backgroundColor: '#008000', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 10,
  },
  modalBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: '#888', fontSize: 14 },
});

export default CoachRosterScreen;
