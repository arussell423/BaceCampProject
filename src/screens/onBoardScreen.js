import React, { Component } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import { Text, Button, Icon } from "react-native-elements";

const { width } = Dimensions.get("window");

const slides = [
  { key: "1", title: "Track Your Game",     text: "Log your performance evaluations after every match and training session.",         icon: "clipboard-list",   type: "material-community", color: "#1B5E20" },
  { key: "2", title: "Smart Training",      text: "Access pre-loaded workouts in Strength, Power, Speed, Footwork and Flexibility.", icon: "dumbbell",         type: "material-community", color: "#0D47A1" },
  { key: "3", title: "Plan Your Schedule",  text: "Keep your calendar organised with colour-coded training and competition days.",    icon: "calendar-month",   type: "material-community", color: "#E65100" },
];

export class onBoardScreen extends Component {
  state = { page: 0 };

  next = () => {
    const { page } = this.state;
    if (page < slides.length - 1) {
      this.setState({ page: page + 1 });
    } else {
      this.props.navigation.navigate("EmailInputScreen");
    }
  };

  render() {
    const { page } = this.state;
    const slide = slides[page];
    return (
      <View style={styles.container}>
        <Image source={require("../assets/image/bACE_CAMP-logo.png")} style={styles.logo} resizeMode="contain" />
        <View style={[styles.iconWrap, { backgroundColor: slide.color + "18", borderColor: slide.color }]}>
          <Icon name={slide.icon} type={slide.type} size={52} color={slide.color} />
        </View>
        <Text h3 style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button
          title={page < slides.length - 1 ? "Next" : "Get Started"}
          buttonStyle={styles.btn}
          titleStyle={{ fontWeight: "bold", fontSize: 18 }}
          containerStyle={{ width: width * 0.75, marginTop: 32 }}
          onPress={this.next}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA", alignItems: "center", justifyContent: "center", padding: 30 },
  logo: { width: 150, height: 50, marginBottom: 36 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", borderWidth: 1.5, marginBottom: 28 },
  title: { textAlign: "center", marginBottom: 14, color: "#1A1A1A" },
  text: { textAlign: "center", color: "#666", fontSize: 15, lineHeight: 24 },
  dotsRow: { flexDirection: "row", marginTop: 32 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ccc", marginHorizontal: 5 },
  dotActive: { backgroundColor: "#008000" },
  btn: { backgroundColor: "#008000", borderRadius: 12 },
});

export default onBoardScreen;
