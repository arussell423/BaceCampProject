import React, { Component } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, Image } from 'react-native-elements';

const { width } = Dimensions.get('window');

const slides = [
  { key: '1', title: 'Track Your Game', text: 'Log your performance evaluations after every match and training session.', emoji: '🎾' },
  { key: '2', title: 'Smart Training', text: 'Access pre-loaded workouts in Strength, Power, Speed, Footwork and Flexibility.', emoji: '💪' },
  { key: '3', title: 'Plan Your Schedule', text: 'Keep your calendar organised with colour-coded training and competition days.', emoji: '📅' },
];

export class onBoardScreen extends Component {
  static navigationOptions = { headerShown: false };
  state = { page: 0 };

  next = () => {
    const { page } = this.state;
    if (page < slides.length - 1) {
      this.setState({ page: page + 1 });
    } else {
      this.props.navigation.navigate('EmailInputScreen');
    }
  };

  render() {
    const { page } = this.state;
    const slide = slides[page];
    return (
      <View style={styles.container}>
        <Image source={require('../assets/image/bACE_CAMP-logo.png')} style={styles.logo} />
        <Text style={{ fontSize: 80, marginBottom: 20 }}>{slide.emoji}</Text>
        <Text h3 style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button
          title={page < slides.length - 1 ? 'Next' : 'Get Started'}
          buttonStyle={styles.btn}
          titleStyle={{ fontWeight: 'bold', fontSize: 18 }}
          containerStyle={{ width: width * 0.7, marginTop: 30 }}
          onPress={this.next}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA', alignItems: 'center', justifyContent: 'center', padding: 30 },
  logo: { width: 120, height: 60, resizeMode: 'contain', marginBottom: 30 },
  title: { textAlign: 'center', marginBottom: 16 },
  text: { textAlign: 'center', color: 'grey', fontSize: 16, lineHeight: 24 },
  dotsRow: { flexDirection: 'row', marginTop: 30 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ccc', marginHorizontal: 5 },
  dotActive: { backgroundColor: '#008000' },
  btn: { backgroundColor: '#008000', borderRadius: 12 },
});

export default onBoardScreen;
