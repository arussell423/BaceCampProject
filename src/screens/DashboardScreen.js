import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { LineChart } from 'react-native-chart-kit';
import { auth, db } from '../components/Firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const SCREEN_WIDTH = Dimensions.get('window').width;
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
    // Chart data: arrays of {date, speed, strength, power, attitude, effort, nerves}
    trendData: [],
  };

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'evaluations', user.uid, 'sessions'), orderBy('timestamp', 'desc'), limit(40)));

      let latestPhysical = null;
      let latestTactical = null;
      let latestMental = null;
      let lastUpdated = null;

      // Group by date to build trend points (up to 8 most recent physical sessions)
      const physicalSessions = [];
      const mentalSessions = [];

      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const dateLabel = d.timestamp ? d.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        if (d.section === 'physical' && !latestPhysical) { latestPhysical = d.data; }
        if (d.section === 'tactical' && !latestTactical) { latestTactical = d.data; }
        if (d.section === 'mental' && !latestMental) { latestMental = d.data; }
        if (!lastUpdated && d.timestamp) lastUpdated = d.timestamp.toDate().toLocaleDateString();
        if (d.section === 'physical' && physicalSessions.length < 8) {
          physicalSessions.push({ date: dateLabel, data: d.data });
        }
        if (d.section === 'mental' && mentalSessions.length < 8) {
          mentalSessions.push({ date: dateLabel, data: d.data });
        }
      });

      // Reverse so earliest is on the left
      physicalSessions.reverse();
      mentalSessions.reverse();

      // Build trendData aligned by index (use physical as primary timeline)
      const trendLength = Math.max(physicalSessions.length, mentalSessions.length, 1);
      const trendData = Array.from({ length: trendLength }, (_, i) => {
        const p = physicalSessions[i]?.data || {};
        const m = mentalSessions[i]?.data || {};
        return {
          date: physicalSessions[i]?.date || mentalSessions[i]?.date || '',
          speed:    Math.round(((p.speed    || 0) / 5) * 100),
          strength: Math.round(((p.strength || 0) / 5) * 100),
          power:    Math.round(((p.power    || 0) / 5) * 100),
          attitude: Math.round(((m.attitude || 0) / 10) * 100),
          effort:   Math.round(((m.effort   || 0) / 10) * 100),
          nerves:   Math.round(((m.nerves   || 0) / 10) * 100),
        };
      });

      const p = latestPhysical || {};
      const m = latestMental || {};
      const speedScore    = Math.round(((p.speed    || 0) / 5) * 100);
      const strengthScore = Math.round(((p.strength || 0) / 5) * 100);
      const powerScore    = Math.round(((p.power    || 0) / 5) * 100);
      const perfAggregate = Math.round((speedScore + strengthScore + powerScore) / 3);

      const attitudeScore = Math.round(((m.attitude || 0) / 10) * 100);
      const effortScore   = Math.round(((m.effort   || 0) / 10) * 100);
      const nervesScore   = Math.round(((m.nerves   || 0) / 10) * 100);
      const wellnessAggregate = Math.round((attitudeScore + effortScore + nervesScore) / 3);

      this.setState({
        loading: false,
        performance: { Speed: speedScore, Strength: strengthScore, Power: powerScore },
        wellness: { Attitude: attitudeScore, Effort: effortScore, Nerves: nervesScore },
        perfAggregate,
        wellnessAggregate,
        lastUpdated,
        trendData,
      });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, performance, wellness, perfAggregate, wellnessAggregate, lastUpdated, trendData } = this.state;

    const hasTrend = trendData.length >= 2;
    const chartLabels = trendData.map((d) => d.date);
    const CHART_CONFIG = {
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      decimalPlaces: 0,
      color: (opacity = 1, index) => {
        const colours = ['rgba(0,128,0,', 'rgba(33,150,243,', 'rgba(255,152,0,'];
        return `${colours[index % colours.length]}${opacity})`;
      },
      labelColor: () => '#888',
      propsForDots: { r: '3', strokeWidth: '1' },
    };

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Dashboard" homeScreen="HomeScreen" />

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

              {/* Performance trend chart */}
              {hasTrend && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Performance Trend</Text>
                  <Text style={styles.chartLegend}>
                    <Text style={{ color: 'rgba(0,128,0,1)' }}>● Speed  </Text>
                    <Text style={{ color: 'rgba(33,150,243,1)' }}>● Strength  </Text>
                    <Text style={{ color: 'rgba(255,152,0,1)' }}>● Power</Text>
                  </Text>
                  <LineChart
                    data={{
                      labels: chartLabels,
                      datasets: [
                        { data: trendData.map((d) => d.speed),    color: (o) => `rgba(0,128,0,${o})` },
                        { data: trendData.map((d) => d.strength), color: (o) => `rgba(33,150,243,${o})` },
                        { data: trendData.map((d) => d.power),    color: (o) => `rgba(255,152,0,${o})` },
                      ],
                    }}
                    width={SCREEN_WIDTH - 56}
                    height={180}
                    chartConfig={CHART_CONFIG}
                    bezier
                    withInnerLines={false}
                    style={styles.chart}
                    fromZero
                    yAxisSuffix=""
                  />
                </View>
              )}

              {/* Wellness breakdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mental & Wellness Breakdown</Text>
                {WELLNESS_CATEGORIES.map((cat) => (
                  <MetricBar key={cat} label={cat} score={wellness[cat]} colour="#2196F3" />
                ))}
              </View>

              {/* Wellness trend chart */}
              {hasTrend && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Wellness Trend</Text>
                  <Text style={styles.chartLegend}>
                    <Text style={{ color: 'rgba(156,39,176,1)' }}>● Attitude  </Text>
                    <Text style={{ color: 'rgba(233,30,99,1)' }}>● Effort  </Text>
                    <Text style={{ color: 'rgba(255,87,34,1)' }}>● Nerves</Text>
                  </Text>
                  <LineChart
                    data={{
                      labels: chartLabels,
                      datasets: [
                        { data: trendData.map((d) => d.attitude), color: (o) => `rgba(156,39,176,${o})` },
                        { data: trendData.map((d) => d.effort),   color: (o) => `rgba(233,30,99,${o})` },
                        { data: trendData.map((d) => d.nerves),   color: (o) => `rgba(255,87,34,${o})` },
                      ],
                    }}
                    width={SCREEN_WIDTH - 56}
                    height={180}
                    chartConfig={{ ...CHART_CONFIG, color: (opacity = 1, index) => {
                      const colours = ['rgba(156,39,176,', 'rgba(233,30,99,', 'rgba(255,87,34,'];
                      return `${colours[index % colours.length]}${opacity})`;
                    }}}
                    bezier
                    withInnerLines={false}
                    style={styles.chart}
                    fromZero
                  />
                </View>
              )}

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
  chart: { borderRadius: 10, marginTop: 10 },
  chartLegend: { fontSize: 11, marginBottom: 4 },
});

export default DashboardScreen;
