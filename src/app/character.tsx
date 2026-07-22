import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";

const classes = [
  {
    id: "warrior",
    emoji: "🛡️",
    title: "Warrior",
    desc: "High Health • Balanced Attack",
  },
  {
    id: "mage",
    emoji: "🧙",
    title: "Mage",
    desc: "High Magic • Low Health",
  },
  {
    id: "archer",
    emoji: "🏹",
    title: "Archer",
    desc: "Fast • Accurate",
  },
  {
    id: "assassin",
    emoji: "🥷",
    title: "Assassin",
    desc: "Critical Damage • Agile",
  },
];

export default function CharacterScreen() {
  const [selected, setSelected] = useState("");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0F172A",
        padding: 24,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 32,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        ⚔️ Choose Your Class
      </Text>

      <Text
        style={{
          color: "#94A3B8",
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        Every hero begins with a class.
      </Text>

      {classes.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => setSelected(item.id)}
          style={{
            backgroundColor:
              selected === item.id ? "#7C3AED" : "#1E293B",
            padding: 18,
            borderRadius: 14,
            marginBottom: 15,
            borderWidth: 1,
            borderColor:
              selected === item.id ? "#A78BFA" : "#334155",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "bold",
            }}
          >
            {item.emoji} {item.title}
          </Text>

          <Text
            style={{
              color: "#CBD5E1",
              marginTop: 6,
            }}
          >
            {item.desc}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        disabled={!selected}
        onPress={() => router.replace("/home")}
        style={{
          backgroundColor: selected ? "#7C3AED" : "#475569",
          padding: 18,
          borderRadius: 14,
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}