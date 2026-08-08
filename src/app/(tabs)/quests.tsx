import React, { useEffect, useRef, useState } from "react";
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
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import RewardService from "@/services/rewardService";
import QuestService, { QuestData } from "@/services/questService";
import RPGHeader from "@/components/RPGHeader";
import { RPGTheme } from "@/utils/rpgTheme";

// ============================================
// TYPES
// ============================================

type Difficulty = "Easy" | "Medium" | "Hard" | "Epic";

export type Quest = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  xp: number;
  difficulty: Difficulty;
  category?: string;
  completed?: boolean;
  active?: boolean;
  locked?: boolean;
  custom?: boolean;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const showMessage = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const mapQuestDataToQuest = (q: QuestData, isCustom: boolean): Quest => {
  const diffStr = String(q.difficulty || "Easy");
  const capitalizedDifficulty = (diffStr.charAt(0).toUpperCase() +
    diffStr.slice(1).toLowerCase()) as Difficulty;

  return {
    id: q.id || "",
    emoji: q.emoji || (isCustom ? "📜" : "⚔️"),
    title: q.title || (isCustom ? "Custom Quest" : "Daily Quest"),
    description: q.description || "",
    xp: q.xpReward ?? q.xp ?? 10,
    difficulty: capitalizedDifficulty,
    category: q.category || "General",
    completed: Boolean(q.completed),
    active: Boolean(q.active),
    locked: Boolean(q.locked),
    custom: isCustom,
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function QuestsScreen() {
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [customQuests, setCustomQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);

  const [totalXP, setTotalXP] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [customLoading, setCustomLoading] = useState<boolean>(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // --------------------------------------------
  // SINGLE FIRESTORE & AUTH SUBSCRIPTION EFFECT
  // --------------------------------------------
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubDaily: (() => void) | null = null;
    let unsubCustom: (() => void) | null = null;

    const setupSubscriptions = (currentUser: User) => {
      const uid = currentUser.uid;

      // 1. Listen to user profile stats
      const userRef = doc(db, "users", uid);
      unsubUser = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const today = new Date().toISOString().split("T")[0];
            const storedDate = data.questDate || "";

            if (storedDate === today) {
              setCompletedQuests(
                (data.completedQuests || []).map((id: any) => String(id))
              );
            } else {
              setCompletedQuests([]);
            }

            setTotalXP(data.totalXP ?? 0);
            setCoins(data.coins ?? 0);
            setStreak(data.streak ?? 0);
          }
          setLoading(false);
        },
        (error) => {
          console.error("[QuestsScreen] User snapshot error:", error);
          setLoading(false);
        }
      );

      // 2. Listen to Daily Quests via questService
      unsubDaily = QuestService.listenToDailyQuests(
        uid,
        (rawDaily) => {
          const mapped = rawDaily.map((dq) => mapQuestDataToQuest(dq, false));
          setDailyQuests(mapped);
        },
        (err) => {
          console.error("[QuestsScreen] Daily quests listen error:", err);
        }
      );

      // 3. Listen to Custom Quests via questService
      unsubCustom = QuestService.listenToUserQuests(
        uid,
        (rawCustom) => {
          const mapped = rawCustom.map((cq) => mapQuestDataToQuest(cq, true));
          setCustomQuests(mapped);
          setCustomLoading(false);
        },
        (err) => {
          console.error("[QuestsScreen] Custom quests listen error:", err);
          setCustomLoading(false);
        }
      );
    };

    if (auth.currentUser) {
      setupSubscriptions(auth.currentUser);
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setupSubscriptions(user);
      } else {
        setLoading(false);
        setCustomLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
      if (unsubDaily) unsubDaily();
      if (unsubCustom) unsubCustom();
    };
  }, []);

  // --------------------------------------------
  // QUEST COMPLETION HANDLER
  // --------------------------------------------
  const handleCompleteQuest = async (quest: Quest) => {
    const user = auth.currentUser;
    if (!user) {
      showMessage("Session Error", "Please sign in again.");
      router.replace("/login");
      return;
    }

    if (quest.completed || completedQuests.includes(quest.id)) {
      return;
    }

    try {
      setCompletingId(quest.id);
      const collectionName = quest.custom ? "quests" : "dailyQuests";

      const result = await RewardService.completeQuest(
        user.uid,
        collectionName,
        quest.id
      );

      if (result && result.completed) {
        setCompletedQuests((prev) => [...prev, quest.id]);
        if (typeof result.newTotalXP === "number") setTotalXP(result.newTotalXP);
        if (typeof result.newCoins === "number") setCoins(result.newCoins);

        showMessage(
          "Quest Completed! ⚔️",
          `${quest.title}\n⭐ +${result.xpEarned} XP\n🪙 +${result.coinsEarned} Coins`
        );
      }
    } catch (error: any) {
      console.error("[QuestsScreen] Error completing quest:", error);
      showMessage("Quest Error", error?.message || "Unable to complete quest.");
    } finally {
      setCompletingId(null);
    }
  };

  // --------------------------------------------
  // COMPUTED STATS
  // --------------------------------------------
  const isQuestDone = (q: Quest) =>
    Boolean(q.completed) || completedQuests.includes(q.id);

  const completedDailyCount = dailyQuests.filter(isQuestDone).length;
  const totalDailyCount = dailyQuests.length || 4;

  const dailyProgress =
    totalDailyCount > 0 ? (completedDailyCount / totalDailyCount) * 100 : 0;
  const remainingDaily = Math.max(totalDailyCount - completedDailyCount, 0);

  // --------------------------------------------
  // QUEST CARD COMPONENT
  // --------------------------------------------
  const QuestCard = ({ quest, list }: { quest: Quest; list: Quest[] }) => {
    const completed = isQuestDone(quest);

    const firstIncompleteIndex = list.findIndex((q) => !isQuestDone(q));
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
    const unlockAnim = useRef(new Animated.Value(isActive ? 1 : 0.96)).current;

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
        {/* BADGES ROW */}
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

        {/* QUEST TOP CONTENT */}
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

        {/* QUEST META ROW */}
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
                  router.push({
                    pathname: "/edit-quest",
                    params: { id: quest.id },
                  });
                }}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              disabled={completed || isCompleting}
              onPress={() => {
                if (isLocked) {
                  showMessage(
                    "🔒 Locked Quest",
                    "Complete the active quest first to unlock this quest."
                  );
                  return;
                }
                handleCompleteQuest(quest);
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
              Complete the current active quest to unlock this quest.
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // --------------------------------------------
  // RENDER LOADING
  // --------------------------------------------
  if (loading || customLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading today's quests...</Text>
      </View>
    );
  }

  // --------------------------------------------
  // RENDER MAIN UI
  // --------------------------------------------
  return (
    <View style={styles.screen}>
      <RPGHeader title="📜 Quest Board" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>QUEST BOARD</Text>
          <Text style={styles.title}>📜 Daily Quests</Text>
          <Text style={styles.subtitle}>
            Complete real-life missions every day, earn XP, coins, and build your streak.
          </Text>
        </View>

        {/* STREAK & STATS CARD */}
        <View style={styles.streakCard}>
          <View style={styles.streakTopRow}>
            <View>
              <Text style={styles.streakLabel}>CURRENT STREAK</Text>
              <Text style={styles.streakValue}>
                🔥 {streak} {streak === 1 ? "Day" : "Days"}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.inlineStatRow}>
                <View style={{ alignItems: "flex-end", marginRight: 14 }}>
                  <Text style={styles.totalXPLabel}>TOTAL XP</Text>
                  <Text style={styles.totalXPValue}>⭐ {totalXP}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.totalXPLabel}>COINS</Text>
                  <Text style={styles.totalXPValue}>🪙 {coins}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* PROGRESS BAR SECTION */}
          <View style={styles.streakProgressSection}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(dailyProgress, 100)}%` },
                ]}
              />
            </View>

            <Text style={styles.remainingText}>
              {remainingDaily === 0
                ? "All daily quests completed! 🏆"
                : `${remainingDaily} daily ${
                    remainingDaily === 1 ? "quest" : "quests"
                  } remaining`}
            </Text>
          </View>
        </View>

        {/* DAILY QUESTS SECTION */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today's Quests</Text>
            <Text style={styles.sectionSubtitle}>Resets every new day</Text>
          </View>
        </View>

        {dailyQuests.map((quest) => (
          <QuestCard key={quest.id} quest={quest} list={dailyQuests} />
        ))}

        {/* VICTORY CARD */}
        {completedDailyCount === totalDailyCount && totalDailyCount > 0 && (
          <View style={styles.victoryCard}>
            <Text style={styles.victoryEmoji}>🏆</Text>
            <View style={styles.victoryInfo}>
              <Text style={styles.victoryTitle}>Daily Quest Clear!</Text>
              <Text style={styles.victoryText}>
                You completed every daily quest today.
              </Text>
            </View>
          </View>
        )}

        {/* CUSTOM QUESTS SECTION */}
        <View style={styles.customHeader}>
          <View>
            <Text style={styles.sectionTitle}>Custom Quests</Text>
            <Text style={styles.sectionSubtitle}>Your personal missions</Text>
          </View>

          <TouchableOpacity
            style={styles.addQuestButton}
            activeOpacity={0.75}
            onPress={() => router.push("/create-quest")}
          >
            <Text style={styles.addQuestText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {customQuests.length > 0 ? (
          customQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} list={customQuests} />
          ))
        ) : (
          <View style={styles.emptyCustomCard}>
            <Text style={styles.emptyCustomEmoji}>⚔️</Text>
            <Text style={styles.emptyCustomTitle}>Create your own quest</Text>
            <Text style={styles.emptyCustomText}>
              Turn a real-life goal into a mission and earn XP when you complete it.
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateButton}
              activeOpacity={0.75}
              onPress={() => router.push("/create-quest")}
            >
              <Text style={styles.emptyCreateText}>Create Quest</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* INFO FOOTER */}
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🌅</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>New day, new adventure</Text>
            <Text style={styles.infoText}>
              Daily quests reset each day. XP, level, lifetime quest count and
              unlocked achievements remain saved.
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
    backgroundColor: "#3F2415",
    borderWidth: 1,
    borderColor: "#92400E",
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
  progressTrack: {
    width: "100%",
    height: 9,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },
  remainingText: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: "#1E293B",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 15,
    marginBottom: 12,
  },
  customQuestCard: {
    borderColor: "#4C1D95",
  },
  completedCard: {
    opacity: 0.75,
    borderColor: "#059669",
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
    alignSelf: "flex-start",
    backgroundColor: "#312E81",
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
    backgroundColor: "#0F172A",
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
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "800",
  },
  completedQuestTitle: {
    textDecorationLine: "line-through",
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
    justifyContent: "space-between",
    gap: 8,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  difficultyBadge: {
    backgroundColor: "#0F172A",
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
    backgroundColor: "#312E81",
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
    backgroundColor: "#334155",
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
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  completedButton: {
    backgroundColor: "#14532D",
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
    backgroundColor: "#3F2B0B",
    borderWidth: 1,
    borderColor: "#A16207",
    borderRadius: 17,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 20,
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
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 14,
  },
  addQuestButton: {
    backgroundColor: "#7C3AED",
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
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
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
    backgroundColor: "#312E81",
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
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
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