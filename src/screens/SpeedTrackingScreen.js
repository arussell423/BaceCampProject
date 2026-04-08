import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Alert, FlatList, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../components/Firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const DRILLS = ['5m Sprint', '10m Sprint', '20m Shuttle', 'T-Drill', 'Cone Drill'];

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

export class SpeedTrackingScreen extends Component {
  state = {
    running: false,
    timeMs: 0,
    selectedDrill: '5m Sprint',
    history: [],
    personalBests: {},
    savePrompt: false,
    lastTime: 0,
  };

  componentDidMount() {
    this.loadHistory();
  }

  componentWillUnmount() {
    if (this._interval) clearInterval(this._interval);
  }

  start = () => {
    this._startTime = Date.now() - this.state.timeMs;
    this._interval = setInterval(() => {
      this.setState({ timeMs: Date.now() - this._startTime });
    }, 10);
    this.setState({ running: true });
  };

  stop = () => {
    clearInterval(this._interval);
    const { timeMs } = this.state;
    this.setState({ running: false, lastTime: timeMs });
    const displayTime = formatTime(timeMs);
    Alert.alert(
      'Save this time?',
      displayTime,
      [
        { text: 'Save', onPress: () => this.saveResult(timeMs, displayTime) },
        { text: 'Discard', onPress: this.reset },
      ]
    );
  };

  reset = () => {
    clearInterval(this._interval);
    this.setState({ running: false, timeMs: 0, savePrompt: false, lastTime: 0 });
  };

  saveResult = async (timeMs, displayTime) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await addDoc(collection(db, 'speedDrills', user.uid, 'results'), {
        drillName: this.state.selectedDrill,
        timeMs,
        displayTime,
        timestamp: serverTimestamp(),
      });
      this.reset();
      this.loadHistory();
    } catch (e) {
      Alert.alert('Error', 'Could not save result.');
      this.reset();
    }
  };

  loadHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(query(
        collection(db, 'speedDrills', user.uid, 'results'),
        where('drillName', '==', this.state.selectedDrill),
        orderBy('timestamp', 'desc'),
        limit(10)
      ));
      const history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Compute personal bests
      const { personalBests } = this.state;
      const drill = this.state.selectedDrill;
      const best = history.reduce((min, h) => (h.timeMs < min ? h.timeMs : min), Infinity);
      this.setState({
        history,
        personalBests: { ...personalBests, [drill]: best === Infinity ? null : best },
      });
    } catch (e) {
      // silently fail
    }
  };

  selectDrill = (drill) => {
    this.setState({ selectedDrill: drill, history: [] }, this.loadHistory);
  };

  render() {
    const { running, timeMs, selectedDrill, history, personalBests } = this.state;
    const pb = personalBests[selectedDrill];

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Speed Drills" homeScreen="HomeScreen" />

        {/* Drill selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.drillBar}>
          {DRILLS.map((drill) => (
            <TouchableOpacity
              key={drill}
              style={[styles.drillChip, selectedDrill === drill && styles.drillChipActive]}
              onPress={() => this.selectDrill(drill)}
            >
              <Text style={[styles.drillLabel, selectedDrill === drill && styles.drillLabelActive]}>
                {drill}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Timer display */}
          <View style={styles.timerCard}>
            <Text style={styles.timerText}>{formatTime(timeMs)}</Text>
            {pb !== null && pb !== undefined && (
              <Text style={styles.pbText}> PB: {formatTime(pb)}</Text>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controlRow}>
            {!running ? (
              <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlStart]} onPress={this.start}>
                <MaterialIcons name="play-arrow" size={28} color="white" />
                <Text style={styles.ctrlText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlStop]} onPress={this.stop}>
                <MaterialIcons name="stop" size={28} color="white" />
                <Text style={styles.ctrlText}>Stop</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.ctrlBtn, styles.ctrlReset]} onPress={this.reset}>
              <MaterialIcons name="refresh" size={28} color="#555" />
              <Text style={[styles.ctrlText, { color: '#555' }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Recent {selectedDrill} Times</Text>
              {history.map((item, idx) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyRank}>#{idx + 1}</Text>
                  <Text style={styles.historyTime}>{item.displayTime}</Text>
                  <Text style={styles.historyDate}>
                    {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString() : '—'}
                  </Text>
                  {idx === 0 && pb === item.timeMs && (
                    <Text style={styles.pbBadge}> PB</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
  drillBar: {
    backgroundColor: 'white', paddingHorizontal: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  drillChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F4F6FA',
  },
  drillChipActive: { backgroundColor: '#F44336', borderColor: '#F44336' },
  drillLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  drillLabelActive: { color: 'white', fontWeight: 'bold' },
  container: { padding: 20, paddingBottom: 40 },
  timerCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 32,
    alignItems: 'center', marginBottom: 24, elevation: 2,
  },
  timerText: { fontSize: 56, fontWeight: 'bold', color: '#222', fontVariant: ['tabular-nums'] },
  pbText: { fontSize: 14, color: '#F44336', marginTop: 8, fontWeight: '600' },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  ctrlBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28,
    paddingVertical: 14, borderRadius: 14, elevation: 2,
  },
  ctrlStart: { backgroundColor: '#008000' },
  ctrlStop: { backgroundColor: '#F44336' },
  ctrlReset: { backgroundColor: '#eee' },
  ctrlText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 6 },
  historySection: { backgroundColor: 'white', borderRadius: 14, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  historyRank: { width: 28, fontSize: 13, color: '#aaa', fontWeight: '600' },
  historyTime: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#222' },
  historyDate: { fontSize: 12, color: '#aaa' },
  pbBadge: { fontSize: 12, marginLeft: 8, color: '#F44336', fontWeight: 'bold' },
});

export default SpeedTrackingScreen;
