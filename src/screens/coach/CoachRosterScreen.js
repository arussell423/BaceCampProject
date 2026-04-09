import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, TextInput, Alert, Modal, ActivityIndicator,
  RefreshControl, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../components/Firebase';
import {
  collection, doc, deleteDoc, writeBatch, serverTimestamp,
  updateDoc, onSnapshot,
} from 'firebase/firestore';

function evalDotColor(lastEvalDate) {
  if (!lastEvalDate) return '#F44336';
  const diff = (Date.now() - new Date(lastEvalDate).getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 1) return '#4CAF50';
  if (diff <= 7) return '#FF9800';
  return '#F44336';
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export class CoachRosterScreen extends Component {
  state = {
    players: [],
    pendingInvites: [],
    inviteEmail: '',
    showInviteModal: false,
    loading: true,
    refreshing: false,
  };

  componentDidMount() {
    this.subscribeRoster();
  }

  componentWillUnmount() {
    if (this._unsub) this._unsub();
  }

  subscribeRoster = () => {
    const user = auth.currentUser;
    if (!user) return;
    // Real-time listener — updates instantly when a player accepts invite
    this._unsub = onSnapshot(
      collection(db, 'playerRosters', user.uid, 'players'),
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const pendingInvites = all.filter((p) => p.invited);
        const players = all.filter((p) => !p.invited);
        this.setState({ players, pendingInvites, loading: false, refreshing: false });
      },
      () => this.setState({ loading: false, refreshing: false }),
    );
  };

  sendInvite = async () => {
    const { inviteEmail } = this.state;
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    const sanitizedEmail = trimmed.replace(/[.#$[\]]/g, '_');
    try {
      const batch = writeBatch(db);
      const linkRef = doc(collection(db, 'linkRequests'), String(Date.now()));
      batch.set(linkRef, {
        coachUid: user.uid,
        playerEmail: trimmed,
        status: 'pending',
        invitedAt: serverTimestamp(),
      });
      const rosterRef = doc(db, 'playerRosters', user.uid, 'players', sanitizedEmail);
      batch.set(rosterRef, {
        email: trimmed,
        name: trimmed,
        invited: true,
        invitedAt: serverTimestamp(),
      }, { merge: true });
      // playerCoach lookup — written by coach (has isCoach() permission)
      batch.set(doc(db, 'playerCoach', sanitizedEmail), { coachUid: user.uid }, { merge: true });
      await batch.commit();
      this.setState({ showInviteModal: false, inviteEmail: '' });
      Alert.alert('✅ Invite Sent', `An invite has been sent to ${trimmed}.\n\nThey will appear in your active roster as soon as they log into the app.`);
    } catch (e) {
      console.error('sendInvite error:', e?.code, e?.message, e);
      Alert.alert('Error', `Could not send invite.\n${e?.code || e?.message || 'Unknown error'}`);
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
              const sanitizedEmail = (player.email || player.id).replace(/[.#$[\]]/g, '_');
              const batch = writeBatch(db);
              batch.delete(doc(db, 'playerRosters', user.uid, 'players', player.id));
              batch.delete(doc(db, 'playerCoach', sanitizedEmail));
              await batch.commit();
              if (player.uid) {
                await updateDoc(doc(db, 'users', player.uid), { coachUid: null }).catch(() => {});
              }
            } catch (e) {
              Alert.alert('Error', 'Could not remove player.');
            }
          },
        },
      ]
    );
  };

  cancelInvite = (player) => {
    Alert.alert(
      'Cancel Invite',
      `Cancel the pending invite to ${player.email}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Invite',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
              const sanitizedEmail = (player.email || player.id).replace(/[.#$[\]]/g, '_');
              const batch = writeBatch(db);
              batch.delete(doc(db, 'playerRosters', user.uid, 'players', player.id));
              batch.delete(doc(db, 'playerCoach', sanitizedEmail));
              await batch.commit();
            } catch (e) {
              Alert.alert('Error', 'Could not cancel invite.');
            }
          },
        },
      ]
    );
  };

  render() {
    const { players, pendingInvites, inviteEmail, showInviteModal, loading, refreshing } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="My Players" homeScreen="CoachHomeScreen" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => this.setState({ refreshing: true })} />
            }
          >
            {/* ── Active Players ───────────────────────────── */}
            <Text style={styles.sectionHeader}>
              Active Players ({players.length})
            </Text>

            {players.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No active players yet.</Text>
                <Text style={styles.emptySubtext}>Tap + below to invite a player by email.</Text>
              </View>
            ) : players.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.playerCard}
                onPress={() => this.props.navigation.navigate('CoachPlayerDetailScreen', {
                  playerUid: player.uid || player.id,
                  playerEmail: player.email,
                  playerName: player.name || player.email,
                })}
              >
                <View style={[styles.dot, { backgroundColor: evalDotColor(player.lastEvalDate) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{player.name || player.email}</Text>
                  <Text style={styles.playerEmail}>{player.email}</Text>
                  {player.linkedAt ? (
                    <Text style={styles.linkedDate}>Joined {fmtDate(player.linkedAt)}</Text>
                  ) : null}
                  {player.lastEvalDate ? (
                    <Text style={styles.evalDate}>Last eval: {new Date(player.lastEvalDate).toLocaleDateString()}</Text>
                  ) : (
                    <Text style={[styles.evalDate, { color: '#F44336' }]}>No evaluations yet</Text>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                <TouchableOpacity onPress={() => this.removePlayer(player)} style={styles.removeBtn}>
                  <MaterialIcons name="close" size={18} color="#bbb" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* ── Pending Invites ──────────────────────────── */}
            {pendingInvites.length > 0 && (
              <View style={styles.pendingSection}>
                <Text style={styles.sectionHeader}>
                  Pending Invites ({pendingInvites.length})
                </Text>
                <Text style={styles.pendingHint}>
                  These players have been invited but haven't logged in yet.
                </Text>
                {pendingInvites.map((p) => (
                  <View key={p.id} style={styles.pendingCard}>
                    <MaterialIcons name="schedule" size={18} color="#FF9800" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pendingEmail}>{p.email}</Text>
                      {p.invitedAt ? (
                        <Text style={styles.pendingDate}>Invited {fmtDate(p.invitedAt)}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity onPress={() => this.cancelInvite(p)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => this.setState({ showInviteModal: true })}
        >
          <MaterialIcons name="person-add" size={26} color="white" />
        </TouchableOpacity>

        {/* Invite Modal */}
        <Modal visible={showInviteModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Invite Player</Text>
              <Text style={styles.modalSubtitle}>
                Enter the player's email. They'll be linked to your roster as soon as they log in.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Player email address"
                placeholderTextColor="#aaa"
                value={inviteEmail}
                onChangeText={(t) => this.setState({ inviteEmail: t })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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
  container: { padding: 16, paddingBottom: 100 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyBox: { alignItems: 'center', marginTop: 48, marginBottom: 24 },
  emptyText: { color: '#aaa', fontSize: 16, fontWeight: '600', marginTop: 10 },
  emptySubtext: { color: '#bbb', fontSize: 13, marginTop: 4, textAlign: 'center' },
  playerCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  playerName: { fontSize: 15, fontWeight: '600', color: '#222' },
  playerEmail: { fontSize: 12, color: '#aaa', marginTop: 2 },
  linkedDate: { fontSize: 11, color: '#4CAF50', marginTop: 2 },
  evalDate: { fontSize: 11, color: '#888', marginTop: 2 },
  removeBtn: { padding: 6, marginLeft: 4 },
  pendingSection: { marginTop: 8 },
  pendingHint: { fontSize: 12, color: '#888', marginBottom: 10 },
  pendingCard: {
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#FF9800',
  },
  pendingEmail: { fontSize: 14, fontWeight: '600', color: '#555' },
  pendingDate: { fontSize: 11, color: '#888', marginTop: 2 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#eee', borderRadius: 8 },
  cancelBtnText: { fontSize: 12, color: '#888' },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    backgroundColor: '#008000', borderRadius: 30, width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  modalInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#222', marginBottom: 16,
  },
  modalBtn: { backgroundColor: '#008000', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  modalBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: '#888', fontSize: 14 },
});

export default CoachRosterScreen;
