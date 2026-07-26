import { auth, db } from "@/lib/firebase";

import {
  arrayUnion,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
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

type Quest = {
  id: number;
  emoji: string;
  title: string;
  description: string;
  xp: number;
  difficulty: "Easy" | "Medium" | "Hard";
};

const QUESTS: Quest[] = [
  {
    id: 1,
    emoji: "💪",
    title: "Morning Workout",
    description: "Exercise for at least 30 minutes",
    xp: 20,
    difficulty: "Medium",
  },
  {
    id: 2,
    emoji: "📚",
    title: "Study Session",
    description: "Focus and study for 1 hour",
    xp: 30,
    difficulty: "Hard",
  },
  {
    id: 3,
    emoji: "💧",
    title: "Stay Hydrated",
    description: "Drink enough water throughout the day",
    xp: 10,
    difficulty: "Easy",
  },
  {
    id: 4,
    emoji: "🧘",
    title: "Mindfulness",
    description: "Meditate or reflect for 10 minutes",
    xp: 15,
    difficulty: "Easy",
  },
];

export default function QuestsScreen() {
  const [completedQuests, setCompletedQuests] =
    useState<number[]>([]);

  const [totalXP, setTotalXP] = useState(0);

  const [loading, setLoading] = useState(true);

  const [completingId, setCompletingId] =
    useState<number | null>(null);

  // ============================================
  // LOAD QUEST DATA FROM FIRESTORE
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setCompletedQuests(
            data.completedQuests || []
          );

          setTotalXP(data.totalXP ?? 0);
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          "QUEST FIRESTORE ERROR:",
          error
        );

        setLoading(false);
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
      completedQuests.includes(quest.id)
    ) {
      return;
    }

    try {
      setCompletingId(quest.id);

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      await runTransaction(
        db,
        async (transaction) => {
          const snapshot =
            await transaction.get(userRef);

          if (!snapshot.exists()) {
            throw new Error(
              "Hero profile not found."
            );
          }

          const data = snapshot.data();

          const currentCompleted: number[] =
            data.completedQuests || [];

          // Prevent duplicate XP
          if (
            currentCompleted.includes(
              quest.id
            )
          ) {
            return;
          }

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

          // 100 XP = 1 Level
          while (newXP >= 100) {
            newXP -= 100;
            newLevel += 1;
          }

          transaction.update(
            userRef,
            {
              completedQuests:
                arrayUnion(quest.id),

              xp: newXP,

              totalXP:
                currentTotalXP +
                quest.xp,

              level: newLevel,

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );

      console.log(
        `QUEST COMPLETED: ${quest.title}`
      );

      console.log(
        `XP EARNED: ${quest.xp}`
      );

      if (Platform.OS === "web") {
        window.alert(
          `Quest Complete! +${quest.xp} XP`
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

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert(
          "Quest Error",
          message
        );
      }
    } finally {
      setCompletingId(null);
    }
  };

  // ============================================
  // CALCULATIONS
  // ============================================

  const completedToday =
    QUESTS.filter((quest) =>
      completedQuests.includes(
        quest.id
      )
    );

  const earnedToday =
    completedToday.reduce(
      (total, quest) =>
        total + quest.xp,
      0
    );

  const progress =
    QUESTS.length > 0
      ? (completedToday.length /
        QUESTS.length) *
      100
      : 0;

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
          Loading quests...
        </Text>
      </View>
    );
  }

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

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            QUEST BOARD
          </Text>

          <Text style={styles.title}>
            📜 Daily Quests
          </Text>

          <Text style={styles.subtitle}>
            Complete real-life missions
            and earn XP.
          </Text>
        </View>

        {/* PROGRESS */}

        <View
          style={styles.progressCard}
        >
          <View
            style={styles.progressHeader}
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
                {completedToday.length} /{" "}
                {QUESTS.length} Completed
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
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          <View style={styles.rewardRow}>
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
        </View>

        {/* QUEST HEADER */}

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Available Quests
          </Text>

          <Text
            style={styles.questCount}
          >
            {QUESTS.length -
              completedToday.length}{" "}
            remaining
          </Text>
        </View>

        {/* QUEST LIST */}

        {QUESTS.map((quest) => {
          const completed =
            completedQuests.includes(
              quest.id
            );

          const isCompleting =
            completingId === quest.id;

          return (
            <View
              key={quest.id}
              style={[
                styles.questCard,
                completed &&
                styles.completedCard,
              ]}
            >
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

                <TouchableOpacity
                  disabled={
                    completed ||
                    isCompleting
                  }
                  onPress={() =>
                    completeQuest(quest)
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
          );
        })}

        {/* ALL QUESTS COMPLETE */}

        {completedToday.length ===
          QUESTS.length && (
            <View
              style={styles.victoryCard}
            >
              <Text
                style={styles.victoryEmoji}
              >
                🏆
              </Text>

              <Text
                style={styles.victoryTitle}
              >
                Daily Quest Clear!
              </Text>

              <Text
                style={styles.victoryText}
              >
                You completed every quest
                and earned {earnedToday} XP.
              </Text>
            </View>
          )}
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
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 15,
  },

  container: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 50,
  },

  header: {
    marginBottom: 24,
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

  progressCard: {
    backgroundColor: "#1E293B",
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
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
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
  },

  questCount: {
    color: "#64748B",
    fontSize: 11,
  },

  questCard: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },

  completedCard: {
    opacity: 0.65,
    borderColor: "#4C1D95",
  },

  questTop: {
    flexDirection: "row",
    marginBottom: 15,
  },

  questIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#334155",
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
    backgroundColor: "#312E81",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  xpText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "800",
  },

  completeButton: {
    minWidth: 78,
    minHeight: 32,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  completedButton: {
    backgroundColor: "#334155",
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  completedButtonText: {
    color: "#94A3B8",
  },

  victoryCard: {
    backgroundColor: "#312E81",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginTop: 8,
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