import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { auth, db } from '../../components/Firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getPlayerPushToken, sendPushNotification } from '../../services/notificationService';

const FEEDBACK_TYPES = ['Text', 'Photo', 'Video'];

export class CoachSendFeedbackScreen extends Component {
  state = {
    feedbackType: 'Text',
    message: '',
    videoUrl: '',
    sending: false,
    sent: false,
  };

  get playerUid() {
    return this.props.route?.params?.playerUid ?? '';
  }

  get playerEmail() {
    return this.props.route?.params?.playerEmail ?? '';
  }

  sendFeedback = async () => {
    const { feedbackType, message, videoUrl } = this.state;
    const user = auth.currentUser;
    if (!user) return;
    const content = feedbackType === 'Video' ? videoUrl : message;
    if (!content.trim()) {
      Alert.alert('Empty', 'Please enter your feedback.');
      return;
    }
    this.setState({ sending: true });
    try {
      await addDoc(collection(db, 'coachFeedback', this.playerUid, 'messages'), {
        fromCoachUid: user.uid,
        type: feedbackType.toLowerCase(),
        content,
        timestamp: serverTimestamp(),
        read: false,
      });
      this.setState({ sent: true, sending: false });
      // Notify player that coach sent feedback
      getPlayerPushToken(this.playerUid)
        .then((token) => sendPushNotification(token, 'New Coach Feedback', `Your coach sent you ${feedbackType.toLowerCase()} feedback`))
        .catch(() => {});
    } catch (e) {
      Alert.alert('Error', 'Could not send feedback.');
      this.setState({ sending: false });
    }
  };

  render() {
    const { feedbackType, message, videoUrl, sending, sent } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Send Feedback" homeScreen="CoachHomeScreen" />

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.toLabel}>To: {this.playerEmail}</Text>

          {/* Type selector */}
          <Text style={styles.sectionLabel}>Feedback Type</Text>
          <View style={styles.typeRow}>
            {FEEDBACK_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, feedbackType === type && styles.typeChipActive]}
                onPress={() => this.setState({ feedbackType: type })}
              >
                <Text style={[styles.typeChipText, feedbackType === type && styles.typeChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content input */}
          {feedbackType === 'Text' && (
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={6}
              placeholder="Write your feedback..."
              placeholderTextColor="#aaa"
              value={message}
              onChangeText={(t) => this.setState({ message: t })}
            />
          )}

          {feedbackType === 'Photo' && (
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={() => Alert.alert('Coming Soon', 'ImagePicker would open here on device')}
            >
              <Icon name="photo-camera" type="material" color="#008000" size={36} />
              <Text style={styles.photoBtnText}>Tap to attach photo</Text>
            </TouchableOpacity>
          )}

          {feedbackType === 'Video' && (
            <TextInput
              style={styles.urlInput}
              placeholder="Paste video URL..."
              placeholderTextColor="#aaa"
              value={videoUrl}
              onChangeText={(t) => this.setState({ videoUrl: t })}
              autoCapitalize="none"
            />
          )}

          {sent ? (
            <View style={styles.sentBox}>
              <Text style={styles.sentText}> Feedback sent to player!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={this.sendFeedback}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.sendBtnText}>Send Feedback</Text>}
            </TouchableOpacity>
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
  container: { padding: 20, paddingBottom: 40 },
  toLabel: { fontSize: 14, color: '#555', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  typeRow: { flexDirection: 'row', marginBottom: 20 },
  typeChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: '#ddd', alignItems: 'center', marginHorizontal: 4,
  },
  typeChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  typeChipText: { color: '#555', fontWeight: '500' },
  typeChipTextActive: { color: 'white', fontWeight: 'bold' },
  messageInput: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, fontSize: 15,
    color: '#222', minHeight: 160, textAlignVertical: 'top',
    elevation: 1, marginBottom: 20, borderWidth: 1, borderColor: '#eee',
  },
  urlInput: {
    backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15,
    color: '#222', elevation: 1, marginBottom: 20, borderWidth: 1, borderColor: '#eee',
  },
  photoBtn: {
    backgroundColor: 'white', borderRadius: 14, padding: 32, alignItems: 'center',
    elevation: 1, marginBottom: 20, borderWidth: 2, borderColor: '#e8f5e9',
    borderStyle: 'dashed',
  },
  photoBtnText: { color: '#008000', fontWeight: '600', marginTop: 10, fontSize: 14 },
  sendBtn: {
    backgroundColor: '#008000', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', elevation: 1,
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  sentBox: {
    backgroundColor: '#e8f5e9', borderRadius: 12, padding: 20, alignItems: 'center',
  },
  sentText: { color: '#008000', fontWeight: 'bold', fontSize: 16 },
});

export default CoachSendFeedbackScreen;
