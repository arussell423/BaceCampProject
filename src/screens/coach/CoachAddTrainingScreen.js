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

const CATEGORIES = ['Speed', 'Strength', 'Power', 'Mobility', 'Flexibility'];

export class CoachAddTrainingScreen extends Component {
  state = {
    title: '',
    category: 'Speed',
    description: '',
    videoUrl: '',
    saving: false,
    saved: false,
  };

  get playerUid() {
    return this.props.route?.params?.playerUid ?? '';
  }

  get playerEmail() {
    return this.props.route?.params?.playerEmail ?? '';
  }

  addTraining = async () => {
    const { title, category, description, videoUrl } = this.state;
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a training title.');
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ saving: true });
    try {
      await addDoc(collection(db, 'coachTraining', this.playerUid, 'sessions'), {
        title: title.trim(),
        category,
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        coachUid: user.uid,
        timestamp: serverTimestamp(),
      });
      Alert.alert('Success', 'Training added for player!');
      this.setState({ title: '', description: '', videoUrl: '', saving: false, saved: true });
      setTimeout(() => this.setState({ saved: false }), 3000);
      // Notify player that coach added a training session
      getPlayerPushToken(this.playerUid)
        .then((token) => sendPushNotification(token, 'New Training Plan', `Your coach added a new ${category} session: ${title.trim()}`))
        .catch(() => {});
    } catch (e) {
      Alert.alert('Error', 'Could not add training.');
      this.setState({ saving: false });
    }
  };

  render() {
    const { title, category, description, videoUrl, saving, saved } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Add Training" homeScreen="CoachHomeScreen" />

        <ScrollView contentContainerStyle={styles.container}>
          {this.playerEmail ? (
            <Text style={styles.toLabel}>For: {this.playerEmail}</Text>
          ) : null}

          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Cone Sprint Drill"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={(t) => this.setState({ title: t })}
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => this.setState({ category: cat })}
              >
                <Text style={[styles.catLabel, category === cat && styles.catLabelActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Describe the workout, sets, reps, etc."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={(t) => this.setState({ description: t })}
          />

          <Text style={styles.fieldLabel}>Video URL (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://youtube.com/..."
            placeholderTextColor="#aaa"
            value={videoUrl}
            onChangeText={(t) => this.setState({ videoUrl: t })}
            autoCapitalize="none"
          />

          {saved && (
            <View style={styles.savedBox}>
              <Text style={styles.savedText}> Training added successfully!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.addBtn, saving && styles.addBtnDisabled]}
            onPress={this.addTraining}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="white" />
              : <Text style={styles.addBtnText}>Add Training</Text>}
          </TouchableOpacity>
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
  toLabel: { fontSize: 14, color: '#555', marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15,
    color: '#222', marginBottom: 18, borderWidth: 1, borderColor: '#eee', elevation: 1,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  categoryBar: { marginBottom: 18 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F4F6FA',
  },
  catChipActive: { backgroundColor: '#008000', borderColor: '#008000' },
  catLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  catLabelActive: { color: 'white', fontWeight: 'bold' },
  addBtn: {
    backgroundColor: '#008000', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', elevation: 1,
  },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  savedBox: {
    backgroundColor: '#e8f5e9', borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 16,
  },
  savedText: { color: '#008000', fontWeight: 'bold' },
});

export default CoachAddTrainingScreen;
