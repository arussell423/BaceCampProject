import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-elements';

const goals = [
  { key: 'improve_fitness', label: 'Improve Fitness', emoji: '💪' },
  { key: 'win_tournaments', label: 'Win Tournaments', emoji: '🏆' },
  { key: 'track_performance', label: 'Track Performance', emoji: '📊' },
  { key: 'better_technique', label: 'Better Technique', emoji: '🎾' },
  { key: 'mental_strength', label: 'Mental Strength', emoji: '🧠' },
  { key: 'injury_recovery', label: 'Injury Recovery', emoji: '🩹' },
];

export class SetGoalScreen extends Component {
  static navigationOptions = { headerShown: false };
  state = { selected: [] };

  toggle = (key) => {
    const { selected } = this.state;
    this.setState({
      selected: selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key],
    });
  };

  render() {
    const { selected } = this.state;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text h3 style={styles.title}>Set Your Goals</Text>
        <Text style={styles.subtitle}>Choose one or more goals (you can change these later)</Text>
        <View style={styles.grid}>
          {goals.map((g) => {
            const active = selected.includes(g.key);
            return (
              <TouchableOpacity key={g.key} style={[styles.card, active && styles.cardActive]} onPress={() => this.toggle(g.key)}>
                <Text style={styles.emoji}>{g.emoji}</Text>
                <Text style={[styles.label, active && styles.labelActive]}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Button
          title="Continue"
          disabled={selected.length === 0}
          buttonStyle={styles.btn}
          titleStyle={{ fontWeight: 'bold', fontSize: 18 }}
          containerStyle={{ width: 300, marginTop: 20 }}
          onPress={() => this.props.navigation.navigate('CustomizeInterest')}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F4F6FA', alignItems: 'center', padding: 30, paddingTop: 60 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { color: 'grey', textAlign: 'center', marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  card: { width: 140, height: 100, backgroundColor: 'white', borderRadius: 12, margin: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ddd' },
  cardActive: { borderColor: '#008000', backgroundColor: '#e8f5e9' },
  emoji: { fontSize: 32 },
  label: { marginTop: 6, fontSize: 13, color: '#333', textAlign: 'center' },
  labelActive: { color: '#008000', fontWeight: 'bold' },
  btn: { backgroundColor: '#008000', borderRadius: 12 },
});

export default SetGoalScreen;
