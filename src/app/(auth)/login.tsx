import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showMessage = (
    title: string,
    message: string
  ) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    // Check empty fields
    if (!email.trim() || !password) {
      showMessage(
        "Missing Details",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      console.log("==========================");
      console.log("LOGIN STARTED");
      console.log("EMAIL:", email.trim());
      console.log("==========================");

      // Firebase Authentication Login
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const user = userCredential.user;

      console.log("LOGIN SUCCESS");
      console.log("USER UID:", user.uid);
      console.log("USER EMAIL:", user.email);

      // Go to Home
      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("==========================");
      console.error("LOGIN ERROR");
      console.error("ERROR CODE:", error?.code);
      console.error(
        "ERROR MESSAGE:",
        error?.message
      );
      console.error("==========================");

      let message =
        "Unable to login. Please try again.";

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        message =
          "Email or password is incorrect.";
      } else if (
        error?.code === "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      } else if (
        error?.code === "auth/user-disabled"
      ) {
        message =
          "This account has been disabled.";
      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many login attempts. Please try again later.";
      } else if (
        error?.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Network error. Please check your internet connection.";
      }

      showMessage("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* LOGO */}

      <Text style={styles.logo}>⚔️</Text>

      <Text style={styles.title}>
        Real-Life RPG
      </Text>

      <Text style={styles.subtitle}>
        Welcome Back, Hero!
      </Text>

      {/* EMAIL */}

      <Text style={styles.label}>
        EMAIL
      </Text>

      <TextInput
        placeholder="Enter your email"
        placeholderTextColor="#64748B"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      {/* PASSWORD */}

      <Text style={styles.label}>
        PASSWORD
      </Text>

      <TextInput
        placeholder="Enter your password"
        placeholderTextColor="#64748B"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        autoCapitalize="none"
        editable={!loading}
        onSubmitEditing={handleLogin}
      />

      {/* LOGIN BUTTON */}

      <TouchableOpacity
        style={[
          styles.loginButton,
          loading && styles.disabledButton,
        ]}
        disabled={loading}
        activeOpacity={0.8}
        onPress={handleLogin}
      >
        {loading ? (
          <>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={styles.spinner}
            />

            <Text style={styles.buttonText}>
              Entering Adventure...
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.buttonText}>
              Login
            </Text>

            <Text style={styles.buttonIcon}>
              ⚔️
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* DIVIDER */}

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />

        <Text style={styles.dividerText}>
          OR
        </Text>

        <View style={styles.divider} />
      </View>

      {/* REGISTER */}

      <TouchableOpacity
        style={styles.registerButton}
        disabled={loading}
        onPress={() =>
          router.push("/register")
        }
      >
        <Text style={styles.registerNormal}>
          Don't have an account?{" "}
          <Text style={styles.registerText}>
            Create Hero
          </Text>
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

  logo: {
    fontSize: 45,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 35,
    fontSize: 14,
  },

  label: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 3,
  },

  input: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 15,
  },

  loginButton: {
    backgroundColor: "#7C3AED",
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,

    shadowColor: "#7C3AED",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },

  disabledButton: {
    opacity: 0.7,
  },

  spinner: {
    marginRight: 9,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  buttonIcon: {
    fontSize: 17,
    marginLeft: 9,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },

  dividerText: {
    color: "#64748B",
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: "700",
  },

  registerButton: {
    alignItems: "center",
  },

  registerNormal: {
    color: "#94A3B8",
    fontSize: 14,
  },

  registerText: {
    color: "#A78BFA",
    fontWeight: "800",
  },
});