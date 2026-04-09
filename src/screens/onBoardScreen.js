import React, { Component, createRef } from "react";
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, Text, ScrollView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const slides = [
  { key: "1", title: "Track Your Game",    text: "Log your performance evaluations after every match and training session.",         icon: "clipboard-list",  color: "#1B5E20" },
  { key: "2", title: "Smart Training",     text: "Access pre-loaded workouts in Strength, Power, Speed, Footwork and Flexibility.", icon: "dumbbell",        color: "#0D47A1" },
  { key: "3", title: "Plan Your Schedule", text: "Keep your calendar organised with colour-coded training and competition days.",    icon: "calendar-month",  color: "#E65100" },
];

export class onBoardScreen extends Component {
  state = { page: 0 };
  scrollRef = createRef();

  goToPage = (page) => {
    this.scrollRef.current?.scrollTo({ x: page * width, animated: true });
    this.setState({ page });
  };

  onScroll = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== this.state.page) this.setState({ page });
  };

  onScrollEnd = (e) => {
    this.onScroll(e);
  };

  next = () => {
    const { page } = this.state;
    if (page < slides.length - 1) {
      this.goToPage(page + 1);
    } else {
      this.props.navigation.navigate("EmailInputScreen");
    }
  };

  render() {
    const { page } = this.state;
    return (
      <View style={styles.root}>
        {/* Hero logo */}
        <Image
          source={require("../assets/image/bACE_CAMP-logo-transparent.png")}
          style={styles.heroLogo}
          resizeMode="contain"
        />

        {/* Horizontal swipeable slides */}
        <ScrollView
          ref={this.scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={this.onScrollEnd}
          onScroll={this.onScroll}
          scrollEventThrottle={200}
          snapToInterval={width}
          decelerationRate="fast"
          style={styles.carousel}
          contentContainerStyle={{ width: width * slides.length }}
        >
          {slides.map((s) => (
            <View key={s.key} style={styles.slide}>
              <View style={[styles.iconCircle, { borderColor: s.color, backgroundColor: s.color + "18" }]}>
                <MaterialCommunityIcons name={s.icon} size={48} color={s.color} />
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.text}>{s.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => this.goToPage(i)}>
              <View style={[styles.dot, i === page && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={this.next}>
          <Text style={styles.btnText}>{page < slides.length - 1 ? "Next" : "Get Started"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.coachLink}
          onPress={() => this.props.navigation.navigate("LoginScreen")}
        >
          <Text style={styles.coachLinkText}>Already have an account? Sign in →</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#F4F6FA", alignItems: "center", justifyContent: "center", padding: 30 },
  heroLogo:   { width: width * 0.65, height: 120, marginBottom: 20 },
  carousel:   { width, flexGrow: 0 },
  slide:      { width, alignItems: "center", paddingHorizontal: 30, paddingVertical: 20 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", borderWidth: 2, marginBottom: 20 },
  title:      { textAlign: "center", marginBottom: 12, color: "#1A1A1A", fontWeight: "700", fontSize: 22 },
  text:       { textAlign: "center", color: "#666", fontSize: 15, lineHeight: 24, maxWidth: 300 },
  dotsRow:    { flexDirection: "row", marginTop: 24, marginBottom: 8 },
  dot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ccc", marginHorizontal: 5 },
  dotActive:  { backgroundColor: "#008000", width: 24 },
  btn:        { backgroundColor: "#008000", borderRadius: 12, width: width * 0.75, marginTop: 20, paddingVertical: 16, alignItems: "center" },
  btnText:    { color: "#fff", fontWeight: "bold", fontSize: 18 },
  coachLink:  { marginTop: 20, padding: 8 },
  coachLinkText: { color: "#008000", fontSize: 14, textDecorationLine: "underline" },
});

export default onBoardScreen;
