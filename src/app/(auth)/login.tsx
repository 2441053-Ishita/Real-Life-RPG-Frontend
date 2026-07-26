import { useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

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
        ⚔️ Real-Life RPG
      </Text>

      <Text
        style={{
          color: "#94A3B8",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        Welcome Back, Hero!
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        style={{
          backgroundColor: "#1E293B",
          color: "white",
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
        }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        style={{
          backgroundColor: "#1E293B",
          color: "white",
          padding: 16,
          borderRadius: 12,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={() => {
          alert("Login Button Working");
          router.replace("/(tabs)/home");
        }}
        style={{
          backgroundColor: "#7C3AED",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={{
          marginTop: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#A78BFA",
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          Don't have an account? Create Hero
        </Text>
      </TouchableOpacity>
    </View>
  );
}