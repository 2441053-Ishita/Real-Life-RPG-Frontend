import RPGHeader from "@/components/RPGHeader";
import { auth, db } from "@/lib/firebase";
import { RPGTheme } from "@/utils/rpgTheme";
import { router } from "expo-router";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Types
type UserStats = {
  level: number;
  totalXP: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  achievementCount: number;
  lastAchievement: string | null;
};

type QuestHistoryItem = {
  id: string;
  title: string;
  difficulty: string;
  xpEarned: number;
  coinsEarned: number;
  questType: "daily" | "custom" | string;
  completedAt: any;
  emoji?: string;
};

type InventorySummary = {
  totalItems: number;
  equippedItems: number;
  lastUnlockedItem: {
    name: string;
    icon: string;
    rarity: string;
    category: string;
  } | null;
};

type WeeklyData = {
  dayLabel: string;
  questsCount: number;
  xpEarned: number;
};

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);

  // Stats from users/{uid}
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    totalXP: 0,
    coins: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievementCount: 0,
    lastAchievement: null,
  });

  // History stats
  const [historyItems, setHistoryItems] = useState<QuestHistoryItem[]>([]);
  const [totalQuests, setTotalQuests] = useState(0);
  const [dailyQuestsCount, setDailyQuestsCount] = useState(0);
  const [customQuestsCount, setCustomQuestsCount] = useState(0);

  // Inventory stats
  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    totalItems: 0,
    equippedItems: 0,
    lastUnlockedItem: null,
  });

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // 1. User Profile Listener
    const userRef = doc(db, "users", uid);
    const unsubUser = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const achievements = Array.isArray(data.unlockedAchievements)
            ? data.unlockedAchievements
            : [];
          const currentStreak = Number(data.currentStreak ?? data.streak ?? 0);
          const longestStreak = Number(data.longestStreak ?? currentStreak);

          setUserStats({
            level: Number(data.level ?? 1),
            totalXP: Number(data.totalXP ?? data.xp ?? 0),
            coins: Number(data.coins ?? 0),
            currentStreak,
            longestStreak,
            achievementCount: achievements.length,
            lastAchievement: achievements.length > 0 ? achievements[achievements.length - 1] : null,
          });
        }
      },
      (err) => console.error("[Dashboard] Error reading user profile:", err)
    );

    // 2. History Listener
    const historyRef = collection(db, "users", uid, "history");
    const unsubHistory = onSnapshot(
      historyRef,
      (snapshot) => {
        let dailyCount = 0;
        let customCount = 0;

        const allDocs: QuestHistoryItem[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const qType = (data.questType || "").toLowerCase();
          if (qType === "daily") dailyCount++;
          else customCount++;

          allDocs.push({
            id: docSnap.id,
            title: data.title || "Completed Quest",
            difficulty: data.difficulty || "easy",
            xpEarned: Number(data.xpEarned ?? 0),
            coinsEarned: Number(data.coinsEarned ?? 0),
            questType: qType,
            completedAt: data.completedAt,
            emoji: data.emoji || (qType === "daily" ? "📅" : "✨"),
          });
        });

        // Sort reverse chronological
        allDocs.sort((a, b) => {
          const timeA = a.completedAt?.toMillis ? a.completedAt.toMillis() : new Date(a.completedAt || 0).getTime();
          const timeB = b.completedAt?.toMillis ? b.completedAt.toMillis() : new Date(b.completedAt || 0).getTime();
          return timeB - timeA;
        });

        setTotalQuests(snapshot.size);
        setDailyQuestsCount(dailyCount);
        setCustomQuestsCount(customCount);
        setHistoryItems(allDocs);
        setLoading(false);
      },
      (err) => {
        console.error("[Dashboard] Error reading quest history:", err);
        setLoading(false);
      }
    );

    // 3. Inventory Listener
    const inventoryRef = collection(db, "users", uid, "inventory");
    const unsubInventory = onSnapshot(
      inventoryRef,
      (snapshot) => {
        let equipped = 0;
        let latestItem: any = null;

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.equipped) equipped++;
          latestItem = {
            name: data.name || "Unlocked Item",
            icon: data.icon || "📦",
            rarity: data.rarity || "Common",
            category: data.category || "gear",
          };
        });

        setInventorySummary({
          totalItems: snapshot.size,
          equippedItems: equipped,
          lastUnlockedItem: latestItem,
        });
      },
      (err) => console.error("[Dashboard] Error reading inventory:", err)
    );

    return () => {
      unsubUser();
      unsubHistory();
      unsubInventory();
    };
  }, [uid]);

  // Aggregate weekly data for 7-day bar chart
  const weeklyData = useMemo<WeeklyData[]>(() => {
    const days: WeeklyData[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toISOString().split("T")[0];

      let questsCount = 0;
      let xpEarned = 0;

      historyItems.forEach((item) => {
        if (!item.completedAt) return;
        const itemDateObj = item.completedAt.toDate ? item.completedAt.toDate() : new Date(item.completedAt);
        const itemDateStr = itemDateObj.toISOString().split("T")[0];

        if (itemDateStr === dateStr) {
          questsCount++;
          xpEarned += item.xpEarned;
        }
      });

      days.push({
        dayLabel: dayName,
        questsCount,
        xpEarned,
      });
    }

    return days;
  }, [historyItems]);

  const maxWeeklyQuests = useMemo(() => {
    return Math.max(1, ...weeklyData.map((d) => d.questsCount));
  }, [weeklyData]);

  const maxWeeklyXP = useMemo(() => {
    return Math.max(1, ...weeklyData.map((d) => d.xpEarned));
  }, [weeklyData]);

  const recent10Quests = useMemo(() => historyItems.slice(0, 10), [historyItems]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="Player Dashboard" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* TOP STATS GRID */}
        <Text style={styles.sectionTitle}>📊 Overview Analytics</Text>

        <View style={styles.statsGrid}>
          {/* Total Quests */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⚔️</Text>
            <Text style={styles.statValue}>{totalQuests}</Text>
            <Text style={styles.statLabel}>Total Quests</Text>
          </View>

          {/* Daily Quests */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statValue}>{dailyQuestsCount}</Text>
            <Text style={styles.statLabel}>Daily Quests</Text>
          </View>

          {/* Custom Quests */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✨</Text>
            <Text style={styles.statValue}>{customQuestsCount}</Text>
            <Text style={styles.statLabel}>Custom Quests</Text>
          </View>

          {/* Current Level */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>Lvl {userStats.level}</Text>
            <Text style={styles.statLabel}>Current Level</Text>
          </View>

          {/* Total XP */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={styles.statValue}>{userStats.totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>

          {/* Current Coins */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🪙</Text>
            <Text style={styles.statValue}>{userStats.coins}</Text>
            <Text style={styles.statLabel}>Current Coins</Text>
          </View>

          {/* Current Streak */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{userStats.currentStreak}d</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          {/* Longest Streak */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{userStats.longestStreak}d</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>

          {/* Total Inventory Items */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={styles.statValue}>{inventorySummary.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>

          {/* Equipped Items */}
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🛡️</Text>
            <Text style={styles.statValue}>{inventorySummary.equippedItems}</Text>
            <Text style={styles.statLabel}>Equipped Items</Text>
          </View>

          {/* Achievement Count */}
          <View style={[styles.statCard, { width: "100%" }]}>
            <Text style={styles.statEmoji}>🏅</Text>
            <Text style={styles.statValue}>{userStats.achievementCount} Unlocked</Text>
            <Text style={styles.statLabel}>Achievement Count</Text>
          </View>
        </View>

        {/* WEEKLY CHARTS SECTION */}
        <Text style={styles.sectionTitle}>📈 Performance Charts</Text>

        {/* CHART 1: WEEKLY QUEST COMPLETION */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Quest Completion</Text>
          <View style={styles.barChartContainer}>
            {weeklyData.map((d, idx) => {
              const heightPercent = Math.max(10, Math.round((d.questsCount / maxWeeklyQuests) * 100));
              return (
                <View key={idx} style={styles.barColumn}>
                  <Text style={styles.barValue}>{d.questsCount}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: RPGTheme.colors.purplePrimary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* CHART 2: XP EARNED THIS WEEK */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>XP Earned This Week</Text>
          <View style={styles.barChartContainer}>
            {weeklyData.map((d, idx) => {
              const heightPercent = Math.max(10, Math.round((d.xpEarned / maxWeeklyXP) * 100));
              return (
                <View key={idx} style={styles.barColumn}>
                  <Text style={styles.barValue}>{d.xpEarned}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: RPGTheme.colors.gold,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* RECENT ACTIVITY SECTION */}
        <Text style={styles.sectionTitle}>🕒 Recent Activity</Text>

        {/* LATEST UNLOCKED ITEM & ACHIEVEMENT */}
        <View style={styles.recentHighlightsRow}>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightHeader}>LATEST UNLOCKED ITEM</Text>
            {inventorySummary.lastUnlockedItem ? (
              <View style={styles.highlightBody}>
                <Text style={styles.highlightEmoji}>{inventorySummary.lastUnlockedItem.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlightName}>{inventorySummary.lastUnlockedItem.name}</Text>
                  <Text style={styles.highlightCategory}>
                    {inventorySummary.lastUnlockedItem.rarity} • {inventorySummary.lastUnlockedItem.category}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.highlightEmpty}>No items unlocked yet</Text>
            )}
          </View>

          <View style={styles.highlightCard}>
            <Text style={styles.highlightHeader}>LATEST ACHIEVEMENT</Text>
            {userStats.lastAchievement ? (
              <View style={styles.highlightBody}>
                <Text style={styles.highlightEmoji}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlightName}>{userStats.lastAchievement}</Text>
                  <Text style={styles.highlightCategory}>Achievement Unlocked!</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.highlightEmpty}>No achievements yet</Text>
            )}
          </View>
        </View>

        {/* LAST 10 COMPLETED QUESTS */}
        <View style={styles.recentListCard}>
          <Text style={styles.recentListTitle}>Last 10 Completed Quests</Text>
          {recent10Quests.length === 0 ? (
            <Text style={styles.highlightEmpty}>No completed quests found in history.</Text>
          ) : (
            recent10Quests.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.activityItem}>
                  <Text style={styles.activityEmoji}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityMeta}>
                      {item.questType.toUpperCase()} • {item.difficulty.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.activityXP}>+{item.xpEarned} XP</Text>
                    <Text style={styles.activityCoins}>+{item.coinsEarned} 🪙</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Return to Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const cardWidth = (Dimensions.get("window").width - 52) / 2;

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
    color: RPGTheme.colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: cardWidth,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 14,
    alignItems: "center",
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 16,
  },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 140,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  barValue: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  barTrack: {
    width: 16,
    height: 90,
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
  },
  barLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },
  recentHighlightsRow: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  highlightCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 14,
  },
  highlightHeader: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  highlightBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  highlightEmoji: {
    fontSize: 26,
  },
  highlightName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  highlightCategory: {
    color: RPGTheme.colors.purplePrimary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  highlightEmpty: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
  },
  recentListCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  recentListTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  activityMeta: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  activityXP: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "800",
  },
  activityCoins: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  backButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
