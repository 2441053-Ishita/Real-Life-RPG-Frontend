import UserService from "@/services/userService";
import { validateHeroName, validatePassword } from "@/utils/authValidation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { RPGTheme } from "@/utils/rpgTheme";
import { HeadingText, TitleText, BodyText, ButtonText, AppText } from "@/components/Typography";

const DURATION = 650;
const EASE = Easing.out(Easing.cubic);

type InputFieldProps = {
  id: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: string;
  focusedId: string | null;
  onFocus: (id: string) => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
  autoCorrect?: boolean;
};

function InputField({
  id,
  placeholder,
  value,
  onChangeText,
  icon,
  focusedId,
  onFocus,
  onBlur,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect = true,
}: InputFieldProps) {
  const isFocused = focusedId === id;

  return (
    <View
      style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
      ]}
    >
      <AppText style={styles.inputIcon}>{icon}</AppText>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={RPGTheme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        onFocus={() => onFocus(id)}
        onBlur={onBlur}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const [heroName, setHeroName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Password strength calculation
  const passValidation = validatePassword(password);
  const heroValidation = validateHeroName(heroName);

  // Animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(28);

  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(28);

  const actionsOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(24);

  useEffect(() => {
    headerOpacity.value = withDelay(
      80,
      withTiming(1, { duration: DURATION, easing: EASE })
    );
    headerTranslateY.value = withDelay(
      80,
      withTiming(0, { duration: DURATION, easing: EASE })
    );

    formOpacity.value = withDelay(
      260,
      withTiming(1, { duration: DURATION, easing: EASE })
    );
    formTranslateY.value = withDelay(
      260,
      withTiming(0, { duration: DURATION, easing: EASE })
    );

    actionsOpacity.value = withDelay(
      440,
      withTiming(1, { duration: DURATION, easing: EASE })
    );
    actionsTranslateY.value = withDelay(
      440,
      withTiming(0, { duration: DURATION, easing: EASE })
    );
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const actionsAnimStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: actionsTranslateY.value }],
  }));

  const handleRegister = async () => {
    // 1. Hero Name Validation
    if (!heroValidation.isValid) {
      if (Platform.OS === "web") {
        window.alert(`Invalid Hero Name\n\n${heroValidation.error}`);
      } else {
        Alert.alert("Invalid Hero Name", heroValidation.error || "Please enter a valid hero name.");
      }
      return;
    }

    if (!email.trim()) {
      if (Platform.OS === "web") {
        window.alert("Missing Email\n\nPlease enter a valid email address.");
      } else {
        Alert.alert("Missing Email", "Please enter a valid email address.");
      }
      return;
    }

    // 2. Strong Password Validation
    if (!passValidation.isValid) {
      const errorMsg = `Password must meet security criteria:\n• ${passValidation.errors.join("\n• ")}`;
      if (Platform.OS === "web") {
        window.alert(`Weak Password\n\n${errorMsg}`);
      } else {
        Alert.alert("Weak Password", errorMsg);
      }
      return;
    }

    // 3. Confirm Password Validation
    if (password !== confirmPassword) {
      if (Platform.OS === "web") {
        window.alert("Password Mismatch\n\nPasswords do not match.");
      } else {
        Alert.alert("Password Mismatch", "Passwords do not match.");
      }
      return;
    }

    try {
      setLoading(true);
      await UserService.signUp({
        email: email.trim().toLowerCase(),
        password,
        heroName: heroValidation.cleanName,
        heroClass: "warrior",
      });

      const successMsg = "Hero Created Successfully! 📧 A verification link has been sent to your email address.";
      if (Platform.OS === "web") {
        window.alert(successMsg);
      } else {
        Alert.alert("Hero Created!", successMsg);
      }

      router.replace("/(tabs)/home");
    } catch (error: any) {
      let message = error?.message || "Unable to create your hero.";
      if (error?.code === "auth/email-already-in-use") {
        message = "This email is already registered. Please sign in.";
      }
      if (Platform.OS === "web") {
        window.alert(`Registration Failed\n\n${message}`);
      } else {
        Alert.alert("Registration Failed", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={RPGTheme.colors.bg} />

      <View pointerEvents="none" style={styles.glowTopLeft} />
      <View pointerEvents="none" style={styles.glowBottomRight} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            {/* HEADER */}
            <Animated.View style={[styles.headerSection, headerAnimStyle]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push("/login")}
                activeOpacity={0.8}
              >
                <ButtonText style={styles.backLabel}>← Back to Sign In</ButtonText>
              </TouchableOpacity>

              <HeadingText style={styles.eyebrow}>✦ JOIN THE REALM ✦</HeadingText>
              <TitleText variant="hero" style={styles.title}>
                Create Your Hero
              </TitleText>
              <BodyText style={styles.subtitle}>Begin your legendary RPG journey.</BodyText>
            </Animated.View>

            {/* FORM */}
            <Animated.View style={[styles.formSection, formAnimStyle]}>
              <InputField
                id="heroName"
                placeholder="Hero Name"
                value={heroName}
                onChangeText={setHeroName}
                icon="🧙"
                focusedId={focusedId}
                onFocus={setFocusedId}
                onBlur={() => setFocusedId(null)}
                autoCapitalize="words"
              />

              <InputField
                id="email"
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                icon="✉️"
                focusedId={focusedId}
                onFocus={setFocusedId}
                onBlur={() => setFocusedId(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <InputField
                id="password"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                icon="🔒"
                focusedId={focusedId}
                onFocus={setFocusedId}
                onBlur={() => setFocusedId(null)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* PASSWORD STRENGTH INDICATOR */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthHeader}>
                    <Text style={styles.strengthLabel}>Password Strength:</Text>
                    <Text style={[styles.strengthValText, { color: passValidation.color }]}>
                      {passValidation.label}
                    </Text>
                  </View>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${Math.max(10, (passValidation.score / 4) * 100)}%`,
                          backgroundColor: passValidation.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              <InputField
                id="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="🛡️"
                focusedId={focusedId}
                onFocus={setFocusedId}
                onBlur={() => setFocusedId(null)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              {confirmPassword.length > 0 && (
                <BodyText
                  style={[
                    styles.matchHint,
                    password === confirmPassword
                      ? styles.matchHintSuccess
                      : styles.matchHintError,
                  ]}
                >
                  {password === confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </BodyText>
              )}
            </Animated.View>

            {/* ACTIONS */}
            <Animated.View style={[styles.actionsSection, actionsAnimStyle]}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <ButtonText style={styles.buttonText}>Forging Hero...</ButtonText>
                  </View>
                ) : (
                  <ButtonText style={styles.buttonText}>Create Hero ⚔️</ButtonText>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <BodyText style={styles.dividerText}>or</BodyText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.footerRow}>
                <BodyText style={styles.footerNote}>Already a hero? </BodyText>
                <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.8}>
                  <ButtonText style={styles.footerLink}>Sign In →</ButtonText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  card: {
    width: "100%",
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

  glowTopLeft: {
    position: "absolute",
    top: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: RPGTheme.colors.purplePrimary,
    opacity: 0.12,
  },
  glowBottomRight: {
    position: "absolute",
    bottom: -120,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: RPGTheme.colors.gold,
    opacity: 0.1,
  },

  headerSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  backLabel: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  eyebrow: {
    color: RPGTheme.colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
  },

  formSection: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: RPGTheme.colors.purplePrimary,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontFamily: RPGTheme.fonts.body,
    height: "100%",
  },
  strengthContainer: {
    marginBottom: 12,
    marginTop: -4,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  strengthLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  strengthValText: {
    fontSize: 10,
    fontWeight: "900",
  },
  strengthTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 3,
  },
  matchHint: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: -4,
  },
  matchHintSuccess: {
    color: RPGTheme.colors.success,
  },
  matchHintError: {
    color: RPGTheme.colors.danger,
  },

  actionsSection: {
    width: "100%",
  },
  button: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.purpleSecondary,
  },
  buttonDisabled: {
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerNote: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 13,
  },
  footerLink: {
    color: RPGTheme.colors.goldLight,
    fontWeight: "900",
    fontSize: 13,
  },
});