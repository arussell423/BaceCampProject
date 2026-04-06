import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-elements';

const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export class SelectGender extends Component {
  static navigationOptions = { headerShown: false };
  state = { selected: null };

  render() {
    const { selected } = this.state;
    return (
      <View style={styles.container}>
        <Text h3 style={styles.title}>What is your gender?</Text>
        <Text style={styles.subtitle}>This helps us personalise your experience</Text>
        <View style={styles.optionsContainer}>
          {genders.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.option, selected === g && styles.optionSelected]}
              onPress={() => this.setState({ selected: g })}
            >
              <Text style={[styles.optionText, selected === g && styles.optionTextSelected]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title="Continue"
          disabled={!selected}
          buttonStyle={styles.btn}
          titleStyle={{ fontWeight: 'bold', fontSize: 18 }}
          containerStyle={{ width: 300, marginTop: 30 }}
          onPress={() => this.props.navigation.navigate('SelectProfileScreen')}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA', alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { color: 'grey', marginBottom: 30 },
  optionsContainer: { width: '100%' },
  option: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#ddd' },
  optionSelected: { borderColor: '#008000', backgroundColor: '#e8f5e9' },
  optionText: { fontSize: 16, textAlign: 'center', color: '#333' },
  optionTextSelected: { color: '#008000', fontWeight: 'bold' },
  btn: { backgroundColor: '#008000', borderRadius: 12 },
});

export default SelectGender;
