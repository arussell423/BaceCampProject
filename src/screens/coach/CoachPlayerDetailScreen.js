import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator, TextInput, Dimensions, Alert, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { auth, db } from '../../components/Firebase';
import {
  collection, query, orderBy, limit, getDocs,
  addDoc, serverTimestamp, onSnapshot, where, getDoc, doc,
} from 'firebase/firestore';
import { getPlayerPushToken, sendPushNotification } from '../../services/notificationService';

const TABS = ['Performance', 'Training', 'Chat', 'History'];
const SCREEN_WIDTH = Dimensions.get('window').width;

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
    chatMessages: [],
    chatInput: '',
    loading: true,
    perfScores: { Speed: 0, Strength: 0, Power: 0 },
    trendData: [],
  };

  componentDidMount() {
    this.loadData();
    this.subscribeChat();
  }

  componentWillUnmount() {
    if (this._chatUnsub) this._chatUnsub();
  }

  subscribeChat = () => {
    const uid = this.playerUid;
    if (!uid) return;
    this._chatUnsub = onSnapshot(
      query(collection(db, 'chats', uid, 'messages'), orderBy('timestamp', 'asc')),
      (snap) => {
        const chatMessages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.setState({ chatMessages });
      }
    );
  };

  sendChatReply = async () => {
    const { chatInput } = this.state;
    const text = chatInput.trim();
    if (!text) return;
    this.setState({ chatInput: '' });
    const coachUser = auth.currentUser;
    try {
      await addDoc(collection(db, 'chats', this.playerUid, 'messages'), {
        text,
        senderUid: coachUser?.uid || '',
        senderName: coachUser?.displayName || coachUser?.email || 'Coach',
        fromRole: 'coach',
        timestamp: serverTimestamp(),
        read: false,
      });
      // Notify player that coach replied
      const coachName = coachUser?.displayName || coachUser?.email || 'Coach';
      getPlayerPushToken(this.playerUid)
        .then((token) => sendPushNotification(token, 'Coach Message', `${coachName}: ${text}`))
        .catch(() => {});
    } catch (e) { /* silently fail */ }
  };

  get playerUid() {
    return this.props.route?.params?.playerUid ?? '';
  }

  get playerEmail() {
    return this.props.route?.params?.playerEmail ?? '';
  }

  loadData = async () => {
    const { playerUid } = this;
    if (!playerUid) return;
    const coachUser = auth.currentUser;
    if (!coachUser) return;

    try {
      // ── Roster membership guard ──────────────────────────────────────────
      // First try: player linked via Firebase UID (uid field on roster doc)
      const byUidSnap = await getDocs(query(
        collection(db, 'playerRosters', coachUser.uid, 'players'),
        where('uid', '==', playerUid),
      ));
      // Fallback: playerUid might still be a sanitizedEmail (pending invite)
      const byEmailDoc = byUidSnap.empty
        ? await getDoc(doc(db, 'playerRosters', coachUser.uid, 'players', playerUid))
        : null;

      if (byUidSnap.empty && (!byEmailDoc || !byEmailDoc.exists())) {
        Alert.alert('Access Denied', 'This player is not on your roster.');
        this.props.navigation.goBack();
        return;
      }
      // ── End guard ────────────────────────────────────────────────────────
      const [evalSnap, trainingSnap] = await Promise.all([
        getDocs(query(collection(db, 'evaluations', playerUid, 'sessions'), orderBy('timestamp', 'desc'), limit(24))),
        getDocs(query(collection(db, 'coachTraining', playerUid, 'sessions'), orderBy('timestamp', 'desc'), limit(10))),
      ]);

      const evaluations = evalSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const trainingPlans = trainingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Compute perf scores from latest physical eval
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

      // Build trend data from up to 8 physical sessions (oldest first)
      const physicalSessions = evaluations
        .filter((e) => e.section === 'physical')
        .slice(0, 8)
        .reverse();
      const trendData = physicalSessions.map((e) => ({
        date: e.timestamp ? e.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        speed:    Math.round(((e.data?.speed    || 0) / 5) * 100),
        strength: Math.round(((e.data?.strength || 0) / 5) * 100),
        power:    Math.round(((e.data?.power    || 0) / 5) * 100),
      }));

      this.setState({ evaluations, trainingPlans, perfScores, trendData, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  renderPerformance() {
    const { perfScores, evaluations, trendData } = this.state;
    const hasData = evaluations.length > 0;
    const hasTrend = trendData.length >= 2;
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
      <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: 100 }]}>
        {!hasData ? (
          <Text style={styles.emptyText}>No evaluation data yet for this player.</Text>
        ) : (
          <>
            <View style={styles.metricsCard}>
              <Text style={styles.metricsTitle}>Latest Performance Metrics</Text>
              {Object.entries(perfScores).map(([key, val]) => (
                <MetricBar key={key} label={key} score={val} colour="#008000" />
              ))}
            </View>
            {hasTrend && (
              <View style={[styles.metricsCard, { marginTop: 12 }]}>
                <Text style={styles.metricsTitle}>Performance Trend</Text>
                <Text style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                  <Text style={{ color: 'rgba(0,128,0,1)' }}>● Speed  </Text>
                  <Text style={{ color: 'rgba(33,150,243,1)' }}>● Strength  </Text>
                  <Text style={{ color: 'rgba(255,152,0,1)' }}>● Power</Text>
                </Text>
                <LineChart
                  data={{
                    labels: trendData.map((d) => d.date),
                    datasets: [
                      { data: trendData.map((d) => d.speed),    color: (o) => `rgba(0,128,0,${o})` },
                      { data: trendData.map((d) => d.strength), color: (o) => `rgba(33,150,243,${o})` },
                      { data: trendData.map((d) => d.power),    color: (o) => `rgba(255,152,0,${o})` },
                    ],
                  }}
                  width={SCREEN_WIDTH - 72}
                  height={180}
                  chartConfig={CHART_CONFIG}
                  bezier
                  withInnerLines={false}
                  style={{ borderRadius: 10, marginTop: 8 }}
                  fromZero
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    );
  }

  renderTraining() {
    const { trainingPlans } = this.state;
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: 100 }]}>
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
      </ScrollView>
    );
  }

  renderChat() {
    const { chatMessages, chatInput } = this.state;
    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {chatMessages.length === 0 ? (
            <Text style={styles.emptyText}>No messages yet from this player.</Text>
          ) : (
            chatMessages.map((msg) => {
              const isCoach = msg.fromRole === 'coach';
              return (
                <View key={msg.id} style={[styles.chatBubbleRow, isCoach && { justifyContent: 'flex-end' }]}>
                  <View style={[styles.chatBubble, isCoach ? styles.chatBubbleCoach : styles.chatBubblePlayer]}>
                    <Text style={[styles.chatBubbleText, isCoach && { color: 'white' }]}>{msg.text}</Text>
                    <Text style={[styles.chatTime, isCoach && { color: 'rgba(255,255,255,0.7)' }]}>
                      {msg.fromRole === 'coach' ? 'You' : msg.senderName || 'Player'}
                      {msg.timestamp?.toDate ? `  ${msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={(t) => this.setState({ chatInput: t })}
            placeholder="Reply to player..."
            placeholderTextColor="#aaa"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.chatSendBtn, !chatInput.trim() && { backgroundColor: '#ccc' }]}
            onPress={this.sendChatReply}
            disabled={!chatInput.trim()}
          >
            <MaterialIcons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  renderHistory() {    const { evaluations } = this.state;
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: 100 }]}>
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
      </ScrollView>
    );
  }

  render() {
    const { activeTab, loading } = this.state;
    const { playerEmail } = this;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Player Detail" homeScreen="CoachHomeScreen" />

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
          <View style={{ flex: 1 }}>
            {activeTab === 0 && this.renderPerformance()}
            {activeTab === 1 && this.renderTraining()}
            {activeTab === 2 && this.renderChat()}
            {activeTab === 3 && this.renderHistory()}
          </View>
        )}

        {/* Floating action row — hidden on Chat tab to avoid overlap */}
        {activeTab !== 2 && <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
            onPress={() => this.props.navigation.navigate('CoachSendFeedbackScreen', {
              playerUid: this.playerUid,
              playerEmail: this.playerEmail,
            })}
          >
            <MaterialIcons name="feedback" color="white" size={18} />
            <Text style={styles.actionBtnText}>Send Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#008000' }]}
            onPress={() => this.props.navigation.navigate('CoachAddTrainingScreen', {
              playerUid: this.playerUid,
              playerEmail: this.playerEmail,
            })}
          >
            <MaterialIcons name="fitness-center" color="white" size={18} />
            <Text style={styles.actionBtnText}>Add Training</Text>
          </TouchableOpacity>
        </View>}
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
  chatBubbleRow: { flexDirection: 'row', marginBottom: 10 },
  chatBubble: { maxWidth: '75%', borderRadius: 14, padding: 10 },
  chatBubblePlayer: { backgroundColor: '#f0f0f0' },
  chatBubbleCoach: { backgroundColor: '#008000' },
  chatBubbleText: { fontSize: 14, color: '#222' },
  chatTime: { fontSize: 10, color: '#aaa', marginTop: 4 },
  chatInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#eee', marginTop: 8,
  },
  chatInput: {
    flex: 1, backgroundColor: '#F4F6FA', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: '#222', maxHeight: 100,
  },
  chatSendBtn: {
    backgroundColor: '#008000', borderRadius: 22, width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
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
