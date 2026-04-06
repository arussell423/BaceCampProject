import React, { Component } from 'react';
import {
  View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { auth, db } from '../components/Firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const PERF_CATEGORIES = ['Speed', 'Strength', 'Power'];
const WELLNESS_CATEGORIES = ['Attitude', 'Effort', 'Nerves'];

const MetricBar = ({ label, score, colour }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.barBackground}>
      <View style={[styles.barFill, { width: `${score}%`, backgroundColor: colour }]} />
    </View>
    <Text style={[styles.metricScore, { color: colour }]}>{score}</Text>
  </View>
);

export class DashboardScreen extends Component {
  state = {
    loading: true,
    performance: { Speed: 0, Strength: 0, Power: 0 },
    wellness: { Attitude: 0, Effort: 0, Nerves: 0 },
    perfAggregate: 0,
    wellnessAggregate: 0,
    lastUpdated: null,
  };

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'evaluations', user.uid, 'sessions'), orderBy('timestamp', 'desc'), limit(20)));

      let latestPhysical = null;
      let latestTactical = null;
      let latestMental = null;
      let lastUpdated = null;

      snap.forEach((doc) => {
        const d = doc.data();
        if (d.section === 'physical' && !latestPhysical) latestPhysical = d.data;
        if (d.section === 'tactical' && !latestTactical) latestTactical = d.data;
        if (d.section === 'mental' && !latestMental) latestMental = d.data;
        if (!lastUpdated && d.timestamp) lastUpdated = d.timestamp.toDate().toLocaleDateString();
      });

      const p = latestPhysical || {};
      const t = latestTactical || {};
      const m = latestMental || {};

      const speedScore = Math.round(((p.speed || 0) / 5) * 100);
      const strengthScore = Math.round(((p.strength || 0) / 5) * 100);
      const powerScore = Math.round(((p.power || 0) / 5) * 100);
      const perfAggregate = Math.round((speedScore + strengthScore + powerScore) / 3);

      const attitudeScore = Math.round(((m.attitude || 0) / 10) * 100);
      const effortScore = Math.round(((m.effort || 0) / 10) * 100);
      const nervesScore = Math.round(((m.nerves || 0) / 10) * 100);
      const wellnessAggregate = Math.round((attitudeScore + effortScore + nervesScore) / 3);

      this.setState({
        loading: false,
        performance: { Speed: speedScore, Strength: strengthScore, Power: powerScore },
        wellness: { Attitude: attitudeScore, Effort: effortScore, Nerves: nervesScore },
        perfAggregate,
        wellnessAggregate,
        lastUpdated,
      });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, performance, wellness, perfAggregate, wellnessAggregate, lastUpdated } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Icon name="arrow-back" type="material" color="#008000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={this.loadData}>
            <Icon name="refresh" type="material" color="#008000" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {loading ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: 'grey' }}>Loading your stats...</Text>
          ) : (
            <>
              {lastUpdated && (
                <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
              )}

              {/* Aggregate scores */}
              <View style={styles.aggregateRow}>
                <View style={[styles.aggregateCard, { backgroundColor: '#e8f5e9' }]}>
                  <Text style={styles.aggregateNum}>{perfAggregate}</Text>
                  <Text style={styles.aggregateLabel}>Performance</Text>
                  <Text style={styles.aggregateSub}>/ 100</Text>
                </View>
                <View style={[styles.aggregateCard, { backgroundColor: '#e3f2fd' }]}>
                  <Text style={[styles.aggregateNum, { color: '#1565C0' }]}>{wellnessAggregate}</Text>
                  <Text style={[styles.aggregateLabel, { color: '#1565C0' }]}>Wellness</Text>
                  <Text style={styles.aggregateSub}>/ 100</Text>
                </View>
              </View>

              {/* Performance breakdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Breakdown</Text>
                {PERF_CATEGORIES.map((cat) => (
                  <MetricBar key={cat} label={cat} score={performance[cat]} colour="#008000" />
                ))}
              </View>

              {/* Wellness breakdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mental & Wellness & Wellness Breakdown</Text>
                {WELLNESS_CATEGORIES.map((cat) => (
                  <MetricBar key={cat} label={cat} score={wellness[cat]} colour="#2196F3" />
                ))}
              </View>

              {/* No data hint */}
              {perfAggregate === 0 && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintTitle}>No evaluation data yet</Text>
                  <Text style={styles.hintText}>Complete your first evaluation to see your stats here.</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  container: { padding: 20, paddingBottom: 40 },
  lastUpdated: { color: 'grey', fontSize: 12, marginBottom: 16, textAlign: 'right' },
  aggregateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  aggregateCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center', marginHorizontal: 6, elevation: 1 },
  aggregateNum: { fontSize: 48, fontWeight: 'bold', color: '#008000' },
  aggregateLabel: { fontSize: 14, fontWeight: '600', color: '#008000' },
  aggregateSub: { fontSize: 12, color: 'grey' },
  section: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 14 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metricLabel: { width: 80, fontSize: 13, color: '#444' },
  barBackground: { flex: 1, height: 10, backgroundColor: '#eee', borderRadius: 5, marginHorizontal: 8 },
  barFill: { height: 10, borderRadius: 5 },
  metricScore: { width: 30, textAlign: 'right', fontWeight: 'bold', fontSize: 13 },
  hintBox: { backgroundColor: '#fff3e0', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  hintTitle: { fontWeight: 'bold', color: '#E65100', marginBottom: 6 },
  hintText: { color: '#555', fontSize: 13 },
});

export default DashboardScreen;
