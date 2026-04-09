import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../components/Firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';

const QUICK_SUGGESTIONS = [
  'Improve my serve',
  'Recovery tips',
  'Mental game advice',
  'Speed training',
];

// In-memory cache keyed by user UID to prevent cross-user leaks
const messageCache = {};

export class AICoachScreen extends Component {
  state = {
    messages: [],
    inputText: '',
    loading: false,
    playerName: '',
  };

  componentDidMount() {
    const user = auth.currentUser;
    const uid = user?.uid || 'guest';
    const playerName = (user && (user.displayName || user.email)) || 'Player';
    this.setState({ playerName });

    const welcome = {
      role: 'assistant',
      content: `Hi ${playerName}! I'm your bACE CAMP AI Coach. Ask me anything about tennis training, technique, strategy, or recovery!`,
    };

    if (messageCache[uid] && messageCache[uid].length > 0) {
      this.setState({ messages: messageCache[uid] });
    } else {
      this.setState({ messages: [welcome] });
    }

    this._uid = uid;
    this.loadLastEval();

    // Auto-send prompt if navigated from Evaluation screen
    const initialPrompt = this.props.route?.params?.initialPrompt;
    if (initialPrompt) {
      setTimeout(() => this.sendMessage(initialPrompt), 600);
    }
  }

  loadLastEval = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(query(collection(db, 'evaluations', user.uid, 'sessions'), orderBy('timestamp', 'desc'), limit(1)));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const hint = {
          role: 'assistant',
          content: `I can see your latest evaluation data (${data.section || 'performance'} section). Feel free to ask me for personalised advice based on your scores!`,
        };
        this.setState((prev) => {
          const msgs = [...prev.messages, hint];
          messageCache[this._uid] = msgs;
          return { messages: msgs };
        });
      }
    } catch (e) {
      // silently ignore
    }
  };

  sendMessage = async (text) => {
    const content = text || this.state.inputText;
    if (!content.trim()) return;
    this.setState({ inputText: '' });

    const userMsg = { role: 'user', content };
    const thinkingMsg = { role: 'assistant', content: 'Thinking...', thinking: true };

    this.setState((prev) => {
      const msgs = [...prev.messages, userMsg, thinkingMsg];
      return { messages: msgs, loading: true };
    });

    try {
      const { messages, playerName } = this.state;
      const history = [...messages, userMsg].filter((m) => !m.thinking);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an expert tennis coach AI assistant for the bACE CAMP app. You are helping a tennis player named ${playerName}. Provide concise, actionable, encouraging advice about tennis training, technique, tactics, nutrition, and recovery. Keep responses under 150 words unless asked for detail.`,
            },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 300,
        }),
      });

      const json = await response.json();
      const reply = json.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again.";

      this.setState((prev) => {
        const msgs = prev.messages.filter((m) => !m.thinking);
        const updated = [...msgs, { role: 'assistant', content: reply }];
        messageCache[this._uid] = updated;
        return { messages: updated, loading: false };
      });
    } catch (e) {
      this.setState((prev) => {
        const msgs = prev.messages.filter((m) => !m.thinking);
        const updated = [...msgs, { role: 'assistant', content: 'Sorry, I could not connect to the AI service. Please check your connection.' }];
        messageCache[this._uid] = updated;
        return { messages: updated, loading: false };
      });
    }
  };

  renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {item.content}
        </Text>
      </View>
    );
  };

  render() {
    const { messages, inputText, loading } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="AI Coach" homeScreen="HomeScreen" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={this.renderMessage}
            contentContainerStyle={styles.chatContainer}
            ref={(r) => { this.flatList = r; }}
            onContentSizeChange={() => this.flatList && this.flatList.scrollToEnd({ animated: true })}
          />

          {/* Quick suggestions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestBar}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
          >
            {QUICK_SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestChip}
                onPress={() => this.sendMessage(s)}
              >
                <Text style={styles.suggestText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={(t) => this.setState({ inputText: t })}
              placeholder="Ask your coach..."
              placeholderTextColor="#aaa"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={() => this.sendMessage()}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="white" />
                : <MaterialIcons name="send" size={20} color="white" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  chatContainer: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14,
    paddingVertical: 10, marginBottom: 10,
  },
  bubbleUser: { backgroundColor: '#008000', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: '#ECECEC', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: 'white' },
  bubbleTextAssistant: { color: '#222' },
  suggestBar: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee' },
  suggestChip: {
    backgroundColor: '#e8f5e9', borderRadius: 16, paddingHorizontal: 14,
    paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: '#c8e6c9',
  },
  suggestText: { color: '#008000', fontSize: 13, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 10,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee',
  },
  input: {
    flex: 1, backgroundColor: '#F4F6FA', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: '#222', maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#008000', borderRadius: 22, width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
});

export default AICoachScreen;
