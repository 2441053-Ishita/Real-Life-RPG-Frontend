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
// DATE HELPER
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

// ============================================
// SCREEN
// ============================================

export default function QuestsScreen() {
  const [completedQuests, setCompletedQuests] =
    useState<string[]>([]);

  const [customQuests, setCustomQuests] =
    useState<Quest[]>([]);

  const [totalXP, setTotalXP] =
    useState(0);

  const [streak, setStreak] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [customLoading, setCustomLoading] =
    useState(true);

  const [completingId, setCompletingId] =
    useState<string | null>(null);

  // ============================================
  // LOAD USER DATA
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

          const today =
            getTodayKey();

          const storedDate =
            data.questDate || "";

          // Only show today's completions
          if (storedDate === today) {
            setCompletedQuests(
              data.completedQuests || []
            );
          } else {
            setCompletedQuests([]);
          }

          setTotalXP(
            data.totalXP ?? 0
          );

          setStreak(
            data.streak ?? 1
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

    return () => unsubscribe();
  }, []);

  // ============================================
  // LOAD CUSTOM QUESTS
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setCustomLoading(false);
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
        where("active", "==", true)
      );

    const unsubscribe =
      onSnapshot(
        customQuestQuery,

        (snapshot) => {
          const loadedQuests: Quest[] =
            snapshot.docs.map(
              (questDocument) => {
                const data =
                  questDocument.data();

                return {
                  id: `custom-${questDocument.id}`,

                  emoji:
                    data.emoji || "⚔️",

                  title:
                    data.title ||
                    "Custom Quest",

                  description:
                    data.description ||
                    "",

                  xp:
                    data.xp ?? 10,

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

          setCustomLoading(false);
        },

        (error) => {
          console.error(
            "CUSTOM QUEST FIRESTORE ERROR:",
            error
          );

          setCustomLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // ============================================
  // COMPLETE QUEST
  // ============================================

  const completeQuest = async (
    quest: Quest
  ) => {
    const user = auth.currentUser;

    if (!user) {
      if (Platform.OS === "web") {
        window.alert(
          "Please sign in again."
        );
      } else {
        Alert.alert(
          "Session Error",
          "Please sign in again."
        );
      }

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

      await runTransaction(
        db,

        async (transaction) => {
          const snapshot =
            await transaction.get(
              userRef
            );

          if (!snapshot.exists()) {
            throw new Error(
              "Hero profile not found."
            );
          }

          const data =
            snapshot.data();

          const today =
            getTodayKey();

          const storedDate =
            data.questDate || "";

          let currentCompleted: string[] =
            [];

          // ====================================
          // TODAY'S COMPLETED QUESTS
          // ====================================

          if (
            storedDate === today
          ) {
            currentCompleted =
              data.completedQuests ||
              [];
          }

          // Duplicate protection
          if (
            currentCompleted.includes(
              quest.id
            )
          ) {
            return;
          }

          // ====================================
          // XP
          // ====================================

          const currentXP =
            data.xp ?? 0;

          const currentTotalXP =
            data.totalXP ?? 0;

          const currentLevel =
            data.level ?? 1;

          let newXP =
            currentXP + quest.xp;

          let newLevel =
            currentLevel;

          // 100 XP = 1 level
          while (
            newXP >= 100
          ) {
            newXP -= 100;

            newLevel += 1;
          }

          // ====================================
          // STREAK
          // ====================================

          let newStreak =
            data.streak ?? 1;

          const lastActiveDate =
            data.lastActiveDate || "";

          if (
            lastActiveDate !== today
          ) {
            const yesterday =
              new Date();

            yesterday.setDate(
              yesterday.getDate() - 1
            );

            const yesterdayYear =
              yesterday.getFullYear();

            const yesterdayMonth =
              String(
                yesterday.getMonth() +
                1
              ).padStart(
                2,
                "0"
              );

            const yesterdayDay =
              String(
                yesterday.getDate()
              ).padStart(
                2,
                "0"
              );

            const yesterdayKey =
              `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

            if (
              lastActiveDate ===
              yesterdayKey
            ) {
              newStreak =
                (data.streak ?? 0) +
                1;
            } else {
              newStreak = 1;
            }
          }

          // ====================================
          // UPDATE FIRESTORE
          // ====================================

          transaction.update(
            userRef,
            {
              completedQuests: [
                ...currentCompleted,
                quest.id,
              ],

              questDate: today,

              xp: newXP,

              totalXP:
                currentTotalXP +
                quest.xp,

              level:
                newLevel,

              streak:
                newStreak,

              lastActiveDate:
                today,

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );

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
        "======================"
      );

      if (
        Platform.OS === "web"
      ) {
        window.alert(
          `Quest Complete! ⚔️\n\n+${quest.xp} XP`
        );
      } else {
        Alert.alert(
          "Quest Complete! ⚔️",
          `You earned +${quest.xp} XP`
        );
      }
    } catch (error: any) {
      console.error(
        "COMPLETE QUEST ERROR:",
        error
      );

      const message =
        error?.message ||
        "Unable to complete quest.";

      if (
        Platform.OS === "web"
      ) {
        window.alert(
          message
        );
      } else {
        Alert.alert(
          "Quest Error",
          message
        );
      }
    } finally {
      setCompletingId(
        null
      );
    }
  };

  // ============================================
  // DAILY CALCULATIONS
  // ============================================

  const completedDaily =
    DAILY_QUESTS.filter(
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
    customQuests
      .filter((quest) =>
        completedQuests.includes(
          quest.id
        )
      )
      .reduce(
        (total, quest) =>
          total + quest.xp,
        0
      );

  const dailyProgress =
    DAILY_QUESTS.length > 0
      ? (
        completedDaily.length /
        DAILY_QUESTS.length
      ) *
      100
      : 0;

  const remainingDaily =
    DAILY_QUESTS.length -
    completedDaily.length;

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
      completingId === quest.id;

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
        {/* CUSTOM LABEL */}

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

        {/* QUEST TOP */}

        <View
          style={styles.questTop}
        >
          <View
            style={styles.questIcon}
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

        {/* META */}

        <View
          style={styles.questMeta}
        >
          <View
            style={styles.badges}
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

          {/* ACTION BUTTONS */}

          <View
            style={styles.actionButtons}
          >
            {/* EDIT CUSTOM QUEST */}

            {quest.custom &&
              !completed && (
                <TouchableOpacity
                  style={
                    styles.editButton
                  }
                  activeOpacity={0.75}
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
                    ✏️ Edit
                  </Text>
                </TouchableOpacity>
              )}

            {/* COMPLETE */}

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
              activeOpacity={0.75}
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
          Loading quests...
        </Text>
      </View>
    );
  }

  // ============================================
  // UI
  // ============================================

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

        <View
          style={styles.headerRow}
        >
          <View style={styles.header}>
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
              missions and earn XP.
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.addQuestButton
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
              + Quest
            </Text>
          </TouchableOpacity>
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
                TODAY'S PROGRESS
              </Text>

              <Text
                style={
                  styles.progressTitle
                }
              >
                {
                  completedDaily.length
                }{" "}
                /{" "}
                {
                  DAILY_QUESTS.length
                }{" "}
                Completed
              </Text>
            </View>

            <Text
              style={
                styles.progressEmoji
              }
            >
              ⚔️
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

          <View
            style={
              styles.rewardRow
            }
          >
            <View>
              <Text
                style={
                  styles.rewardLabel
                }
              >
                XP earned today
              </Text>

              <Text
                style={
                  styles.rewardValue
                }
              >
                +{earnedToday} XP
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

          {/* STREAK */}

          <View
            style={
              styles.streakRow
            }
          >
            <Text
              style={
                styles.streakText
              }
            >
              🔥 {streak} Day
              Streak
            </Text>

            <Text
              style={
                styles.dateText
              }
            >
              {getTodayKey()}
            </Text>
          </View>
        </View>

        {/* DAILY QUEST HEADER */}

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
            Daily Missions
          </Text>

          <Text
            style={
              styles.questCount
            }
          >
            {remainingDaily}{" "}
            remaining
          </Text>
        </View>

        {/* DAILY QUESTS */}

        {DAILY_QUESTS.map(
          (quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
            />
          )
        )}

        {/* CUSTOM QUEST HEADER */}

        <View
          style={[
            styles.sectionHeader,
            styles.customSectionHeader,
          ]}
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Your Quests
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Missions created by
              you
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push(
                "/create-quest"
              )
            }
          >
            <Text
              style={
                styles.createLink
              }
            >
              + Create
            </Text>
          </TouchableOpacity>
        </View>

        {/* EMPTY CUSTOM QUESTS */}

        {customQuests.length ===
          0 && (
            <View
              style={
                styles.emptyCard
              }
            >
              <Text
                style={
                  styles.emptyEmoji
                }
              >
                ⚔️
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Create Your First
                Quest
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Turn your own goals
                into missions and
                earn XP.
              </Text>

              <TouchableOpacity
                style={
                  styles.emptyButton
                }
                onPress={() =>
                  router.push(
                    "/create-quest"
                  )
                }
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  + Create Quest
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* CUSTOM QUESTS */}

        {customQuests.map(
          (quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
            />
          )
        )}

        {/* DAILY COMPLETE */}

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

              <Text
                style={
                  styles.victoryTitle
                }
              >
                Daily Missions
                Clear!
              </Text>

              <Text
                style={
                  styles.victoryText
                }
              >
                You completed every
                daily mission. Come
                back tomorrow for a
                new adventure.
              </Text>
            </View>
          )}
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

    // HEADER

    headerRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      justifyContent:
        "space-between",
      marginBottom: 24,
    },

    header: {
      flex: 1,
      paddingRight: 15,
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

    addQuestButton: {
      backgroundColor:
        "#7C3AED",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 11,
      marginTop: 15,
    },

    addQuestText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "900",
    },

    // PROGRESS

    progressCard: {
      backgroundColor:
        "#1E293B",
      borderWidth: 1,
      borderColor: "#334155",
      borderRadius: 20,
      padding: 18,
      marginBottom: 28,
    },

    progressHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 18,
    },

    progressLabel: {
      color: "#A78BFA",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 5,
    },

    progressTitle: {
      color: "#FFFFFF",
      fontSize: 19,
      fontWeight: "800",
    },

    progressEmoji: {
      fontSize: 30,
    },

    progressTrack: {
      height: 9,
      backgroundColor:
        "#334155",
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 14,
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        "#7C3AED",
      borderRadius: 10,
    },

    rewardRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-end",
    },

    rewardLabel: {
      color: "#94A3B8",
      fontSize: 10,
    },

    rewardValue: {
      color: "#A78BFA",
      fontSize: 14,
      fontWeight: "800",
      marginTop: 3,
    },

    totalXPContainer: {
      alignItems: "flex-end",
    },

    totalXPLabel: {
      color: "#64748B",
      fontSize: 8,
      fontWeight: "700",
    },

    totalXPValue: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "800",
      marginTop: 3,
    },

    streakRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      borderTopWidth: 1,
      borderTopColor:
        "#334155",
      marginTop: 13,
      paddingTop: 12,
    },

    streakText: {
      color: "#F59E0B",
      fontSize: 10,
      fontWeight: "800",
    },

    dateText: {
      color: "#64748B",
      fontSize: 9,
    },

    // SECTION

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 14,
    },

    customSectionHeader: {
      marginTop: 20,
    },

    sectionTitle: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
    },

    sectionSubtitle: {
      color: "#64748B",
      fontSize: 9,
      marginTop: 4,
    },

    questCount: {
      color: "#64748B",
      fontSize: 11,
    },

    createLink: {
      color: "#A78BFA",
      fontSize: 11,
      fontWeight: "800",
    },

    // QUEST

    questCard: {
      backgroundColor:
        "#1E293B",
      borderWidth: 1,
      borderColor: "#334155",
      borderRadius: 18,
      padding: 15,
      marginBottom: 14,
    },

    customQuestCard: {
      borderColor: "#6D28D9",
    },

    completedCard: {
      opacity: 0.65,
      borderColor: "#4C1D95",
    },

    customLabel: {
      alignSelf: "flex-start",
      backgroundColor:
        "#312E81",
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginBottom: 10,
    },

    customLabelText: {
      color: "#C4B5FD",
      fontSize: 7,
      fontWeight: "900",
      letterSpacing: 1,
    },

    questTop: {
      flexDirection: "row",
      marginBottom: 15,
    },

    questIcon: {
      width: 48,
      height: 48,
      backgroundColor:
        "#0F172A",
      borderRadius: 14,
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
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 5,
    },

    completedQuestTitle: {
      textDecorationLine:
        "line-through",
      color: "#94A3B8",
    },

    questDescription: {
      color: "#94A3B8",
      fontSize: 11,
      lineHeight: 17,
    },

    questMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    badges: {
      flexDirection: "row",
      gap: 7,
    },

    difficultyBadge: {
      backgroundColor:
        "#334155",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },

    difficultyText: {
      color: "#CBD5E1",
      fontSize: 9,
      fontWeight: "700",
    },

    xpBadge: {
      backgroundColor:
        "#312E81",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },

    xpText: {
      color: "#C4B5FD",
      fontSize: 9,
      fontWeight: "800",
    },

    // ACTIONS

    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },

    editButton: {
      minHeight: 32,
      backgroundColor:
        "#334155",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 8,
    },

    editButtonText: {
      color: "#C4B5FD",
      fontSize: 10,
      fontWeight: "800",
    },

    completeButton: {
      minWidth: 78,
      minHeight: 32,
      backgroundColor:
        "#7C3AED",
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
      justifyContent:
        "center",
    },

    completedButton: {
      backgroundColor:
        "#334155",
    },

    completeButtonText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },

    completedButtonText: {
      color: "#94A3B8",
    },

    // EMPTY

    emptyCard: {
      backgroundColor:
        "#1E293B",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: "#475569",
      borderRadius: 18,
      padding: 25,
      alignItems: "center",
      marginBottom: 15,
    },

    emptyEmoji: {
      fontSize: 30,
      marginBottom: 10,
    },

    emptyTitle: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },

    emptyText: {
      color: "#94A3B8",
      fontSize: 10,
      textAlign: "center",
      lineHeight: 16,
      marginTop: 5,
      marginBottom: 14,
    },

    emptyButton: {
      backgroundColor:
        "#7C3AED",
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
    },

    emptyButtonText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },

    // VICTORY

    victoryCard: {
      backgroundColor:
        "#312E81",
      borderRadius: 20,
      padding: 22,
      alignItems: "center",
      marginTop: 12,
    },

    victoryEmoji: {
      fontSize: 38,
      marginBottom: 10,
    },

    victoryTitle: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 7,
    },

    victoryText: {
      color: "#C4B5FD",
      fontSize: 12,
      textAlign: "center",
      lineHeight: 19,
    },
  });