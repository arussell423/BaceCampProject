import React, { Component } from 'react';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { db } from '../../components/Firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const TABS = ['Performance', 'Training', 'History'];

const MetricBar = ({ label, score, colour }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.barBackground}>
      <View style={[styles.barFill, { width: `${score}%`, backgroundColor: colour }]} />
    </View>
    <Text style={[styles.metricScore, { color: colour }]}>{score}</Text>
  </View>
);

export class CoachPlayerDetailScreen extends Component {
  state = {
    activeTab: 0,
    evaluations: [],
    trainingPlans: [],
    loading: true,
    perfScores: { Speed: 0, Strength: 0, Power: 0 },
  };

  componentDidMount() {
    this.loadData();
  }

  get playerUid() {
    return this.props.route?.params?.playerUid ?? '';
  }

  get playerEmail() {
    return this.props.route?.params?.playerEmail ?? '';
  }

  loadData = async () => {
    const { playerUid } = this;
    if (!playerUid) return;
    try {
      const [evalSnap, trainingSnap] = await Promise.all([
        getDocs(query(collection(db, 'evaluations', playerUid, 'sessions'), orderBy('timestamp', 'desc'), limit(10))),
        getDocs(query(collection(db, 'coachTraining', playerUid, 'sessions'), orderBy('timestamp', 'desc'), limit(10))),
      ]);

      const evaluations = evalSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const trainingPlans = trainingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Compute perf scores from latest eval
      let perfScores = { Speed: 0, Strength: 0, Power: 0 };
      const physEval = evaluations.find((e) => e.section === 'physical');
      if (physEval && physEval.data) {
        const p = physEval.data;
        perfScores = {
          Speed: Math.round(((p.speed || 0) / 5) * 100),
          Strength: Math.round(((p.strength || 0) / 5) * 100),
          Power: Math.round(((p.power || 0) / 5) * 100),
        };
      }

      this.setState({ evaluations, trainingPlans, perfScores, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  renderPerformance() {
    const { perfScores, evaluations } = this.state;
    const hasData = evaluations.length > 0;
    return (
      <View style={styles.tabContent}>
        {!hasData ? (
          <Text style={styles.emptyText}>No evaluation data yet for this player.</Text>
        ) : (
          <View style={styles.metricsCard}>
            <Text style={styles.metricsTitle}>Performance Metrics</Text>
            {Object.entries(perfScores).map(([key, val]) => (
              <MetricBar key={key} label={key} score={val} colour="#008000" />
            ))}
          </View>
        )}
      </View>
    );
  }

  renderTraining() {
    const { trainingPlans } = this.state;
    return (
      <View style={styles.tabContent}>
        {trainingPlans.length === 0 ? (
          <Text style={styles.emptyText}>No coach-assigned training yet.</Text>
        ) : (
          trainingPlans.map((tp) => (
            <View key={tp.id} style={styles.trainingCard}>
              <View style={styles.trainingHeader}>
                <Text style={styles.trainingTitle}>{tp.title}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{tp.category}</Text>
                </View>
              </View>
              <Text style={styles.trainingDesc}>{tp.description}</Text>
              {tp.videoUrl ? (
                <Text style={styles.videoUrl}>[Video] {tp.videoUrl}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    );
  }

  renderHistory() {
    const { evaluations } = this.state;
    return (
      <View style={styles.tabContent}>
        {evaluations.length === 0 ? (
          <Text style={styles.emptyText}>No evaluation history yet.</Text>
        ) : (
          evaluations.map((ev) => (
            <View key={ev.id} style={styles.historyItem}>
              <Text style={styles.historySection}>{ev.section || 'Session'}</Text>
              <Text style={styles.historyDate}>
                {ev.timestamp ? ev.timestamp.toDate().toLocaleDateString() : '—'}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  }

  render() {
    const { activeTab, loading } = this.state;
    const { playerEmail } = this;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Icon name="arrow-back" type="material" color="#008000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{playerEmail || 'Player'}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, activeTab === idx && styles.tabChipActive]}
              onPress={() => this.setState({ activeTab: idx })}
            >
              <Text style={[styles.tabLabel, activeTab === idx && styles.tabLabelActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {activeTab === 0 && this.renderPerformance()}
            {activeTab === 1 && this.renderTraining()}
            {activeTab === 2 && this.renderHistory()}
          </ScrollView>
        )}

        {/* Floating action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
            onPress={() => this.props.navigation.navigate('CoachSendFeedbackScreen', {
              playerUid: this.playerUid,
              playerEmail: this.playerEmail,
            })}
          >
            <Icon name="feedback" type="material" color="white" size={18} />
            <Text style={styles.actionBtnText}>Send Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#008000' }]}
            onPress={() => this.props.navigation.navigate('CoachAddTrainingScreen', {
              playerUid: this.playerUid,
              playerEmail: this.playerEmail,
            })}
          >
            <Icon name="fitness-center" type="material" color="white" size={18} />
            <Text style={styles.actionBtnText}>Add Training</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', flex: 1, textAlign: 'center' },
  tabBar: {
    flexDirection: 'row', backgroundColor: 'white',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  tabChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, marginHorizontal: 4, borderWidth: 1, borderColor: '#ddd',
  },
  tabChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  tabLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  tabLabelActive: { color: 'white', fontWeight: 'bold' },
  tabContent: { padding: 16 },
  metricsCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, elevation: 1 },
  metricsTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metricLabel: { width: 80, fontSize: 13, color: '#444' },
  barBackground: { flex: 1, height: 10, backgroundColor: '#eee', borderRadius: 5, marginHorizontal: 8 },
  barFill: { height: 10, borderRadius: 5 },
  metricScore: { width: 30, textAlign: 'right', fontWeight: 'bold', fontSize: 13 },
  emptyText: { color: '#aaa', fontSize: 15, textAlign: 'center', marginTop: 40 },
  trainingCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1,
  },
  trainingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trainingTitle: { fontSize: 15, fontWeight: '600', color: '#222', flex: 1 },
  categoryBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  categoryBadgeText: { color: '#008000', fontSize: 11, fontWeight: '600' },
  trainingDesc: { fontSize: 13, color: '#555', lineHeight: 19 },
  videoUrl: { fontSize: 12, color: '#2196F3', marginTop: 8 },
  historyItem: {
    backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', elevation: 1,
  },
  historySection: { fontSize: 14, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  historyDate: { fontSize: 12, color: '#aaa' },
  actionRow: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, backgroundColor: 'white',
    borderTopWidth: 1, borderTopColor: '#eee', elevation: 4,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12, marginHorizontal: 6,
  },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },
});

export default CoachPlayerDetailScreen;
