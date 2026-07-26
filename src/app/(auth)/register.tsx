import { auth } from "@/lib/firebase";
import { BorderRadius } from "@/theme/borderRadius";
import { Colors } from "@/theme/colors";
import { Spacing } from "@/theme/spacing";
import { FontSize } from "@/theme/typography";

import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { useEffect, useState } from "react";

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
      <Text style={styles.inputIcon}>{icon}</Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
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

  // ----------------------------
  // Animations
  // ----------------------------

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(28);

  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(28);

  const actionsOpacity = useSharedValue(0);
  const actionsTranslateY = useSharedValue(24);

  useEffect(() => {
    headerOpacity.value = withDelay(
      80,
      withTiming(1, {
        duration: DURATION,
        easing: EASE,
      })
    );

    headerTranslateY.value = withDelay(
      80,
      withTiming(0, {
        duration: DURATION,
        easing: EASE,
      })
    );

    formOpacity.value = withDelay(
      260,
      withTiming(1, {
        duration: DURATION,
        easing: EASE,
      })
    );

    formTranslateY.value = withDelay(
      260,
      withTiming(0, {
        duration: DURATION,
        easing: EASE,
      })
    );

    actionsOpacity.value = withDelay(
      440,
      withTiming(1, {
        duration: DURATION,
        easing: EASE,
      })
    );

    actionsTranslateY.value = withDelay(
      440,
      withTiming(0, {
        duration: DURATION,
        easing: EASE,
      })
    );
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: headerTranslateY.value,
      },
    ],
  }));

  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [
      {
        translateY: formTranslateY.value,
      },
    ],
  }));

  const actionsAnimStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [
      {
        translateY: actionsTranslateY.value,
      },
    ],
  }));

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async () => {
    console.log("================================");
    console.log("HANDLE REGISTER STARTED");
    console.log("Hero Name:", heroName);
    console.log("Email:", email);
    console.log("================================");

    if (!heroName.trim()) {
      console.log("ERROR: Hero name missing");

      Alert.alert(
        "Error",
        "Please enter your Hero Name."
      );

      return;
    }

    if (!email.trim()) {
      console.log("ERROR: Email missing");

      Alert.alert(
        "Error",
        "Please enter your email."
      );

      return;
    }

    if (!password) {
      console.log("ERROR: Password missing");

      Alert.alert(
        "Error",
        "Please enter your password."
      );

      return;
    }

    if (!confirmPassword) {
      console.log("ERROR: Confirm password missing");

      Alert.alert(
        "Error",
        "Please confirm your password."
      );

      return;
    }

    if (password !== confirmPassword) {
      console.log("ERROR: Password mismatch");

      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 6) {
      console.log("ERROR: Password too short");

      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters."
      );

      return;
    }

    try {
      console.log("Starting Firebase registration...");

      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      console.log("FIREBASE REGISTRATION SUCCESS");
      console.log(
        "User UID:",
        userCredential.user.uid
      );

      if (Platform.OS === "web") {
        window.alert("Hero Created Successfully!");
      } else {
        Alert.alert(
          "Success",
          "Hero Created Successfully!"
        );
      }

      console.log("Navigating to /character");

      router.replace("/character");
    } catch (error: any) {
      console.error(
        "FIREBASE REGISTRATION ERROR:",
        error
      );

      console.error(
        "Firebase error code:",
        error?.code
      );

      console.error(
        "Firebase error message:",
        error?.message
      );

      const errorMessage =
        error?.message ||
        "Unknown registration error";

      if (Platform.OS === "web") {
        window.alert(
          `Registration Failed\n\n${errorMessage}`
        );
      } else {
        Alert.alert(
          "Registration Failed",
          errorMessage
        );
      }
    } finally {
      console.log("Registration process finished");

      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.background}
      />

      <View
        pointerEvents="none"
        style={styles.glowTopLeft}
      />

      <View
        pointerEvents="none"
        style={styles.glowBottomRight}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* HEADER */}

          <Animated.View
            style={[
              styles.headerSection,
              headerAnimStyle,
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                console.log("BACK BUTTON PRESSED");
                router.push("/login");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>
                ←
              </Text>

              <Text style={styles.backLabel}>
                Back to Sign In
              </Text>
            </TouchableOpacity>

            <Text style={styles.eyebrow}>
              ✦ JOIN THE REALM ✦
            </Text>

            <Text style={styles.title}>
              Create Your Hero
            </Text>

            <Text style={styles.subtitle}>
              Begin your legendary journey.
            </Text>
          </Animated.View>

          {/* FORM */}

          <Animated.View
            style={[
              styles.formSection,
              formAnimStyle,
            ]}
          >
            <InputField
              id="heroName"
              placeholder="Hero Name"
              value={heroName}
              onChangeText={setHeroName}
              icon="🧙"
              focusedId={focusedId}
              onFocus={setFocusedId}
              onBlur={() =>
                setFocusedId(null)
              }
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
              onBlur={() =>
                setFocusedId(null)
              }
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
              onBlur={() =>
                setFocusedId(null)
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <InputField
              id="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={
                setConfirmPassword
              }
              icon="🛡️"
              focusedId={focusedId}
              onFocus={setFocusedId}
              onBlur={() =>
                setFocusedId(null)
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {confirmPassword.length > 0 && (
              <Text
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
              </Text>
            )}
          </Animated.View>

          {/* ACTIONS */}

          <Animated.View
            style={[
              styles.actionsSection,
              actionsAnimStyle,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                loading &&
                styles.buttonDisabled,
              ]}
              onPress={() => {
                console.log(
                  "CREATE HERO BUTTON PRESSED"
                );

                handleRegister();
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View
                pointerEvents="none"
                style={styles.buttonShimmer}
              />

              {loading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={Colors.white}
                    style={
                      styles.buttonSpinner
                    }
                  />

                  <Text
                    style={styles.buttonText}
                  >
                    Creating Hero...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={styles.buttonText}
                  >
                    Create Hero
                  </Text>

                  <Text
                    style={styles.buttonIcon}
                  >
                    ⚔️
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* DIVIDER */}

            <View style={styles.dividerRow}>
              <View
                style={styles.dividerLine}
              />

              <Text
                style={styles.dividerText}
              >
                or
              </Text>

              <View
                style={styles.dividerLine}
              />
            </View>

            {/* LOGIN */}

            <View style={styles.footerRow}>
              <Text
                style={styles.footerNote}
              >
                Already have an account?
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.push("/login")
                }
                activeOpacity={0.7}
              >
                <Text
                  style={styles.footerLink}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    overflow: "hidden",
  },

  glowTopLeft: {
    position: "absolute",
    top: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },

  glowBottomRight: {
    position: "absolute",
    bottom: -120,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.secondary,
    opacity: 0.08,
  },

  headerSection: {
    paddingTop: Spacing.xxl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },

  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  backArrow: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg + 4,
  },

  backLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },

  eyebrow: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },

  title: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },

  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: "center",
    lineHeight: 22,
  },

  formSection: {
    width: "100%",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 56,
  },

  inputWrapperFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  inputIcon: {
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
    lineHeight: 24,
  },

  input: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.md,
    height: "100%",
  },

  matchHint: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    marginTop: -Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  matchHintSuccess: {
    color: Colors.success,
  },

  matchHintError: {
    color: Colors.danger,
  },

  actionsSection: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.md,
  },

  button: {
    width: "100%",
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",

    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonShimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "40%",
    height: "100%",
    backgroundColor: Colors.white,
    opacity: 0.07,
    transform: [
      {
        skewX: "-20deg",
      },
    ],
  },

  buttonSpinner: {
    marginRight: Spacing.sm,
  },

  buttonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  buttonIcon: {
    fontSize: FontSize.md,
    marginLeft: Spacing.sm,
    lineHeight: 24,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: Spacing.sm,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },

  dividerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: "600",
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },

  footerNote: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },

  footerLink: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
});