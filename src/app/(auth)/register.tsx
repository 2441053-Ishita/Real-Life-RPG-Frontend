import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RegisterScreen() {
  const [heroName, setHeroName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!heroName || !email || !password) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      Alert.alert(
        "Success",
        "Hero Created Successfully!"
      );

      router.replace("/character");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        padding: 24,
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
        ⚔️ Create Your Hero
      </Text>

      <Text
        style={{
          color: "#94A3B8",
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        Begin your Real-Life RPG journey.
      </Text>

      <TextInput
        placeholder="Hero Name"
        placeholderTextColor="#94A3B8"
        style={inputStyle}
        value={heroName}
        onChangeText={setHeroName}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        style={inputStyle}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        style={inputStyle}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[
          buttonStyle,
          loading && { opacity: 0.6 },
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          {loading ? "Creating Hero..." : "Create Hero"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => router.push("/login")}
      >
        <Text
          style={{
            color: "#A78BFA",
            textAlign: "center",
          }}
        >
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const inputStyle = {
  backgroundColor: "#1E293B",
  color: "white",
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#334155",
};

const buttonStyle = {
  backgroundColor: "#7C3AED",
  padding: 16,
  borderRadius: 12,
  alignItems: "center" as const,
  marginTop: 10,
};
