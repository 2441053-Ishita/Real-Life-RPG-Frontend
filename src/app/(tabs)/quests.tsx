import { auth, db } from "@/lib/firebase";
import RewardService from "@/services/rewardService";
import {
  getUserQuests as getUserQuestsService,
  createQuest as createQuestService,
  updateQuest as updateQuestService,
  deleteQuest as deleteQuestService,
} from "@/services/questService";
import { router } from "expo-router";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import {
  DEFAULT_SKILLS,
  HeroSkills,
  getSkillForCategory,
} from "@/utils/skills";
import { calculateSkillTreeBonuses } from "@/utils/skillTree";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
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
  category?: string;
  completed?: boolean;
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
    category: "Fitness",
  },

  {
    id: "daily-2",
    emoji: "📚",
    title: "Study Session",
    description: "Focus and study for 1 hour",
    xp: 30,
    difficulty: "Hard",
    category: "Study",
  },

  {
    id: "daily-3",
    emoji: "💧",
    title: "Stay Hydrated",
    description: "Drink enough water throughout the day",
    xp: 10,
    difficulty: "Easy",
    category: "Health",
  },

  {
    id: "daily-4",
    emoji: "🧘",
    title: "Mindfulness",
    description: "Meditate or reflect for 10 minutes",
    xp: 15,
    difficulty: "Easy",
    category: "Meditation",
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
    dailyQuests,
    setDailyQuests,
  ] = useState<Quest[]>([]);

  const [
    customQuests,
    setCustomQuests,
  ] = useState<Quest[]>([]);

  const [coins, setCoins] =
    useState(0);

  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);

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

            setXP(data.xp ?? 0);
            setLevel(data.level ?? 1);

            setTotalXP(
              data.totalXP ?? 0
            );

            setCoins(
              data.coins ?? 0
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

    return () => unsubscribe();
  }, []);

  // ============================================
  // LOAD DAILY QUESTS (users/{uid}/dailyQuests)
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setCustomLoading(false);
      return;
    }

    const dailyRef = collection(db, "users", user.uid, "dailyQuests");
    let isDailySeeding = false;

    const unsubscribeDaily = onSnapshot(
      dailyRef,
      async (snapshot) => {
        if (snapshot.empty && !isDailySeeding) {
          isDailySeeding = true;
          for (const dq of DAILY_QUESTS) {
            await addDoc(dailyRef, {
              title: dq.title,
              description: dq.description,
              difficulty: dq.difficulty.toLowerCase(),
              category: dq.category || "general",
              xpReward: dq.xp,
              coinReward: Math.floor(dq.xp / 2),
              completed: false,
              emoji: dq.emoji,
              xp: dq.xp,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          isDailySeeding = false;
          return;
        }

        const loadedDaily: Quest[] = snapshot.docs.map((questDocument) => {
          const data = questDocument.data();
          return {
            id: questDocument.id,
            emoji: data.emoji || "⚔️",
            title: data.title || "Daily Quest",
            description: data.description || "",
            xp: data.xpReward ?? data.xp ?? 10,
            difficulty: (data.difficulty as Difficulty) || "Easy",
            completed: Boolean(data.completed),
            custom: false,
          };
        });

        setDailyQuests(loadedDaily);
      },
      (error) => {
        console.error("DAILY QUEST FIRESTORE ERROR:", error);
      }
    );

    return () => unsubscribeDaily();
  }, []);

  // ============================================
  // LOAD CUSTOM QUESTS (users/{uid}/quests)
  // ============================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setCustomLoading(false);
      return;
    }

    const customQuestRef = collection(db, "users", user.uid, "quests");

    const unsubscribeCustom = onSnapshot(
      customQuestRef,
      (snapshot) => {
        const loadedQuests: Quest[] = snapshot.docs.map((questDocument) => {
          const data = questDocument.data();
          return {
            id: questDocument.id,
            emoji: data.emoji || "⚔️",
            title: data.title || "Quest",
            description: data.description || "",
            xp: data.xpReward ?? data.xp ?? 10,
            difficulty: (data.difficulty as Difficulty) || "Easy",
            completed: Boolean(data.completed),
            custom: true,
          };
        });

        setCustomQuests(loadedQuests);
        setCustomLoading(false);
      },
      (error) => {
        console.error("CUSTOM QUEST FIRESTORE ERROR:", error);
        setCustomLoading(false);
      }
    );

    return () => unsubscribeCustom();
  }, []);

  // ============================================
  // COMPLETE QUEST
  // ============================================

  const completeQuest = async (quest: Quest) => {
    console.log("[DEBUG 2] completeQuest called for quest.id:", quest.id);
    const user = auth.currentUser;

    if (!user) {
      showMessage("Session Error", "Please sign in again.");
      router.replace("/login");
      return;
    }

    if (completedQuests.includes(quest.id)) {
      console.log("[DEBUG 2.1] Quest already completed locally. Exiting.");
      return;
    }

    try {
      setCompletingId(quest.id);

      const realQuestId = quest.id.startsWith("custom-")
        ? quest.id.replace("custom-", "")
        : quest.id;

      console.log("[DEBUG 3] Calling RewardService.completeQuest with user.uid:", user.uid, "realQuestId:", realQuestId);
      // Delegate all reward calculations and completion to RewardService.completeQuest
      const result = await RewardService.completeQuest(user.uid, realQuestId);

      if (result && result.completed) {
        console.log("[DEBUG 3.1] RewardService successfully completed quest. Updating state.");
        setCompletedQuests((prev) => [...prev, quest.id]);

        if (typeof result.newTotalXP === "number") {
          setTotalXP(result.newTotalXP);
        }

        if (typeof result.newCoins === "number") {
          setCoins(result.newCoins);
        }

        // Unlock next sequential quest based directly on Firestore query results
        try {
          const firestoreQuests = await getUserQuestsService(user.uid);

          console.log("==========================================");
          console.log("[STEP 1 INSPECTION] ALL FIRESTORE QUESTS:");
          firestoreQuests.forEach((fq, idx) => {
            console.log(`Index ${idx} | id: ${fq.id} | title: "${fq.title}" | completed: ${fq.completed} | active: ${fq.active} | locked: ${fq.locked}`);
          });

          const q1 = firestoreQuests.find((fq) => fq.id === realQuestId);
          console.log("------------------------------------------");
          console.log("[STEP 1 INSPECTION] QUEST 1 DOCUMENT:");
          console.log("id:", q1?.id);
          console.log("title:", q1?.title);
          console.log("completed:", q1?.completed);
          console.log("active:", q1?.active);
          console.log("locked:", q1?.locked);

          const q1Index = firestoreQuests.findIndex((fq) => fq.id === realQuestId);
          console.log("Quest 1 Index in getUserQuests array:", q1Index);

          // Find Quest 2 (the quest immediately created after or positioned after Quest 1)
          const q2 = firestoreQuests.find((fq) => fq.id !== realQuestId && !fq.completed);
          console.log("------------------------------------------");
          console.log("[STEP 1 INSPECTION] QUEST 2 DOCUMENT:");
          console.log("id:", q2?.id);
          console.log("title:", q2?.title);
          console.log("completed:", q2?.completed);
          console.log("active:", q2?.active);
          console.log("locked:", q2?.locked);
          console.log("==========================================");

          const currentIndex = firestoreQuests.findIndex((fq) => fq.id === realQuestId);
          if (currentIndex !== -1 && currentIndex + 1 < firestoreQuests.length) {
            const nextQuest = firestoreQuests[currentIndex + 1];
            if (nextQuest && !nextQuest.completed && nextQuest.id) {
              await updateQuestService(user.uid, nextQuest.id, {
                active: true,
                locked: false,
                updatedAt: serverTimestamp(),
              });
              console.log("[DEBUG 3.2] Firestore-driven unlock: Unlocked next quest document in Firestore:", nextQuest.id);
            }
          } else {
            console.log("[DEBUG 3.2] updateQuestService() WAS NOT CALLED because currentIndex + 1 >= firestoreQuests.length (currentIndex:", currentIndex, ", length:", firestoreQuests.length, ")");
          }
        } catch (unlockErr) {
          console.error("[DEBUG 3.2] Firestore-driven unlock error:", unlockErr);
        }

        showMessage(
          "Quest Complete! ⚔️",
          `${quest.title}\n⭐ +${result.xpEarned} XP\n🪙 +${result.coinsEarned} Coins`
        );
      }
    } catch (error: any) {
      console.error("COMPLETE QUEST ERROR:", error);
      const message = error?.message || "Unable to complete quest.";
      showMessage("Quest Error", message);
    } finally {
      setCompletingId(null);
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
    list,
  }: {
    quest: Quest;
    list: Quest[];
  }) => {
    const isDone = (q: Quest) => Boolean(q.completed) || completedQuests.includes(q.id);
    const completed = isDone(quest);

    const firstIncompleteIndex = list.findIndex(
      (q) => !isDone(q)
    );
    const questIndex = list.findIndex((q) => q.id === quest.id);

    const isActive =
      !completed &&
      firstIncompleteIndex !== -1 &&
      questIndex === firstIncompleteIndex;

    const isLocked =
      !completed &&
      firstIncompleteIndex !== -1 &&
      questIndex > firstIncompleteIndex;

    const isCompleting = completingId === quest.id;

    const unlockAnim = useRef(new Animated.Value(isActive ? 1 : 0.95)).current;

    useEffect(() => {
      if (isActive) {
        Animated.spring(unlockAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(unlockAnim, {
          toValue: 0.96,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [isActive]);

    return (
      <Animated.View
        style={[
          styles.questCard,
          completed && styles.completedCard,
          isActive && styles.activeQuestCard,
          isLocked && styles.lockedQuestCard,
          quest.custom && styles.customQuestCard,
          { transform: [{ scale: unlockAnim }] },
        ]}
      >
        {/* BADGES HEADER ROW */}
        <View style={styles.cardBadgeRow}>
          {quest.custom && (
            <View style={styles.customLabel}>
              <Text style={styles.customLabelText}>CUSTOM QUEST</Text>
            </View>
          )}

          {isActive && (
            <View style={styles.activeLabel}>
              <Text style={styles.activeLabelText}>⚡ ACTIVE QUEST</Text>
            </View>
          )}

          {isLocked && (
            <View style={styles.lockedLabel}>
              <Text style={styles.lockedLabelText}>🔒 LOCKED</Text>
            </View>
          )}

          {completed && (
            <View style={styles.completedLabelBadge}>
              <Text style={styles.completedLabelBadgeText}>✓ COMPLETED</Text>
            </View>
          )}
        </View>

        <View style={styles.questTop}>
          <View style={[styles.questIcon, isLocked && styles.lockedQuestIcon]}>
            <Text style={styles.questEmoji}>
              {completed ? "✅" : isLocked ? "🔒" : quest.emoji}
            </Text>
          </View>

          <View style={styles.questInformation}>
            <Text
              style={[
                styles.questTitle,
                completed && styles.completedQuestTitle,
                isLocked && styles.lockedQuestTitle,
              ]}
            >
              {quest.title}
            </Text>

            <Text
              style={[
                styles.questDescription,
                isLocked && styles.lockedQuestDescription,
              ]}
            >
              {quest.description}
            </Text>
          </View>
        </View>

        <View style={styles.questMeta}>
          <View style={styles.badges}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{quest.difficulty}</Text>
            </View>

            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{quest.xp} XP</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            {quest.custom && !completed && !isLocked && (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.75}
                onPress={() => {
                  const firestoreId = quest.id.replace("custom-", "");
                  router.push({
                    pathname: "/edit-quest",
                    params: { id: firestoreId },
                  });
                }}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              disabled={completed || isCompleting}
              onPress={() => {
                console.log("[DEBUG 1] Complete button pressed for quest.id:", quest.id, "title:", quest.title);
                if (isLocked) {
                  showMessage(
                    "🔒 Locked Quest",
                    "Complete the current quest to unlock this quest."
                  );
                  return;
                }
                completeQuest(quest);
              }}
              activeOpacity={0.75}
              style={[
                styles.completeButton,
                completed && styles.completedButton,
                isActive && styles.activeCompleteButton,
                isLocked && styles.lockedCompleteButton,
              ]}
            >
              {isCompleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.completeButtonText,
                    completed && styles.completedButtonText,
                    isLocked && styles.lockedCompleteButtonText,
                  ]}
                >
                  {completed
                    ? "Completed ✓"
                    : isLocked
                      ? "🔒 Locked"
                      : "Complete ⚔️"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* LOCKED BANNER FOOTER */}
        {isLocked && (
          <View style={styles.lockedBannerContainer}>
            <Text style={styles.lockedBannerText}>
              Complete the current quest to unlock this quest.
            </Text>
          </View>
        )}
      </Animated.View>
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
    <View style={styles.screen}>
      <RPGHeader title="📜 Quest Board" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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

        {/* STREAK & PROGRESS CARD */}

        <View style={styles.streakCard}>
          {/* TOP STATS ROW */}
          <View style={styles.streakTopRow}>
            <View>
              <Text style={styles.streakLabel}>
                CURRENT STREAK
              </Text>

              <Text style={styles.streakValue}>
                🔥 {streak}{" "}
                {streak === 1
                  ? "Day"
                  : "Days"}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.inlineStatRow}>
                <View style={{ alignItems: "flex-end", marginRight: 14 }}>
                  <Text style={styles.totalXPLabel}>
                    TOTAL XP
                  </Text>
                  <Text style={styles.totalXPValue}>
                    ⭐ {totalXP}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.totalXPLabel}>
                    COINS
                  </Text>
                  <Text style={styles.totalXPValue}>
                    🪙 {coins}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* PROGRESS TRACK SECTION */}
          <View style={styles.streakProgressSection}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dailyProgress}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.remainingText}>
              {remainingDaily === 0
                ? "All daily quests completed! 🏆"
                : `${remainingDaily} daily ${remainingDaily === 1
                  ? "quest"
                  : "quests"
                } remaining`}
            </Text>
          </View>
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

        {dailyQuests.map(
          (quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              list={dailyQuests}
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
                list={customQuests}
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
      fontFamily: RPGTheme.fonts.body,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 2,
      marginBottom: 7,
    },

    title: {
      color: "#FFFFFF",
      fontFamily: RPGTheme.fonts.heading,
      fontSize: 28,
      fontWeight: "900",
      marginBottom: 7,
    },

    subtitle: {
      color: "#94A3B8",
      fontFamily: RPGTheme.fonts.body,
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
      marginBottom: 18,
    },

    streakTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },

    inlineStatRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    streakProgressSection: {
      width: "100%",
      marginTop: 2,
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
      fontFamily: RPGTheme.fonts.stats,
      fontSize: 20,
      fontWeight: "900",
    },

    totalXPContainer: {
      alignItems: "flex-end",
    },

    totalXPLabel: {
      color: "#F59E0B",
      fontFamily: RPGTheme.fonts.body,
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 5,
    },

    totalXPValue: {
      color: "#FFFFFF",
      fontFamily: RPGTheme.fonts.stats,
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
      opacity: 0.75,
      borderColor:
        "#059669",
    },

    activeQuestCard: {
      borderColor: "#7C3AED",
      borderWidth: 2,
      backgroundColor: "#1E1B4B",
    },

    lockedQuestCard: {
      opacity: 0.55,
      backgroundColor: "#0B1120",
      borderColor: "#1E293B",
    },

    cardBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },

    activeLabel: {
      backgroundColor: "#7C3AED",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },

    activeLabelText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    lockedLabel: {
      backgroundColor: "#334155",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },

    lockedLabelText: {
      color: "#94A3B8",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    completedLabelBadge: {
      backgroundColor: "#059669",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },

    completedLabelBadgeText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    customLabel: {
      alignSelf:
        "flex-start",
      backgroundColor:
        "#312E81",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },

    customLabelText: {
      color: "#C4B5FD",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.5,
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
      fontFamily: RPGTheme.fonts.heading,
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
      fontFamily: RPGTheme.fonts.body,
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
      fontFamily: RPGTheme.fonts.stats,
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

    lockedQuestIcon: {
      backgroundColor: "#1E293B",
      opacity: 0.7,
    },

    lockedQuestTitle: {
      color: "#64748B",
    },

    lockedQuestDescription: {
      color: "#475569",
    },

    activeCompleteButton: {
      backgroundColor: "#7C3AED",
      borderWidth: 1,
      borderColor: "#A78BFA",
    },

    lockedCompleteButton: {
      backgroundColor: "#1E293B",
      borderColor: "#334155",
      borderWidth: 1,
      opacity: 0.6,
    },

    completeButtonText: {
      color: "#FFFFFF",
      fontFamily: RPGTheme.fonts.button,
      fontSize: 9,
      fontWeight: "900",
    },

    completedButtonText: {
      color: "#86EFAC",
    },

    lockedCompleteButtonText: {
      color: "#64748B",
    },

    lockedBannerContainer: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "rgba(51, 65, 85, 0.4)",
      alignItems: "center",
    },

    lockedBannerText: {
      color: "#F59E0B",
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center",
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