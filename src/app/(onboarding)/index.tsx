import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <Animated.View
        entering={FadeInDown.delay(100).duration(600)}
        style={styles.content}
      >
        <Text style={styles.logo}>⚔️</Text>

        <Text style={styles.title}>Real-Life RPG</Text>

        <Text style={styles.subtitle}>Level Up Your Real Life</Text>

        <Text style={styles.description}>
          Turn your daily goals into exciting quests and become the hero of your
          own story.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.button}
          onPress={() => {
            alert("Button Working");
            router.push("/login");
          }}
        >
          <View pointerEvents="none" style={styles.buttonShimmer} />

          <Text style={styles.buttonText}>Start Adventure</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.signIn}>Already a Hero? Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  glowTop: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#7C3AED",
    opacity: 0.15,
    top: -100,
    left: -80,
  },

  glowBottom: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#A855F7",
    opacity: 0.12,
    bottom: -120,
    right: -100,
  },

  content: {
    width: "100%",
    alignItems: "center",
  },

  logo: {
    fontSize: 90,
    marginBottom: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#A78BFA",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },

  description: {
    color: "#CBD5E1",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },

  button: {
    width: "100%",
    backgroundColor: "#7C3AED",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    overflow: "hidden",
  },

  buttonShimmer: {
    position: "absolute",
    top: 0,
    left: -40,
    width: 40,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    transform: [{ skewX: "-20deg" }],
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  signIn: {
    color: "#A78BFA",
    fontSize: 16,
    fontWeight: "600",
  },
});