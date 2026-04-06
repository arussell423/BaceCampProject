import React, { Component } from 'react';
import {
  View, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Text, Icon, Button } from 'react-native-elements';
import firebase from 'firebase';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EVENT_TYPES = [
  { label: 'Training', colour: '#1565C0', bg: '#e3f2fd' },
  { label: 'Competition', colour: '#2E7D32', bg: '#e8f5e9' },
  { label: 'Other', colour: '#E65100', bg: '#fff3e0' },
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export class ScheduleScreen extends Component {
  static navigationOptions = { headerShown: false };

  state = {
    today: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    events: {},            // { 'YYYY-MM-DD': [{ title, type }] }
    selectedDate: null,
    showAddModal: false,
    newEventTitle: '',
    newEventType: 'Training',
    loading: false,
  };

  componentDidMount() {
    this.loadEvents();
  }

  loadEvents = async () => {
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
      const snap = await firebase.firestore()
        .collection('schedules')
        .doc(user.uid)
        .collection('events')
        .get();
      const events = {};
      snap.forEach((doc) => {
        const d = doc.data();
        if (!events[d.date]) events[d.date] = [];
        events[d.date].push({ id: doc.id, title: d.title, type: d.type });
      });
      this.setState({ events });
    } catch (e) { /* offline */ }
  };

  addEvent = async () => {
    const { selectedDate, newEventTitle, newEventType, events } = this.state;
    if (!newEventTitle.trim()) {
      Alert.alert('Enter a title', 'Please enter an event title.');
      return;
    }
    const user = firebase.auth().currentUser;
    if (!user) return;
    this.setState({ loading: true });
    try {
      const ref = await firebase.firestore()
        .collection('schedules').doc(user.uid)
        .collection('events')
        .add({ date: selectedDate, title: newEventTitle.trim(), type: newEventType });
      const updated = { ...events };
      if (!updated[selectedDate]) updated[selectedDate] = [];
      updated[selectedDate].push({ id: ref.id, title: newEventTitle.trim(), type: newEventType });
      this.setState({ events: updated, showAddModal: false, newEventTitle: '', loading: false });
    } catch (e) {
      this.setState({ loading: false });
      Alert.alert('Error', 'Could not save event.');
    }
  };

  deleteEvent = async (date, eventId) => {
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
      await firebase.firestore()
        .collection('schedules').doc(user.uid)
        .collection('events').doc(eventId).delete();
      const updated = { ...this.state.events };
      updated[date] = updated[date].filter((e) => e.id !== eventId);
      if (updated[date].length === 0) delete updated[date];
      this.setState({ events: updated });
    } catch (e) {
      Alert.alert('Error', 'Could not delete event.');
    }
  };

  prevMonth = () => {
    let { currentMonth, currentYear } = this.state;
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else currentMonth--;
    this.setState({ currentMonth, currentYear, selectedDate: null });
  };

  nextMonth = () => {
    let { currentMonth, currentYear } = this.state;
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else currentMonth++;
    this.setState({ currentMonth, currentYear, selectedDate: null });
  };

  formatDate = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  render() {
    const { today, currentMonth, currentYear, events, selectedDate, showAddModal, newEventTitle, newEventType, loading } = this.state;
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    const selectedEvents = selectedDate ? (events[selectedDate] || []) : [];

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <Icon name="arrow-back" type="material" color="#008000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={this.prevMonth}><Icon name="chevron-left" type="material" color="#008000" /></TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
            <TouchableOpacity onPress={this.nextMonth}><Icon name="chevron-right" type="material" color="#008000" /></TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={styles.dayLabels}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <Text key={d} style={styles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {Array(firstDay).fill(null).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dateStr = this.formatDate(currentYear, currentMonth, day);
              const dayEvents = events[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.dayCell, isToday && styles.today, isSelected && styles.selected]}
                  onPress={() => this.setState({ selectedDate: dateStr })}
                >
                  <Text style={[styles.dayNum, isToday && styles.todayText, isSelected && styles.selectedText]}>{day}</Text>
                  <View style={styles.dotRow}>
                    {dayEvents.slice(0, 3).map((ev, ei) => {
                      const typeObj = EVENT_TYPES.find((t) => t.label === ev.type) || EVENT_TYPES[2];
                      return <View key={ei} style={[styles.dot, { backgroundColor: typeObj.colour }]} />;
                    })}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {EVENT_TYPES.map((t) => (
              <View key={t.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: t.colour }]} />
                <Text style={styles.legendLabel}>{t.label}</Text>
              </View>
            ))}
          </View>

          {/* Selected day detail */}
          {selectedDate && (
            <View style={styles.dayDetail}>
              <View style={styles.dayDetailHeader}>
                <Text style={styles.dayDetailTitle}>{selectedDate}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => this.setState({ showAddModal: true })}
                >
                  <Icon name="add" type="material" color="white" size={20} />
                  <Text style={{ color: 'white', marginLeft: 4, fontWeight: '600' }}>Add Event</Text>
                </TouchableOpacity>
              </View>

              {selectedEvents.length === 0 ? (
                <Text style={styles.noEvents}>No events for this day. Tap + to add one.</Text>
              ) : (
                selectedEvents.map((ev) => {
                  const typeObj = EVENT_TYPES.find((t) => t.label === ev.type) || EVENT_TYPES[2];
                  return (
                    <View key={ev.id} style={[styles.eventRow, { backgroundColor: typeObj.bg, borderLeftColor: typeObj.colour }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.eventType, { color: typeObj.colour }]}>{ev.type}</Text>
                        <Text style={styles.eventTitle}>{ev.title}</Text>
                      </View>
                      <TouchableOpacity onPress={() => this.deleteEvent(selectedDate, ev.id)}>
                        <Icon name="delete-outline" type="material" color="#999" size={20} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Add Event Modal */}
        <Modal visible={showAddModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add Event — {selectedDate}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Event title (e.g. Practice match vs John)"
                value={newEventTitle}
                onChangeText={(t) => this.setState({ newEventTitle: t })}
              />
              <Text style={styles.typeLabel}>Event Type:</Text>
              <View style={styles.typeRow}>
                {EVENT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.label}
                    style={[styles.typeChip, { borderColor: t.colour }, newEventType === t.label && { backgroundColor: t.colour }]}
                    onPress={() => this.setState({ newEventType: t.label })}
                  >
                    <Text style={{ color: newEventType === t.label ? 'white' : t.colour, fontWeight: '600', fontSize: 13 }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtns}>
                <Button title="Cancel" type="outline" buttonStyle={{ borderColor: '#ccc' }} titleStyle={{ color: '#666' }} containerStyle={{ flex: 1, marginRight: 8 }} onPress={() => this.setState({ showAddModal: false, newEventTitle: '' })} />
                <Button title="Add" buttonStyle={{ backgroundColor: '#008000' }} containerStyle={{ flex: 1 }} loading={loading} onPress={this.addEvent} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  container: { padding: 16, paddingBottom: 40 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: 'grey', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100/7}%`, aspectRatio: 0.9, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayNum: { fontSize: 13, color: '#333' },
  dotRow: { flexDirection: 'row', marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, marginHorizontal: 1 },
  today: { backgroundColor: '#e8f5e9', borderRadius: 8 },
  todayText: { color: '#008000', fontWeight: 'bold' },
  selected: { backgroundColor: '#008000', borderRadius: 8 },
  selectedText: { color: 'white', fontWeight: 'bold' },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendLabel: { fontSize: 12, color: '#555' },
  dayDetail: { backgroundColor: 'white', borderRadius: 14, padding: 16, elevation: 1 },
  dayDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayDetailTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#008000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  noEvents: { color: 'grey', textAlign: 'center', paddingVertical: 20 },
  eventRow: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderRadius: 8, padding: 10, marginBottom: 8 },
  eventType: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  eventTitle: { fontSize: 14, color: '#333', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  textInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 16, backgroundColor: '#fafafa' },
  typeLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  typeRow: { flexDirection: 'row', marginBottom: 20 },
  typeChip: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  modalBtns: { flexDirection: 'row' },
});

export default ScheduleScreen;
