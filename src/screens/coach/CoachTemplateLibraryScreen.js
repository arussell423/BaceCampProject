import React, { Component } from 'react';
import {
  View, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, Text,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../../components/AppHeader';
import { auth } from '../../components/Firebase';
import { getTemplates, deleteTemplate } from '../../services/drillLibrary';

const DIFF_COLORS = { Beginner: '#4CAF50', Intermediate: '#FF9800', Advanced: '#F44336' };

export class CoachTemplateLibraryScreen extends Component {
  state = { templates: [], loading: true };

  componentDidMount() { this._load(); }

  _load = async () => {
    const user = auth.currentUser;
    if (!user) { this.setState({ loading: false }); return; }
    const templates = await getTemplates(user.uid).catch(() => []);
    this.setState({ templates, loading: false });
  };

  _delete = (tmpl) => {
    Alert.alert('Delete Template', `Delete "${tmpl.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const user = auth.currentUser;
        if (!user) return;
        await deleteTemplate(user.uid, tmpl.id).catch(() => {});
        this.setState((prev) => ({ templates: prev.templates.filter((t) => t.id !== tmpl.id) }));
      }},
    ]);
  };

  _use = (tmpl) => {
    this.props.navigation.navigate('CoachAddTrainingScreen', { loadTemplate: tmpl });
  };

  render() {
    const { templates, loading } = this.state;
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader navigation={this.props.navigation} title="Template Library" homeScreen="CoachHomeScreen" />
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#008000" />
        ) : templates.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No Templates Yet</Text>
            <Text style={styles.emptyHint}>Build a training session and tap "Save as Template" to reuse it anytime.</Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const dc = DIFF_COLORS[item.difficulty] || '#888';
              return (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardMeta}>{item.category}  ·  {(item.exercises || []).length} exercises  ·  RPE {item.rpe || '—'}</Text>
                    </View>
                    {item.difficulty ? (
                      <View style={[styles.diffBadge, { backgroundColor: dc + '22', borderColor: dc }]}>
                        <Text style={[styles.diffBadgeText, { color: dc }]}>{item.difficulty}</Text>
                      </View>
                    ) : null}
                  </View>
                  {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.useBtn} onPress={() => this._use(item)}>
                      <MaterialIcons name="play-arrow" size={16} color="white" />
                      <Text style={styles.useBtnText}> Use Template</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => this._delete(item)}>
                      <MaterialIcons name="delete-outline" size={18} color="#e53935" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
  list: { padding: 16, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#888', marginTop: 16 },
  emptyHint: { fontSize: 14, color: '#aaa', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4, borderLeftColor: '#006400',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 3 },
  cardDesc: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 12 },
  diffBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  diffBadgeText: { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  useBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#006400', borderRadius: 10, paddingVertical: 10, marginRight: 8 },
  useBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  deleteBtn: { padding: 10, backgroundColor: '#FFF0F0', borderRadius: 10, borderWidth: 1, borderColor: '#FFCDD2' },
});

export default CoachTemplateLibraryScreen;
