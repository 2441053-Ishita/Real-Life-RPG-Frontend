import { auth, db } from "@/lib/firebase";
import { getHeroRank } from "./utils/rank";
import { RPGTheme } from "./utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import AvatarImage from "@/components/AvatarImage";
import { HeadingText, TitleText, BodyText, StatsText, ButtonText, AppText } from "@/components/Typography";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const TOTAL_APP_ACHIEVEMENTS = 12;

export default function StatisticsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    heroName: "Hero of the Realm",
    level: 1,
    xp: 0,
    totalXP: 0,
    coins: 0,
    streak: 1,
    longestStreak: 1,
    completedQuests: 0,
    totalQuests: 0,
    todayQuests: 0,
    bossesDefeatedCount: 0,
    currentChapter: 1,
    unlockedAchievementsCount: 0,
    equippedTitle: "Novice",
    equippedAvatar: "knight",
    avatarUrl: null as string | null,
    createdAtDate: "Joined Realm",
    daysJoined: 1,
  });

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const level = data.level ?? 1;
          const xp = data.xp ?? 0;
          const totalXP = data.totalXP ?? 0;
          const coins = data.coins ?? 0;
          const streak = data.streak ?? 1;
          const completedQuestsArr = data.completedQuests || [];
          const totalQuestsCompleted = data.totalQuestsCompleted ?? completedQuestsArr.length;

          const bossesMap = data.chapterBossesDefeated || {};
          const bossesDefeatedCount = Object.values(bossesMap).filter(Boolean).length;

          const unlockedAchievements = data.unlockedAchievements || [];

          // Account creation date math
          let createdAtDateStr = "Recent Adventurer";
          let daysJoined = 1;
          if (data.createdAt?.toDate) {
            const dateObj = data.createdAt.toDate();
            createdAtDateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const diffTime = Math.abs(Date.now() - dateObj.getTime());
            daysJoined = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }

          setStats({
            heroName: data.heroName || "Hero of the Realm",
            level,
            xp,
            totalXP,
            coins,
            streak,
            longestStreak: Math.max(streak, data.longestStreak ?? streak),
            completedQuests: totalQuestsCompleted,
            totalQuests: Math.max(totalQuestsCompleted, 10),
            todayQuests: data.todayQuestsCompleted ?? (completedQuestsArr.length > 0 ? 1 : 0),
            bossesDefeatedCount,
            currentChapter: data.currentChapter ?? 1,
            unlockedAchievementsCount: unlockedAchievements.length,
            equippedTitle: data.equippedTitle || "Novice Adventurer",
            equippedAvatar: data.equippedAvatar || "knight",
            avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
            createdAtDate: createdAtDateStr,
            daysJoined,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("STATISTICS FIRESTORE ERROR:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const rank = getHeroRank(stats.level);
  const xpPercent = Math.min(100, Math.round((stats.xp / 100) * 100));
  const achievementPercent = Math.min(
    100,
    Math.round((stats.unlockedAchievementsCount / TOTAL_APP_ACHIEVEMENTS) * 100)
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <BodyText style={styles.loadingText}>Gathering Hero Chronicles...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="📊 Hero Statistics & Hall of Records" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. HERO SUMMARY CARD */}
        <View style={styles.heroSummaryCard}>
          <View style={styles.avatarWrapper}>
            <AvatarImage
              avatarUrl={stats.avatarUrl}
              equippedAvatar={stats.equippedAvatar}
              size={80}
            />
            <View style={[styles.levelBadge, { backgroundColor: rank.color }]}>
              <StatsText style={styles.levelBadgeText}>Lvl {stats.level}</StatsText>
            </View>
          </View>

          <View style={styles.heroDetailsGroup}>
            <HeadingText style={styles.heroName}>{stats.heroName}</HeadingText>
            <BodyText style={styles.heroTitle}>👑 {stats.equippedTitle}</BodyText>

            <View style={[styles.rankTag, { backgroundColor: rank.color }]}>
              <HeadingText style={styles.rankTagText}>{rank.name} RANK</HeadingText>
            </View>
          </View>
        </View>

        {/* 2. PROGRESS & XP OVERVIEW */}
        <HeadingText style={styles.sectionHeader}>⭐ Level & Experience Progress</HeadingText>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <BodyText style={styles.statLabel}>Current Level</BodyText>
            <StatsText style={styles.statValue}>Lvl {stats.level}</StatsText>
          </View>

          <View style={styles.statRow}>
            <BodyText style={styles.statLabel}>XP to Next Level</BodyText>
            <StatsText style={styles.statValue}>{stats.xp} / 100 XP</StatsText>
          </View>

          {/* XP PROGRESS TRACK */}
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
          </View>

          <View style={styles.grid2Col}>
            <View style={styles.subStatBox}>
              <AppText style={styles.subStatIcon}>✨</AppText>
              <StatsText style={styles.subStatVal}>{stats.totalXP}</StatsText>
              <BodyText style={styles.subStatLabel}>Total XP Earned</BodyText>
            </View>

            <View style={styles.subStatBox}>
              <AppText style={styles.subStatIcon}>🪙</AppText>
              <StatsText style={styles.subStatVal}>{stats.coins}</StatsText>
              <BodyText style={styles.subStatLabel}>Gold Coins Earned</BodyText>
            </View>
          </View>
        </View>

        {/* 3. STREAK & HABIT METRICS */}
        <HeadingText style={styles.sectionHeader}>🔥 Streak & Habit Mastery</HeadingText>
        <View style={styles.grid2Col}>
          <View style={styles.statCard}>
            <AppText style={styles.statCardIcon}>🔥</AppText>
            <StatsText style={styles.statCardValue}>{stats.streak} Days</StatsText>
            <BodyText style={styles.statCardLabel}>Current Active Streak</BodyText>
          </View>

          <View style={styles.statCard}>
            <AppText style={styles.statCardIcon}>⚡</AppText>
            <StatsText style={styles.statCardValue}>{stats.longestStreak} Days</StatsText>
            <BodyText style={styles.statCardLabel}>Longest Habit Streak</BodyText>
          </View>
        </View>

        {/* 4. QUEST COMPLETION METRICS */}
        <HeadingText style={styles.sectionHeader}>📜 Quest Completion Statistics</HeadingText>
        <View style={styles.card}>
          <View style={styles.grid3Col}>
            <View style={styles.colStatBox}>
              <StatsText style={styles.colStatVal}>{stats.completedQuests}</StatsText>
              <BodyText style={styles.colStatLabel}>Completed</BodyText>
            </View>
            <View style={styles.colStatBox}>
              <StatsText style={styles.colStatVal}>{stats.todayQuests}</StatsText>
              <BodyText style={styles.colStatLabel}>Today</BodyText>
            </View>
            <View style={styles.colStatBox}>
              <StatsText style={styles.colStatVal}>
                {Math.round((stats.completedQuests / Math.max(stats.completedQuests, 1)) * 100)}%
              </StatsText>
              <BodyText style={styles.colStatLabel}>Clear Rate</BodyText>
            </View>
          </View>
        </View>

        {/* 5. BOSS BATTLE & REALM PROGRESS */}
        <HeadingText style={styles.sectionHeader}>🐉 Boss Conquest & Realm Map</HeadingText>
        <View style={styles.grid2Col}>
          <View style={styles.statCard}>
            <AppText style={styles.statCardIcon}>⚔️</AppText>
            <StatsText style={styles.statCardValue}>{stats.bossesDefeatedCount}</StatsText>
            <BodyText style={styles.statCardLabel}>Boss Lords Defeated</BodyText>
          </View>

          <View style={styles.statCard}>
            <AppText style={styles.statCardIcon}>🗺️</AppText>
            <StatsText style={styles.statCardValue}>Chapter {stats.currentChapter}</StatsText>
            <BodyText style={styles.statCardLabel}>Highest Chapter Reached</BodyText>
          </View>
        </View>

        {/* 6. ACHIEVEMENTS */}
        <HeadingText style={styles.sectionHeader}>🏆 Achievements & Trophies</HeadingText>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <BodyText style={styles.statLabel}>Trophies Unlocked</BodyText>
            <StatsText style={styles.statValue}>
              {stats.unlockedAchievementsCount} / {TOTAL_APP_ACHIEVEMENTS}
            </StatsText>
          </View>

          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                { width: `${achievementPercent}%`, backgroundColor: RPGTheme.colors.gold },
              ]}
            />
          </View>

          <BodyText style={styles.achievementHint}>
            {achievementPercent}% of total realm achievements unlocked!
          </BodyText>
        </View>

        {/* 7. JOURNEY & CHRONICLES */}
        <HeadingText style={styles.sectionHeader}>📜 Hero Journey Chronicles</HeadingText>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <BodyText style={styles.statLabel}>Account Creation Date</BodyText>
            <StatsText style={styles.statValue}>{stats.createdAtDate}</StatsText>
          </View>
          <View style={styles.statRow}>
            <BodyText style={styles.statLabel}>Days Active in Realm</BodyText>
            <StatsText style={styles.statValue}>{stats.daysJoined} Days</StatsText>
          </View>
        </View>
      </ScrollView>
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
    color: RPGTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 14,
  },
  container: {
    padding: 16,
    paddingBottom: 60,
  },

  heroSummaryCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
  },
  levelBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  heroDetailsGroup: {
    flex: 1,
  },
  heroName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 2,
  },
  heroTitle: {
    color: RPGTheme.colors.goldLight,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  rankTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rankTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  sectionHeader: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    marginBottom: 20,
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },

  xpTrack: {
    height: 10,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 10,
  },
  xpFill: {
    height: "100%",
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 10,
  },

  grid2Col: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  subStatBox: {
    flex: 1,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    marginTop: 6,
  },
  subStatIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  subStatVal: {
    color: RPGTheme.colors.goldLight,
    fontSize: 16,
    fontWeight: "900",
  },
  subStatLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  statCard: {
    flex: 1,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  statCardIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  statCardValue: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 2,
  },
  statCardLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    textAlign: "center",
    fontWeight: "700",
  },

  grid3Col: {
    flexDirection: "row",
    gap: 8,
  },
  colStatBox: {
    flex: 1,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  colStatVal: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  colStatLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  achievementHint: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});
