import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text, Button, Icon } from "react-native-elements";

const goals = [
  { key: "improve_fitness",   label: "Improve Fitness",    icon: "heart-pulse",         type: "material-community", color: "#C62828" },
  { key: "win_tournaments",   label: "Win Tournaments",    icon: "trophy-outline",      type: "material-community", color: "#F57F17" },
  { key: "track_performance", label: "Track Performance",  icon: "chart-line",          type: "material-community", color: "#1565C0" },
  { key: "better_technique",  label: "Better Technique",   icon: "tennis-ball",         type: "material-community", color: "#2E7D32" },
  { key: "mental_strength",   label: "Mental Strength",    icon: "head-cog-outline",    type: "material-community", color: "#4527A0" },
  { key: "injury_recovery",   label: "Injury Recovery",    icon: "bandage",             type: "material-community", color: "#00695C" },
];

export class SetGoalScreen extends Component {
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
        <Text style={styles.subtitle}>Choose one or more goals — you can change these later</Text>
        <View style={styles.grid}>
          {goals.map((g) => {
            const active = selected.includes(g.key);
            return (
              <TouchableOpacity key={g.key} style={[styles.card, active && { borderColor: g.color, backgroundColor: g.color + "12" }]} onPress={() => this.toggle(g.key)}>
                <Icon name={g.icon} type={g.type} size={30} color={active ? g.color : "#999"} />
                <Text style={[styles.label, active && { color: g.color, fontWeight: "700" }]}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Button
          title="Continue"
          disabled={selected.length === 0}
          buttonStyle={styles.btn}
          titleStyle={{ fontWeight: "bold", fontSize: 18 }}
          containerStyle={{ width: 300, marginTop: 20 }}
          onPress={() => this.props.navigation.navigate("CustomizeInterest")}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#F4F6FA", alignItems: "center", padding: 30, paddingTop: 60 },
  title: { textAlign: "center", marginBottom: 8 },
  subtitle: { color: "grey", textAlign: "center", marginBottom: 30 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  card: { width: 140, height: 110, backgroundColor: "white", borderRadius: 14, margin: 8, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#ddd" },
  label: { marginTop: 8, fontSize: 12, color: "#555", textAlign: "center" },
  btn: { backgroundColor: "#008000", borderRadius: 12 },
});

export default SetGoalScreen;
