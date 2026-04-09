import React, { Component } from 'react';
import { AppHeader } from '../components/AppHeader';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, TextInput, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '../components/CrossPlatformSlider';
import { auth, db } from '../components/Firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { getCoachPushToken, sendPushNotification } from '../services/notificationService';

// ─── Shared: Star Rating Row ─────────────────────────────────────────────────

function StarRating({ value, max, onPress, colour }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      {Array.from({ length: max }).map((_, i) => (
        <TouchableOpacity key={i} onPress={() => onPress(i + 1)} style={{ marginRight: 4 }}>
          <MaterialIcons
            name={i < value ? 'star' : 'star-outline'}
            size={26}
            color={i < value ? colour : '#ddd'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Physical Tab ────────────────────────────────────────────────────────────

// Body regions grouped anatomically for a structured visual layout
const BODY_REGIONS = [
  { section: 'Head & Shoulders', muscles: ['Left Shoulder', 'Right Shoulder'] },
  { section: 'Arms',             muscles: ['Left Arm', 'Right Arm'] },
  { section: 'Back',             muscles: ['Upper Back', 'Lower Back'] },
  { section: 'Core',             muscles: ['Core / Abs'] },
  { section: 'Hips',             muscles: ['Left Hip', 'Right Hip'] },
  { section: 'Knees',            muscles: ['Left Knee', 'Right Knee'] },
  { section: 'Ankles',           muscles: ['Left Ankle', 'Right Ankle'] },
];

const BODY_COLOURS = [
  { label: 'Painful',  colour: '#e53935' },
  { label: 'Achy',     colour: '#43a047' },
  { label: 'Fatigued', colour: '#fdd835' },
];

class PhysicalTab extends Component {
  constructor(props) {
    super(props);
    const p = props.prevValues || {};
    this.state = {
      selectedColour: null,
      muscleMap: p.muscleMap || {},
      speed:    p.speed    || 3,
      strength: p.strength || 3,
      power:    p.power    || 3,
    };
  }

  toggleMuscle = (muscle) => {
    const { selectedColour, muscleMap } = this.state;
    if (!selectedColour) {
      Alert.alert('Select a colour first', 'Tap Red, Green or Yellow before selecting a muscle.');
      return;
    }
    const updated = { ...muscleMap };
    if (updated[muscle] === selectedColour) delete updated[muscle];
    else updated[muscle] = selectedColour;
    this.setState({ muscleMap: updated });
  };

  render() {
    const { selectedColour, muscleMap, speed, strength, power } = this.state;
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>

        {/* ── Body Status ── */}
        <Text style={styles.sectionLabel}>Body Status — select a colour then tap a muscle:</Text>

        {/* Colour selector */}
        <View style={styles.colourRow}>
          {BODY_COLOURS.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.colourChip, selectedColour === c.label && { borderColor: c.colour, borderWidth: 3 }]}
              onPress={() => this.setState({ selectedColour: selectedColour === c.label ? null : c.label })}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.colour, marginBottom: 4 }} />
              <Text style={{ fontSize: 11, color: '#333' }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Body diagram — grouped by region */}
        <View style={styles.bodyDiagram}>
          {BODY_REGIONS.map((region) => (
            <View key={region.section} style={styles.bodyRegion}>
              <Text style={styles.bodyRegionLabel}>{region.section}</Text>
              <View style={styles.bodyRegionMuscles}>
                {region.muscles.map((m) => {
                  const assigned = muscleMap[m];
                  const colourObj = BODY_COLOURS.find((c) => c.label === assigned);
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.muscleChip,
                        colourObj && { backgroundColor: colourObj.colour + '33', borderColor: colourObj.colour },
                        colourObj && { borderWidth: 2 },
                      ]}
                      onPress={() => this.toggleMuscle(m)}
                    >
                      {colourObj && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colourObj.colour, marginRight: 5 }} />
                      )}
                      <Text style={styles.muscleText}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* ── Performance Ratings ── */}
        <Text style={styles.sectionLabel}>Performance Ratings</Text>
        {[
          { label: 'Speed',    key: 'speed',    val: speed,    colour: '#008000' },
          { label: 'Strength', key: 'strength', val: strength, colour: '#1565C0' },
          { label: 'Power',    key: 'power',    val: power,    colour: '#6A1B9A' },
        ].map((item) => (
          <View key={item.key} style={styles.ratingBlock}>
            <View style={styles.ratingLabelRow}>
              <Text style={styles.sliderLabel}>{item.label}</Text>
              <Text style={[styles.ratingValue, { color: item.colour }]}>{item.val} / 5</Text>
            </View>
            <StarRating
              value={item.val}
              max={5}
              colour={item.colour}
              onPress={(v) => this.setState({ [item.key]: v })}
            />
            <Slider
              value={item.val}
              onValueChange={(v) => this.setState({ [item.key]: Math.round(v) })}
              minimumValue={1} maximumValue={5} step={1}
              thumbTintColor={item.colour} minimumTrackTintColor={item.colour}
              style={{ flex: 1 }}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, { marginTop: 20, paddingVertical: 12, alignItems: 'center' }]}
          onPress={() => this.props.onSave({ speed, strength, power, muscleMap })}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save Physical Evaluation</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

// ─── Tactical Tab ─────────────────────────────────────────────────────────────

class TacticalTab extends Component {
  constructor(props) {
    super(props);
    const p = props.prevValues || {};
    this.state = {
      unforcedErrors: p.unforcedErrors || 5,
      winners:        p.winners        || 5,
      shotPlacement:  p.shotPlacement  || 5,
      shotSelection:  p.shotSelection  || 5,
      gamePlan:       p.gamePlan       || '',
      preMatchPlanSet: p.preMatchPlanSet || false,
    };
  }

  render() {
    const { unforcedErrors, winners, shotPlacement, shotSelection, gamePlan, preMatchPlanSet } = this.state;
    const metrics = [
      { label: `Unforced Errors: ${unforcedErrors}/10`, key: 'unforcedErrors', val: unforcedErrors },
      { label: `Winners: ${winners}/10`,                key: 'winners',        val: winners },
      { label: `Shot Placement: ${shotPlacement}/10`,   key: 'shotPlacement',  val: shotPlacement },
      { label: `Shot Selection: ${shotSelection}/10`,   key: 'shotSelection',  val: shotSelection },
    ];
    return (
      <ScrollView contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled">
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

        {/* Pre Match Game Plan */}
        <Text style={styles.sectionLabel}>Pre Match Game Plan</Text>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => this.setState((prev) => ({ preMatchPlanSet: !prev.preMatchPlanSet }))}
        >
          <MaterialIcons
            name={preMatchPlanSet ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={preMatchPlanSet ? '#2196F3' : '#aaa'}
          />
          <Text style={[styles.checkLabel, preMatchPlanSet && { color: '#2196F3' }]}>
            {preMatchPlanSet ? 'Game plan confirmed ✓' : 'Tap to confirm you have a game plan'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.gamePlanInput}
          multiline
          numberOfLines={4}
          placeholder="Describe your game plan, tactical focus areas, opponent tendencies..."
          placeholderTextColor="#aaa"
          value={gamePlan}
          onChangeText={(t) => this.setState({ gamePlan: t })}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: '#2196F3', marginTop: 12, paddingVertical: 12, alignItems: 'center' }]}
          onPress={() => this.props.onSave({ unforcedErrors, winners, shotPlacement, shotSelection, gamePlan, preMatchPlanSet })}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save Tactical Evaluation</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

// ─── Mental Tab ───────────────────────────────────────────────────────────────

class MentalTab extends Component {
  constructor(props) {
    super(props);
    const p = props.prevValues || {};
    this.state = {
      attitude: p.attitude || 5,
      effort:   p.effort   || 5,
      nerves:   p.nerves   || 5,
    };
  }

  render() {
    const { attitude, effort, nerves } = this.state;
    const metrics = [
      { label: `Attitude: ${attitude}/10`, key: 'attitude', val: attitude, colour: '#9C27B0' },
      { label: `Effort: ${effort}/10`,     key: 'effort',   val: effort,   colour: '#E91E63' },
      { label: `Nerves: ${nerves}/10`,     key: 'nerves',   val: nerves,   colour: '#FF5722' },
    ];
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <Text style={styles.sectionLabel}>Mental Performance — LOW ← slide → HIGH</Text>
        {metrics.map((item) => (
          <View key={item.key} style={styles.ratingBlock}>
            <View style={styles.ratingLabelRow}>
              <Text style={styles.sliderLabel}>{item.label}</Text>
              <View style={styles.scaleBadge}>
                <Text style={[styles.scaleBadgeText, { color: item.colour }]}>{item.val}/10</Text>
              </View>
            </View>
            <View style={styles.scaleLabelRow}>
              <Text style={styles.scaleEnd}>LOW</Text>
              <Slider
                value={item.val}
                onValueChange={(v) => this.setState({ [item.key]: Math.round(v) })}
                minimumValue={1} maximumValue={10} step={1}
                thumbTintColor={item.colour} minimumTrackTintColor={item.colour}
                style={{ flex: 1, marginHorizontal: 8 }}
              />
              <Text style={styles.scaleEnd}>HIGH</Text>
            </View>
          </View>
        ))}

        <View style={styles.coachHint}>
          <Text style={styles.coachHintTitle}> Virtual Coach Tip</Text>
          <Text style={styles.coachHintText}>
            Rate your nerves honestly — managing nerves is the #1 factor in match performance!
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: '#9C27B0', marginTop: 20, paddingVertical: 12, alignItems: 'center' }]}
          onPress={() => this.props.onSave({ attitude, effort, nerves })}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save Mental Evaluation</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

// ─── Main EvaluationScreen ────────────────────────────────────────────────────

const TABS = ['Physical', 'Tactical', 'Mental'];

export class EvaluationScreen extends Component {
  state = {
    activeTab: 0,
    saved: { physical: false, tactical: false, mental: false },
    prevPhysical: null,
    prevTactical: null,
    prevMental: null,
    loadingPrev: true,
  };

  componentDidMount() {
    this.loadPrevEvaluations();
  }

  loadPrevEvaluations = async () => {
    const user = auth.currentUser;
    if (!user) { this.setState({ loadingPrev: false }); return; }
    try {
      const snap = await getDocs(
        query(collection(db, 'evaluations', user.uid, 'sessions'), orderBy('timestamp', 'desc'), limit(20))
      );
      let prevPhysical = null, prevTactical = null, prevMental = null;
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.section === 'physical' && !prevPhysical) prevPhysical = d.data;
        if (d.section === 'tactical' && !prevTactical) prevTactical = d.data;
        if (d.section === 'mental'   && !prevMental)   prevMental   = d.data;
      });
      this.setState({ prevPhysical, prevTactical, prevMental, loadingPrev: false });
    } catch (e) {
      this.setState({ loadingPrev: false });
    }
  };

  saveSection = (section, data) => {
    const user = auth.currentUser;
    if (!user) return;
    addDoc(collection(db, 'evaluations', user.uid, 'sessions'), { section, data, timestamp: serverTimestamp() })
      .then(() => {
        this.setState((prev) => ({ saved: { ...prev.saved, [section]: true } }));
        const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
        // Offer AI Feedback after saving
        Alert.alert(
          '✅ Saved!',
          `${sectionLabel} evaluation saved. Would you like personalised AI coaching advice based on your results?`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Get AI Feedback',
              onPress: () => {
                const prompt = `I just saved my ${sectionLabel.toLowerCase()} evaluation. Please give me personalised coaching advice based on my latest ${sectionLabel.toLowerCase()} scores.`;
                this.props.navigation.navigate('AICoachScreen', { initialPrompt: prompt });
              },
            },
          ]
        );
        // Notify coach that player submitted an evaluation
        const playerName = user.displayName || user.email || 'Your player';
        getCoachPushToken(user.email)
          .then((token) => sendPushNotification(token, 'New Evaluation Submitted', `${playerName} submitted their ${sectionLabel} evaluation`))
          .catch(() => {});
      })
      .catch(() => Alert.alert('Error', 'Could not save. Please check your connection.'));
  };

  render() {
    const { activeTab, loadingPrev, prevPhysical, prevTactical, prevMental } = this.state;

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

        {loadingPrev ? null : (
          <>
            {activeTab === 0 && <PhysicalTab prevValues={prevPhysical} onSave={(d) => this.saveSection('physical', d)} />}
            {activeTab === 1 && <TacticalTab prevValues={prevTactical} onSave={(d) => this.saveSection('tactical', d)} />}
            {activeTab === 2 && <MentalTab   prevValues={prevMental}   onSave={(d) => this.saveSection('mental', d)} />}
          </>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#008000' },
  tabLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  tabLabelActive: { color: '#008000', fontWeight: 'bold' },
  tabContent: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 12, marginTop: 8 },

  // Colour selector
  colourRow: { flexDirection: 'row', marginBottom: 16 },
  colourChip: {
    alignItems: 'center', backgroundColor: 'white', borderRadius: 10,
    padding: 10, marginRight: 12, borderWidth: 1, borderColor: '#ddd', minWidth: 70,
  },

  // Body diagram
  bodyDiagram: { marginBottom: 20 },
  bodyRegion: { marginBottom: 10 },
  bodyRegionLabel: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 6 },
  bodyRegionMuscles: { flexDirection: 'row', flexWrap: 'wrap' },
  muscleChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eee', borderRadius: 8, paddingVertical: 6,
    paddingHorizontal: 10, margin: 4, borderWidth: 1, borderColor: '#ddd',
  },
  muscleText: { fontSize: 12, color: '#333' },

  // Rating blocks
  ratingBlock: { marginBottom: 18, backgroundColor: 'white', borderRadius: 12, padding: 14, elevation: 1 },
  ratingLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sliderLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  ratingValue: { fontSize: 14, fontWeight: 'bold' },
  sliderRow: { marginBottom: 18 },

  // Mental scale labels
  scaleLabelRow: { flexDirection: 'row', alignItems: 'center' },
  scaleEnd: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  scaleBadge: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  scaleBadgeText: { fontSize: 12, fontWeight: 'bold' },

  // Tactical
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8 },
  checkLabel: { fontSize: 14, color: '#555', marginLeft: 8, flex: 1 },
  gamePlanInput: {
    backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 14,
    color: '#222', minHeight: 110, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#eee', elevation: 1, marginBottom: 8,
  },

  saveBtn: { backgroundColor: '#008000', borderRadius: 12 },
  coachHint: { backgroundColor: '#fff3e0', borderRadius: 12, padding: 14, marginTop: 16, borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  coachHintTitle: { fontWeight: 'bold', color: '#E65100', marginBottom: 4 },
  coachHintText: { color: '#555', fontSize: 13 },
});

export default EvaluationScreen;
