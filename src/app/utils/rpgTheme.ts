import { Platform } from "react-native";

if (Platform.OS === "web" && typeof document !== "undefined") {
  const fontId = "google-fonts-dark-fantasy";
  if (!document.getElementById(fontId)) {
    const link = document.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Cormorant+Garamond:wght@600;700;900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700;800&display=swap";
    document.head.appendChild(link);
  }
}

export const RPGTheme = {
  colors: {
    bg: "#09090B",
    primaryCard: "#111827",
    secondaryCard: "#1A1F2E",
    cardBorder: "rgba(124, 58, 237, 0.25)",
    goldBorder: "rgba(212, 175, 55, 0.35)",
    purplePrimary: "#7C3AED",
    purpleSecondary: "#A855F7",
    gold: "#D4AF37",
    goldLight: "#FFD166",
    success: "#22C55E",
    danger: "#EF4444",
    textPrimary: "#FFFFFF",
    textSecondary: "#B5B8C5",
    textMuted: "#64748B",
  },
  fonts: {
    heading: Platform.select({
      web: "'Cinzel', serif",
      default: "Cinzel-Bold",
    }),
    heroName: Platform.select({
      web: "'Cormorant Garamond', serif",
      default: "CormorantGaramond-SemiBold",
    }),
    menu: Platform.select({
      web: "'Cinzel', serif",
      default: "Cinzel-Medium",
    }),
    button: Platform.select({
      web: "'Manrope', sans-serif",
      default: "Manrope-SemiBold",
    }),
    body: Platform.select({
      web: "'Manrope', sans-serif",
      default: "Manrope-Regular",
    }),
    stats: Platform.select({
      web: "'JetBrains Mono', monospace",
      default: "JetBrainsMono-SemiBold",
    }),
  },
  rarities: {
    Common: { color: "#94A3B8", bg: "rgba(148, 163, 184, 0.12)", border: "#475569" },
    Rare: { color: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)", border: "#2563EB" },
    Epic: { color: "#A855F7", bg: "rgba(168, 85, 247, 0.18)", border: "#7C3AED" },
    Legendary: { color: "#D4AF37", bg: "rgba(212, 175, 55, 0.18)", border: "#F59E0B" },
    Mythic: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.2)", border: "#DC2626" },
  },
};
