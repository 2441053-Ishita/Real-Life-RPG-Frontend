import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { getHeroRank } from "@/utils/rank";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import AvatarImage from "@/components/AvatarImage";
import { HeadingText, TitleText, BodyText, StatsText, ButtonText, AppText } from "@/components/Typography";
import { sendTestNotification, requestNotificationPermission, scheduleDailyNotifications, cancelAllReminders } from "@/utils/notifications";

const REMINDER_TIMES = [
  { label: "8:00 AM", value: "08:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "8:00 PM", value: "20:00" },
  { label: "10:00 PM", value: "22:00" },
];

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState({
    heroName: "Hero of the Realm",
    level: 1,
    streak: 1,
    equippedTitle: "Novice",
    equippedAvatar: "knight",
    avatarUrl: null as string | null,
  });

  const [settings, setSettings] = useState({
    notifications: true,
    reminderTime: "20:00",
    soundEffects: true,
    backgroundMusic: true,
    vibration: true,
  });

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setHero({
            heroName: data.heroName || "Hero of the Realm",
            level: data.level ?? 1,
            streak: data.streak ?? 1,
            equippedTitle: data.equippedTitle || "Novice Adventurer",
            equippedAvatar: data.equippedAvatar || "knight",
            avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
          });

          const userSettings = data.settings || {};
          setSettings({
            notifications: userSettings.notifications ?? true,
            reminderTime: userSettings.reminderTime || "20:00",
            soundEffects: userSettings.soundEffects ?? true,
            backgroundMusic: userSettings.backgroundMusic ?? true,
            vibration: userSettings.vibration ?? true,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("SETTINGS FIRESTORE ERROR:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const toggleSetting = async (key: keyof typeof settings, val?: any) => {
    if (!uid) return;

    if (key === "notifications" && !settings.notifications) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        if (Platform.OS === "web") {
          window.alert("Notifications Denied\n\nPlease enable browser notification permissions.");
        } else {
          Alert.alert("Permission Required", "Please allow notifications in system settings.");
        }
      }
    }

    const nextVal = val !== undefined ? val : !settings[key];
    const newSettings = {
      ...settings,
      [key]: nextVal,
    };
    setSettings(newSettings);

    if (newSettings.notifications) {
      scheduleDailyNotifications(newSettings.reminderTime, hero.streak);
    } else {
      cancelAllReminders();
    }

    try {
      await updateDoc(doc(db, "users", uid), {
        settings: newSettings,
        notificationSettings: {
          enabled: newSettings.notifications,
          reminderTime: newSettings.reminderTime,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error("Failed to update user settings:", e);
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification(hero.streak);
  };

  const handleLogout = () => {
    const confirmLogout = async () => {
      try {
        await auth.signOut();
        router.replace("/login");
      } catch (err: any) {
        if (Platform.OS === "web") {
          window.alert("Logout Error\n\nUnable to log out. Please try again.");
        } else {
          Alert.alert("Error", "Unable to log out.");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to log out of your adventure?")) {
        confirmLogout();
      }
    } else {
      Alert.alert(
        "Log Out",
        "Are you sure you want to log out of your adventure?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log Out", style: "destructive", onPress: confirmLogout },
        ]
      );
    }
  };

  const rank = getHeroRank(hero.level);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <BodyText style={styles.loadingText}>Loading Realm Preferences...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="⚙️ Settings & Preferences" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. HERO PROFILE CARD */}
        <View style={styles.heroProfileCard}>
          <AvatarImage
            avatarUrl={hero.avatarUrl}
            equippedAvatar={hero.equippedAvatar}
            size={72}
          />
          <View style={styles.heroInfoGroup}>
            <HeadingText style={styles.heroName}>{hero.heroName}</HeadingText>
            <BodyText style={styles.heroTitle}>👑 {hero.equippedTitle}</BodyText>
            <View style={[styles.rankTag, { backgroundColor: rank.color }]}>
              <StatsText style={styles.rankText}>Lvl {hero.level} • {rank.name}</StatsText>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/edit-hero")}
          >
            <ButtonText style={styles.editBtnText}>Edit ✏️</ButtonText>
          </TouchableOpacity>
        </View>

        {/* 2. SMART REMINDER & NOTIFICATION SYSTEM */}
        <HeadingText style={styles.sectionHeader}>🔔 Smart Reminder System</HeadingText>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <HeadingText style={styles.toggleTitle}>🔥 Daily Habit & Streak Protection</HeadingText>
              <BodyText style={styles.toggleSub}>Remind me to complete daily habits and protect my streak</BodyText>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting("notifications")}
              trackColor={{ false: "#334155", true: RPGTheme.colors.purplePrimary }}
              thumbColor={settings.notifications ? RPGTheme.colors.gold : "#94A3B8"}
            />
          </View>

          {settings.notifications && (
            <>
              <View style={styles.divider} />
              <HeadingText style={styles.subTitle}>Select Daily Reminder Time</HeadingText>
              <View style={styles.timeRow}>
                {REMINDER_TIMES.map((t) => {
                  const isSelected = settings.reminderTime === t.value;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      activeOpacity={0.8}
                      onPress={() => toggleSetting("reminderTime", t.value)}
                      style={[styles.timeChip, isSelected && styles.selectedTimeChip]}
                    >
                      <ButtonText style={[styles.timeChipText, isSelected && { color: "#FFFFFF" }]}>
                        {t.label}
                      </ButtonText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTestNotification}
                style={styles.testNotifyBtn}
              >
                <ButtonText style={styles.testNotifyBtnText}>Send Test Reminder Alert 🔔</ButtonText>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 3. AUDIO & GAMEPLAY PREFERENCES */}
        <HeadingText style={styles.sectionHeader}>🔊 Audio & Gameplay Preferences</HeadingText>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <HeadingText style={styles.toggleTitle}>🔊 Sound Effects</HeadingText>
              <BodyText style={styles.toggleSub}>Play audio effects on quest complete</BodyText>
            </View>
            <Switch
              value={settings.soundEffects}
              onValueChange={() => toggleSetting("soundEffects")}
              trackColor={{ false: "#334155", true: RPGTheme.colors.purplePrimary }}
              thumbColor={settings.soundEffects ? RPGTheme.colors.gold : "#94A3B8"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <HeadingText style={styles.toggleTitle}>🎵 Background Music</HeadingText>
              <BodyText style={styles.toggleSub}>Atmospheric fantasy soundtrack</BodyText>
            </View>
            <Switch
              value={settings.backgroundMusic}
              onValueChange={() => toggleSetting("backgroundMusic")}
              trackColor={{ false: "#334155", true: RPGTheme.colors.purplePrimary }}
              thumbColor={settings.backgroundMusic ? RPGTheme.colors.gold : "#94A3B8"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <HeadingText style={styles.toggleTitle}>📳 Haptic Vibration</HeadingText>
              <BodyText style={styles.toggleSub}>Vibrate on boss hit and achievements</BodyText>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={() => toggleSetting("vibration")}
              trackColor={{ false: "#334155", true: RPGTheme.colors.purplePrimary }}
              thumbColor={settings.vibration ? RPGTheme.colors.gold : "#94A3B8"}
            />
          </View>
        </View>

        {/* 4. ACCOUNT ACTIONS */}
        <HeadingText style={styles.sectionHeader}>👤 Account Management</HeadingText>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push("/edit-hero")}
          >
            <AppText style={styles.navIcon}>🎭</AppText>
            <HeadingText style={styles.navText}>Edit Profile & Avatar</HeadingText>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => router.push("/statistics")}
          >
            <AppText style={styles.navIcon}>📊</AppText>
            <HeadingText style={styles.navText}>View Hero Statistics</HeadingText>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.navRow}
            onPress={handleLogout}
          >
            <AppText style={styles.navIcon}>🚪</AppText>
            <HeadingText style={[styles.navText, { color: RPGTheme.colors.danger }]}>
              Log Out of Realm
            </HeadingText>
          </TouchableOpacity>
        </View>

        {/* 5. ABOUT APP */}
        <View style={styles.aboutCard}>
          <HeadingText style={styles.aboutTitle}>⚔️ REALM RPG HABIT TRACKER</HeadingText>
          <BodyText style={styles.aboutVersion}>Version 1.0.0 (Smart Reminder Build)</BodyText>
          <BodyText style={styles.aboutDesc}>
            Turn your daily goals into epic quests, defeat boss lords, unlock legendary gear, and level up your real life.
          </BodyText>
        </View>
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
    padding: 16,
    paddingBottom: 60,
  },

  heroProfileCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  heroInfoGroup: {
    flex: 1,
  },
  heroName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  heroTitle: {
    color: RPGTheme.colors.goldLight,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  rankTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  editBtn: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  editBtnText: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 11,
    fontWeight: "800",
  },

  sectionHeader: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  subTitle: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },
  card: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: RPGTheme.colors.cardBorder,
    marginVertical: 12,
  },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  toggleSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  timeChip: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  selectedTimeChip: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderColor: RPGTheme.colors.purpleSecondary,
  },
  timeChipText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  testNotifyBtn: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.goldBorder,
  },
  testNotifyBtnText: {
    color: RPGTheme.colors.goldLight,
    fontSize: 11,
    fontWeight: "900",
  },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 20,
  },
  navText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },

  aboutCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  aboutTitle: {
    color: RPGTheme.colors.gold,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
  },
  aboutVersion: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 8,
  },
  aboutDesc: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
