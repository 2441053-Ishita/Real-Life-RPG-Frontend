import UserService from "@/services/userService";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { RPGTheme } from "@/utils/rpgTheme";
import { HeadingText, TitleText, BodyText, ButtonText, AppText } from "@/components/Typography";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showMessage("Missing Email", "Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      await UserService.resetPassword(cleanEmail);
      setSent(true);
      showMessage(
        "Reset Email Sent! 📧",
        "Check your email inbox for instructions to reset your password."
      );
    } catch (error: any) {
      let message = error?.message || "Failed to send reset email. Please try again.";
      if (error?.code === "auth/user-not-found") {
        message = "No hero account found with this email address.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }
      showMessage("Reset Failed", message);
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
        <AppText style={styles.logo}>🔑</AppText>
        <HeadingText style={styles.title}>FORGOT PASSWORD</HeadingText>
        <TitleText variant="hero" style={styles.subtitle}>
          Recover Your Citadel Key
        </TitleText>

        <BodyText style={styles.description}>
          Enter your registered email address below. We will send you a password reset link to regain access to your hero account.
        </BodyText>

        {/* EMAIL INPUT */}
        <HeadingText style={styles.label}>EMAIL ADDRESS</HeadingText>
        <TextInput
          placeholder="hero@realm.com"
          placeholderTextColor={RPGTheme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {/* RESET BUTTON */}
        <TouchableOpacity
          style={[styles.resetButton, (loading || sent) && styles.disabledButton]}
          disabled={loading || sent}
          activeOpacity={0.85}
          onPress={handleResetPassword}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <ButtonText style={styles.buttonText}>Sending Email...</ButtonText>
            </View>
          ) : sent ? (
            <ButtonText style={styles.buttonText}>✓ Email Sent!</ButtonText>
          ) : (
            <ButtonText style={styles.buttonText}>Send Reset Link 📧</ButtonText>
          )}
        </TouchableOpacity>

        {/* RETURN TO LOGIN */}
        <TouchableOpacity
          style={styles.backButton}
          disabled={loading}
          onPress={() => router.push("/(auth)/login")}
        >
          <BodyText style={styles.backText}>← Return to Login</BodyText>
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
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(124, 58, 237, 0.15)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 24,
    alignItems: "stretch",
  },
  logo: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  label: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    color: RPGTheme.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
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
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backText: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
});
