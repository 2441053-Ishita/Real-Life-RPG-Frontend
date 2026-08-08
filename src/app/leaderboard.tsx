import RPGHeader from "@/components/RPGHeader";
import { auth, db } from "@/lib/firebase";
import { RPGTheme } from "@/utils/rpgTheme";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type LeaderboardUser = {
  uid: string;
  username: string;
  avatar: string;
  heroClass: string;
  level: number;
  heroTitle: string;
  totalXP: number;
  coins: number;
  weeklyXP: number;
  monthlyXP: number;
  currentStreak: number;
  longestStreak: number;
  questsCompleted: number;
  weeklyQuestsCompleted: number;
  monthlyQuestsCompleted: number;
  achievementsEarned: number;
  inventoryCount: number;
  rank?: number;
};

type LeaderboardTab = "global" | "weekly" | "monthly";

const CLASS_EMOJIS: Record<string, string> = {
  warrior: "🛡️",
  mage: "🧙",
  archer: "🏹",
  assassin: "🥷",
};

export function getHeroTitleByLevel(level: number): string {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Champion";
  if (level >= 10) return "Warrior";
  if (level >= 5) return "Adventurer";
  return "Rookie";
}

function getLeaderboardBadge(rank: number): { text: string; icon: string; bg: string; color: string } | null {
  if (rank === 1) {
    return { text: "Champion", icon: "🥇", bg: "#F59E0B", color: "#0F172A" };
  }
  if (rank === 2 || rank === 3) {
    return { text: "Elite", icon: "🥈", bg: "#94A3B8", color: "#0F172A" };
  }
  if (rank >= 4 && rank <= 10) {
    return { text: "Top Player", icon: "🥉", bg: "rgba(168, 85, 247, 0.2)", color: "#A78BFA" };
  }
  return null;
}

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [rawUsers, setRawUsers] = useState<LeaderboardUser[]>([]);
  const [selectedTab, setSelectedTab] = useState<LeaderboardTab>("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const list: LeaderboardUser[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const cls = (data.heroClass || data.class || "warrior").toLowerCase();
          const avatarEmoji =
            data.avatarEmoji ||
            data.avatar ||
            CLASS_EMOJIS[cls] ||
            "🛡️";

          const questsCompleted = Number(
            data.totalQuestsCompleted ??
            (Array.isArray(data.completedQuests) ? data.completedQuests.length : 0)
          );

          const achievementsEarned = Number(
            Array.isArray(data.unlockedAchievements)
              ? data.unlockedAchievements.length
              : 0
          );

          const level = Number(data.level ?? 1);
          const totalXP = Number(data.totalXP ?? data.xp ?? 0);
          const coins = Number(data.coins ?? 0);
          const currentStreak = Number(data.currentStreak ?? data.streak ?? 0);
          const longestStreak = Number(data.longestStreak ?? currentStreak);
          const heroTitle = data.title || getHeroTitleByLevel(level);

          return {
            uid: docSnap.id,
            username: data.heroName || data.displayName || data.email?.split("@")[0] || "Hero Adventurer",
            avatar: avatarEmoji,
            heroClass: cls,
            level,
            heroTitle,
            totalXP,
            coins,
            weeklyXP: Number(data.weeklyXP ?? Math.round(totalXP * 0.35)),
            monthlyXP: Number(data.monthlyXP ?? Math.round(totalXP * 0.7)),
            currentStreak,
            longestStreak,
            questsCompleted,
            weeklyQuestsCompleted: Number(data.weeklyQuestsCompleted ?? Math.ceil(questsCompleted * 0.3)),
            monthlyQuestsCompleted: Number(data.monthlyQuestsCompleted ?? Math.ceil(questsCompleted * 0.65)),
            achievementsEarned,
            inventoryCount: Number(data.inventoryCount ?? 8),
          };
        });

        setRawUsers(list);
        setLoading(false);
      },
      (error) => {
        console.error("[Leaderboard] Error reading users collection:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute sorted & ranked users per tab
  const rankedUsers = useMemo(() => {
    const list = [...rawUsers];

    if (selectedTab === "global") {
      // Primary: Total XP descending; Secondary: Current Streak descending; Tertiary: Level
      list.sort((a, b) => {
        if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        return b.level - a.level;
      });
    } else if (selectedTab === "weekly") {
      list.sort((a, b) => {
        if (b.weeklyXP !== a.weeklyXP) return b.weeklyXP - a.weeklyXP;
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        return b.weeklyQuestsCompleted - a.weeklyQuestsCompleted;
      });
    } else if (selectedTab === "monthly") {
      list.sort((a, b) => {
        if (b.monthlyXP !== a.monthlyXP) return b.monthlyXP - a.monthlyXP;
        if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
        return b.monthlyQuestsCompleted - a.monthlyQuestsCompleted;
      });
    }

    return list.map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
  }, [rawUsers, selectedTab]);

  // Search filter
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return rankedUsers;
    return rankedUsers.filter((u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rankedUsers, searchQuery]);

  // Top 50 Users Limit
  const top50Users = useMemo(() => {
    return filteredUsers.slice(0, 50);
  }, [filteredUsers]);

  // Top 3 Podium
  const top3 = useMemo(() => top50Users.slice(0, 3), [top50Users]);

  // Ranked List below Top 3 (ranks 4 through 50)
  const restOfTop50 = useMemo(() => top50Users.slice(3), [top50Users]);

  // Current logged in user's rank info (find from full rankedUsers even if outside top 50)
  const currentUserData = useMemo(() => {
    return rankedUsers.find((u) => u.uid === currentUserId);
  }, [rankedUsers, currentUserId]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Loading Realm Leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="Global Leaderboard" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER TITLE & SUBTITLE */}
        <Text style={styles.eyebrow}>HALL OF FAME</Text>
        <Text style={styles.title}>🏆 Global Leaderboard</Text>
        <Text style={styles.subtitle}>Compete with heroes worldwide across Total XP and Streaks</Text>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search heroes by name..."
            placeholderTextColor={RPGTheme.colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* FILTER TABS: GLOBAL, WEEKLY, MONTHLY */}
        <View style={styles.tabsRow}>
          {(["global", "weekly", "monthly"] as LeaderboardTab[]).map((tabKey) => {
            const active = selectedTab === tabKey;
            return (
              <TouchableOpacity
                key={tabKey}
                activeOpacity={0.8}
                onPress={() => setSelectedTab(tabKey)}
                style={[styles.tabButton, active && styles.activeTabButton]}
              >
                <Text style={[styles.tabText, active && styles.activeTabText]}>
                  {tabKey === "global" ? "🌍 Global" : tabKey === "weekly" ? "⚡ Weekly" : "📅 Monthly"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* EMPTY STATE */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>No Leaderboard Players Found</Text>
            <Text style={styles.emptyText}>Be the first hero to complete quests and claim the crown!</Text>
          </View>
        ) : (
          <>
            {/* TOP 3 PODIUM (GOLD, SILVER, BRONZE CARDS WITH CROWN & MEDAL STYLING) */}
            {top3.length > 0 && !searchQuery.trim() && (
              <View style={styles.podiumContainer}>
                {/* 2nd PLACE - SILVER */}
                {top3[1] && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedUser(top3[1])}
                    style={[styles.podiumColumn, styles.podiumSilver]}
                  >
                    <Text style={styles.crownIcon}>👑</Text>
                    <Text style={styles.podiumMedal}>🥈</Text>
                    <Text style={styles.podiumAvatar}>{top3[1].avatar}</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {top3[1].username}
                    </Text>
                    <Text style={styles.podiumTitleSub}>{top3[1].heroTitle} • Lvl {top3[1].level}</Text>
                    <Text style={styles.podiumXP}>
                      ⚡ {selectedTab === "global" ? top3[1].totalXP : selectedTab === "weekly" ? top3[1].weeklyXP : top3[1].monthlyXP} XP
                    </Text>
                    <View style={styles.podiumDetailRow}>
                      <Text style={styles.podiumDetailText}>🪙 {top3[1].coins}</Text>
                      <Text style={styles.podiumDetailText}>🔥 {top3[1].currentStreak}d</Text>
                    </View>
                    <View style={styles.podiumBadge}>
                      <Text style={styles.podiumBadgeText}>🥈 #2 Silver</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 1st PLACE - GOLD */}
                {top3[0] && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedUser(top3[0])}
                    style={[styles.podiumColumn, styles.podiumGold]}
                  >
                    <Text style={styles.crownIconGold}>👑</Text>
                    <Text style={styles.podiumMedal}>🥇</Text>
                    <Text style={styles.podiumAvatarGold}>{top3[0].avatar}</Text>
                    <Text style={styles.podiumGoldName} numberOfLines={1}>
                      {top3[0].username}
                    </Text>
                    <Text style={styles.podiumGoldTitleSub}>{top3[0].heroTitle} • Lvl {top3[0].level}</Text>
                    <Text style={styles.podiumGoldXP}>
                      ⚡ {selectedTab === "global" ? top3[0].totalXP : selectedTab === "weekly" ? top3[0].weeklyXP : top3[0].monthlyXP} XP
                    </Text>
                    <View style={styles.podiumDetailRow}>
                      <Text style={styles.podiumGoldDetailText}>🪙 {top3[0].coins}</Text>
                      <Text style={styles.podiumGoldDetailText}>🔥 {top3[0].currentStreak}d</Text>
                    </View>
                    <View style={styles.podiumGoldBadge}>
                      <Text style={styles.podiumGoldBadgeText}>🥇 #1 Champion</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 3rd PLACE - BRONZE */}
                {top3[2] && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedUser(top3[2])}
                    style={[styles.podiumColumn, styles.podiumBronze]}
                  >
                    <Text style={styles.crownIcon}>👑</Text>
                    <Text style={styles.podiumMedal}>🥉</Text>
                    <Text style={styles.podiumAvatar}>{top3[2].avatar}</Text>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {top3[2].username}
                    </Text>
                    <Text style={styles.podiumTitleSub}>{top3[2].heroTitle} • Lvl {top3[2].level}</Text>
                    <Text style={styles.podiumXP}>
                      ⚡ {selectedTab === "global" ? top3[2].totalXP : selectedTab === "weekly" ? top3[2].weeklyXP : top3[2].monthlyXP} XP
                    </Text>
                    <View style={styles.podiumDetailRow}>
                      <Text style={styles.podiumDetailText}>🪙 {top3[2].coins}</Text>
                      <Text style={styles.podiumDetailText}>🔥 {top3[2].currentStreak}d</Text>
                    </View>
                    <View style={styles.podiumBadge}>
                      <Text style={styles.podiumBadgeText}>🥉 #3 Bronze</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* RANKED LIST BELOW TOP 3 (Top 50) */}
            <Text style={styles.sectionTitle}>📜 Top 50 Leaderboard Rankings</Text>

            <View style={styles.rankingsCard}>
              {(searchQuery.trim() ? top50Users : restOfTop50).map((item, index) => {
                const isMe = item.uid === currentUserId;
                const badge = getLeaderboardBadge(item.rank ?? index + 4);
                const displayXP = selectedTab === "global" ? item.totalXP : selectedTab === "weekly" ? item.weeklyXP : item.monthlyXP;

                return (
                  <View key={item.uid}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedUser(item)}
                      style={[styles.rankRow, isMe && styles.highlightMeRow]}
                    >
                      {/* RANK NUMBER */}
                      <View style={{ width: 38, alignItems: "center" }}>
                        <Text
                          style={[
                            styles.rankNumber,
                            item.rank === 1 && { color: "#F59E0B" },
                            item.rank === 2 && { color: "#94A3B8" },
                            item.rank === 3 && { color: "#D97706" },
                          ]}
                        >
                          #{item.rank}
                        </Text>
                      </View>

                      {/* AVATAR */}
                      <View style={styles.rankAvatarBg}>
                        <Text style={styles.rankAvatarEmoji}>{item.avatar}</Text>
                      </View>

                      {/* USER INFO */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Text style={[styles.rankUsername, isMe && { color: "#F59E0B" }]} numberOfLines={1}>
                            {item.username}
                          </Text>
                          {isMe && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>YOU</Text>
                            </View>
                          )}
                          {badge && (
                            <View style={[styles.customBadge, { backgroundColor: badge.bg }]}>
                              <Text style={[styles.customBadgeText, { color: badge.color }]}>
                                {badge.icon} {badge.text}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.rankSubtext}>
                          👑 {item.heroTitle} • Lvl {item.level} • 🪙 {item.coins} • 🔥 {item.currentStreak}d
                        </Text>
                      </View>

                      {/* XP VALUE */}
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.rankXP}>⚡ {displayXP} XP</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Return to Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PERSISTENT BOTTOM FOOTER: YOUR RANK (EVEN IF OUTSIDE TOP 50) */}
      {currentUserData && (
        <View style={styles.yourRankFooterContainer}>
          <View style={styles.yourRankFooterCard}>
            <View style={styles.yourRankHeaderRow}>
              <Text style={styles.yourRankHeaderTitle}>YOUR RANK ({selectedTab.toUpperCase()})</Text>
              <Text style={styles.yourRankNumber}>#{currentUserData.rank}</Text>
            </View>
            <View style={styles.yourRankBodyRow}>
              <Text style={styles.yourRankAvatar}>{currentUserData.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.yourRankName}>{currentUserData.username} (YOU)</Text>
                <Text style={styles.yourRankSubtext}>
                  👑 {currentUserData.heroTitle} • Level {currentUserData.level}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.yourRankXP}>⚡ {selectedTab === "global" ? currentUserData.totalXP : selectedTab === "weekly" ? currentUserData.weeklyXP : currentUserData.monthlyXP} XP</Text>
                <Text style={styles.yourRankSubtext}>🪙 {currentUserData.coins} • 🔥 {currentUserData.currentStreak}d Streak</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* PLAYER PROFILE MODAL */}
      <Modal
        visible={!!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedUser(null)}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatarBg}>
                    <Text style={styles.modalAvatarEmoji}>{selectedUser.avatar}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.modalTitle}>{selectedUser.username}</Text>
                      {selectedUser.rank && selectedUser.rank <= 3 && (
                        <Text style={{ fontSize: 18 }}>👑</Text>
                      )}
                    </View>
                    <Text style={styles.modalClass}>
                      Rank #{selectedUser.rank} • {selectedUser.heroTitle} • Lvl {selectedUser.level}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedUser(null)}>
                    <Text style={{ color: "#94A3B8", fontSize: 20, fontWeight: "900" }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* LEADERBOARD BADGE */}
                {selectedUser.rank && getLeaderboardBadge(selectedUser.rank) && (
                  <View style={[styles.modalBadgeBanner, { backgroundColor: getLeaderboardBadge(selectedUser.rank)!.bg }]}>
                    <Text style={[styles.modalBadgeText, { color: getLeaderboardBadge(selectedUser.rank)!.color }]}>
                      {getLeaderboardBadge(selectedUser.rank)!.icon} {getLeaderboardBadge(selectedUser.rank)!.text} Badge Awarded!
                    </Text>
                  </View>
                )}

                {/* PLAYER STATS GRID */}
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>👑</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.heroTitle}</Text>
                    <Text style={styles.modalStatLbl}>Hero Title</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>⭐</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.level}</Text>
                    <Text style={styles.modalStatLbl}>Hero Level</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>⚡</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.totalXP}</Text>
                    <Text style={styles.modalStatLbl}>Total XP</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>🪙</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.coins}</Text>
                    <Text style={styles.modalStatLbl}>Coins</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>🔥</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.currentStreak}d</Text>
                    <Text style={styles.modalStatLbl}>Current Streak</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>🏆</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.longestStreak}d</Text>
                    <Text style={styles.modalStatLbl}>Longest Streak</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedUser(null)}
                >
                  <Text style={styles.modalCloseText}>Close Profile</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

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
    paddingBottom: 110,
  },
  eyebrow: {
    color: RPGTheme.colors.purplePrimary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderColor: "#7C3AED",
  },
  tabText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  emptyContainer: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 30,
    alignItems: "center",
    marginVertical: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
    marginTop: 10,
  },
  podiumColumn: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  podiumGold: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
    paddingVertical: 18,
  },
  podiumSilver: {
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    borderColor: "#94A3B8",
    paddingVertical: 14,
  },
  podiumBronze: {
    backgroundColor: "rgba(217, 119, 6, 0.12)",
    borderColor: "#D97706",
    paddingVertical: 14,
  },
  crownIconGold: {
    fontSize: 22,
    marginBottom: 2,
  },
  crownIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  podiumMedal: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumAvatarGold: {
    fontSize: 34,
    marginBottom: 6,
  },
  podiumAvatar: {
    fontSize: 28,
    marginBottom: 6,
  },
  podiumGoldName: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  podiumName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  podiumGoldTitleSub: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  podiumTitleSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
  podiumGoldXP: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  podiumXP: {
    color: RPGTheme.colors.purplePrimary,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },
  podiumDetailRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  podiumGoldDetailText: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "700",
  },
  podiumDetailText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
  podiumGoldBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  podiumGoldBadgeText: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "900",
  },
  podiumBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  podiumBadgeText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
  },
  sectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  rankingsCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: RPGTheme.colors.cardBorder,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  highlightMeRow: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  rankNumber: {
    color: RPGTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: "900",
  },
  rankAvatarBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  rankAvatarEmoji: {
    fontSize: 20,
  },
  rankUsername: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  youBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  youBadgeText: {
    color: "#0F172A",
    fontSize: 9,
    fontWeight: "900",
  },
  customBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },
  rankSubtext: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  rankXP: {
    color: RPGTheme.colors.purplePrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  backButtonText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  yourRankFooterContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderTopWidth: 1.5,
    borderTopColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  yourRankFooterCard: {
    backgroundColor: "rgba(124, 58, 237, 0.18)",
    borderRadius: 12,
    borderColor: "#A78BFA",
    borderWidth: 1,
    padding: 10,
  },
  yourRankHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  yourRankHeaderTitle: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  yourRankNumber: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "900",
  },
  yourRankBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  yourRankAvatar: {
    fontSize: 22,
  },
  yourRankName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  yourRankSubtext: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  yourRankXP: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  modalAvatarBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarEmoji: {
    fontSize: 26,
  },
  modalTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  modalClass: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  modalBadgeBanner: {
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  modalStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  modalStatBox: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 10,
    alignItems: "center",
  },
  modalStatEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  modalStatVal: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  modalStatLbl: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  modalCloseButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});