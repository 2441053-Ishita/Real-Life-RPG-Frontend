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

// ============================================
// TYPES
// ============================================

type HeroData = {
  heroName: string;
  email: string;
  class: string;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;

  completedQuests: string[];

  totalQuestsCompleted: number;

  unlockedAchievements: string[];
};

// ============================================
// CLASS INFO
// ============================================

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

// ============================================
// PROFILE SCREEN
// ============================================

export default function ProfileScreen() {
  const [hero, setHero] =
    useState<HeroData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  // ============================================
  // LOAD PROFILE
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

          const completedQuests =
            Array.isArray(
              data.completedQuests
            )
              ? data.completedQuests.map(
                (id: unknown) =>
                  String(id)
              )
              : [];

          const unlockedAchievements =
            Array.isArray(
              data.unlockedAchievements
            )
              ? data.unlockedAchievements.map(
                (id: unknown) =>
                  String(id)
              )
              : [];

          setHero({
            heroName:
              data.heroName ||
              "Hero",

            email:
              data.email ||
              user.email ||
              "",

            class:
              data.class ||
              "warrior",

            level:
              data.level ?? 1,

            xp:
              data.xp ?? 0,

            totalXP:
              data.totalXP ?? 0,

            streak:
              data.streak ?? 0,

            completedQuests,

            totalQuestsCompleted:
              data.totalQuestsCompleted ??
              completedQuests.length,

            unlockedAchievements,
          });
        } else {
          setHero(null);
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

    return () =>
      unsubscribe();
  }, []);

  // ============================================
  // MESSAGE
  // ============================================

  const showMessage = (
    title: string,
    message: string
  ) => {
    if (Platform.OS === "web") {
      window.alert(
        `${title}\n\n${message}`
      );
    } else {
      Alert.alert(
        title,
        message
      );
    }
  };

  // ============================================
  // LOGOUT
  // ============================================

  const performLogout =
    async () => {
      try {
        setLoggingOut(true);

        await signOut(auth);

        console.log(
          "LOGOUT SUCCESS"
        );

        router.replace(
          "/login"
        );
      } catch (error: any) {
        console.error(
          "LOGOUT ERROR:",
          error
        );

        showMessage(
          "Logout Failed",
          error?.message ||
          "Unable to logout."
        );
      } finally {
        setLoggingOut(false);
      }
    };

  const handleLogout = () => {
    if (loggingOut) {
      return;
    }

    if (Platform.OS === "web") {
      const confirmed =
        window.confirm(
          "Are you sure you want to log out?"
        );

      if (confirmed) {
        performLogout();
      }

      return;
    }

    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Log Out",
          style: "destructive",
          onPress: performLogout,
        },
      ]
    );
  };

  // ============================================
  // EDIT HERO PLACEHOLDER
  // ============================================

  const handleEditHero = () => {
    router.push("/edit-hero");
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color="#7C3AED"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  // ============================================
  // PROFILE NOT FOUND
  // ============================================

  if (!hero) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <Text
          style={
            styles.errorEmoji
          }
        >
          ⚠️
        </Text>

        <Text
          style={
            styles.errorTitle
          }
        >
          Profile not found
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          Your hero profile could
          not be loaded.
        </Text>

        <TouchableOpacity
          style={
            styles.logoutButton
          }
          onPress={
            handleLogout
          }
        >
          <Text
            style={
              styles.logoutText
            }
          >
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
    hero.totalQuestsCompleted;

  const achievementCount =
    hero.unlockedAchievements?.length ?? 0;

  const xpNeeded = 100;

  const xpProgress =
    Math.min(
      (hero.xp / xpNeeded) *
      100,
      100
    );

  const remainingXP =
    Math.max(
      xpNeeded - hero.xp,
      0
    );

  // ============================================
  // UI
  // ============================================

  return (
    <View
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <Text
          style={styles.eyebrow}
        >
          PLAYER PROFILE
        </Text>

        <Text
          style={styles.title}
        >
          👤 Profile
        </Text>

        <Text
          style={styles.subtitle}
        >
          Manage your hero and
          account.
        </Text>

        {/* PROFILE CARD */}

        <View
          style={
            styles.profileCard
          }
        >
          <View
            style={styles.avatar}
          >
            <Text
              style={
                styles.avatarEmoji
              }
            >
              {currentClass.emoji}
            </Text>
          </View>

          <Text
            style={
              styles.heroName
            }
          >
            {hero.heroName}
          </Text>

          <Text
            style={
              styles.heroClass
            }
          >
            Level {hero.level} •{" "}
            {currentClass.title}
          </Text>

          <View
            style={
              styles.levelBadge
            }
          >
            <Text
              style={
                styles.levelText
              }
            >
              LVL {hero.level}
            </Text>
          </View>

          {/* XP */}

          <View
            style={
              styles.xpSection
            }
          >
            <View
              style={
                styles.xpHeader
              }
            >
              <Text
                style={
                  styles.xpLabel
                }
              >
                EXPERIENCE
              </Text>

              <Text
                style={
                  styles.xpValue
                }
              >
                {hero.xp} /{" "}
                {xpNeeded} XP
              </Text>
            </View>

            <View
              style={
                styles.progressTrack
              }
            >
              <View
                style={[
                  styles.progressFill,

                  {
                    width:
                      `${xpProgress}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.nextLevel
              }
            >
              {remainingXP > 0
                ? `${remainingXP} XP until Level ${hero.level + 1
                }`
                : "Ready to level up!"}
            </Text>
          </View>
        </View>

        {/* ACCOUNT */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Account
        </Text>

        <View
          style={
            styles.sectionCard
          }
        >
          {/* EMAIL */}

          <View
            style={
              styles.infoRow
            }
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <Text
                style={
                  styles.infoEmoji
                }
              >
                ✉️
              </Text>
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                EMAIL
              </Text>

              <Text
                style={
                  styles.infoValue
                }
                numberOfLines={1}
              >
                {hero.email}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.divider
            }
          />

          {/* HERO CLASS */}

          <View
            style={
              styles.infoRow
            }
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <Text
                style={
                  styles.infoEmoji
                }
              >
                ⚔️
              </Text>
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                HERO CLASS
              </Text>

              <Text
                style={
                  styles.infoValue
                }
              >
                {
                  currentClass.emoji
                }{" "}
                {
                  currentClass.title
                }
              </Text>
            </View>
          </View>

          <View
            style={
              styles.divider
            }
          />

          {/* STATUS */}

          <View
            style={
              styles.infoRow
            }
          >
            <View
              style={
                styles.infoIcon
              }
            >
              <Text
                style={
                  styles.infoEmoji
                }
              >
                🆔
              </Text>
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={
                  styles.infoLabel
                }
              >
                ACCOUNT STATUS
              </Text>

              <Text
                style={
                  styles.activeText
                }
              >
                ● Active
              </Text>
            </View>
          </View>
        </View>

        {/* HERO PROGRESS */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Hero Progress
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push("/achievements")
            }
          >
            <Text
              style={
                styles.viewLink
              }
            >
              View Hero →
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.statsCard
          }
        >
          <View
            style={
              styles.statItem
            }
          >
            <Text
              style={
                styles.statEmoji
              }
            >
              ⭐
            </Text>

            <Text
              style={
                styles.statValue
              }
            >
              {hero.totalXP}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Total XP
            </Text>
          </View>

          <View
            style={
              styles.verticalDivider
            }
          />

          <View
            style={
              styles.statItem
            }
          >
            <Text
              style={
                styles.statEmoji
              }
            >
              ⚔️
            </Text>

            <Text
              style={
                styles.statValue
              }
            >
              {completedCount}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Quests
            </Text>
          </View>

          <View
            style={
              styles.verticalDivider
            }
          />

          <View
            style={
              styles.statItem
            }
          >
            <Text
              style={
                styles.statEmoji
              }
            >
              🔥
            </Text>

            <Text
              style={
                styles.statValue
              }
            >
              {hero.streak}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Streak
            </Text>
          </View>
        </View>

        {/* ACHIEVEMENT SUMMARY */}

        <View
          style={
            styles.achievementSummary
          }
        >
          <View
            style={
              styles.achievementSummaryIcon
            }
          >
            <Text
              style={
                styles.achievementSummaryEmoji
              }
            >
              🏆
            </Text>
          </View>

          <View
            style={
              styles.achievementSummaryInfo
            }
          >
            <Text
              style={
                styles.achievementSummaryLabel
              }
            >
              ACHIEVEMENTS
            </Text>

            <Text
              style={
                styles.achievementSummaryValue
              }
            >
              {achievementCount}{" "}
              unlocked
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/character"
              )
            }
          >
            <Text
              style={
                styles.summaryArrow
              }
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Settings
        </Text>

        <View
          style={
            styles.sectionCard
          }
        >
          {/* EDIT HERO */}

          <TouchableOpacity
            style={
              styles.settingRow
            }
            activeOpacity={0.7}
            onPress={
              handleEditHero
            }
          >
            <View
              style={
                styles.settingLeft
              }
            >
              <Text
                style={
                  styles.settingEmoji
                }
              >
                ✏️
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
                  Change hero name
                  and class
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.arrow
              }
            >
              ›
            </Text>
          </TouchableOpacity>

          <View
            style={
              styles.divider
            }
          />

          {/* ACHIEVEMENTS */}

          <TouchableOpacity
            style={
              styles.settingRow
            }
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/character"
              )
            }
          >
            <View
              style={
                styles.settingLeft
              }
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
                  {
                    achievementCount
                  }{" "}
                  rewards unlocked
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.arrow
              }
            >
              ›
            </Text>
          </TouchableOpacity>

          <View
            style={
              styles.divider
            }
          />

          {/* QUEST HISTORY */}

          <TouchableOpacity
            style={
              styles.settingRow
            }
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/history"
              )
            }
          >
            <View
              style={
                styles.settingLeft
              }
            >
              <Text
                style={
                  styles.settingEmoji
                }
              >
                📖
              </Text>

              <View>
                <Text
                  style={
                    styles.settingText
                  }
                >
                  Quest History
                </Text>

                <Text
                  style={
                    styles.settingSubtext
                  }
                >
                  View completed
                  adventures
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.arrow
              }
            >
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
                style={
                  styles.logoutText
                }
              >
                Logging Out...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={
                  styles.logoutIcon
                }
              >
                🚪
              </Text>

              <Text
                style={
                  styles.logoutText
                }
              >
                Log Out
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text
          style={
            styles.version
          }
        >
          REAL-LIFE RPG • VERSION
          1.0
        </Text>
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#0F172A",
    },

    loadingScreen: {
      flex: 1,
      backgroundColor:
        "#0F172A",
      justifyContent:
        "center",
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
      backgroundColor:
        "#1E293B",
      borderRadius: 22,
      padding: 22,
      alignItems: "center",
      borderWidth: 1,
      borderColor:
        "#334155",
      marginBottom: 28,
    },

    avatar: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor:
        "#312E81",
      alignItems: "center",
      justifyContent:
        "center",
      borderWidth: 2,
      borderColor:
        "#7C3AED",
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
      backgroundColor:
        "#7C3AED",
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
      justifyContent:
        "space-between",
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
      backgroundColor:
        "#334155",
      borderRadius: 10,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        "#7C3AED",
      borderRadius: 10,
    },

    nextLevel: {
      color: "#64748B",
      fontSize: 9,
      marginTop: 8,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    sectionTitle: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 12,
    },

    viewLink: {
      color: "#A78BFA",
      fontSize: 10,
      fontWeight: "800",
      marginBottom: 12,
    },

    sectionCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#334155",
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
      backgroundColor:
        "#0F172A",
      alignItems: "center",
      justifyContent:
        "center",
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
      backgroundColor:
        "#334155",
    },

    statsCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#334155",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 18,
      marginBottom: 13,
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
      backgroundColor:
        "#334155",
    },

    achievementSummary: {
      backgroundColor:
        "#312E81",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#4C1D95",
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 27,
    },

    achievementSummaryIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor:
        "#1E1B4B",
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 12,
    },

    achievementSummaryEmoji: {
      fontSize: 21,
    },

    achievementSummaryInfo: {
      flex: 1,
    },

    achievementSummaryLabel: {
      color: "#A78BFA",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1,
    },

    achievementSummaryValue: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
      marginTop: 4,
    },

    summaryArrow: {
      color: "#C4B5FD",
      fontSize: 25,
    },

    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
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
      backgroundColor:
        "#3F1D2E",
      borderWidth: 1,
      borderColor:
        "#7F1D1D",
      borderRadius: 16,
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
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