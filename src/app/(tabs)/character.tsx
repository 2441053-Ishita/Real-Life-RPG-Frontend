import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
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
  class: string;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;

  completedQuests: string[];

  totalQuestsCompleted: number;

  unlockedAchievements: string[];
};

type Achievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
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
// CHARACTER SCREEN
// ============================================

export default function CharacterScreen() {
  const [hero, setHero] =
    useState<HeroData | null>(null);

  const [loading, setLoading] =
    useState(true);

  // ============================================
  // LOAD HERO FROM FIRESTORE
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
          "CHARACTER FIRESTORE ERROR:",
          error
        );

        setLoading(false);
      }
    );

    return () =>
      unsubscribe();
  }, []);

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
          Loading your hero...
        </Text>
      </View>
    );
  }

  // ============================================
  // HERO NOT FOUND
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
          Hero not found
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          Your hero profile could not
          be loaded.
        </Text>
      </View>
    );
  }

  // ============================================
  // HERO VALUES
  // ============================================

  const currentClass =
    classInfo[hero.class] ||
    classInfo.warrior;

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
  // LIFETIME QUEST COUNT
  // ============================================

  const completedCount =
    hero.totalQuestsCompleted;

  // ============================================
  // HERO STATS
  // ============================================

  const strength =
    10 +
    (hero.level - 1) * 2;

  const intelligence =
    10 +
    (hero.level - 1) * 2;

  const agility =
    10 +
    (hero.level - 1) * 2;

  const vitality =
    10 +
    (hero.level - 1) * 2;

  const stats = [
    {
      icon: "💪",
      name: "Strength",
      value: strength,
    },

    {
      icon: "🧠",
      name: "Intelligence",
      value: intelligence,
    },

    {
      icon: "⚡",
      name: "Agility",
      value: agility,
    },

    {
      icon: "❤️",
      name: "Vitality",
      value: vitality,
    },
  ];

  // ============================================
  // PERMANENT ACHIEVEMENT CHECK
  // ============================================

  const hasAchievement = (
    id: string
  ) => {
    return (
      hero.unlockedAchievements.includes(
        id
      )
    );
  };

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  const achievements: Achievement[] =
    [
      {
        id: "first-step",

        icon: "🌱",

        title: "First Step",

        description:
          "Complete your first quest",

        unlocked:
          hasAchievement(
            "first-step"
          ) ||
          completedCount >= 1,
      },

      {
        id: "rising-hero",

        icon: "⭐",

        title: "Rising Hero",

        description:
          "Earn 100 total XP",

        unlocked:
          hasAchievement(
            "rising-hero"
          ) ||
          hero.totalXP >= 100,
      },

      {
        id: "streak-3",

        icon: "🥉",

        title: "3-Day Warrior",

        description:
          "Reach a 3 day streak",

        unlocked:
          hasAchievement(
            "streak-3"
          ),
      },

      {
        id: "streak-7",

        icon: "🥈",

        title: "7-Day Champion",

        description:
          "Reach a 7 day streak",

        unlocked:
          hasAchievement(
            "streak-7"
          ),
      },

      {
        id: "streak-14",

        icon: "🥇",

        title: "14-Day Master",

        description:
          "Reach a 14 day streak",

        unlocked:
          hasAchievement(
            "streak-14"
          ),
      },

      {
        id: "streak-30",

        icon: "👑",

        title: "30-Day Legend",

        description:
          "Reach a 30 day streak",

        unlocked:
          hasAchievement(
            "streak-30"
          ),
      },

      {
        id: "quest-master",

        icon: "⚔️",

        title: "Quest Master",

        description:
          "Complete 25 quests",

        unlocked:
          hasAchievement(
            "quest-master"
          ) ||
          completedCount >= 25,
      },
    ];

  // ============================================
  // ACHIEVEMENT COUNT
  // ============================================

  const unlockedCount =
    achievements.filter(
      (achievement) =>
        achievement.unlocked
    ).length;

  // ============================================
  // NEXT STREAK MILESTONE
  // ============================================

  const streakMilestones = [
    {
      days: 3,
      id: "streak-3",
    },

    {
      days: 7,
      id: "streak-7",
    },

    {
      days: 14,
      id: "streak-14",
    },

    {
      days: 30,
      id: "streak-30",
    },
  ];

  const nextStreakMilestone =
    streakMilestones.find(
      (milestone) =>
        !hasAchievement(
          milestone.id
        )
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
          YOUR HERO
        </Text>

        <Text
          style={styles.title}
        >
          ⚔️ Character
        </Text>

        <Text
          style={styles.subtitle}
        >
          Grow stronger with every
          quest you complete.
        </Text>

        {/* HERO CARD */}

        <View
          style={styles.heroCard}
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
                styles.levelBadgeText
              }
            >
              LVL {hero.level}
            </Text>
          </View>

          {/* XP */}

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

        {/* HERO STATS */}

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
            Hero Stats
          </Text>

          <Text
            style={
              styles.sectionHint
            }
          >
            Level {hero.level}
          </Text>
        </View>

        <View
          style={
            styles.statsGrid
          }
        >
          {stats.map(
            (stat) => (
              <View
                key={stat.name}
                style={
                  styles.statCard
                }
              >
                <Text
                  style={
                    styles.statIcon
                  }
                >
                  {stat.icon}
                </Text>

                <Text
                  style={
                    styles.statValue
                  }
                >
                  {stat.value}
                </Text>

                <Text
                  style={
                    styles.statName
                  }
                >
                  {stat.name}
                </Text>
              </View>
            )
          )}
        </View>

        {/* ADVENTURE RECORD */}

        <View
          style={
            styles.recordHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Adventure Record
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/quest-history"
              )
            }
          >
            <Text
              style={
                styles.historyLink
              }
            >
              View History →
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.recordCard
          }
        >
          <View
            style={
              styles.recordItem
            }
          >
            <Text
              style={
                styles.recordValue
              }
            >
              {completedCount}
            </Text>

            <Text
              style={
                styles.recordLabel
              }
            >
              Total Quests
            </Text>
          </View>

          <View
            style={
              styles.recordDivider
            }
          />

          <View
            style={
              styles.recordItem
            }
          >
            <Text
              style={
                styles.recordValue
              }
            >
              {hero.streak}
            </Text>

            <Text
              style={
                styles.recordLabel
              }
            >
              Day Streak
            </Text>
          </View>

          <View
            style={
              styles.recordDivider
            }
          />

          <View
            style={
              styles.recordItem
            }
          >
            <Text
              style={
                styles.recordValue
              }
            >
              {hero.totalXP}
            </Text>

            <Text
              style={
                styles.recordLabel
              }
            >
              Total XP
            </Text>
          </View>
        </View>

        {/* STREAK MILESTONE */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Streak Journey
        </Text>

        <View
          style={
            styles.streakJourneyCard
          }
        >
          <View
            style={
              styles.streakJourneyTop
            }
          >
            <View>
              <Text
                style={
                  styles.streakJourneyLabel
                }
              >
                CURRENT STREAK
              </Text>

              <Text
                style={
                  styles.streakJourneyValue
                }
              >
                🔥 {hero.streak}{" "}
                {hero.streak === 1
                  ? "Day"
                  : "Days"}
              </Text>
            </View>

            <Text
              style={
                styles.streakJourneyEmoji
              }
            >
              🏆
            </Text>
          </View>

          {nextStreakMilestone ? (
            <Text
              style={
                styles.streakJourneyText
              }
            >
              Next milestone:{" "}
              {
                nextStreakMilestone.days
              }{" "}
              day streak
            </Text>
          ) : (
            <Text
              style={
                styles.streakJourneyText
              }
            >
              All streak milestones
              unlocked. Legendary!
            </Text>
          )}

          <View
            style={
              styles.milestoneRow
            }
          >
            {streakMilestones.map(
              (milestone) => {
                const unlocked =
                  hasAchievement(
                    milestone.id
                  );

                return (
                  <View
                    key={
                      milestone.id
                    }
                    style={[
                      styles.milestoneItem,

                      unlocked &&
                      styles.milestoneUnlocked,
                    ]}
                  >
                    <Text
                      style={
                        styles.milestoneEmoji
                      }
                    >
                      {milestone.days ===
                        3
                        ? "🥉"
                        : milestone.days ===
                          7
                          ? "🥈"
                          : milestone.days ===
                            14
                            ? "🥇"
                            : "👑"}
                    </Text>

                    <Text
                      style={
                        styles.milestoneDays
                      }
                    >
                      {
                        milestone.days
                      }{" "}
                      Days
                    </Text>

                    <Text
                      style={
                        styles.milestoneStatus
                      }
                    >
                      {unlocked
                        ? "Unlocked"
                        : "Locked"}
                    </Text>
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* ACHIEVEMENTS */}

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
            Achievements
          </Text>

          <Text
            style={
              styles.sectionHint
            }
          >
            {unlockedCount} /{" "}
            {achievements.length}
          </Text>
        </View>

        {achievements.map(
          (achievement) => (
            <View
              key={
                achievement.id
              }
              style={[
                styles.achievementCard,

                !achievement.unlocked &&
                styles.lockedAchievement,

                achievement.unlocked &&
                styles.unlockedAchievementCard,
              ]}
            >
              <View
                style={
                  styles.achievementIcon
                }
              >
                <Text
                  style={
                    styles.achievementEmoji
                  }
                >
                  {achievement.unlocked
                    ? achievement.icon
                    : "🔒"}
                </Text>
              </View>

              <View
                style={
                  styles.achievementInfo
                }
              >
                <Text
                  style={
                    styles.achievementTitle
                  }
                >
                  {achievement.title}
                </Text>

                <Text
                  style={
                    styles.achievementDescription
                  }
                >
                  {
                    achievement.description
                  }
                </Text>
              </View>

              {achievement.unlocked ? (
                <View
                  style={
                    styles.unlockedBadge
                  }
                >
                  <Text
                    style={
                      styles.unlockedText
                    }
                  >
                    UNLOCKED
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.lockedBadge
                  }
                >
                  <Text
                    style={
                      styles.lockedText
                    }
                  >
                    LOCKED
                  </Text>
                </View>
              )}
            </View>
          )
        )}

        {/* MOTIVATION */}

        <View
          style={
            styles.motivationCard
          }
        >
          <Text
            style={
              styles.motivationEmoji
            }
          >
            🏆
          </Text>

          <View
            style={
              styles.motivationInfo
            }
          >
            <Text
              style={
                styles.motivationTitle
              }
            >
              Become Legendary
            </Text>

            <Text
              style={
                styles.motivationText
              }
            >
              Your real-life actions
              shape your hero. Complete
              quests, build your streak,
              unlock achievements and
              level up.
            </Text>
          </View>
        </View>
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
      lineHeight: 20,
      marginBottom: 24,
    },

    heroCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 22,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor:
        "#334155",
      marginBottom: 28,
    },

    avatar: {
      width: 85,
      height: 85,
      borderRadius: 43,
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
      fontSize: 42,
    },

    heroName: {
      color: "#FFFFFF",
      fontSize: 24,
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
      borderRadius: 15,
      marginTop: 12,
      marginBottom: 20,
    },

    levelBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "900",
    },

    xpHeader: {
      width: "100%",
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginBottom: 8,
    },

    xpLabel: {
      color: "#94A3B8",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
    },

    xpValue: {
      color: "#A78BFA",
      fontSize: 11,
      fontWeight: "800",
    },

    progressTrack: {
      width: "100%",
      height: 9,
      borderRadius: 10,
      backgroundColor:
        "#334155",
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        "#7C3AED",
      borderRadius: 10,
    },

    nextLevel: {
      alignSelf:
        "flex-start",
      color: "#64748B",
      fontSize: 10,
      marginTop: 8,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 14,
    },

    sectionTitle: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 14,
    },

    sectionHint: {
      color: "#64748B",
      fontSize: 11,
      marginBottom: 14,
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      marginBottom: 26,
    },

    statCard: {
      width: "48%",
      backgroundColor:
        "#1E293B",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#334155",
      alignItems: "center",
      paddingVertical: 17,
      marginBottom: 10,
    },

    statIcon: {
      fontSize: 24,
      marginBottom: 5,
    },

    statValue: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "900",
    },

    statName: {
      color: "#94A3B8",
      fontSize: 10,
      marginTop: 3,
    },

    // ========================================
    // ADVENTURE RECORD
    // ========================================

    recordHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    historyLink: {
      color: "#A78BFA",
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 14,
    },

    recordCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#334155",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 18,
      marginBottom: 28,
    },

    recordItem: {
      flex: 1,
      alignItems: "center",
    },

    recordValue: {
      color: "#FFFFFF",
      fontSize: 19,
      fontWeight: "900",
    },

    recordLabel: {
      color: "#94A3B8",
      fontSize: 9,
      marginTop: 4,
    },

    recordDivider: {
      height: 30,
      width: 1,
      backgroundColor:
        "#334155",
    },

    // ========================================
    // STREAK JOURNEY
    // ========================================

    streakJourneyCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#334155",
      padding: 16,
      marginBottom: 28,
    },

    streakJourneyTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    streakJourneyLabel: {
      color: "#F59E0B",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    streakJourneyValue: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "900",
      marginTop: 5,
    },

    streakJourneyEmoji: {
      fontSize: 32,
    },

    streakJourneyText: {
      color: "#94A3B8",
      fontSize: 10,
      marginTop: 10,
      marginBottom: 15,
    },

    milestoneRow: {
      flexDirection: "row",
      gap: 7,
    },

    milestoneItem: {
      flex: 1,
      backgroundColor:
        "#0F172A",
      borderWidth: 1,
      borderColor:
        "#334155",
      borderRadius: 12,
      alignItems: "center",
      paddingVertical: 10,
      opacity: 0.55,
    },

    milestoneUnlocked: {
      backgroundColor:
        "#312E81",
      borderColor:
        "#7C3AED",
      opacity: 1,
    },

    milestoneEmoji: {
      fontSize: 19,
      marginBottom: 4,
    },

    milestoneDays: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },

    milestoneStatus: {
      color: "#94A3B8",
      fontSize: 7,
      marginTop: 3,
    },

    // ========================================
    // ACHIEVEMENTS
    // ========================================

    achievementCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#1E293B",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#334155",
      padding: 14,
      marginBottom: 11,
    },

    unlockedAchievementCard: {
      borderColor:
        "#4C1D95",
    },

    lockedAchievement: {
      opacity: 0.55,
    },

    achievementIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor:
        "#0F172A",
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 12,
    },

    achievementEmoji: {
      fontSize: 21,
    },

    achievementInfo: {
      flex: 1,
      paddingRight: 5,
    },

    achievementTitle: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
    },

    achievementDescription: {
      color: "#94A3B8",
      fontSize: 10,
      marginTop: 4,
    },

    unlockedBadge: {
      backgroundColor:
        "#312E81",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },

    unlockedText: {
      color: "#C4B5FD",
      fontSize: 7,
      fontWeight: "900",
    },

    lockedBadge: {
      backgroundColor:
        "#0F172A",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },

    lockedText: {
      color: "#64748B",
      fontSize: 7,
      fontWeight: "900",
    },

    motivationCard: {
      backgroundColor:
        "#312E81",
      borderRadius: 18,
      padding: 17,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
    },

    motivationEmoji: {
      fontSize: 30,
      marginRight: 13,
    },

    motivationInfo: {
      flex: 1,
    },

    motivationTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 5,
    },

    motivationText: {
      color: "#C4B5FD",
      fontSize: 10,
      lineHeight: 16,
    },
  });