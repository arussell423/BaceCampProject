import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-elements';

const interests = [
  { key: 'singles', label: 'Singles', emoji: '🧍' },
  { key: 'doubles', label: 'Doubles', emoji: '👥' },
  { key: 'strength', label: 'Strength Training', emoji: '🏋️' },
  { key: 'speed', label: 'Speed Drills', emoji: '⚡' },
  { key: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { key: 'mental', label: 'Mental Training', emoji: '🧘' },
  { key: 'footwork', label: 'Footwork', emoji: '👟' },
  { key: 'flexibility', label: 'Flexibility', emoji: '🤸' },
];

export class CustomizeInterest extends Component {
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
        <Text h3 style={styles.title}>Your Interests</Text>
        <Text style={styles.subtitle}>Select topics you'd like to focus on</Text>
        <View style={styles.grid}>
          {interests.map((item) => {
            const active = selected.includes(item.key);
            return (
              <TouchableOpacity key={item.key} style={[styles.card, active && styles.cardActive]} onPress={() => this.toggle(item.key)}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
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
          onPress={() => this.props.navigation.navigate('SelectGender')}
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

export default CustomizeInterest;
