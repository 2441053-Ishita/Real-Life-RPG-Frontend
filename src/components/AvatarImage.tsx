import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { RPGTheme } from "@/app/utils/rpgTheme";

export const DEFAULT_AVATARS = [
  { id: "warrior", emoji: "⚔️", label: "Paladin Warrior" },
  { id: "mage", emoji: "🧙", label: "Arcane Mage" },
  { id: "guardian", emoji: "🛡️", label: "Iron Guardian" },
  { id: "elf", emoji: "🧝", label: "Elven Archer" },
  { id: "vampire", emoji: "🧛", label: "Shadow Knight" },
  { id: "king", emoji: "👑", label: "Realm Monarch" },
];

type AvatarImageProps = {
  avatarUrl?: string | null;
  equippedAvatar?: string | null;
  size?: number;
  showGlow?: boolean;
};

export default function AvatarImage({
  avatarUrl,
  equippedAvatar,
  size = 64,
  showGlow = true,
}: AvatarImageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const matchedDefault = DEFAULT_AVATARS.find((a) => a.id === equippedAvatar);
  const emoji = matchedDefault ? matchedDefault.emoji : "🧙";

  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
        showGlow && styles.glowBorder,
      ]}
    >
      {avatarUrl && !error ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: size, height: size, borderRadius }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => setError(true)}
            resizeMode="cover"
          />
          {loading && (
            <View style={[styles.loadingOverlay, { borderRadius }]}>
              <ActivityIndicator size="small" color={RPGTheme.colors.gold} />
            </View>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.fallbackContainer,
            {
              width: size,
              height: size,
              borderRadius,
            },
          ]}
        >
          <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: RPGTheme.colors.goldBorder,
    overflow: "hidden",
  },
  glowBorder: {
    shadowColor: RPGTheme.colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackContainer: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    justifyContent: "center",
    alignItems: "center",
  },
});
