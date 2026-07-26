import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚔️ Real-Life RPG</Text>

      <Text style={styles.subtitle}>
        Welcome Back, Hero!
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => {
          alert("Login Button Working");
          router.replace("/(tabs)/home");
        }}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.registerText}>
          Don't have an account? Create Hero
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 40,
    fontSize: 16,
  },

  input: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },

  loginButton: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18,
  },

  registerButton: {
    marginTop: 24,
    alignItems: "center",
  },

  registerText: {
    color: "#A78BFA",
    fontSize: 16,
    fontWeight: "600",
  },
});