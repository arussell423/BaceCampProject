import React, { Component } from 'react';
import { AppHeader } from '../../components/AppHeader';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, Alert, ScrollView, ActivityIndicator, Text, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../components/Firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getPlayerPushToken, sendPushNotification } from '../../services/notificationService';

const FEEDBACK_TYPES = ['Text', 'Photo', 'Video'];

export class CoachSendFeedbackScreen extends Component {
  state = {
    feedbackType: 'Text',
    message: '',
    videoUrl: '',
    photoUri: null,
    sending: false,
    sent: false,
  };

  get playerUid() {
    return this.props.route?.params?.playerUid ?? '';
  }

  get playerEmail() {
    return this.props.route?.params?.playerEmail ?? '';
  }

  pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.length) {
      this.setState({ photoUri: result.assets[0].uri });
    }
  };

  sendFeedback = async () => {
    const { feedbackType, message, videoUrl, photoUri } = this.state;
    const user = auth.currentUser;
    if (!user) return;

    if (feedbackType === 'Photo') {
      if (!photoUri) {
        Alert.alert('No Photo', 'Please select a photo first.');
        return;
      }
      // Photo is stored as a local URI reference — recipient can only see it on this device.
      // Full cross-device photo sharing requires Firebase Storage (future enhancement).
      Alert.alert(
        'Photo Note',
        'The photo will be saved as a reference. To share photos with players, Firebase Storage integration is needed.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Anyway', onPress: () => this._doSendFeedback(feedbackType, photoUri, user) },
        ]
      );
      return;
    }

    let content = feedbackType === 'Video' ? videoUrl : message;
    if (!content.trim()) {
      Alert.alert('Empty', 'Please enter your feedback.');
      return;
    }
    this._doSendFeedback(feedbackType, content, user);
  };

  _doSendFeedback = async (feedbackType, content, user) => {
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
      // Notify player
      getPlayerPushToken(this.playerUid)
        .then((token) => sendPushNotification(token, 'New Coach Feedback', `Your coach sent you ${feedbackType.toLowerCase()} feedback`))
        .catch(() => {});
      // Auto-reset after 3 seconds so coach can send another
      setTimeout(() => this.setState({ sent: false, message: '', videoUrl: '', photoUri: null }), 3000);
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

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
            <View>
              <TouchableOpacity style={styles.photoBtn} onPress={this.pickPhoto}>
                <MaterialIcons name="photo-camera" size={36} color="#008000" />
                <Text style={styles.photoBtnText}>
                  {this.state.photoUri ? 'Change Photo' : 'Tap to attach photo'}
                </Text>
              </TouchableOpacity>
              {this.state.photoUri ? (
                <Image source={{ uri: this.state.photoUri }} style={styles.photoPreview} resizeMode="cover" />
              ) : null}
            </View>
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
              <Text style={styles.sentText}>✅ Feedback sent!</Text>
              <Text style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Form will reset automatically…</Text>
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
  photoPreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
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
