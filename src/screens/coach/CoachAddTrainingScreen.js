import React, { Component } from 'react';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert,
  ScrollView, ActivityIndicator, Text, Modal, FlatList, Platform,
  Switch, Pressable,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../../components/AppHeader';
import { auth, db } from '../../components/Firebase';
import {
  collection, addDoc, serverTimestamp, getDocs, query, orderBy, writeBatch, doc,
} from 'firebase/firestore';
import { getPlayerPushToken, sendPushNotification } from '../../services/notificationService';
import { BUILT_IN_DRILLS, getCoachDrills, saveTemplate, getTemplates, deleteTemplate } from '../../services/drillLibrary';

const CATEGORIES = ['Speed', 'Strength', 'Power', 'Footwork', 'Flexibility'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const DIFF_COLORS = { Beginner: '#4CAF50', Intermediate: '#FF9800', Advanced: '#F44336' };

function rpeLabel(v) {
  if (v <= 3) return 'Easy';
  if (v <= 5) return 'Moderate';
  if (v <= 7) return 'Hard';
  return 'Max Effort';
}

export class CoachAddTrainingScreen extends Component {
  state = {
    title: '',
    category: 'Speed',
    difficulty: 'Intermediate',
    rpe: 6,
    description: '',
    videoUrl: '',
    coachNotes: '',
    scheduledDate: '',
    exercises: [],
    assignAll: false,
    saving: false,
    saved: false,
    // Modals
    showDrillModal: false,
    drillFilter: 'All',
    builtInDrills: BUILT_IN_DRILLS,
    customDrills: [],
    // Templates
    showTemplateModal: false,
    templates: [],
    loadingTemplates: false,
    savingTemplate: false,
  };

  get playerUid() { return this.props.route?.params?.playerUid ?? ''; }
  get playerEmail() { return this.props.route?.params?.playerEmail ?? ''; }
  get playerName() { return this.props.route?.params?.playerName ?? this.playerEmail; }

  componentDidMount() {
    this._loadCustomDrills();
    const tmpl = this.props.route?.params?.loadTemplate;
    if (tmpl) this._applyTemplate(tmpl);
  }

  _loadCustomDrills = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const custom = await getCoachDrills(user.uid).catch(() => []);
    this.setState({ customDrills: custom });
  };

  _openTemplateModal = async () => {
    this.setState({ showTemplateModal: true, loadingTemplates: true });
    const user = auth.currentUser;
    if (!user) { this.setState({ loadingTemplates: false }); return; }
    const templates = await getTemplates(user.uid).catch(() => []);
    this.setState({ templates, loadingTemplates: false });
  };

  _applyTemplate = (tmpl) => {
    this.setState({
      title: tmpl.title || '',
      category: tmpl.category || 'Speed',
      difficulty: tmpl.difficulty || 'Intermediate',
      rpe: tmpl.rpe || 6,
      description: tmpl.description || '',
      exercises: (tmpl.exercises || []).map((e) => ({ ...e })),
      coachNotes: tmpl.coachNotes || '',
      videoUrl: tmpl.videoUrl || '',
    });
    this.setState({ showTemplateModal: false });
  };

  _saveAsTemplate = async () => {
    const { title, category, difficulty, rpe, description, exercises, coachNotes, videoUrl } = this.state;
    if (!title.trim()) { Alert.alert('Missing Title', 'Add a title before saving as template.'); return; }
    const user = auth.currentUser;
    if (!user) return;
    this.setState({ savingTemplate: true });
    try {
      await saveTemplate(user.uid, { title: title.trim(), category, difficulty, rpe, description, exercises, coachNotes, videoUrl });
      Alert.alert('Template Saved', `"${title.trim()}" saved to your template library.`);
    } catch (e) {
      Alert.alert('Error', 'Could not save template.');
    }
    this.setState({ savingTemplate: false });
  };

  _addExerciseFromDrill = (drill) => {
    const ex = {
      _key: Date.now() + Math.random(),
      name: drill.name,
      sets: String(drill.defaultSets || 3),
      reps: String(drill.defaultReps || 10),
      rest: drill.defaultRest || '45s',
      duration: drill.defaultDuration || '',
      notes: drill.description || '',
    };
    this.setState((prev) => ({ exercises: [...prev.exercises, ex], showDrillModal: false }));
  };

  _addBlankExercise = () => {
    const ex = { _key: Date.now(), name: '', sets: '3', reps: '10', rest: '45s', duration: '', notes: '' };
    this.setState((prev) => ({ exercises: [...prev.exercises, ex] }));
  };

  _updateExercise = (key, field, value) => {
    this.setState((prev) => ({
      exercises: prev.exercises.map((e) => e._key === key ? { ...e, [field]: value } : e),
    }));
  };

  _removeExercise = (key) => {
    this.setState((prev) => ({ exercises: prev.exercises.filter((e) => e._key !== key) }));
  };

  _detectYouTube = (url) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  _getYouTubeThumbnail = (url) => {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  addTraining = async () => {
    const { title, category, description, videoUrl, difficulty, rpe, exercises, coachNotes, scheduledDate, assignAll } = this.state;
    if (!title.trim()) { Alert.alert('Missing Title', 'Please enter a training title.'); return; }
    const user = auth.currentUser;
    if (!user) return;

    let scheduledTs = null;
    if (scheduledDate.trim()) {
      const parsed = new Date(scheduledDate.trim());
      if (isNaN(parsed.getTime())) { Alert.alert('Invalid Date', 'Use format YYYY-MM-DD (e.g. 2026-04-15).'); return; }
      scheduledTs = parsed.toISOString();
    }

    this.setState({ saving: true });
    try {
      const payload = {
        title: title.trim(),
        category,
        difficulty,
        rpe,
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        coachNotes: coachNotes.trim(),
        exercises: exercises.map(({ _key, ...rest }) => rest),
        coachUid: user.uid,
        scheduledDate: scheduledTs,
        status: 'pending',
        timestamp: serverTimestamp(),
      };

      if (assignAll) {
        const rosterSnap = await getDocs(collection(db, 'playerRosters', user.uid, 'players'));
        const activePlayers = rosterSnap.docs.filter((d) => d.data().uid && !d.data().invited);
        if (activePlayers.length === 0) { Alert.alert('No Players', 'No active players on your roster.'); this.setState({ saving: false }); return; }
        await Promise.all(activePlayers.map((pd) =>
          addDoc(collection(db, 'coachTraining', pd.data().uid, 'sessions'), { ...payload, assignedTo: 'all' })
            .then(() => {
              getPlayerPushToken(pd.data().uid)
                .then((t) => sendPushNotification(t, 'New Training Plan', `Coach assigned: ${title.trim()}`))
                .catch(() => {});
            })
        ));
        Alert.alert('Done!', `Training assigned to ${activePlayers.length} players.`);
      } else {
        if (!this.playerUid) { Alert.alert('No Player', 'No player selected.'); this.setState({ saving: false }); return; }
        await addDoc(collection(db, 'coachTraining', this.playerUid, 'sessions'), { ...payload, assignedTo: 'player' });
        getPlayerPushToken(this.playerUid)
          .then((t) => sendPushNotification(t, 'New Training Plan', `Your coach added: ${title.trim()}`))
          .catch(() => {});
        Alert.alert('Success', 'Training assigned!');
      }

      this.setState({ title: '', description: '', videoUrl: '', coachNotes: '', scheduledDate: '', exercises: [], rpe: 6, saving: false, saved: true });
      setTimeout(() => this.setState({ saved: false }), 3000);
    } catch (e) {
      Alert.alert('Error', 'Could not assign training.');
      this.setState({ saving: false });
    }
  };

  _renderDrillModal() {
    const { showDrillModal, drillFilter, builtInDrills, customDrills } = this.state;
    const allDrills = [...builtInDrills, ...customDrills];
    const filtered = drillFilter === 'All' ? allDrills : allDrills.filter((d) => d.category === drillFilter);
    const filterCats = ['All', ...CATEGORIES];

    return (
      <Modal visible={showDrillModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => this.setState({ showDrillModal: false })}>
        <SafeAreaView style={modal.container}>
          <View style={modal.header}>
            <Text style={modal.headerTitle}>Drill Library</Text>
            <TouchableOpacity onPress={() => this.setState({ showDrillModal: false })}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modal.filterBar}>
            {filterCats.map((cat) => (
              <TouchableOpacity key={cat} style={[modal.filterChip, drillFilter === cat && modal.filterChipActive]} onPress={() => this.setState({ drillFilter: cat })}>
                <Text style={[modal.filterLabel, drillFilter === cat && modal.filterLabelActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={modal.drillCard} onPress={() => this._addExerciseFromDrill(item)}>
                <View style={modal.drillCardRow}>
                  <Text style={modal.drillName}>{item.name}</Text>
                  <View style={[modal.catBadge, { backgroundColor: '#00800018', borderColor: '#008000' }]}>
                    <Text style={[modal.catBadgeText, { color: '#008000' }]}>{item.category}</Text>
                  </View>
                </View>
                <Text style={modal.drillMeta}>{item.defaultSets}×{item.defaultReps}  ·  Rest {item.defaultRest}  ·  {item.defaultDuration}</Text>
                <Text style={modal.drillDesc} numberOfLines={2}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={modal.customBtn} onPress={() => { this._addBlankExercise(); this.setState({ showDrillModal: false }); }}>
            <MaterialIcons name="add" size={18} color="#008000" />
            <Text style={modal.customBtnText}> Add Custom Exercise</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  _renderTemplateModal() {
    const { showTemplateModal, templates, loadingTemplates } = this.state;
    return (
      <Modal visible={showTemplateModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => this.setState({ showTemplateModal: false })}>
        <SafeAreaView style={modal.container}>
          <View style={modal.header}>
            <Text style={modal.headerTitle}>My Templates</Text>
            <TouchableOpacity onPress={() => this.setState({ showTemplateModal: false })}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {loadingTemplates ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#008000" />
          ) : templates.length === 0 ? (
            <View style={modal.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#ccc" />
              <Text style={modal.emptyText}>No templates saved yet.</Text>
              <Text style={modal.emptyHint}>Build a session and tap "Save as Template".</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={modal.templateCard} onPress={() => this._applyTemplate(item)}>
                  <View style={modal.drillCardRow}>
                    <Text style={modal.drillName}>{item.title}</Text>
                    {item.difficulty ? (
                      <View style={[modal.catBadge, { backgroundColor: (DIFF_COLORS[item.difficulty] || '#888') + '22', borderColor: DIFF_COLORS[item.difficulty] || '#888' }]}>
                        <Text style={[modal.catBadgeText, { color: DIFF_COLORS[item.difficulty] || '#888' }]}>{item.difficulty}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={modal.drillMeta}>{item.category}  ·  {(item.exercises || []).length} exercises  ·  RPE {item.rpe || '—'}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    );
  }

  render() {
    const { title, category, difficulty, rpe, description, videoUrl, coachNotes, scheduledDate, exercises, assignAll, saving, saved, savingTemplate } = this.state;
    const isYT = this._detectYouTube(videoUrl);

    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Add Training" homeScreen="CoachHomeScreen" />
        {this._renderDrillModal()}
        {this._renderTemplateModal()}

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Hero card */}
          <View style={styles.heroCard}>
            <MaterialCommunityIcons name="dumbbell" size={28} color="rgba(255,255,255,0.8)" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.heroTitle}>Assign Training Session</Text>
              <Text style={styles.heroSub}>{this.playerName || 'All Players'}</Text>
            </View>
            <TouchableOpacity style={styles.templateBtn} onPress={this._openTemplateModal}>
              <MaterialIcons name="library-books" size={16} color="white" />
              <Text style={styles.templateBtnText}> Templates</Text>
            </TouchableOpacity>
          </View>

          {/* Assignment toggle */}
          {!!this.playerUid && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>ASSIGN TO</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{assignAll ? 'All players on roster' : `${this.playerName || this.playerEmail}`}</Text>
                <View style={styles.toggleRight}>
                  <Text style={styles.toggleHint}>{assignAll ? 'All' : 'This player'}</Text>
                  <Switch
                    value={assignAll}
                    onValueChange={(v) => this.setState({ assignAll: v })}
                    trackColor={{ false: '#ddd', true: '#008000' }}
                    thumbColor="white"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Session details */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>SESSION DETAILS</Text>

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pre-Match Speed Block"
              placeholderTextColor="#aaa"
              value={title}
              onChangeText={(t) => this.setState({ title: t })}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => this.setState({ category: cat })}>
                  <Text style={[styles.chipLabel, category === cat && styles.chipLabelActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Difficulty</Text>
            <View style={styles.diffRow}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity key={d} style={[styles.diffChip, difficulty === d && { backgroundColor: DIFF_COLORS[d], borderColor: DIFF_COLORS[d] }]} onPress={() => this.setState({ difficulty: d })}>
                  <Text style={[styles.diffLabel, difficulty === d && { color: 'white', fontWeight: 'bold' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>RPE (Rate of Perceived Exertion)  <Text style={styles.rpeValue}>{rpe}/10 — {rpeLabel(rpe)}</Text></Text>
            <View style={styles.rpeRow}>
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <TouchableOpacity key={n} style={[styles.rpeBtn, rpe === n && styles.rpeBtnActive]} onPress={() => this.setState({ rpe: n })}>
                  <Text style={[styles.rpeBtnText, rpe === n && styles.rpeBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Scheduled Date (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD  e.g. 2026-04-15"
              placeholderTextColor="#aaa"
              value={scheduledDate}
              onChangeText={(t) => this.setState({ scheduledDate: t })}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />

            <Text style={styles.fieldLabel}>Session Notes (visible to player)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Warm-up instructions, focus points, context..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={(t) => this.setState({ description: t })}
            />
          </View>

          {/* Exercises */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionLabel}>EXERCISES  <Text style={styles.exerciseCount}>({exercises.length})</Text></Text>
              <TouchableOpacity style={styles.addExBtn} onPress={() => this.setState({ showDrillModal: true, drillFilter: category })}>
                <MaterialIcons name="add" size={16} color="white" />
                <Text style={styles.addExBtnText}> Add Drill</Text>
              </TouchableOpacity>
            </View>

            {exercises.length === 0 ? (
              <TouchableOpacity style={styles.emptyExCard} onPress={() => this.setState({ showDrillModal: true, drillFilter: category })}>
                <MaterialCommunityIcons name="weight-lifter" size={32} color="#ccc" />
                <Text style={styles.emptyExText}>Tap to add exercises from the drill library</Text>
              </TouchableOpacity>
            ) : (
              exercises.map((ex, idx) => (
                <View key={ex._key} style={styles.exCard}>
                  <View style={styles.exHeaderRow}>
                    <Text style={styles.exNum}>{idx + 1}</Text>
                    <TextInput
                      style={styles.exNameInput}
                      placeholder="Exercise name"
                      placeholderTextColor="#aaa"
                      value={ex.name}
                      onChangeText={(v) => this._updateExercise(ex._key, 'name', v)}
                    />
                    <TouchableOpacity onPress={() => this._removeExercise(ex._key)} style={styles.exDelete}>
                      <MaterialIcons name="delete-outline" size={20} color="#e53935" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.exFieldsRow}>
                    <View style={styles.exFieldGroup}>
                      <Text style={styles.exFieldLabel}>Sets</Text>
                      <TextInput style={styles.exFieldInput} value={ex.sets} onChangeText={(v) => this._updateExercise(ex._key, 'sets', v)} keyboardType="number-pad" />
                    </View>
                    <View style={styles.exFieldGroup}>
                      <Text style={styles.exFieldLabel}>Reps</Text>
                      <TextInput style={styles.exFieldInput} value={ex.reps} onChangeText={(v) => this._updateExercise(ex._key, 'reps', v)} keyboardType="number-pad" />
                    </View>
                    <View style={styles.exFieldGroup}>
                      <Text style={styles.exFieldLabel}>Rest</Text>
                      <TextInput style={styles.exFieldInput} value={ex.rest} onChangeText={(v) => this._updateExercise(ex._key, 'rest', v)} />
                    </View>
                    <View style={[styles.exFieldGroup, { flex: 1.4 }]}>
                      <Text style={styles.exFieldLabel}>Duration</Text>
                      <TextInput style={styles.exFieldInput} value={ex.duration} onChangeText={(v) => this._updateExercise(ex._key, 'duration', v)} placeholder="e.g. 20 min" />
                    </View>
                  </View>
                  <TextInput
                    style={styles.exNotesInput}
                    placeholder="Exercise notes (optional)"
                    placeholderTextColor="#bbb"
                    value={ex.notes}
                    onChangeText={(v) => this._updateExercise(ex._key, 'notes', v)}
                    multiline
                  />
                </View>
              ))
            )}
          </View>

          {/* Video */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>VIDEO REFERENCE</Text>
            <TextInput
              style={styles.input}
              placeholder="YouTube or Vimeo URL (optional)"
              placeholderTextColor="#aaa"
              value={videoUrl}
              onChangeText={(t) => this.setState({ videoUrl: t })}
              autoCapitalize="none"
              keyboardType="url"
            />
            {isYT && (
              <View style={styles.videoPreview}>
                <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
                <Text style={styles.videoPreviewText}> YouTube video linked ✓</Text>
              </View>
            )}
            {videoUrl.trim() && !isYT && (
              <Text style={styles.videoWarning}>⚠ Not detected as YouTube/Vimeo. Players will see a plain link.</Text>
            )}
          </View>

          {/* Coach notes */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>COACH NOTES <Text style={styles.coachNoteHint}>(not shown to player)</Text></Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Private notes, tactical cues, things to watch..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              value={coachNotes}
              onChangeText={(t) => this.setState({ coachNotes: t })}
            />
          </View>

          {/* Success banner */}
          {saved && (
            <View style={styles.savedBox}>
              <MaterialIcons name="check-circle" size={20} color="#008000" />
              <Text style={styles.savedText}> Training assigned successfully!</Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveTemplateBtn} onPress={this._saveAsTemplate} disabled={savingTemplate}>
              {savingTemplate
                ? <ActivityIndicator size="small" color="#008000" />
                : <><MaterialIcons name="bookmark-border" size={16} color="#008000" /><Text style={styles.saveTemplateBtnText}> Save Template</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, saving && styles.addBtnDisabled]} onPress={this.addTraining} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.addBtnText}>Assign Training</Text>}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
  container: { padding: 16, paddingBottom: 48 },

  heroCard: {
    backgroundColor: '#006400', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    elevation: 4, shadowColor: '#006400', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  heroTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  templateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  templateBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },

  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 12 },
  exerciseCount: { color: '#008000' },
  coachNoteHint: { fontSize: 10, color: '#aaa', fontWeight: '400', letterSpacing: 0 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#F8F9FB', borderRadius: 10, padding: 12, fontSize: 14,
    color: '#222', marginBottom: 14, borderWidth: 1, borderColor: '#EAECF0',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },

  chipRow: { marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F8F9FB' },
  chipActive: { backgroundColor: '#006400', borderColor: '#006400' },
  chipLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipLabelActive: { color: 'white', fontWeight: '700' },

  diffRow: { flexDirection: 'row', marginBottom: 14 },
  diffChip: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', marginRight: 6, backgroundColor: '#F8F9FB' },
  diffLabel: { fontSize: 12, color: '#555', fontWeight: '500' },

  rpeRow: { flexDirection: 'row', marginBottom: 14, flexWrap: 'wrap' },
  rpeBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 6, backgroundColor: '#F8F9FB' },
  rpeBtnActive: { backgroundColor: '#006400', borderColor: '#006400' },
  rpeBtnText: { fontSize: 12, color: '#555', fontWeight: '600' },
  rpeBtnTextActive: { color: 'white' },
  rpeValue: { color: '#008000', fontWeight: '700' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 14, color: '#222', fontWeight: '500', flex: 1 },
  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleHint: { fontSize: 12, color: '#888' },

  addExBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#006400', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addExBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },

  emptyExCard: { alignItems: 'center', paddingVertical: 28, borderWidth: 1.5, borderColor: '#eee', borderStyle: 'dashed', borderRadius: 12, gap: 8 },
  emptyExText: { fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 6 },

  exCard: { backgroundColor: '#F8F9FB', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EAECF0' },
  exHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  exNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#006400', color: 'white', textAlign: 'center', fontSize: 12, fontWeight: 'bold', lineHeight: 22, marginRight: 8 },
  exNameInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#222', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 },
  exDelete: { padding: 4 },
  exFieldsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  exFieldGroup: { flex: 1, alignItems: 'center' },
  exFieldLabel: { fontSize: 10, color: '#888', fontWeight: '600', marginBottom: 3 },
  exFieldInput: { width: '100%', backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#eee', padding: 6, fontSize: 13, textAlign: 'center', color: '#222' },
  exNotesInput: { backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#eee', padding: 8, fontSize: 12, color: '#555', minHeight: 36 },

  videoPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8f8', borderRadius: 8, padding: 10, marginTop: -6, marginBottom: 14 },
  videoPreviewText: { fontSize: 13, color: '#FF0000', fontWeight: '600' },
  videoWarning: { fontSize: 12, color: '#FF9800', marginTop: -6, marginBottom: 14 },

  savedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', borderRadius: 12, padding: 14, marginBottom: 12 },
  savedText: { color: '#008000', fontWeight: 'bold', fontSize: 14 },

  actionRow: { flexDirection: 'row', gap: 10 },
  saveTemplateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#008000', borderRadius: 12, paddingVertical: 14, backgroundColor: 'white' },
  saveTemplateBtnText: { color: '#008000', fontWeight: '700', fontSize: 14 },
  addBtn: { flex: 2, backgroundColor: '#006400', borderRadius: 12, paddingVertical: 14, alignItems: 'center', elevation: 2, shadowColor: '#006400', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  filterBar: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F8F9FB' },
  filterChipActive: { backgroundColor: '#006400', borderColor: '#006400' },
  filterLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterLabelActive: { color: 'white', fontWeight: '700' },
  drillCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  templateCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#006400', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  drillCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  drillName: { fontSize: 14, fontWeight: '700', color: '#222', flex: 1, marginRight: 8 },
  drillMeta: { fontSize: 12, color: '#888', marginBottom: 4 },
  drillDesc: { fontSize: 12, color: '#555', lineHeight: 17 },
  catBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  catBadgeText: { fontSize: 11, fontWeight: '600' },
  customBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#008000', borderRadius: 12, padding: 14 },
  customBtnText: { color: '#008000', fontWeight: '700', fontSize: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 12, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#aaa', marginTop: 6, textAlign: 'center' },
});

export default CoachAddTrainingScreen;
