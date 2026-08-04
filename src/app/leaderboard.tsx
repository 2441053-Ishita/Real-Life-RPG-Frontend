import RPGHeader from "@/components/RPGHeader";
import { auth, db } from "@/lib/firebase";
import { RPGTheme } from "@/utils/rpgTheme";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
  totalXP: number;
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

          const totalXP = Number(data.totalXP ?? data.xp ?? 0);
          const currentStreak = Number(data.currentStreak ?? data.streak ?? 0);
          const longestStreak = Number(data.longestStreak ?? currentStreak);

          return {
            uid: docSnap.id,
            username: data.heroName || data.displayName || data.email?.split("@")[0] || "Hero Adventurer",
            avatar: avatarEmoji,
            heroClass: cls,
            level: Number(data.level ?? 1),
            totalXP,
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
      // Primary: Total XP, Secondary: Level, Tertiary: Current Streak
      list.sort((a, b) => {
        if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
        if (b.level !== a.level) return b.level - a.level;
        return b.currentStreak - a.currentStreak;
      });
    } else if (selectedTab === "weekly") {
      // Primary: Weekly XP, Secondary: Weekly Quests Completed
      list.sort((a, b) => {
        if (b.weeklyXP !== a.weeklyXP) return b.weeklyXP - a.weeklyXP;
        if (b.weeklyQuestsCompleted !== a.weeklyQuestsCompleted) return b.weeklyQuestsCompleted - a.weeklyQuestsCompleted;
        return b.currentStreak - a.currentStreak;
      });
    } else if (selectedTab === "monthly") {
      // Primary: Monthly XP, Secondary: Monthly Quests Completed
      list.sort((a, b) => {
        if (b.monthlyXP !== a.monthlyXP) return b.monthlyXP - a.monthlyXP;
        if (b.monthlyQuestsCompleted !== a.monthlyQuestsCompleted) return b.monthlyQuestsCompleted - a.monthlyQuestsCompleted;
        return b.currentStreak - a.currentStreak;
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

  const top3 = useMemo(() => filteredUsers.slice(0, 3), [filteredUsers]);

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
      <RPGHeader title="Realm Leaderboard" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER TITLE & SUBTITLE */}
        <Text style={styles.eyebrow}>HALL OF FAME</Text>
        <Text style={styles.title}>🏆 Hero Leaderboard</Text>
        <Text style={styles.subtitle}>Compete across Global, Weekly, and Monthly rankings</Text>

        {/* LOGGED IN USER RANKING BANNER */}
        {currentUserData && (
          <View style={styles.myRankBanner}>
            <Text style={styles.myRankBannerTitle}>YOUR RANKING ({selectedTab.toUpperCase()})</Text>
            <View style={styles.myRankRow}>
              <Text style={styles.myRankBadge}>Your Rank: #{currentUserData.rank}</Text>
              <Text style={styles.myRankAvatar}>{currentUserData.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.myRankName}>{currentUserData.username} (YOU)</Text>
                <Text style={styles.myRankStats}>
                  Lvl {currentUserData.level} • {selectedTab === "global" ? `${currentUserData.totalXP} XP` : selectedTab === "weekly" ? `${currentUserData.weeklyXP} XP` : `${currentUserData.monthlyXP} XP`} • 🔥 {currentUserData.currentStreak}d Streak
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search heroes by username..."
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
            {/* TOP 3 PODIUM */}
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
                    <Text style={styles.podiumXP}>
                      ⚡ {selectedTab === "global" ? top3[1].totalXP : selectedTab === "weekly" ? top3[1].weeklyXP : top3[1].monthlyXP} XP
                    </Text>
                    <View style={styles.podiumBadge}>
                      <Text style={styles.podiumBadgeText}>🥈 Elite #2</Text>
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
                    <Text style={styles.podiumGoldXP}>
                      ⚡ {selectedTab === "global" ? top3[0].totalXP : selectedTab === "weekly" ? top3[0].weeklyXP : top3[0].monthlyXP} XP
                    </Text>
                    <View style={styles.podiumGoldBadge}>
                      <Text style={styles.podiumGoldBadgeText}>🥇 Champion #1</Text>
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
                    <Text style={styles.podiumXP}>
                      ⚡ {selectedTab === "global" ? top3[2].totalXP : selectedTab === "weekly" ? top3[2].weeklyXP : top3[2].monthlyXP} XP
                    </Text>
                    <View style={styles.podiumBadge}>
                      <Text style={styles.podiumBadgeText}>🥉 Elite #3</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* FULL RANKINGS LIST */}
            <Text style={styles.sectionTitle}>📜 All Realm Heroes</Text>

            <View style={styles.rankingsCard}>
              {filteredUsers.map((item, index) => {
                const isMe = item.uid === currentUserId;
                const badge = getLeaderboardBadge(item.rank ?? index + 1);
                const displayXP = selectedTab === "global" ? item.totalXP : selectedTab === "weekly" ? item.weeklyXP : item.monthlyXP;

                return (
                  <View key={item.uid}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedUser(item)}
                      style={[styles.rankRow, isMe && styles.highlightMeRow]}
                    >
                      {/* CROWN OR RANK NUMBER */}
                      <View style={{ width: 34, alignItems: "center" }}>
                        {item.rank && item.rank <= 3 ? (
                          <Text style={{ fontSize: 16 }}>👑</Text>
                        ) : null}
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
                          ⭐ Lvl {item.level} • 🔥 {item.currentStreak}d Streak • 🏆 {item.questsCompleted} Quests
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
                      Rank #{selectedUser.rank} • {selectedUser.heroClass.toUpperCase()} HERO
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
                    <Text style={styles.modalStatEmoji}>🔥</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.currentStreak}d</Text>
                    <Text style={styles.modalStatLbl}>Current Streak</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>🏆</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.longestStreak}d</Text>
                    <Text style={styles.modalStatLbl}>Longest Streak</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>⚔️</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.questsCompleted}</Text>
                    <Text style={styles.modalStatLbl}>Quests Done</Text>
                  </View>

                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatEmoji}>🏅</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.achievementsEarned}</Text>
                    <Text style={styles.modalStatLbl}>Achievements</Text>
                  </View>

                  <View style={[styles.modalStatBox, { width: "100%" }]}>
                    <Text style={styles.modalStatEmoji}>📦</Text>
                    <Text style={styles.modalStatVal}>{selectedUser.inventoryCount} Items</Text>
                    <Text style={styles.modalStatLbl}>Inventory Items Unlocked</Text>
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
    paddingBottom: 40,
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
  myRankBanner: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderColor: "#7C3AED",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  myRankBannerTitle: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  myRankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  myRankBadge: {
    color: "#F59E0B",
    fontSize: 16,
    fontWeight: "900",
  },
  myRankAvatar: {
    fontSize: 24,
  },
  myRankName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  myRankStats: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "700",
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
    marginBottom: 10,
  },
  emptyTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 24,
    marginTop: 8,
  },
  podiumColumn: {
    flex: 1,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 12,
    alignItems: "center",
  },
  podiumGold: {
    borderColor: "#F59E0B",
    borderWidth: 2,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingVertical: 18,
    marginTop: -16,
  },
  podiumSilver: {
    borderColor: "#94A3B8",
    paddingVertical: 14,
  },
  podiumBronze: {
    borderColor: "#D97706",
    paddingVertical: 14,
  },
  crownIconGold: {
    fontSize: 22,
    marginBottom: -2,
  },
  crownIcon: {
    fontSize: 18,
    marginBottom: -2,
  },
  podiumMedal: {
    fontSize: 22,
    marginBottom: 6,
  },
  podiumAvatarGold: {
    fontSize: 32,
    marginBottom: 6,
  },
  podiumAvatar: {
    fontSize: 24,
    marginBottom: 6,
  },
  podiumGoldName: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "900",
  },
  podiumName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  podiumGoldXP: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  podiumXP: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  podiumGoldBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  podiumGoldBadgeText: {
    color: "#0F172A",
    fontSize: 9,
    fontWeight: "900",
  },
  podiumBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  podiumBadgeText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
  },
  sectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  rankingsCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 14,
    marginBottom: 20,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 10,
  },
  highlightMeRow: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "#7C3AED",
    borderWidth: 1,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    color: RPGTheme.colors.textPrimary,
  },
  rankAvatarBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  rankAvatarEmoji: {
    fontSize: 18,
  },
  rankUsername: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 110,
  },
  rankSubtext: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  rankXP: {
    color: "#F59E0B",
    fontSize: 13,
    fontWeight: "900",
  },
  youBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  youBadgeText: {
    color: "#0F172A",
    fontSize: 8,
    fontWeight: "900",
  },
  customBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  customBadgeText: {
    fontSize: 8,
    fontWeight: "800",
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

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
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
    color: RPGTheme.colors.purplePrimary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  modalBadgeBanner: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  modalStatBox: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    padding: 10,
    alignItems: "center",
  },
  modalStatEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  modalStatVal: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
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
    fontSize: 14,
    fontWeight: "800",
  },
});