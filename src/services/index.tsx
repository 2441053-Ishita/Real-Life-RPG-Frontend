import { View, Text, StyleSheet, StatusBar } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.logo}>⚔️</Text>

      <Text style={styles.title}>Real-Life RPG</Text>

      <Text style={styles.subtitle}>
        Turn Your Life Into{"\n"}An Adventure
      </Text>

      <Text style={styles.loading}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  logo: {
    fontSize: 70,
    marginBottom: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 15,
  },

  subtitle: {
    color: "#B0B0B0",
    fontSize: 20,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 60,
  },

  loading: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
  },
});
