import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator, Text,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../components/Firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const SORT_OPTIONS = ['Performance', 'Wellness', 'Name'];

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

const MetricBar = ({ score, colour, maxWidth }) => (
  <View style={[dbStyles.barBg, { width: maxWidth || '100%' }]}>
    <View style={[dbStyles.barFill, { width: `${score}%`, backgroundColor: colour }]} />
  </View>
);

export class CoachDashboardScreen extends Component {
  state = {
    players: [],
    loading: true,
    sortBy: 'Performance',
  };

  componentDidMount() {
    this.loadPlayers();
  }

  loadPlayers = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'playerRosters', user.uid, 'players'));

      const players = await Promise.all(snap.docs.map(async (playerDoc) => {
        const p = { id: playerDoc.id, ...playerDoc.data() };
        // Use Firebase UID if the player has linked; fall back to doc ID (sanitized email)
        const lookupId = p.uid || playerDoc.id;
        try {
          const evalSnap = await getDocs(query(collection(db, 'evaluations', lookupId, 'sessions'), orderBy('timestamp', 'desc'), limit(5)));

          const evals = evalSnap.docs.map((d) => d.data());
          const physEval = evals.find((e) => e.section === 'physical');
          const mentalEval = evals.find((e) => e.section === 'mental');

          let perfScore = 0;
          let wellnessScore = 0;

          if (physEval && physEval.data) {
            const d = physEval.data;
            perfScore = Math.round(
              (((d.speed || 0) + (d.strength || 0) + (d.power || 0)) / 15) * 100
            );
          }
          if (mentalEval && mentalEval.data) {
            const d = mentalEval.data;
            wellnessScore = Math.round(
              (((d.attitude || 0) + (d.effort || 0) + (d.nerves || 0)) / 30) * 100
            );
          }

          const lastEval = evals[0];
          const lastEvalDate = lastEval && lastEval.timestamp
            ? lastEval.timestamp.toDate().toISOString()
            : null;

          return { ...p, perfScore, wellnessScore, lastEvalDate };
        } catch (e) {
          return { ...p, perfScore: 0, wellnessScore: 0, lastEvalDate: null };
        }
      }));

      this.setState({ players, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  sortedPlayers() {
    const { players, sortBy } = this.state;
    return [...players].sort((a, b) => {
      if (sortBy === 'Performance') return b.perfScore - a.perfScore;
      if (sortBy === 'Wellness') return b.wellnessScore - a.wellnessScore;
      return (a.name || a.email || '').localeCompare(b.name || b.email || '');
    });
  }

  render() {
    const { loading, sortBy } = this.state;
    const sorted = this.sortedPlayers();

    return (
      <SafeAreaView style={dbStyles.safeArea}>
        <View style={dbStyles.headerBar}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#008000" />
          </TouchableOpacity>
          <Text style={dbStyles.headerTitle}>Team Dashboard</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Sort bar */}
        <View style={dbStyles.sortBar}>
          <Text style={dbStyles.sortLabel}>Sort: </Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[dbStyles.sortChip, sortBy === opt && dbStyles.sortChipActive]}
              onPress={() => this.setState({ sortBy: opt })}
            >
              <Text style={[dbStyles.sortChipText, sortBy === opt && dbStyles.sortChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={dbStyles.container}>
            {sorted.length === 0 && (
              <Text style={dbStyles.emptyText}>No players on roster yet.</Text>
            )}
            {sorted.map((player) => {
              const stale = daysSince(player.lastEvalDate) > 7;
              return (
                <TouchableOpacity
                  key={player.id}
                  style={dbStyles.playerCard}
                  onPress={() => this.props.navigation.navigate('CoachPlayerDetailScreen', {
                    playerUid: player.uid || player.id,
                    playerEmail: player.email,
                  })}
                >
                  <View style={dbStyles.playerHeader}>
                    {stale && <MaterialCommunityIcons name="alert-outline" size={16} color="#E65100" style={{ marginRight: 6 }} />}
                    <Text style={dbStyles.playerName}>{player.name || player.email}</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                  </View>

                  <View style={dbStyles.metricsRow}>
                    <View style={dbStyles.metricItem}>
                      <Text style={dbStyles.metricLabel}>Perf</Text>
                      <MetricBar score={player.perfScore} colour="#008000" />
                      <Text style={[dbStyles.metricNum, { color: '#008000' }]}>{player.perfScore}</Text>
                    </View>
                    <View style={dbStyles.metricItem}>
                      <Text style={dbStyles.metricLabel}>Wellness</Text>
                      <MetricBar score={player.wellnessScore} colour="#2196F3" />
                      <Text style={[dbStyles.metricNum, { color: '#2196F3' }]}>{player.wellnessScore}</Text>
                    </View>
                  </View>

                  {player.lastEvalDate && (
                    <Text style={dbStyles.lastEvalText}>
                      Last eval: {new Date(player.lastEvalDate).toLocaleDateString()}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}

const dbStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: 'white', elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  sortBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  sortLabel: { fontSize: 13, color: '#888', marginRight: 8 },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#ddd', marginRight: 8,
  },
  sortChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  sortChipText: { fontSize: 12, color: '#555' },
  sortChipTextActive: { color: 'white', fontWeight: 'bold' },
  container: { padding: 16, paddingBottom: 40 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 15 },
  playerCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16,
    marginBottom: 12, elevation: 1,
  },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  playerName: { fontSize: 15, fontWeight: '600', color: '#222' },
  metricsRow: { flexDirection: 'row' },
  metricItem: { flex: 1, marginHorizontal: 4 },
  metricLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  barBg: { height: 8, backgroundColor: '#eee', borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  metricNum: { fontSize: 12, fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
  lastEvalText: { fontSize: 11, color: '#aaa', marginTop: 10 },
});

export default CoachDashboardScreen;
