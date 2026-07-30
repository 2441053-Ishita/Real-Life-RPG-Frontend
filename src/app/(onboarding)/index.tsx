import React from "react";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View, Dimensions } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { RPGTheme } from "../utils/rpgTheme";
import { HeadingText, TitleText, BodyText, ButtonText } from "@/components/Typography";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* BACKGROUND GLOW DECOR */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      <View pointerEvents="none" style={styles.castleBgDecor}>
        <BodyText style={styles.castleIcon}>🏰</BodyText>
      </View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(800)}
        style={styles.contentCard}
      >
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <BodyText style={styles.emblemEmoji}>⚔️</BodyText>
        </Animated.View>

        <HeadingText style={styles.title}>REALM RPG</HeadingText>
        <TitleText variant="hero" style={styles.subtitle}>
          Level Up Your Real Life
        </TitleText>

        <BodyText style={styles.description}>
          Transform your daily habits into epic quests. Earn XP, collect legendary gear, defeat bosses, and become the hero of your own story.
        </BodyText>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryButton}
          onPress={() => router.push("/register" as any)}
        >
          <ButtonText style={styles.primaryButtonText}>
            Start Your Journey ⚔️
          </ButtonText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.secondaryButton}
          onPress={() => router.push("/login" as any)}
        >
          <ButtonText style={styles.secondaryButtonText}>
            Continue Adventure (Sign In) →
          </ButtonText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  glowTop: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: RPGTheme.colors.purplePrimary,
    opacity: 0.18,
    top: -120,
    left: -100,
  },
  glowBottom: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: RPGTheme.colors.gold,
    opacity: 0.12,
    bottom: -140,
    right: -120,
  },
  castleBgDecor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.05,
  },
  castleIcon: {
    fontSize: 260,
  },

  contentCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    shadowColor: RPGTheme.colors.purplePrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emblemEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: RPGTheme.colors.goldLight,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    color: RPGTheme.colors.textSecondary,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 32,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: RPGTheme.colors.purplePrimary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: RPGTheme.colors.purpleSecondary,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  secondaryButtonText: {
    color: RPGTheme.colors.gold,
    fontSize: 13,
    fontWeight: "800",
  },
});