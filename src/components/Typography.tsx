import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { RPGTheme } from "@/app/utils/rpgTheme";

export function AppText({ style, ...props }: TextProps) {
  return <Text style={[styles.body, style]} {...props} />;
}

export function HeadingText({ style, ...props }: TextProps) {
  return <Text style={[styles.heading, style]} {...props} />;
}

export function BodyText({ style, ...props }: TextProps) {
  return <Text style={[styles.body, style]} {...props} />;
}

export function TitleText({ variant = "screen", style, ...props }: TextProps & { variant?: "screen" | "hero" | "menu" }) {
  const fontStyle =
    variant === "hero"
      ? styles.heroName
      : variant === "menu"
      ? styles.menu
      : styles.heading;
  return <Text style={[fontStyle, style]} {...props} />;
}

export function ButtonText({ style, ...props }: TextProps) {
  return <Text style={[styles.button, style]} {...props} />;
}

export function StatsText({ style, ...props }: TextProps) {
  return <Text style={[styles.stats, style]} {...props} />;
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: RPGTheme.fonts.heading,
    color: RPGTheme.colors.textPrimary,
  },
  heroName: {
    fontFamily: RPGTheme.fonts.heroName,
    color: RPGTheme.colors.textPrimary,
  },
  menu: {
    fontFamily: RPGTheme.fonts.menu,
    color: RPGTheme.colors.textPrimary,
  },
  body: {
    fontFamily: RPGTheme.fonts.body,
    color: RPGTheme.colors.textSecondary,
  },
  button: {
    fontFamily: RPGTheme.fonts.button,
    color: "#FFFFFF",
  },
  stats: {
    fontFamily: RPGTheme.fonts.stats,
    color: RPGTheme.colors.goldLight,
  },
});
