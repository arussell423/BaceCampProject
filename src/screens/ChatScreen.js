import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, FlatList,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../components/Firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp,
} from 'firebase/firestore';
import { getCoachPushToken, sendPushNotification } from '../services/notificationService';

export class ChatScreen extends Component {
  state = {
    messages: [],
    inputText: '',
    loading: true,
  };

  get uid() {
    return auth.currentUser?.uid || '';
  }

  get displayName() {
    const user = auth.currentUser;
    return user?.displayName || user?.email || 'Player';
  }

  componentDidMount() {
    if (!this.uid) return;
    // Listen to the player's chat collection in real time
    this._unsub = onSnapshot(
      query(collection(db, 'chats', this.uid, 'messages'), orderBy('timestamp', 'asc')),
      (snap) => {
        const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.setState({ messages, loading: false });
        // Scroll to latest
        setTimeout(() => this._list && this._list.scrollToEnd({ animated: true }), 100);
      },
      () => this.setState({ loading: false })
    );
  }

  componentWillUnmount() {
    if (this._unsub) this._unsub();
  }

  sendMessage = async () => {
    const text = this.state.inputText.trim();
    if (!text || !this.uid) return;
    this.setState({ inputText: '' });
    try {
      await addDoc(collection(db, 'chats', this.uid, 'messages'), {
        text,
        senderUid: this.uid,
        senderName: this.displayName,
        fromRole: 'player',
        timestamp: serverTimestamp(),
        read: false,
      });
      // Notify the coach that a player sent a message
      const playerEmail = auth.currentUser?.email;
      getCoachPushToken(playerEmail)
        .then((token) => sendPushNotification(token, 'New Message', `${this.displayName}: ${text}`))
        .catch(() => {});
    } catch (e) {
      // silently fail — message stays in input if needed
    }
  };

  renderMessage = ({ item }) => {
    const isMe = item.fromRole === 'player';
    const initials = (item.senderName || '?')[0].toUpperCase();
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMe && (
          <View style={[{width:32,height:32,borderRadius:16,backgroundColor:'#1565C0',alignItems:'center',justifyContent:'center'},styles.avatarCoach]}><Text style={{color:'#fff',fontWeight:'bold',fontSize:12}}>{initials}</Text></View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleCoach]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.senderName || 'Coach'}</Text>
          )}
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextCoach]}>
            {item.text}
          </Text>
          {item.timestamp && (
            <Text style={[styles.timestamp, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
              {item.timestamp.toDate
                ? item.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}
            </Text>
          )}
        </View>
        {isMe && (
          <View style={[{width:32,height:32,borderRadius:16,backgroundColor:'#2E7D32',alignItems:'center',justifyContent:'center'},styles.avatarMe]}><Text style={{color:'#fff',fontWeight:'bold',fontSize:12}}>{(this.displayName)[0].toUpperCase()}</Text></View>
        )}
      </View>
    );
  };

  render() {
    const { messages, inputText, loading } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Chat" homeScreen="HomeScreen" />

        {loading ? (
          <ActivityIndicator size="large" color="#008000" style={{ marginTop: 60 }} />
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="chat-bubble-outline" size={52} color="#ccc" />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>
                  Send a message to your coach — they'll see it and can reply here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={this.renderMessage}
                contentContainerStyle={styles.chatList}
                ref={(r) => { this._list = r; }}
                onContentSizeChange={() => this._list && this._list.scrollToEnd({ animated: true })}
              />
            )}

            {/* Input bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={(t) => this.setState({ inputText: t })}
                placeholder="Message your coach..."
                placeholderTextColor="#aaa"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={this.sendMessage}
                disabled={!inputText.trim()}
              >
                <MaterialIcons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  chatList: { padding: 16, paddingBottom: 8 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: '#008000', borderBottomRightRadius: 4, marginLeft: 8,
  },
  bubbleCoach: {
    backgroundColor: 'white', borderBottomLeftRadius: 4, marginRight: 8,
    elevation: 1, borderWidth: 1, borderColor: '#eee',
  },
  senderName: { fontSize: 11, fontWeight: '700', color: '#008000', marginBottom: 3 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: 'white' },
  bubbleTextCoach: { color: '#222' },
  timestamp: { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' },

  avatarMe: { backgroundColor: '#2E7D32', marginLeft: 6 },
  avatarCoach: { backgroundColor: '#1565C0', marginRight: 6 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#aaa', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 20 },

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

export default ChatScreen;
