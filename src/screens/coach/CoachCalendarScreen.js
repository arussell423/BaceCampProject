import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator, Text,
} from 'react-native';
import { auth, db } from '../../components/Firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export class CoachCalendarScreen extends Component {
  state = {
    players: [],
    selectedPlayerUid: null,
    selectedPlayerEmail: '',
    events: [],
    selectedDate: '',
    showAddModal: false,
    newEventTitle: '',
    newEventType: 'Training',
    loading: true,
    addingEvent: false,
  };

  componentDidMount() {
    this.loadPlayers();
  }

  loadPlayers = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'playerRosters', user.uid, 'players'));
      const players = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      this.setState({ players, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  selectPlayer = (player) => {
    this.setState({
      selectedPlayerUid: player.id,
      selectedPlayerEmail: player.email,
      events: [],
    }, () => this.loadEvents(player.id));
  };

  loadEvents = async (playerUid) => {
    try {
      const snap = await getDocs(query(collection(db, 'schedules', playerUid, 'events'), orderBy('date', 'desc'), limit(20)));
      const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      this.setState({ events });
    } catch (e) {
      // silently fail
    }
  };

  addEvent = async () => {
    const { selectedPlayerUid, selectedDate, newEventTitle, newEventType } = this.state;
    if (!selectedPlayerUid) {
      Alert.alert('Select Player', 'Please select a player first.');
      return;
    }
    if (!selectedDate.trim()) {
      Alert.alert('Select Date', 'Please enter a date.');
      return;
    }
    if (!newEventTitle.trim()) {
      Alert.alert('Event Title', 'Please enter an event title.');
      return;
    }
    this.setState({ addingEvent: true });
    try {
      await addDoc(collection(db, 'schedules', selectedPlayerUid, 'events'), {
        date: selectedDate.trim(),
        title: newEventTitle.trim(),
        type: newEventType,
        timestamp: serverTimestamp(),
      });
      this.setState({ newEventTitle: '', addingEvent: false });
      Alert.alert('Added', 'Event added to player schedule.');
      this.loadEvents(selectedPlayerUid);
    } catch (e) {
      Alert.alert('Error', 'Could not add event.');
      this.setState({ addingEvent: false });
    }
  };

  render() {
    const {
      players, selectedPlayerUid, selectedPlayerEmail,
      events, selectedDate, newEventTitle, newEventType,
      loading, addingEvent,
    } = this.state;

    const EVENT_TYPES = ['Training', 'Match', 'Rest', 'Assessment'];

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Calendar" homeScreen="CoachHomeScreen" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.container}>
            {/* Player picker */}
            <Text style={styles.sectionLabel}>Select Player</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerBar}>
              {players.length === 0 ? (
                <Text style={styles.emptyText}>No players on roster.</Text>
              ) : (
                players.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerChip, selectedPlayerUid === p.id && styles.playerChipActive]}
                    onPress={() => this.selectPlayer(p)}
                  >
                    <Text style={[styles.playerChipText, selectedPlayerUid === p.id && styles.playerChipTextActive]}>
                      {p.name || p.email}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {selectedPlayerUid && (
              <>
                <Text style={styles.selectedLabel}>
                  Scheduling for: <Text style={{ color: '#008000' }}>{selectedPlayerEmail}</Text>
                </Text>

                {/* Add event form */}
                <View style={styles.addCard}>
                  <Text style={styles.addCardTitle}>Add Event</Text>

                  <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2024-01-15"
                    placeholderTextColor="#aaa"
                    value={selectedDate}
                    onChangeText={(t) => this.setState({ selectedDate: t })}
                  />

                  <Text style={styles.fieldLabel}>Event Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Speed Training Session"
                    placeholderTextColor="#aaa"
                    value={newEventTitle}
                    onChangeText={(t) => this.setState({ newEventTitle: t })}
                  />

                  <Text style={styles.fieldLabel}>Event Type</Text>
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
                {events.length > 0 && (
                  <View style={styles.eventsList}>
                    <Text style={styles.sectionLabel}>Upcoming Events</Text>
                    {events.map((ev) => (
                      <View key={ev.id} style={styles.eventItem}>
                        <View style={styles.eventDateBadge}>
                          <Text style={styles.eventDate}>{ev.date}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.eventTitle}>{ev.title}</Text>
                          <Text style={styles.eventType}>{ev.type}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: 'white', elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  container: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  playerBar: { marginBottom: 16 },
  playerChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: 'white',
  },
  playerChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  playerChipText: { fontSize: 13, color: '#555' },
  playerChipTextActive: { color: 'white', fontWeight: 'bold' },
  emptyText: { color: '#aaa', fontSize: 14 },
  selectedLabel: { fontSize: 14, color: '#555', marginBottom: 16 },
  addCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, elevation: 1, marginBottom: 16,
  },
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
  addBtn: {
    backgroundColor: '#008000', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  eventsList: { marginTop: 8 },
  eventItem: {
    backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', elevation: 1,
  },
  eventDateBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 8, padding: 8, marginRight: 12,
  },
  eventDate: { fontSize: 12, color: '#008000', fontWeight: '600' },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  eventType: { fontSize: 12, color: '#aaa', marginTop: 2 },
});

export default CoachCalendarScreen;
