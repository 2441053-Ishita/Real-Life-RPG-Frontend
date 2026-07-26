import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { signOut } from "firebase/auth";

import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);

      if (Platform.OS === "web") {
        window.alert("Logged out successfully.");
      } else {
        Alert.alert("Success", "Logged out successfully.");
      }

      router.replace("/login");
    } catch (error: any) {
      console.error("LOGOUT ERROR:", error);

      if (Platform.OS === "web") {
        window.alert(
          error?.message || "Unable to logout."
        );
      } else {
        Alert.alert(
          "Logout Failed",
          error?.message || "Unable to logout."
        );
      }
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <Text style={styles.eyebrow}>PLAYER PROFILE</Text>

        <Text style={styles.title}>
          👤 Profile
        </Text>

        <Text style={styles.subtitle}>
          Manage your hero and account.
        </Text>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>
              🛡️
            </Text>
          </View>

          <Text style={styles.heroName}>
            Hero
          </Text>

          <Text style={styles.heroClass}>
            Level 1 • Warrior
          </Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              LVL 1
            </Text>
          </View>
        </View>

        {/* ACCOUNT */}

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>
                ✉️
              </Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Email
              </Text>

              <Text
                style={styles.infoValue}
                numberOfLines={1}
              >
                {user?.email || "No email available"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>
                🆔
              </Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Account Status
              </Text>

              <Text style={styles.activeText}>
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
            <Text style={styles.statEmoji}>
              ⭐
            </Text>

            <Text style={styles.statValue}>
              20
            </Text>

            <Text style={styles.statLabel}>
              Total XP
            </Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>
              ⚔️
            </Text>

            <Text style={styles.statValue}>
              0
            </Text>

            <Text style={styles.statLabel}>
              Quests
            </Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>
              🔥
            </Text>

            <Text style={styles.statValue}>
              1
            </Text>

            <Text style={styles.statLabel}>
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
            onPress={() => {
              if (Platform.OS === "web") {
                window.alert(
                  "Edit Hero will be added soon."
                );
              } else {
                Alert.alert(
                  "Coming Soon",
                  "Edit Hero will be added soon."
                );
              }
            }}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingEmoji}>
                ⚔️
              </Text>

              <Text style={styles.settingText}>
                Edit Hero
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === "web") {
                window.alert(
                  "Achievements page coming soon."
                );
              } else {
                Alert.alert(
                  "Coming Soon",
                  "Achievements page coming soon."
                );
              }
            }}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingEmoji}>
                🏆
              </Text>

              <Text style={styles.settingText}>
                Achievements
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === "web") {
                window.alert(
                  "App settings coming soon."
                );
              } else {
                Alert.alert(
                  "Coming Soon",
                  "App settings coming soon."
                );
              }
            }}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingEmoji}>
                ⚙️
              </Text>

              <Text style={styles.settingText}>
                App Settings
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.75}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>
            🚪
          </Text>

          <Text style={styles.logoutText}>
            Log Out
          </Text>
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
    paddingVertical: 16,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  settingEmoji: {
    fontSize: 19,
    marginRight: 12,
  },

  settingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
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
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  logoutIcon: {
    fontSize: 17,
    marginRight: 8,
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