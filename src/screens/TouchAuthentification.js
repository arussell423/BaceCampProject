import React, { Component } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export class TouchAuthentification extends Component {
  static navigationOptions = { headerShown: false };

  handleBiometric = () => {
    Alert.alert('Biometric Login', 'Fingerprint / Face ID authentication would be triggered here on a physical device.');
  };

  render() {
    return (
      <View style={styles.container}>
        <MaterialIcons name="fingerprint" size={80} color="#008000" />
        <Text style={[{fontSize:20,fontWeight:'bold'},styles.title]}>Enable Fingerprint Login</Text>
        <Text style={styles.subtitle}>
          Log in faster and more securely with your fingerprint or Face ID.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { width: 300, marginBottom: 16, paddingVertical: 12, alignItems: 'center' }]}
          onPress={this.handleBiometric}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: 'white' }}>Enable Biometrics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnOutline, { width: 300, paddingVertical: 12, alignItems: 'center' }]}
          onPress={() => this.props.navigation.navigate('SelectProfileScreen')}
        >
          <Text style={{ fontSize: 16, color: '#008000' }}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA', alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { textAlign: 'center', marginTop: 20, marginBottom: 12 },
  subtitle: { color: 'grey', textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 40 },
  btn: { backgroundColor: '#008000', borderRadius: 12 },
  btnOutline: { borderColor: '#008000', borderRadius: 12 },
});

export default TouchAuthentification;
