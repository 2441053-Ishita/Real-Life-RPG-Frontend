import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RPGTheme } from "../utils/rpgTheme";
import { HeadingText, TitleText, BodyText, ButtonText, AppText } from "@/components/Typography";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showMessage("Missing Details", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      let message = "Unable to login. Please try again.";
      if (error?.code === "auth/invalid-credential") {
        message = "Email or password is incorrect.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error?.code === "auth/user-disabled") {
        message = "This account has been disabled.";
      } else if (error?.code === "auth/too-many-requests") {
        message = "Too many login attempts. Please try again later.";
      } else if (error?.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      }

      showMessage("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* GLOW DECOR */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <View style={styles.card}>
        <AppText style={styles.logo}>⚔️</AppText>
        <HeadingText style={styles.title}>REALM RPG</HeadingText>
        <TitleText variant="hero" style={styles.subtitle}>
          Welcome Back, Hero!
        </TitleText>

        {/* EMAIL */}
        <HeadingText style={styles.label}>EMAIL ADDRESS</HeadingText>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor={RPGTheme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {/* PASSWORD */}
        <HeadingText style={styles.label}>PASSWORD</HeadingText>
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor={RPGTheme.colors.textMuted}
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
          style={[styles.loginButton, loading && styles.disabledButton]}
          disabled={loading}
          activeOpacity={0.85}
          onPress={handleLogin}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <ButtonText style={styles.buttonText}>Entering Citadel...</ButtonText>
            </View>
          ) : (
            <ButtonText style={styles.buttonText}>Login to Adventure ⚔️</ButtonText>
          )}
        </TouchableOpacity>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <BodyText style={styles.dividerText}>OR</BodyText>
          <View style={styles.dividerLine} />
        </View>

        {/* REGISTER */}
        <TouchableOpacity
          style={styles.registerButton}
          disabled={loading}
          onPress={() => router.push("/register")}
        >
          <BodyText style={styles.registerNormal}>
            Don't have a hero yet?{" "}
            <ButtonText style={styles.registerLink}>Create Hero →</ButtonText>
          </BodyText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  glowTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: RPGTheme.colors.purplePrimary,
    opacity: 0.15,
    top: -100,
    left: -80,
  },
  glowBottom: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: RPGTheme.colors.gold,
    opacity: 0.1,
    bottom: -120,
    right: -100,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    shadowColor: RPGTheme.colors.purplePrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  logo: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 6,
  },
  title: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 2,
  },
  subtitle: {
    color: RPGTheme.colors.goldLight,
    textAlign: "center",
    marginBottom: 24,
    fontSize: 16,
  },

  label: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    color: RPGTheme.colors.textPrimary,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    fontSize: 14,
    fontFamily: RPGTheme.fonts.body,
  },

  loginButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: RPGTheme.colors.purpleSecondary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: RPGTheme.colors.cardBorder,
  },
  dividerText: {
    color: RPGTheme.colors.textMuted,
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: "800",
  },

  registerButton: {
    alignItems: "center",
  },
  registerNormal: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 13,
  },
  registerLink: {
    color: RPGTheme.colors.goldLight,
    fontWeight: "900",
  },
});