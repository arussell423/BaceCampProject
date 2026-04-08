import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Text } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const interests = [
  { key: "singles",     label: "Singles",           icon: "account",           type: "material-community", color: "#1B5E20" },
  { key: "doubles",     label: "Doubles",           icon: "account-group",     type: "material-community", color: "#0D47A1" },
  { key: "strength",    label: "Strength Training", icon: "dumbbell",          type: "material-community", color: "#B71C1C" },
  { key: "speed",       label: "Speed Drills",      icon: "timer-outline",     type: "material-community", color: "#E65100" },
  { key: "nutrition",   label: "Nutrition",         icon: "food-apple-outline",type: "material-community", color: "#2E7D32" },
  { key: "mental",      label: "Mental Training",   icon: "head-cog-outline",  type: "material-community", color: "#4527A0" },
  { key: "footwork",    label: "Footwork",          icon: "shoe-sneaker",      type: "material-community", color: "#006064" },
  { key: "flexibility", label: "Flexibility",       icon: "yoga",              type: "material-community", color: "#37474F" },
];

export class CustomizeInterest extends Component {
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
        <Text style={[{fontSize:20,fontWeight:'bold'},styles.title]}>Your Interests</Text>
        <Text style={styles.subtitle}>Select topics you would like to focus on</Text>
        <View style={styles.grid}>
          {interests.map((item) => {
            const active = selected.includes(item.key);
            return (
              <TouchableOpacity key={item.key} style={[styles.card, active && { borderColor: item.color, backgroundColor: item.color + "12" }]} onPress={() => this.toggle(item.key)}>
                <MaterialCommunityIcons name={item.icon} size={30} color={active ? item.color : "#999"} />
                <Text style={[styles.label, active && { color: item.color, fontWeight: "700" }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.btn, { width: 300, marginTop: 20, paddingVertical: 12, alignItems: 'center' }, selected.length === 0 && { opacity: 0.5 }]}
          disabled={selected.length === 0}
          onPress={() => this.props.navigation.navigate("SelectGender")}
        >
          <Text style={{ fontWeight: "bold", fontSize: 18, color: '#fff' }}>Continue</Text>
        </TouchableOpacity>
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

export default CustomizeInterest;
