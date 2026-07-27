import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";

import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

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

type Difficulty = "Easy" | "Medium" | "Hard";

type Quest = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  xp: number;
  difficulty: Difficulty;
  custom?: boolean;
};

type AchievementInfo = {
  id: string;
  emoji: string;
  title: string;
  description: string;
};

// ============================================
// ACHIEVEMENTS
// ============================================

const ACHIEVEMENT_INFO: Record<
  string,
  AchievementInfo
> = {
  "first-step": {
    id: "first-step",
    emoji: "🌱",
    title: "First Step",
    description: "Complete your first quest",
  },

  "rising-hero": {
    id: "rising-hero",
    emoji: "⭐",
    title: "Rising Hero",
    description: "Earn 100 total XP",
  },

  "quest-master": {
    id: "quest-master",
    emoji: "⚔️",
    title: "Quest Master",
    description: "Complete 25 quests",
  },

  "streak-3": {
    id: "streak-3",
    emoji: "🥉",
    title: "3-Day Warrior",
    description: "Reach a 3 day streak",
  },

  "streak-7": {
    id: "streak-7",
    emoji: "🥈",
    title: "7-Day Champion",
    description: "Reach a 7 day streak",
  },

  "streak-14": {
    id: "streak-14",
    emoji: "🥇",
    title: "14-Day Master",
    description: "Reach a 14 day streak",
  },

  "streak-30": {
    id: "streak-30",
    emoji: "👑",
    title: "30-Day Legend",
    description: "Reach a 30 day streak",
  },
};

// ============================================
// DAILY QUESTS
// ============================================

const DAILY_QUESTS: Quest[] = [
  {
    id: "daily-1",
    emoji: "💪",
    title: "Morning Workout",
    description: "Exercise for at least 30 minutes",
    xp: 20,
    difficulty: "Medium",
  },

  {
    id: "daily-2",
    emoji: "📚",
    title: "Study Session",
    description: "Focus and study for 1 hour",
    xp: 30,
    difficulty: "Hard",
  },

  {
    id: "daily-3",
    emoji: "💧",
    title: "Stay Hydrated",
    description: "Drink enough water throughout the day",
    xp: 10,
    difficulty: "Easy",
  },

  {
    id: "daily-4",
    emoji: "🧘",
    title: "Mindfulness",
    description: "Meditate or reflect for 10 minutes",
    xp: 15,
    difficulty: "Easy",
  },
];

// ============================================
// DATE HELPERS
// ============================================

const getTodayKey = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getYesterdayKey = () => {
  const yesterday = new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const year = yesterday.getFullYear();

  const month = String(
    yesterday.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    yesterday.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ============================================
// SCREEN
// ============================================

export default function QuestsScreen() {
  const [
    completedQuests,
    setCompletedQuests,
  ] = useState<string[]>([]);

  const [
    customQuests,
    setCustomQuests,
  ] = useState<Quest[]>([]);

  const [totalXP, setTotalXP] =
    useState(0);

  const [streak, setStreak] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [
    customLoading,
    setCustomLoading,
  ] = useState(true);

  const [
    completingId,
    setCompletingId,
  ] = useState<string | null>(null);

  // ============================================
  // MESSAGE HELPER
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
  // AUTOMATIC DAILY RESET + STREAK CHECK
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const prepareDailyQuests =
      async () => {
        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const today =
          getTodayKey();

        const yesterday =
          getYesterdayKey();

        try {
          await runTransaction(
            db,

            async (transaction) => {
              const snapshot =
                await transaction.get(
                  userRef
                );

              if (!snapshot.exists()) {
                return;
              }

              const data =
                snapshot.data();

              const storedQuestDate =
                data.questDate || "";

              const lastActiveDate =
                data.lastActiveDate || "";

              const currentStreak =
                data.streak ?? 0;

              const updates:
                Record<string, any> = {};

              // DAILY RESET

              if (
                storedQuestDate !== today
              ) {
                updates.completedQuests =
                  [];

                updates.questDate =
                  today;
              }

              // STREAK RESET

              const streakExpired =
                lastActiveDate !== today &&
                lastActiveDate !== yesterday;

              if (
                streakExpired &&
                currentStreak !== 0
              ) {
                updates.streak = 0;
              }

              if (
                Object.keys(updates)
                  .length > 0
              ) {
                updates.updatedAt =
                  serverTimestamp();

                transaction.update(
                  userRef,
                  updates
                );
              }
            }
          );

          console.log(
            "DAILY QUEST + STREAK CHECK COMPLETE"
          );
        } catch (error) {
          console.error(
            "DAILY QUEST / STREAK RESET ERROR:",
            error
          );
        }
      };

    prepareDailyQuests();
  }, []);

  // ============================================
  // LOAD USER DATA
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);

      router.replace(
        "/login"
      );

      return;
    }

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const unsubscribe =
      onSnapshot(
        userRef,

        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            const data =
              snapshot.data();

            const today =
              getTodayKey();

            const storedDate =
              data.questDate || "";

            if (
              storedDate === today
            ) {
              const normalized =
                (
                  data.completedQuests ||
                  []
                ).map(
                  (
                    id:
                      | string
                      | number
                  ) =>
                    String(id)
                );

              setCompletedQuests(
                normalized
              );
            } else {
              setCompletedQuests(
                []
              );
            }

            setTotalXP(
              data.totalXP ?? 0
            );

            setStreak(
              data.streak ?? 0
            );
          }

          setLoading(false);
        },

        (error) => {
          console.error(
            "QUEST USER FIRESTORE ERROR:",
            error
          );

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // ============================================
  // LOAD CUSTOM QUESTS
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setCustomLoading(
        false
      );

      return;
    }

    const customQuestRef =
      collection(
        db,
        "users",
        user.uid,
        "customQuests"
      );

    const customQuestQuery =
      query(
        customQuestRef,

        where(
          "active",
          "==",
          true
        )
      );

    const unsubscribe =
      onSnapshot(
        customQuestQuery,

        (snapshot) => {
          const loadedQuests:
            Quest[] =
            snapshot.docs.map(
              (
                questDocument
              ) => {
                const data =
                  questDocument.data();

                return {
                  id:
                    `custom-${questDocument.id}`,

                  emoji:
                    data.emoji ||
                    "⚔️",

                  title:
                    data.title ||
                    "Custom Quest",

                  description:
                    data.description ||
                    "",

                  xp:
                    data.xp ??
                    10,

                  difficulty:
                    data.difficulty ||
                    "Easy",

                  custom: true,
                };
              }
            );

          setCustomQuests(
            loadedQuests
          );

          setCustomLoading(
            false
          );
        },

        (error) => {
          console.error(
            "CUSTOM QUEST FIRESTORE ERROR:",
            error
          );

          setCustomLoading(
            false
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // ============================================
  // COMPLETE QUEST
  // ============================================

  const completeQuest =
    async (quest: Quest) => {
      const user =
        auth.currentUser;

      if (!user) {
        showMessage(
          "Session Error",
          "Please sign in again."
        );

        router.replace(
          "/login"
        );

        return;
      }

      if (
        completedQuests.includes(
          quest.id
        )
      ) {
        return;
      }

      try {
        setCompletingId(
          quest.id
        );

        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const today =
          getTodayKey();

        const yesterday =
          getYesterdayKey();

        // ======================================
        // TRANSACTION RETURNS NEW ACHIEVEMENTS
        // ======================================

        const result =
          await runTransaction(
            db,

            async (
              transaction
            ) => {
              const snapshot =
                await transaction.get(
                  userRef
                );

              if (
                !snapshot.exists()
              ) {
                throw new Error(
                  "Hero profile not found."
                );
              }

              const data =
                snapshot.data();

              // ==================================
              // TODAY'S COMPLETED QUESTS
              // ==================================

              const storedDate =
                data.questDate || "";

              let currentCompleted:
                string[] = [];

              if (
                storedDate === today
              ) {
                currentCompleted =
                  (
                    data.completedQuests ||
                    []
                  ).map(
                    (
                      id:
                        | string
                        | number
                    ) =>
                      String(id)
                  );
              }

              // ==================================
              // DUPLICATE PROTECTION
              // ==================================

              if (
                currentCompleted.includes(
                  quest.id
                )
              ) {
                return {
                  completed: false,
                  newAchievements:
                    [] as string[],
                };
              }

              const newCompleted = [
                ...currentCompleted,
                quest.id,
              ];

              // ==================================
              // XP + LEVEL
              // ==================================

              const currentXP =
                data.xp ?? 0;

              const currentTotalXP =
                data.totalXP ?? 0;

              const currentLevel =
                data.level ?? 1;

              let newXP =
                currentXP +
                quest.xp;

              let newLevel =
                currentLevel;

              while (
                newXP >= 100
              ) {
                newXP -= 100;

                newLevel += 1;
              }

              const newTotalXP =
                currentTotalXP +
                quest.xp;

              // ==================================
              // LIFETIME QUEST COUNT
              // ==================================

              const currentQuestCount =
                data.totalQuestsCompleted ??
                0;

              const newQuestCount =
                currentQuestCount +
                1;

              // ==================================
              // STREAK
              // ==================================

              const lastActiveDate =
                data.lastActiveDate || "";

              let newStreak =
                data.streak ?? 0;

              if (
                lastActiveDate !== today
              ) {
                if (
                  lastActiveDate ===
                  yesterday
                ) {
                  newStreak =
                    (data.streak ??
                      0) + 1;
                } else {
                  newStreak = 1;
                }
              }

              // ==================================
              // SAVED ACHIEVEMENTS
              // ==================================

              const savedAchievements:
                string[] =
                Array.isArray(
                  data.unlockedAchievements
                )
                  ? data.unlockedAchievements.map(
                    (
                      id: unknown
                    ) =>
                      String(id)
                  )
                  : [];

              const savedSet =
                new Set<string>(
                  savedAchievements
                );

              const achievementSet =
                new Set<string>(
                  savedAchievements
                );

              // ==================================
              // FIRST STEP
              // ==================================

              achievementSet.add(
                "first-step"
              );

              // ==================================
              // RISING HERO
              // ==================================

              if (
                newTotalXP >= 100
              ) {
                achievementSet.add(
                  "rising-hero"
                );
              }

              // ==================================
              // QUEST MASTER
              // ==================================

              if (
                newQuestCount >= 25
              ) {
                achievementSet.add(
                  "quest-master"
                );
              }

              // ==================================
              // STREAK MILESTONES
              // ==================================

              if (
                newStreak >= 3
              ) {
                achievementSet.add(
                  "streak-3"
                );
              }

              if (
                newStreak >= 7
              ) {
                achievementSet.add(
                  "streak-7"
                );
              }

              if (
                newStreak >= 14
              ) {
                achievementSet.add(
                  "streak-14"
                );
              }

              if (
                newStreak >= 30
              ) {
                achievementSet.add(
                  "streak-30"
                );
              }

              const unlockedAchievements =
                Array.from(
                  achievementSet
                );

              // ==================================
              // FIND ONLY NEW ACHIEVEMENTS
              // ==================================

              const newAchievements =
                unlockedAchievements.filter(
                  (achievementId) =>
                    !savedSet.has(
                      achievementId
                    )
                );

              // ==================================
              // UPDATE USER
              // ==================================

              transaction.update(
                userRef,
                {
                  completedQuests:
                    newCompleted,

                  questDate:
                    today,

                  xp:
                    newXP,

                  totalXP:
                    newTotalXP,

                  level:
                    newLevel,

                  totalQuestsCompleted:
                    newQuestCount,

                  streak:
                    newStreak,

                  lastActiveDate:
                    today,

                  unlockedAchievements,

                  updatedAt:
                    serverTimestamp(),
                }
              );

              // ==================================
              // QUEST HISTORY
              // ==================================

              const safeQuestId =
                quest.id.replace(
                  /[^a-zA-Z0-9_-]/g,
                  "_"
                );

              const historyRef =
                doc(
                  db,
                  "users",
                  user.uid,
                  "questHistory",
                  `${today}_${safeQuestId}`
                );

              transaction.set(
                historyRef,
                {
                  questId:
                    quest.id,

                  title:
                    quest.title,

                  description:
                    quest.description,

                  emoji:
                    quest.emoji,

                  difficulty:
                    quest.difficulty,

                  xpEarned:
                    quest.xp,

                  custom:
                    quest.custom ??
                    false,

                  completedDate:
                    today,

                  completedAt:
                    serverTimestamp(),
                }
              );

              // ==================================
              // RETURN TRANSACTION RESULT
              // ==================================

              return {
                completed: true,
                newAchievements,
                newLevel,
                newStreak,
                newTotalXP,
              };
            }
          );

        // ========================================
        // DUPLICATE TRANSACTION RESULT
        // ========================================

        if (
          !result ||
          !result.completed
        ) {
          return;
        }

        console.log(
          "======================"
        );

        console.log(
          "QUEST COMPLETED:",
          quest.title
        );

        console.log(
          "XP EARNED:",
          quest.xp
        );

        console.log(
          "NEW ACHIEVEMENTS:",
          result.newAchievements
        );

        console.log(
          "QUEST HISTORY SAVED"
        );

        console.log(
          "======================"
        );

        // ========================================
        // ACHIEVEMENT POPUP
        // ========================================

        if (
          result.newAchievements.length >
          0
        ) {
          const unlockedDetails =
            result.newAchievements
              .map(
                (
                  achievementId
                ) =>
                  ACHIEVEMENT_INFO[
                  achievementId
                  ]
              )
              .filter(
                (
                  achievement
                ): achievement is AchievementInfo =>
                  Boolean(
                    achievement
                  )
              );

          const achievementMessage =
            unlockedDetails
              .map(
                (
                  achievement
                ) =>
                  `${achievement.emoji} ${achievement.title}\n${achievement.description}`
              )
              .join(
                "\n\n"
              );

          showMessage(
            "🏆 Achievement Unlocked!",
            `Quest Complete: ${quest.title}\n+${quest.xp} XP\n\n${achievementMessage}`
          );
        } else {
          // ======================================
          // NORMAL QUEST POPUP
          // ======================================

          showMessage(
            "Quest Complete! ⚔️",
            `${quest.title}\n\nYou earned +${quest.xp} XP`
          );
        }
      } catch (
      error: any
      ) {
        console.error(
          "COMPLETE QUEST ERROR:",
          error
        );

        const message =
          error?.message ||
          "Unable to complete quest.";

        showMessage(
          "Quest Error",
          message
        );
      } finally {
        setCompletingId(
          null
        );
      }
    };

  // ============================================
  // CALCULATIONS
  // ============================================

  const completedDaily =
    DAILY_QUESTS.filter(
      (quest) =>
        completedQuests.includes(
          quest.id
        )
    );

  const completedCustom =
    customQuests.filter(
      (quest) =>
        completedQuests.includes(
          quest.id
        )
    );

  const earnedToday =
    completedDaily.reduce(
      (total, quest) =>
        total + quest.xp,
      0
    ) +
    completedCustom.reduce(
      (total, quest) =>
        total + quest.xp,
      0
    );

  const dailyProgress =
    DAILY_QUESTS.length > 0
      ? (
        completedDaily.length /
        DAILY_QUESTS.length
      ) * 100
      : 0;

  const remainingDaily =
    Math.max(
      DAILY_QUESTS.length -
      completedDaily.length,
      0
    );

  // ============================================
  // QUEST CARD
  // ============================================

  const QuestCard = ({
    quest,
  }: {
    quest: Quest;
  }) => {
    const completed =
      completedQuests.includes(
        quest.id
      );

    const isCompleting =
      completingId ===
      quest.id;

    return (
      <View
        style={[
          styles.questCard,

          completed &&
          styles.completedCard,

          quest.custom &&
          styles.customQuestCard,
        ]}
      >
        {quest.custom && (
          <View
            style={
              styles.customLabel
            }
          >
            <Text
              style={
                styles.customLabelText
              }
            >
              CUSTOM QUEST
            </Text>
          </View>
        )}

        <View
          style={styles.questTop}
        >
          <View
            style={
              styles.questIcon
            }
          >
            <Text
              style={
                styles.questEmoji
              }
            >
              {completed
                ? "✅"
                : quest.emoji}
            </Text>
          </View>

          <View
            style={
              styles.questInformation
            }
          >
            <Text
              style={[
                styles.questTitle,

                completed &&
                styles.completedQuestTitle,
              ]}
            >
              {quest.title}
            </Text>

            <Text
              style={
                styles.questDescription
              }
            >
              {quest.description}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.questMeta
          }
        >
          <View
            style={
              styles.badges
            }
          >
            <View
              style={
                styles.difficultyBadge
              }
            >
              <Text
                style={
                  styles.difficultyText
                }
              >
                {quest.difficulty}
              </Text>
            </View>

            <View
              style={
                styles.xpBadge
              }
            >
              <Text
                style={
                  styles.xpText
                }
              >
                +{quest.xp} XP
              </Text>
            </View>
          </View>

          <View
            style={
              styles.actionButtons
            }
          >
            {quest.custom &&
              !completed && (
                <TouchableOpacity
                  style={
                    styles.editButton
                  }
                  activeOpacity={
                    0.75
                  }
                  onPress={() => {
                    const firestoreId =
                      quest.id.replace(
                        "custom-",
                        ""
                      );

                    router.push({
                      pathname:
                        "/edit-quest",

                      params: {
                        id: firestoreId,
                      },
                    });
                  }}
                >
                  <Text
                    style={
                      styles.editButtonText
                    }
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              )}

            <TouchableOpacity
              disabled={
                completed ||
                isCompleting
              }
              onPress={() =>
                completeQuest(
                  quest
                )
              }
              activeOpacity={
                0.75
              }
              style={[
                styles.completeButton,

                completed &&
                styles.completedButton,
              ]}
            >
              {isCompleting ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={[
                    styles.completeButtonText,

                    completed &&
                    styles.completedButtonText,
                  ]}
                >
                  {completed
                    ? "Completed ✓"
                    : "Complete"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // LOADING
  // ============================================

  if (
    loading ||
    customLoading
  ) {
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
          Loading today's quests...
        </Text>
      </View>
    );
  }

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

        <View
          style={styles.header}
        >
          <Text
            style={styles.eyebrow}
          >
            QUEST BOARD
          </Text>

          <Text
            style={styles.title}
          >
            📜 Daily Quests
          </Text>

          <Text
            style={styles.subtitle}
          >
            Complete real-life
            missions every day, earn
            XP and build your streak.
          </Text>
        </View>

        {/* STREAK */}

        <View
          style={
            styles.streakCard
          }
        >
          <View>
            <Text
              style={
                styles.streakLabel
              }
            >
              CURRENT STREAK
            </Text>

            <Text
              style={
                styles.streakValue
              }
            >
              🔥 {streak}{" "}
              {streak === 1
                ? "Day"
                : "Days"}
            </Text>
          </View>

          <View
            style={
              styles.totalXPContainer
            }
          >
            <Text
              style={
                styles.totalXPLabel
              }
            >
              TOTAL XP
            </Text>

            <Text
              style={
                styles.totalXPValue
              }
            >
              ⭐ {totalXP}
            </Text>
          </View>
        </View>

        {/* PROGRESS */}

        <View
          style={
            styles.progressCard
          }
        >
          <View
            style={
              styles.progressHeader
            }
          >
            <View>
              <Text
                style={
                  styles.progressLabel
                }
              >
                DAILY PROGRESS
              </Text>

              <Text
                style={
                  styles.progressValue
                }
              >
                {
                  completedDaily.length
                }
                /
                {
                  DAILY_QUESTS.length
                }{" "}
                completed
              </Text>
            </View>

            <Text
              style={
                styles.earnedXP
              }
            >
              +{earnedToday} XP
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
                    `${dailyProgress}%`,
                },
              ]}
            />
          </View>

          <Text
            style={
              styles.remainingText
            }
          >
            {remainingDaily === 0
              ? "All daily quests completed! 🏆"
              : `${remainingDaily} daily ${remainingDaily === 1
                ? "quest"
                : "quests"
              } remaining`}
          </Text>
        </View>

        {/* DAILY QUESTS */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Today's Quests
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Resets every new day
            </Text>
          </View>
        </View>

        {DAILY_QUESTS.map(
          (quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
            />
          )
        )}

        {/* VICTORY */}

        {completedDaily.length ===
          DAILY_QUESTS.length && (
            <View
              style={
                styles.victoryCard
              }
            >
              <Text
                style={
                  styles.victoryEmoji
                }
              >
                🏆
              </Text>

              <View
                style={
                  styles.victoryInfo
                }
              >
                <Text
                  style={
                    styles.victoryTitle
                  }
                >
                  Daily Quest Clear!
                </Text>

                <Text
                  style={
                    styles.victoryText
                  }
                >
                  You completed every
                  daily quest today.
                </Text>
              </View>
            </View>
          )}

        {/* CUSTOM HEADER */}

        <View
          style={
            styles.customHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Custom Quests
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Your personal missions
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.addQuestButton
            }
            activeOpacity={
              0.75
            }
            onPress={() =>
              router.push(
                "/create-quest"
              )
            }
          >
            <Text
              style={
                styles.addQuestText
              }
            >
              + Create
            </Text>
          </TouchableOpacity>
        </View>

        {/* CUSTOM QUESTS */}

        {customQuests.length >
          0 ? (
          customQuests.map(
            (quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
              />
            )
          )
        ) : (
          <View
            style={
              styles.emptyCustomCard
            }
          >
            <Text
              style={
                styles.emptyCustomEmoji
              }
            >
              ⚔️
            </Text>

            <Text
              style={
                styles.emptyCustomTitle
              }
            >
              Create your own quest
            </Text>

            <Text
              style={
                styles.emptyCustomText
              }
            >
              Turn a real-life goal
              into a mission and earn
              XP when you complete it.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyCreateButton
              }
              activeOpacity={
                0.75
              }
              onPress={() =>
                router.push(
                  "/create-quest"
                )
              }
            >
              <Text
                style={
                  styles.emptyCreateText
                }
              >
                Create Quest
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INFO */}

        <View
          style={styles.infoCard}
        >
          <Text
            style={
              styles.infoEmoji
            }
          >
            🌅
          </Text>

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              New day, new adventure
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Daily quests reset each
              day. XP, level, lifetime
              quest count and unlocked
              achievements stay
              permanently saved.
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
      alignItems: "center",
      justifyContent:
        "center",
      padding: 30,
    },

    loadingText: {
      color: "#94A3B8",
      fontSize: 13,
      marginTop: 15,
    },

    container: {
      padding: 20,
      paddingTop: 55,
      paddingBottom: 60,
    },

    header: {
      marginBottom: 20,
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
    },

    streakCard: {
      backgroundColor:
        "#3F2415",
      borderWidth: 1,
      borderColor:
        "#92400E",
      borderRadius: 18,
      padding: 17,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    streakLabel: {
      color: "#F59E0B",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 5,
    },

    streakValue: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "900",
    },

    totalXPContainer: {
      alignItems: "flex-end",
    },

    totalXPLabel: {
      color: "#F59E0B",
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 5,
    },

    totalXPValue: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },

    progressCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#334155",
      padding: 17,
      marginBottom: 28,
    },

    progressHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 14,
    },

    progressLabel: {
      color: "#A78BFA",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.3,
      marginBottom: 5,
    },

    progressValue: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
    },

    earnedXP: {
      color: "#C4B5FD",
      fontSize: 13,
      fontWeight: "900",
    },

    progressTrack: {
      width: "100%",
      height: 9,
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

    remainingText: {
      color: "#64748B",
      fontSize: 10,
      marginTop: 8,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 14,
    },

    sectionTitle: {
      color: "#FFFFFF",
      fontSize: 19,
      fontWeight: "800",
    },

    sectionSubtitle: {
      color: "#64748B",
      fontSize: 10,
      marginTop: 4,
    },

    questCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        "#334155",
      padding: 15,
      marginBottom: 12,
    },

    customQuestCard: {
      borderColor:
        "#4C1D95",
    },

    completedCard: {
      opacity: 0.68,
      borderColor:
        "#166534",
    },

    customLabel: {
      alignSelf:
        "flex-start",
      backgroundColor:
        "#312E81",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      marginBottom: 11,
    },

    customLabelText: {
      color: "#C4B5FD",
      fontSize: 7,
      fontWeight: "900",
      letterSpacing: 1,
    },

    questTop: {
      flexDirection: "row",
      alignItems: "center",
    },

    questIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor:
        "#0F172A",
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 12,
    },

    questEmoji: {
      fontSize: 23,
    },

    questInformation: {
      flex: 1,
    },

    questTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
    },

    completedQuestTitle: {
      textDecorationLine:
        "line-through",
      color: "#94A3B8",
    },

    questDescription: {
      color: "#94A3B8",
      fontSize: 10,
      lineHeight: 15,
      marginTop: 4,
    },

    questMeta: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    badges: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },

    difficultyBadge: {
      backgroundColor:
        "#0F172A",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },

    difficultyText: {
      color: "#94A3B8",
      fontSize: 8,
      fontWeight: "800",
    },

    xpBadge: {
      backgroundColor:
        "#312E81",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },

    xpText: {
      color: "#C4B5FD",
      fontSize: 8,
      fontWeight: "900",
    },

    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    editButton: {
      backgroundColor:
        "#334155",
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 9,
    },

    editButtonText: {
      color: "#CBD5E1",
      fontSize: 9,
      fontWeight: "800",
    },

    completeButton: {
      minWidth: 82,
      minHeight: 34,
      backgroundColor:
        "#7C3AED",
      borderRadius: 10,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 10,
    },

    completedButton: {
      backgroundColor:
        "#14532D",
    },

    completeButtonText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
    },

    completedButtonText: {
      color: "#86EFAC",
    },

    victoryCard: {
      backgroundColor:
        "#3F2B0B",
      borderWidth: 1,
      borderColor:
        "#A16207",
      borderRadius: 17,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      marginBottom: 27,
    },

    victoryEmoji: {
      fontSize: 31,
      marginRight: 13,
    },

    victoryInfo: {
      flex: 1,
    },

    victoryTitle: {
      color: "#FDE68A",
      fontSize: 14,
      fontWeight: "900",
    },

    victoryText: {
      color: "#D6D3D1",
      fontSize: 10,
      lineHeight: 15,
      marginTop: 4,
    },

    customHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginTop: 5,
      marginBottom: 14,
    },

    addQuestButton: {
      backgroundColor:
        "#7C3AED",
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 10,
    },

    addQuestText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "900",
    },

    emptyCustomCard: {
      backgroundColor:
        "#1E293B",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#334155",
      alignItems: "center",
      padding: 22,
      marginBottom: 20,
    },

    emptyCustomEmoji: {
      fontSize: 32,
      marginBottom: 9,
    },

    emptyCustomTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
    },

    emptyCustomText: {
      color: "#94A3B8",
      fontSize: 10,
      lineHeight: 16,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 14,
    },

    emptyCreateButton: {
      backgroundColor:
        "#312E81",
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 10,
    },

    emptyCreateText: {
      color: "#C4B5FD",
      fontSize: 10,
      fontWeight: "900",
    },

    infoCard: {
      backgroundColor:
        "#1E293B",
      borderWidth: 1,
      borderColor:
        "#334155",
      borderRadius: 16,
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },

    infoEmoji: {
      fontSize: 25,
      marginRight: 12,
    },

    infoContent: {
      flex: 1,
    },

    infoTitle: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 4,
    },

    infoText: {
      color: "#94A3B8",
      fontSize: 9,
      lineHeight: 15,
    },
  });