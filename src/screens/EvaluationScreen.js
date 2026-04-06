import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import { Text, Slider, Icon, Button } from 'react-native-elements';
import { auth, db } from '../components/Firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ─── Physical Tab ────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  'Left Shoulder', 'Right Shoulder',
  'Left Arm', 'Right Arm',
  'Upper Back', 'Lower Back',
  'Core / Abs',
  'Left Hip', 'Right Hip',
  'Left Knee', 'Right Knee',
  'Left Ankle', 'Right Ankle',
];

const BODY_COLOURS = [
  { label: 'Painful', colour: '#e53935' },
  { label: 'Achy',    colour: '#43a047' },
  { label: 'Fatigued',colour: '#fdd835' },
];

class PhysicalTab extends Component {
  state = {
    selectedColour: null,
    muscleMap: {},  // { muscleName: colourLabel }
    speed: 3, strength: 3, power: 3,
  };

  toggleMuscle = (muscle) => {
    const { selectedColour, muscleMap } = this.state;
    if (!selectedColour) {
      Alert.alert('Select a colour first', 'Tap Red, Green or Yellow before selecting a muscle.');
      return;
    }
    const updated = { ...muscleMap };
    if (updated[muscle] === selectedColour) {
      delete updated[muscle];
    } else {
      updated[muscle] = selectedColour;
    }
    this.setState({ muscleMap: updated });
  };

  render() {
    const { selectedColour, muscleMap, speed, strength, power } = this.state;
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        {/* Colour selector */}
        <Text style={styles.sectionLabel}>Body Status — select a colour then tap a muscle:</Text>
        <View style={styles.colourRow}>
          {BODY_COLOURS.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.colourChip, selectedColour === c.label && { borderColor: c.colour, borderWidth: 3 }]}
              onPress={() => this.setState({ selectedColour: c.label })}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.colour, marginBottom: 4 }} />
              <Text style={{ fontSize: 11, color: '#333' }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Muscle grid */}
        <View style={styles.muscleGrid}>
          {MUSCLE_GROUPS.map((m) => {
            const assigned = muscleMap[m];
            const colourObj = BODY_COLOURS.find((c) => c.label === assigned);
            return (
              <TouchableOpacity
                key={m}
                style={[styles.muscleChip, colourObj && { backgroundColor: colourObj.colour + '33', borderColor: colourObj.colour }]}
                onPress={() => this.toggleMuscle(m)}
              >
                <Text style={styles.muscleText}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ratings */}
        <Text style={styles.sectionLabel}>Performance Ratings</Text>
        {[
          { label: `Speed: ${speed}/5`, key: 'speed', val: speed },
          { label: `Strength: ${strength}/5`, key: 'strength', val: strength },
          { label: `Power: ${power}/5`, key: 'power', val: power },
        ].map((item) => (
          <View key={item.key} style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{item.label}</Text>
            <Slider
              value={item.val}
              onValueChange={(v) => this.setState({ [item.key]: Math.round(v) })}
              minimumValue={1} maximumValue={5} step={1}
              thumbTintColor="#008000" minimumTrackTintColor="#008000"
              style={{ flex: 1 }}
            />
          </View>
        ))}
        <Button
          title="Save Physical Evaluation"
          buttonStyle={styles.saveBtn}
          containerStyle={{ marginTop: 20 }}
          onPress={() => this.props.onSave({ speed, strength, power, muscleMap })}
        />
      </ScrollView>
    );
  }
}

// ─── Tactical Tab ─────────────────────────────────────────────────────────────

class TacticalTab extends Component {
  state = {
    unforcedErrors: 5, winners: 5, shotPlacement: 5, shotSelection: 5,
    gamePlan: '',
  };

  render() {
    const { unforcedErrors, winners, shotPlacement, shotSelection } = this.state;
    const metrics = [
      { label: `Unforced Errors: ${unforcedErrors}/10`, key: 'unforcedErrors', val: unforcedErrors },
      { label: `Winners: ${winners}/10`, key: 'winners', val: winners },
      { label: `Shot Placement: ${shotPlacement}/10`, key: 'shotPlacement', val: shotPlacement },
      { label: `Shot Selection: ${shotSelection}/10`, key: 'shotSelection', val: shotSelection },
    ];
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <Text style={styles.sectionLabel}>Tactical Metrics (slide to rate)</Text>
        {metrics.map((item) => (
          <View key={item.key} style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{item.label}</Text>
            <Slider
              value={item.val}
              onValueChange={(v) => this.setState({ [item.key]: Math.round(v) })}
              minimumValue={1} maximumValue={10} step={1}
              thumbTintColor="#2196F3" minimumTrackTintColor="#2196F3"
              style={{ flex: 1 }}
            />
          </View>
        ))}
        <Button
          title="Save Tactical Evaluation"
          buttonStyle={[styles.saveBtn, { backgroundColor: '#2196F3' }]}
          containerStyle={{ marginTop: 20 }}
          onPress={() => this.props.onSave({ unforcedErrors, winners, shotPlacement, shotSelection })}
        />
      </ScrollView>
    );
  }
}

// ─── Mental Tab ───────────────────────────────────────────────────────────────

class MentalTab extends Component {
  state = { attitude: 5, effort: 5, nerves: 5 };

  render() {
    const { attitude, effort, nerves } = this.state;
    const metrics = [
      { label: `Attitude: ${attitude}/10`, key: 'attitude', val: attitude },
      { label: `Effort: ${effort}/10`, key: 'effort', val: effort },
      { label: `Nerves: ${nerves}/10`, key: 'nerves', val: nerves },
    ];
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <Text style={styles.sectionLabel}>Mental Performance (slide to rate)</Text>
        {metrics.map((item) => (
          <View key={item.key} style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{item.label}</Text>
            <Slider
              value={item.val}
              onValueChange={(v) => this.setState({ [item.key]: Math.round(v) })}
              minimumValue={1} maximumValue={10} step={1}
              thumbTintColor="#9C27B0" minimumTrackTintColor="#9C27B0"
              style={{ flex: 1 }}
            />
          </View>
        ))}
        <View style={styles.coachHint}>
          <Text style={styles.coachHintTitle}> Virtual Coach Tip</Text>
          <Text style={styles.coachHintText}>
            Rate your nerves honestly — managing nerves is the #1 factor in match performance!
          </Text>
        </View>
        <Button
          title="Save Mental Evaluation"
          buttonStyle={[styles.saveBtn, { backgroundColor: '#9C27B0' }]}
          containerStyle={{ marginTop: 20 }}
          onPress={() => this.props.onSave({ attitude, effort, nerves })}
        />
      </ScrollView>
    );
  }
}

// ─── Main EvaluationScreen ────────────────────────────────────────────────────

const TABS = ['Physical', 'Tactical', 'Mental'];

export class EvaluationScreen extends Component {
  state = { activeTab: 0, saved: { physical: false, tactical: false, mental: false } };

  saveSection = (section, data) => {
    const user = auth.currentUser;
    if (!user) return;
    addDoc(collection(db, 'evaluations', user.uid, 'sessions'), { section, data, timestamp: serverTimestamp() })
      .then(() => {
        this.setState((prev) => ({ saved: { ...prev.saved, [section]: true } }));
        Alert.alert(' Saved!', `${section.charAt(0).toUpperCase() + section.slice(1)} evaluation saved. Your virtual coach will review it!`);
      })
      .catch(() => Alert.alert('Error', 'Could not save. Please check your connection.'));
  };

  render() {
    const { activeTab } = this.state;
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Evaluation" homeScreen="HomeScreen" />

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => this.setState({ activeTab: i })}
            >
              <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 0 && <PhysicalTab onSave={(d) => this.saveSection('physical', d)} />}
        {activeTab === 1 && <TacticalTab onSave={(d) => this.saveSection('tactical', d)} />}
        {activeTab === 2 && <MentalTab onSave={(d) => this.saveSection('mental', d)} />}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#008000' },
  tabLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  tabLabelActive: { color: '#008000', fontWeight: 'bold' },
  tabContent: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 12, marginTop: 8 },
  colourRow: { flexDirection: 'row', marginBottom: 16 },
  colourChip: { alignItems: 'center', backgroundColor: 'white', borderRadius: 10, padding: 10, marginRight: 12, borderWidth: 1, borderColor: '#ddd', minWidth: 70 },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  muscleChip: { backgroundColor: '#eee', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, margin: 4, borderWidth: 1, borderColor: '#ddd' },
  muscleText: { fontSize: 12, color: '#333' },
  sliderRow: { marginBottom: 18 },
  sliderLabel: { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '500' },
  saveBtn: { backgroundColor: '#008000', borderRadius: 12 },
  coachHint: { backgroundColor: '#fff3e0', borderRadius: 12, padding: 14, marginTop: 16, borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  coachHintTitle: { fontWeight: 'bold', color: '#E65100', marginBottom: 4 },
  coachHintText: { color: '#555', fontSize: 13 },
});

export default EvaluationScreen;
