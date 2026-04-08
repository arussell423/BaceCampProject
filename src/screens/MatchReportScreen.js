import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert, Text, ActivityIndicator,
} from 'react-native';
import { auth, db } from '../components/Firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export class MatchReportScreen extends Component {
  state = {
    opponent: '',
    venue: '',
    myScore: '',
    oppScore: '',
    result: null,      // 'win' | 'loss' | 'draw'
    notes: '',
    gamePlan: '',
    loading: false,
    saved: false,
    pastReports: [],
    showPast: false,
  };

  componentDidMount() {
    this.loadPastReports();
  }

  loadPastReports = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'matchReports', user.uid, 'reports'), orderBy('timestamp', 'desc'), limit(10)));
      const pastReports = [];
      snap.forEach((doc) => pastReports.push({ id: doc.id, ...doc.data() }));
      this.setState({ pastReports });
    } catch (e) { /* offline */ }
  };

  submit = async () => {
    const { opponent, myScore, oppScore, result, notes, gamePlan } = this.state;
    if (!opponent.trim()) { Alert.alert('Opponent name required'); return; }
    if (!result) { Alert.alert('Please select a result (Win / Loss / Draw)'); return; }

    const user = auth.currentUser;
    if (!user) return;
    this.setState({ loading: true });

    try {
      await addDoc(collection(db, 'matchReports', user.uid, 'reports'), {
        opponent: opponent.trim(),
        myScore: myScore.trim(),
        oppScore: oppScore.trim(),
        result,
        notes: notes.trim(),
        gamePlan: gamePlan.trim(),
        timestamp: serverTimestamp(),
      });
      this.setState({
        loading: false, saved: true,
        opponent: '', myScore: '', oppScore: '', result: null, notes: '', gamePlan: '',
      });
      Alert.alert(' Match Report Saved!', 'Your report has been saved to your log.');
      this.loadPastReports();
    } catch (e) {
      this.setState({ loading: false });
      Alert.alert('Error', 'Could not save report. Check your connection.');
    }
  };

  render() {
    const { opponent, venue, myScore, oppScore, result, notes, gamePlan, loading, pastReports, showPast } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Match Report" homeScreen="HomeScreen" />

        {/* Toggle between new report and past reports */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, !showPast && styles.toggleBtnActive]}
            onPress={() => this.setState({ showPast: false })}
          >
            <Text style={[styles.toggleText, !showPast && styles.toggleTextActive]}>New Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, showPast && styles.toggleBtnActive]}
            onPress={() => this.setState({ showPast: true })}
          >
            <Text style={[styles.toggleText, showPast && styles.toggleTextActive]}>Past Reports</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {!showPast ? (
            <>
              <Text style={styles.sectionLabel}>Match Details</Text>

              <TextInput style={styles.input} placeholder="Opponent name" value={opponent} onChangeText={(t) => this.setState({ opponent: t })} />
              <TextInput style={styles.input} placeholder="Venue (optional)" value={venue} onChangeText={(t) => this.setState({ venue: t })} />

              <View style={styles.scoreRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Your Score</Text>
                  <TextInput style={styles.input} placeholder="e.g. 6-4, 7-5" value={myScore} onChangeText={(t) => this.setState({ myScore: t })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Opponent Score</Text>
                  <TextInput style={styles.input} placeholder="e.g. 4-6, 5-7" value={oppScore} onChangeText={(t) => this.setState({ oppScore: t })} />
                </View>
              </View>

              <Text style={styles.sectionLabel}>Result</Text>
              <View style={styles.resultRow}>
                {['win', 'loss', 'draw'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.resultChip,
                      r === 'win' && result === 'win' && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
                      r === 'loss' && result === 'loss' && { backgroundColor: '#F44336', borderColor: '#F44336' },
                      r === 'draw' && result === 'draw' && { backgroundColor: '#FF9800', borderColor: '#FF9800' },
                    ]}
                    onPress={() => this.setState({ result: r })}
                  >
                    <Text style={[styles.resultText, result === r && { color: 'white' }]}>
                      {r === 'win' ? 'Win' : r === 'loss' ? 'Loss' : 'Draw'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Match notes — what went well? What to improve?"
                multiline numberOfLines={4}
                value={notes}
                onChangeText={(t) => this.setState({ notes: t })}
              />

              <Text style={styles.sectionLabel}>Game Plan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Game plan for next match vs this opponent..."
                multiline numberOfLines={4}
                value={gamePlan}
                onChangeText={(t) => this.setState({ gamePlan: t })}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 20, paddingVertical: 12, alignItems: 'center' }]}
                onPress={this.submit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save Match Report</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Past Match Reports</Text>
              {pastReports.length === 0 ? (
                <Text style={{ color: 'grey', textAlign: 'center', paddingTop: 30 }}>No reports yet.</Text>
              ) : (
                pastReports.map((r) => (
                  <View key={r.id} style={styles.pastCard}>
                    <View style={styles.pastRow}>
                      <Text style={styles.pastOpponent}>vs {r.opponent}</Text>
                      <View style={[styles.resultDot,
                        r.result === 'win' && { backgroundColor: '#4CAF50' },
                        r.result === 'loss' && { backgroundColor: '#F44336' },
                        r.result === 'draw' && { backgroundColor: '#FF9800' },
                      ]}>
                        <Text style={styles.resultDotText}>{r.result?.toUpperCase()}</Text>
                      </View>
                    </View>
                    {(r.myScore || r.oppScore) && (
                      <Text style={styles.pastScore}>{r.myScore} — {r.oppScore}</Text>
                    )}
                    {r.notes ? <Text style={styles.pastNotes}>{r.notes}</Text> : null}
                    {r.timestamp && (
                      <Text style={styles.pastDate}>{r.timestamp.toDate?.()?.toLocaleDateString?.() || ''}</Text>
                    )}
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  toggleBtnActive: { borderBottomColor: '#008000' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#888' },
  toggleTextActive: { color: '#008000' },
  container: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8, marginTop: 16 },
  inputLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: 'white', marginBottom: 8 },
  textArea: { height: 100, textAlignVertical: 'top' },
  scoreRow: { flexDirection: 'row' },
  resultRow: { flexDirection: 'row', marginBottom: 8 },
  resultChip: { flex: 1, borderWidth: 2, borderColor: '#ddd', borderRadius: 10, padding: 10, marginRight: 8, alignItems: 'center' },
  resultText: { fontWeight: '600', color: '#555', fontSize: 13 },
  saveBtn: { backgroundColor: '#008000', borderRadius: 12 },
  pastCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  pastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pastOpponent: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  resultDot: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  resultDotText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  pastScore: { color: '#555', fontSize: 13, marginBottom: 4 },
  pastNotes: { color: 'grey', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  pastDate: { color: '#bbb', fontSize: 11, marginTop: 6, textAlign: 'right' },
});

export default MatchReportScreen;
