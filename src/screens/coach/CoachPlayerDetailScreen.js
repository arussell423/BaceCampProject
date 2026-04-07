import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { auth, db } from '../../components/Firebase';
import {
  collection, query, orderBy, limit, getDocs,
  addDoc, serverTimestamp, onSnapshot,
} from 'firebase/firestore';

const TABS = ['Performance', 'Training', 'Chat', 'History'];

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

  renderChat() {
    const { chatMessages, chatInput } = this.state;
    return (
      <View style={[styles.tabContent, { flex: 1 }]}>
        <ScrollView style={{ flex: 1 }}>
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
            <Icon name="send" type="material" color="white" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  renderHistory() {    const { evaluations } = this.state;
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
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {activeTab === 0 && this.renderPerformance()}
            {activeTab === 1 && this.renderTraining()}
            {activeTab === 2 && this.renderChat()}
            {activeTab === 3 && this.renderHistory()}
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
