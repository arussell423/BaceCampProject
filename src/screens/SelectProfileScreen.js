import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon, Image } from 'react-native-elements';

export class SelectProfileScreen extends Component {
  static navigationOptions = { headerShown: false };

  selectRole = (role) => {
    this.props.navigation.navigate('HomeScreen', { role });
  };

  render() {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/image/bACE_CAMP-logo.png')}
          style={styles.logo}
        />
        <Text h4 style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>Select your profile type to get started</Text>

        <View style={styles.cardsRow}>
          <TouchableOpacity style={styles.card} onPress={() => this.selectRole('player')}>
            <Icon name="person" type="material" size={60} color="#008000" />
            <Text h4 style={styles.cardTitle}>Player</Text>
            <Text style={styles.cardDesc}>Track your performance, training and wellness</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => this.selectRole('coach')}>
            <Icon name="people" type="material" size={60} color="#008000" />
            <Text h4 style={styles.cardTitle}>Coach</Text>
            <Text style={styles.cardDesc}>Manage your players, send feedback and training</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: { width: 120, height: 80, marginBottom: 20, resizeMode: 'contain' },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { color: 'grey', textAlign: 'center', marginBottom: 40 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { marginTop: 10, textAlign: 'center' },
  cardDesc: { color: 'grey', textAlign: 'center', fontSize: 12, marginTop: 6 },
});

export default SelectProfileScreen;
