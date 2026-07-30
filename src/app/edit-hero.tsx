import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RPGTheme } from "./utils/rpgTheme";
import AvatarImage, { DEFAULT_AVATARS } from "@/components/AvatarImage";
import { HeadingText, TitleText, BodyText, ButtonText, AppText } from "@/components/Typography";

type HeroClass = "warrior" | "mage" | "archer" | "assassin";

type ClassOption = {
  id: HeroClass;
  emoji: string;
  title: string;
  description: string;
};

const heroClasses: ClassOption[] = [
  { id: "warrior", emoji: "🛡️", title: "Warrior", description: "Strong, disciplined and fearless." },
  { id: "mage", emoji: "🧙", title: "Mage", description: "Wise, focused and intelligent." },
  { id: "archer", emoji: "🏹", title: "Archer", description: "Precise, agile and consistent." },
  { id: "assassin", emoji: "🥷", title: "Assassin", description: "Fast, strategic and determined." },
];

export default function EditHeroScreen() {
  const [heroName, setHeroName] = useState("");
  const [selectedClass, setSelectedClass] = useState<HeroClass>("warrior");
  const [equippedAvatar, setEquippedAvatar] = useState("warrior");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.replace("/login");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setHeroName(data.heroName || "Hero");
          const currentClass = data.class;
          if (heroClasses.some((item) => item.id === currentClass)) {
            setSelectedClass(currentClass as HeroClass);
          }
          setEquippedAvatar(data.equippedAvatar || "warrior");
          setAvatarUrl(data.profile?.avatarUrl || data.avatarUrl || "");
        }
      } catch (error: any) {
        console.error("LOAD HERO ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHero();
  }, []);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const cleanName = heroName.trim();

    if (!cleanName) {
      showMessage("Hero Name Required", "Please enter your hero name.");
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        heroName: cleanName,
        class: selectedClass,
        equippedAvatar: equippedAvatar,
        avatarUrl: avatarUrl.trim() || null,
        "profile.avatarUrl": avatarUrl.trim() || null,
      });

      showMessage("Hero Updated! ⚔️", "Your hero profile and avatar have been updated!");
      router.back();
    } catch (error: any) {
      console.error("UPDATE HERO ERROR:", error);
      showMessage("Update Failed", error?.message || "Unable to update your hero.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <BodyText style={styles.loadingText}>Loading your hero sanctuary...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* BACK BUTTON */}
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <ButtonText style={styles.backText}>← Back to Sanctuary</ButtonText>
        </TouchableOpacity>

        {/* HEADER */}
        <BodyText style={styles.eyebrow}>HERO CUSTOMIZATION</BodyText>
        <HeadingText style={styles.title}>✏️ Edit Profile & Avatar</HeadingText>

        {/* HERO PREVIEW */}
        <View style={styles.previewCard}>
          <HeadingText style={styles.previewLabel}>HERO AVATAR PREVIEW</HeadingText>
          <View style={styles.avatarPreviewWrapper}>
            <AvatarImage
              avatarUrl={avatarUrl.trim() || null}
              equippedAvatar={equippedAvatar}
              size={90}
            />
          </View>
          <HeadingText style={styles.previewName}>{heroName.trim() || "Your Hero"}</HeadingText>
          <BodyText style={styles.previewClass}>{selectedClass.toUpperCase()} HERO</BodyText>
        </View>

        {/* AVATAR SELECTION GRID */}
        <HeadingText style={styles.sectionTitle}>Default RPG Hero Avatars</HeadingText>
        <View style={styles.avatarGrid}>
          {DEFAULT_AVATARS.map((av) => {
            const isSelected = equippedAvatar === av.id;
            return (
              <TouchableOpacity
                key={av.id}
                activeOpacity={0.8}
                onPress={() => setEquippedAvatar(av.id)}
                style={[
                  styles.avatarChoiceCard,
                  isSelected && styles.selectedAvatarChoiceCard,
                ]}
              >
                <AppText style={styles.avatarChoiceEmoji}>{av.emoji}</AppText>
                <BodyText style={styles.avatarChoiceLabel}>{av.label}</BodyText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CUSTOM IMAGE URL INPUT */}
        <HeadingText style={styles.sectionTitle}>Custom Image URL / Avatar URL</HeadingText>
        <View style={styles.inputCard}>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="Paste custom image URL (e.g. https://...)"
            placeholderTextColor={RPGTheme.colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* HERO NAME */}
        <HeadingText style={styles.sectionTitle}>Hero Name</HeadingText>
        <View style={styles.inputCard}>
          <TextInput
            value={heroName}
            onChangeText={setHeroName}
            placeholder="Enter hero name"
            placeholderTextColor={RPGTheme.colors.textMuted}
            style={styles.input}
            maxLength={25}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <ButtonText style={styles.saveButtonText}>Save Avatar & Hero Profile 💾</ButtonText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 14,
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  backText: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  eyebrow: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 20,
  },

  previewCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    marginBottom: 24,
  },
  previewLabel: {
    color: RPGTheme.colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  avatarPreviewWrapper: {
    marginBottom: 14,
  },
  previewName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 2,
  },
  previewClass: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  sectionTitle: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  avatarChoiceCard: {
    width: "31%",
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
  },
  selectedAvatarChoiceCard: {
    borderColor: RPGTheme.colors.gold,
    backgroundColor: RPGTheme.colors.secondaryCard,
  },
  avatarChoiceEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarChoiceLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    textAlign: "center",
    fontWeight: "700",
  },

  inputCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
    marginBottom: 24,
  },
  input: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontFamily: RPGTheme.fonts.body,
  },

  saveButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.purpleSecondary,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});