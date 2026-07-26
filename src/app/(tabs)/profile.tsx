import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type HeroData = {
  heroName: string;
  email: string;
  class: string;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;
  completedQuests: number[];
};

const classInfo: Record<
  string,
  {
    emoji: string;
    title: string;
  }
> = {
  warrior: {
    emoji: "🛡️",
    title: "Warrior",
  },

  mage: {
    emoji: "🧙",
    title: "Mage",
  },

  archer: {
    emoji: "🏹",
    title: "Archer",
  },

  assassin: {
    emoji: "🥷",
    title: "Assassin",
  },
};

export default function ProfileScreen() {
  const [hero, setHero] =
    useState<HeroData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  // ============================================
  // LOAD PROFILE FROM FIRESTORE
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const unsubscribe = onSnapshot(
      userRef,

      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setHero({
            heroName:
              data.heroName || "Hero",

            email:
              data.email ||
              user.email ||
              "",

            class:
              data.class || "warrior",

            level:
              data.level ?? 1,

            xp:
              data.xp ?? 0,

            totalXP:
              data.totalXP ?? 0,

            streak:
              data.streak ?? 1,

            completedQuests:
              data.completedQuests || [],
          });
        }

        setLoading(false);
      },

      (error) => {
        console.error(
          "PROFILE FIRESTORE ERROR:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await signOut(auth);

      console.log("LOGOUT SUCCESS");

      router.replace("/login");
    } catch (error: any) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      const message =
        error?.message ||
        "Unable to logout.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(
          "Logout Failed",
          message
        );
      }
    } finally {
      setLoggingOut(false);
    }
  };

  // ============================================
  // COMING SOON
  // ============================================

  const showComingSoon = (
    feature: string
  ) => {
    const message =
      `${feature} will be added soon.`;

    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert(
        "Coming Soon",
        message
      );
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#7C3AED"
        />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorEmoji}>
          ⚠️
        </Text>

        <Text style={styles.errorTitle}>
          Profile not found
        </Text>

        <Text style={styles.errorText}>
          Your hero profile could not be
          loaded.
        </Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Return to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================
  // HERO VALUES
  // ============================================

  const currentClass =
    classInfo[hero.class] ||
    classInfo.warrior;

  const completedCount =
    hero.completedQuests.length;

  const xpNeeded = 100;

  const xpProgress = Math.min(
    (hero.xp / xpNeeded) * 100,
    100
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <Text style={styles.eyebrow}>
          PLAYER PROFILE
        </Text>

        <Text style={styles.title}>
          👤 Profile
        </Text>

        <Text style={styles.subtitle}>
          Manage your hero and account.
        </Text>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text
              style={styles.avatarEmoji}
            >
              {currentClass.emoji}
            </Text>
          </View>

          <Text style={styles.heroName}>
            {hero.heroName}
          </Text>

          <Text style={styles.heroClass}>
            Level {hero.level} •{" "}
            {currentClass.title}
          </Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              LVL {hero.level}
            </Text>
          </View>

          {/* XP */}

          <View style={styles.xpSection}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>
                EXPERIENCE
              </Text>

              <Text style={styles.xpValue}>
                {hero.xp} / {xpNeeded} XP
              </Text>
            </View>

            <View
              style={styles.progressTrack}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${xpProgress}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ACCOUNT */}

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text
                style={styles.infoEmoji}
              >
                ✉️
              </Text>
            </View>

            <View
              style={styles.infoContent}
            >
              <Text
                style={styles.infoLabel}
              >
                EMAIL
              </Text>

              <Text
                style={styles.infoValue}
                numberOfLines={1}
              >
                {hero.email}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text
                style={styles.infoEmoji}
              >
                ⚔️
              </Text>
            </View>

            <View
              style={styles.infoContent}
            >
              <Text
                style={styles.infoLabel}
              >
                HERO CLASS
              </Text>

              <Text
                style={styles.infoValue}
              >
                {currentClass.emoji}{" "}
                {currentClass.title}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text
                style={styles.infoEmoji}
              >
                🆔
              </Text>
            </View>

            <View
              style={styles.infoContent}
            >
              <Text
                style={styles.infoLabel}
              >
                ACCOUNT STATUS
              </Text>

              <Text
                style={styles.activeText}
              >
                ● Active
              </Text>
            </View>
          </View>
        </View>

        {/* HERO PROGRESS */}

        <Text style={styles.sectionTitle}>
          Hero Progress
        </Text>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text
              style={styles.statEmoji}
            >
              ⭐
            </Text>

            <Text
              style={styles.statValue}
            >
              {hero.totalXP}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Total XP
            </Text>
          </View>

          <View
            style={styles.verticalDivider}
          />

          <View style={styles.statItem}>
            <Text
              style={styles.statEmoji}
            >
              ⚔️
            </Text>

            <Text
              style={styles.statValue}
            >
              {completedCount}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Quests
            </Text>
          </View>

          <View
            style={styles.verticalDivider}
          />

          <View style={styles.statItem}>
            <Text
              style={styles.statEmoji}
            >
              🔥
            </Text>

            <Text
              style={styles.statValue}
            >
              {hero.streak}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Streak
            </Text>
          </View>
        </View>

        {/* SETTINGS */}

        <Text style={styles.sectionTitle}>
          Settings
        </Text>

        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() =>
              showComingSoon("Edit Hero")
            }
          >
            <View
              style={styles.settingLeft}
            >
              <Text
                style={
                  styles.settingEmoji
                }
              >
                ⚔️
              </Text>

              <View>
                <Text
                  style={
                    styles.settingText
                  }
                >
                  Edit Hero
                </Text>

                <Text
                  style={
                    styles.settingSubtext
                  }
                >
                  Change hero details
                </Text>
              </View>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() =>
              showComingSoon(
                "Achievements"
              )
            }
          >
            <View
              style={styles.settingLeft}
            >
              <Text
                style={
                  styles.settingEmoji
                }
              >
                🏆
              </Text>

              <View>
                <Text
                  style={
                    styles.settingText
                  }
                >
                  Achievements
                </Text>

                <Text
                  style={
                    styles.settingSubtext
                  }
                >
                  View unlocked rewards
                </Text>
              </View>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() =>
              showComingSoon(
                "App Settings"
              )
            }
          >
            <View
              style={styles.settingLeft}
            >
              <Text
                style={
                  styles.settingEmoji
                }
              >
                ⚙️
              </Text>

              <View>
                <Text
                  style={
                    styles.settingText
                  }
                >
                  App Settings
                </Text>

                <Text
                  style={
                    styles.settingSubtext
                  }
                >
                  Preferences and options
                </Text>
              </View>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}

        <TouchableOpacity
          style={[
            styles.logoutButton,
            loggingOut &&
            styles.logoutDisabled,
          ]}
          activeOpacity={0.75}
          disabled={loggingOut}
          onPress={handleLogout}
        >
          {loggingOut ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FCA5A5"
              />

              <Text
                style={styles.logoutText}
              >
                Logging Out...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={styles.logoutIcon}
              >
                🚪
              </Text>

              <Text
                style={styles.logoutText}
              >
                Log Out
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>
          REAL-LIFE RPG • VERSION 1.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  loadingText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 15,
  },

  errorEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },

  errorText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },

  container: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 50,
  },

  eyebrow: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 7,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 7,
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginBottom: 24,
  },

  profileCard: {
    backgroundColor: "#1E293B",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 28,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#312E81",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#7C3AED",
    marginBottom: 12,
  },

  avatarEmoji: {
    fontSize: 40,
  },

  heroName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  heroClass: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 5,
  },

  levelBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },

  levelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  xpSection: {
    width: "100%",
    marginTop: 20,
  },

  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  xpLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  xpValue: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
  },

  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  sectionCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 15,
    marginBottom: 27,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoEmoji: {
    fontSize: 19,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },

  infoValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  activeText: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#334155",
  },

  statsCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    marginBottom: 27,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  statLabel: {
    color: "#94A3B8",
    fontSize: 9,
    marginTop: 4,
  },

  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: "#334155",
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  settingEmoji: {
    fontSize: 19,
    marginRight: 12,
  },

  settingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  settingSubtext: {
    color: "#64748B",
    fontSize: 9,
    marginTop: 3,
  },

  arrow: {
    color: "#64748B",
    fontSize: 24,
    fontWeight: "300",
  },

  logoutButton: {
    backgroundColor: "#3F1D2E",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    borderRadius: 16,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 3,
    paddingHorizontal: 15,
  },

  logoutDisabled: {
    opacity: 0.6,
  },

  logoutIcon: {
    fontSize: 17,
  },

  logoutText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "800",
  },

  version: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 22,
  },
});