import React, { Component } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Icon } from 'react-native-elements';

export class TouchAuthentification extends Component {
  static navigationOptions = { headerShown: false };

  handleBiometric = () => {
    Alert.alert('Biometric Login', 'Fingerprint / Face ID authentication would be triggered here on a physical device.');
  };

  render() {
    return (
      <View style={styles.container}>
        <Icon name="fingerprint" type="material" size={80} color="#008000" />
        <Text h3 style={styles.title}>Enable Fingerprint Login</Text>
        <Text style={styles.subtitle}>
          Log in faster and more securely with your fingerprint or Face ID.
        </Text>
        <Button
          title="Enable Biometrics"
          buttonStyle={styles.btn}
          titleStyle={{ fontWeight: 'bold', fontSize: 18 }}
          containerStyle={{ width: 300, marginBottom: 16 }}
          onPress={this.handleBiometric}
        />
        <Button
          title="Skip for now"
          type="outline"
          buttonStyle={styles.btnOutline}
          titleStyle={{ fontSize: 16, color: '#008000' }}
          containerStyle={{ width: 300 }}
          onPress={() => this.props.navigation.navigate('SelectProfileScreen')}
        />
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
