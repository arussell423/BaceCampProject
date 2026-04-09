import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator, Text, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../components/Firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export class CoachCalendarScreen extends Component {
  state = {
    players: [],
    selectedPlayer: null,
    events: [],
    selectedDate: '',
    newEventTitle: '',
    newEventType: 'Training',
    loading: true,
    addingEvent: false,
  };

  componentDidMount() {
    this.loadPlayers();
  }

  componentWillUnmount() {
    if (this._eventsUnsub) this._eventsUnsub();
  }

  loadPlayers = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'playerRosters', user.uid, 'players'));
      // Only show active (linked) players — exclude pending invites
      const players = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => !p.invited && p.uid);
      this.setState({ players, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  selectPlayer = (player) => {
    if (this._eventsUnsub) this._eventsUnsub();
    // Use the player's Firebase UID (not the sanitizedEmail doc ID)
    const uid = player.uid || player.id;
    this.setState({ selectedPlayer: player, events: [] });
    this._eventsUnsub = onSnapshot(
      query(collection(db, 'schedules', uid, 'events'), orderBy('date', 'asc'), limit(30)),
      (snap) => {
        const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.setState({ events });
      },
      () => {} // silently ignore permission errors
    );
  };

  deleteEvent = (ev) => {
    const { selectedPlayer } = this.state;
    if (!selectedPlayer) return;
    Alert.alert('Delete Event', `Remove "${ev.title}" from the schedule?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const uid = selectedPlayer.uid || selectedPlayer.id;
          try {
            await deleteDoc(doc(db, 'schedules', uid, 'events', ev.id));
          } catch (e) {
            Alert.alert('Error', 'Could not delete event.');
          }
        },
      },
    ]);
  };

  addEvent = async () => {
    const { selectedPlayer, selectedDate, newEventTitle, newEventType } = this.state;
    if (!selectedPlayer) {
      Alert.alert('Select Player', 'Please select a player first.');
      return;
    }
    if (!selectedDate.trim()) {
      Alert.alert('Select Date', 'Please enter a date (YYYY-MM-DD).');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate.trim())) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format (e.g. 2024-06-15).');
      return;
    }
    if (!newEventTitle.trim()) {
      Alert.alert('Event Title', 'Please enter an event title.');
      return;
    }
    const uid = selectedPlayer.uid || selectedPlayer.id;
    this.setState({ addingEvent: true });
    try {
      await addDoc(collection(db, 'schedules', uid, 'events'), {
        date: selectedDate.trim(),
        title: newEventTitle.trim(),
        type: newEventType,
        addedByCoach: true,
        timestamp: serverTimestamp(),
      });
      this.setState({ newEventTitle: '', selectedDate: '', addingEvent: false });
      Alert.alert('✅ Added', 'Event added to player schedule.');
    } catch (e) {
      Alert.alert('Error', 'Could not add event. Check your connection.');
      this.setState({ addingEvent: false });
    }
  };

  render() {
    const {
      players, selectedPlayer, events, selectedDate, newEventTitle,
      newEventType, loading, addingEvent,
    } = this.state;

    const EVENT_TYPES = ['Training', 'Match', 'Rest', 'Assessment'];
    const today = new Date().toISOString().split('T')[0];

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Schedule" homeScreen="CoachHomeScreen" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

            {/* Player picker */}
            <Text style={styles.sectionLabel}>Select Player</Text>
            {players.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialIcons name="people-outline" size={36} color="#ccc" />
                <Text style={styles.emptyText}>No active players on roster yet.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerBar}>
                {players.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerChip, selectedPlayer?.id === p.id && styles.playerChipActive]}
                    onPress={() => this.selectPlayer(p)}
                  >
                    <Text style={[styles.playerChipText, selectedPlayer?.id === p.id && styles.playerChipTextActive]}>
                      {p.name || p.email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedPlayer && (
              <>
                <Text style={styles.selectedLabel}>
                  Scheduling for: <Text style={{ color: '#008000', fontWeight: '700' }}>{selectedPlayer.name || selectedPlayer.email}</Text>
                </Text>

                {/* Add event form */}
                <View style={styles.addCard}>
                  <Text style={styles.addCardTitle}>Add Event</Text>

                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`YYYY-MM-DD  (today: ${today})`}
                    placeholderTextColor="#aaa"
                    value={selectedDate}
                    onChangeText={(t) => this.setState({ selectedDate: t })}
                    keyboardType="numbers-and-punctuation"
                  />

                  <Text style={styles.fieldLabel}>Event Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Speed Training Session"
                    placeholderTextColor="#aaa"
                    value={newEventTitle}
                    onChangeText={(t) => this.setState({ newEventTitle: t })}
                  />

                  <Text style={styles.fieldLabel}>Type</Text>
                  <View style={styles.typeRow}>
                    {EVENT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeChip, newEventType === type && styles.typeChipActive]}
                        onPress={() => this.setState({ newEventType: type })}
                      >
                        <Text style={[styles.typeChipText, newEventType === type && styles.typeChipTextActive]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.addBtn, addingEvent && styles.addBtnDisabled]}
                    onPress={this.addEvent}
                    disabled={addingEvent}
                  >
                    {addingEvent
                      ? <ActivityIndicator size="small" color="white" />
                      : <Text style={styles.addBtnText}>Add to Schedule</Text>}
                  </TouchableOpacity>
                </View>

                {/* Events list */}
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const upcoming = events.filter((ev) => ev.date >= today);
                  const past = events.filter((ev) => ev.date < today);
                  return (
                    <>
                      <Text style={styles.sectionLabel}>
                        Upcoming Events ({upcoming.length})
                      </Text>
                      {upcoming.length === 0 ? (
                        <Text style={styles.noEvents}>No upcoming events.</Text>
                      ) : (
                        upcoming.map((ev) => (
                          <View key={ev.id} style={[styles.eventItem, ev.addedByCoach && styles.eventItemCoach]}>
                            <View style={styles.eventDateBadge}>
                              <Text style={styles.eventDate}>{ev.date}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.eventTitle}>{ev.title}</Text>
                              <Text style={styles.eventType}>{ev.type}{ev.addedByCoach ? '  ·  Coach' : ''}</Text>
                            </View>
                            <TouchableOpacity onPress={() => this.deleteEvent(ev)} style={styles.deleteEventBtn}>
                              <MaterialIcons name="close" size={16} color="#bbb" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}

                      {past.length > 0 && (
                        <>
                          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
                            Past Events ({past.length})
                          </Text>
                          {past.slice().reverse().map((ev) => (
                            <View key={ev.id} style={[styles.eventItem, styles.eventItemPast]}>
                              <View style={[styles.eventDateBadge, { backgroundColor: '#eee' }]}>
                                <Text style={[styles.eventDate, { color: '#aaa' }]}>{ev.date}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.eventTitle, { color: '#aaa' }]}>{ev.title}</Text>
                                <Text style={styles.eventType}>{ev.type}</Text>
                              </View>
                              <TouchableOpacity onPress={() => this.deleteEvent(ev)} style={styles.deleteEventBtn}>
                                <MaterialIcons name="close" size={16} color="#ccc" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  container: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  playerBar: { marginBottom: 16 },
  playerChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: 'white',
  },
  playerChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  playerChipText: { fontSize: 13, color: '#555' },
  playerChipTextActive: { color: 'white', fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: '#aaa', fontSize: 14, marginTop: 8 },
  noEvents: { color: '#aaa', fontSize: 13, textAlign: 'center', marginVertical: 16 },
  selectedLabel: { fontSize: 14, color: '#555', marginBottom: 16 },
  addCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, elevation: 1, marginBottom: 20 },
  addCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#aaa', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#222', marginBottom: 14,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 8,
  },
  typeChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  typeChipText: { fontSize: 12, color: '#555' },
  typeChipTextActive: { color: 'white', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#008000', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  eventItem: {
    backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
  },
  eventItemCoach: { borderLeftWidth: 3, borderLeftColor: '#008000' },
  eventItemPast: { opacity: 0.55 },
  deleteEventBtn: { padding: 6, marginLeft: 4 },
  eventDateBadge: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 8, marginRight: 12 },
  eventDate: { fontSize: 12, color: '#008000', fontWeight: '600' },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  eventType: { fontSize: 12, color: '#aaa', marginTop: 2 },
});

export default CoachCalendarScreen;

