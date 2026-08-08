import { auth, db } from "@/lib/firebase";
import { getHeroRank } from "@/utils/rank";
import {
  DEFAULT_SKILLS,
  HeroSkills,
  SKILL_METADATA,
  SkillType,
} from "@/utils/skills";
import {
  DEFAULT_EQUIPMENT,
  EquipmentState,
  SLOT_LABELS,
  calculateTotalEquipmentStats,
  getRarityColor,
} from "@/utils/inventory";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import { router } from "expo-router";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AvatarImage from "@/components/AvatarImage";
import LevelService from "@/services/levelService";
import { getPlayerTitle } from "./profile";

type HeroData = {
  heroName: string;
  className: string;
  level: number;
  xp: number;
  totalXP: number;
  coins: number;
  streak: number;
  currentStreak: number;
  longestStreak: number;
  completedQuests: string[];
  totalQuestsCompleted: number;
  unlockedAchievements: string[];
  skills: HeroSkills;
  equipment: EquipmentState;
  equippedAvatar?: string;
  avatarUrl?: string | null;
};

const SKILL_KEYS: SkillType[] = [
  "strength",
  "intelligence",
  "discipline",
  "wisdom",
  "vitality",
  "creativity",
];

const SLOTS = ["weapon", "helmet", "armor", "boots", "shield", "accessory"] as const;

export default function CharacterScreen() {
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState<HeroData>({
    heroName: "Hero of the Realm",
    className: "Warrior Adventurer",
    level: 1,
    xp: 0,
    totalXP: 0,
    coins: 0,
    streak: 1,
    currentStreak: 1,
    longestStreak: 1,
    completedQuests: [],
    totalQuestsCompleted: 0,
    unlockedAchievements: [],
    skills: DEFAULT_SKILLS,
    equipment: DEFAULT_EQUIPMENT,
  });

  const [detailedStats, setDetailedStats] = useState({
    totalQuestsCompleted: 0,
    dailyQuestsCompleted: 0,
    customQuestsCompleted: 0,
    bossesDefeated: 0,
    achievementsUnlocked: 0,
    inventoryItemCount: 0,
  });

  const [recentQuests, setRecentQuests] = useState<any[]>([]);
  const [lastUnlockedItem, setLastUnlockedItem] = useState<any>(null);
  const [lastAchievement, setLastAchievement] = useState<any>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubHero = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const unlockedAchievements = Array.isArray(data.unlockedAchievements)
          ? data.unlockedAchievements.map((id: any) => String(id))
          : [];

        const currentStreak = Number(data.currentStreak ?? data.streak ?? 1);
        const longestStreak = Number(data.longestStreak ?? currentStreak);

        setHero({
          heroName: data.heroName || "Hero of the Realm",
          className: data.className || "Paladin Adventurer",
          level: data.level ?? 1,
          xp: data.xp ?? 0,
          totalXP: data.totalXP ?? 0,
          coins: data.coins ?? 0,
          streak: currentStreak,
          currentStreak,
          longestStreak,
          completedQuests: (data.completedQuests || []).map((id: any) => String(id)),
          totalQuestsCompleted: data.totalQuestsCompleted ?? 0,
          unlockedAchievements,
          skills: { ...DEFAULT_SKILLS, ...(data.skills || {}) },
          equipment: { ...DEFAULT_EQUIPMENT, ...(data.equipment || {}) },
          equippedAvatar: data.equippedAvatar || "warrior",
          avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
        });

        if (unlockedAchievements.length > 0) {
          const lastAchId = unlockedAchievements[unlockedAchievements.length - 1];
          setLastAchievement({
            title: lastAchId.replace(/_/g, " ").toUpperCase(),
            emoji: "🏆",
          });
        }
      }
      setLoading(false);
    });

    const inventoryRef = collection(db, "users", uid, "inventory");
    const unsubInv = onSnapshot(inventoryRef, (snap) => {
      let lastItem: any = null;
      snap.docs.forEach((dSnap) => {
        const d = dSnap.data();
        lastItem = {
          name: d.name || "Item",
          icon: d.icon || "⚔️",
          rarity: d.rarity || "Common",
        };
      });
      if (lastItem) setLastUnlockedItem(lastItem);
      setDetailedStats((prev) => ({ ...prev, inventoryItemCount: snap.docs.length }));
    });

    const dailyRef = collection(db, "users", uid, "dailyQuests");
    const unsubDaily = onSnapshot(dailyRef, (snap) => {
      setDetailedStats((prev) => ({
        ...prev,
        dailyQuestsCompleted: snap.docs.filter((d) => d.data().completed === true).length,
      }));
    });

    const customRef = collection(db, "users", uid, "quests");
    const unsubCustom = onSnapshot(customRef, (snap) => {
      setDetailedStats((prev) => ({
        ...prev,
        customQuestsCompleted: snap.docs.filter((d) => d.data().completed === true).length,
      }));
    });

    const bossRef = collection(db, "users", uid, "bossVictories");
    const unsubBoss = onSnapshot(bossRef, (snap) => {
      setDetailedStats((prev) => ({
        ...prev,
        bossesDefeated: snap.docs.length,
      }));
    });

    const historyRef = collection(db, "users", uid, "questHistory");
    const unsubHistory = onSnapshot(historyRef, (snap) => {
      const quests = snap.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          title: d.title || d.questTitle || "Completed Quest",
          emoji: d.emoji || "📜",
          completedAt: d.completedAt ? new Date(d.completedAt.seconds * 1000).toLocaleDateString() : "Recently",
        };
      });
      setRecentQuests(quests.slice(0, 5));
      setDetailedStats((prev) => ({
        ...prev,
        totalQuestsCompleted: snap.docs.length > 0 ? snap.docs.length : prev.totalQuestsCompleted,
      }));
    });

    return () => {
      unsubHero();
      unsubInv();
      unsubDaily();
      unsubCustom();
      unsubBoss();
      unsubHistory();
    };
  }, [uid]);

  const rank = getHeroRank(hero.level);
  const title = getPlayerTitle(hero.level);
  const gearStats = calculateTotalEquipmentStats(hero.equipment);

  const xpNeeded = LevelService.calculateXPForNextLevel(hero.level);
  const currentXP = hero.xp ?? (hero.totalXP % 100);
  const xpProgress = Math.min(100, Math.max(0, Math.round((currentXP / xpNeeded) * 100)));
  const totalAchievementsCount = 12;
  const achievementProgress = Math.min(100, Math.round((hero.unlockedAchievements.length / totalAchievementsCount) * 100));
  const totalCatalogItems = 30;
  const inventoryProgress = Math.min(100, Math.round((detailedStats.inventoryItemCount / totalCatalogItems) * 100));

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Summoning Hero Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="👤 Hero Sanctuary" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* LARGE HERO PORTRAIT CARD */}
        <View style={styles.heroPortraitCard}>
          <View style={styles.portraitFrame}>
            <AvatarImage avatarUrl={hero.avatarUrl} equippedAvatar={hero.equippedAvatar} size={84} />
            <View style={[styles.levelBadge, { backgroundColor: rank.color }]}>
              <Text style={styles.levelBadgeText}>Lvl {hero.level}</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{hero.heroName}</Text>
          <Text style={styles.heroClass}>{hero.className}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.rankTag, { backgroundColor: rank.color }]}>
              <Text style={styles.rankTagText}>👑 {rank.name} RANK</Text>
            </View>
            <View style={styles.playerTitleBadge}>
              <Text style={styles.playerTitleText}>👑 Title: {title}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push("/edit-hero" as any)}>
            <Text style={styles.editProfileText}>Edit Hero Profile ⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* 1. PLAYER STATISTICS GRID (10 CARDS) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📊 Hero Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>⚡</Text>
              <Text style={styles.statMiniNum}>{hero.totalXP}</Text>
              <Text style={styles.statMiniLabel}>Total XP</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>⭐</Text>
              <Text style={styles.statMiniNum}>Lvl {hero.level}</Text>
              <Text style={styles.statMiniLabel}>Current Level</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>🪙</Text>
              <Text style={styles.statMiniNum}>{hero.coins}</Text>
              <Text style={styles.statMiniLabel}>Coins</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>🔥</Text>
              <Text style={styles.statMiniNum}>{hero.currentStreak} Days</Text>
              <Text style={styles.statMiniLabel}>Current Streak</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>🏆</Text>
              <Text style={styles.statMiniNum}>{hero.longestStreak} Days</Text>
              <Text style={styles.statMiniLabel}>Longest Streak</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>📜</Text>
              <Text style={styles.statMiniNum}>{detailedStats.totalQuestsCompleted || hero.totalQuestsCompleted}</Text>
              <Text style={styles.statMiniLabel}>Total Quests</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>☀️</Text>
              <Text style={styles.statMiniNum}>{detailedStats.dailyQuestsCompleted}</Text>
              <Text style={styles.statMiniLabel}>Daily Quests</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>🎯</Text>
              <Text style={styles.statMiniNum}>{detailedStats.customQuestsCompleted}</Text>
              <Text style={styles.statMiniLabel}>Custom Quests</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>🐉</Text>
              <Text style={styles.statMiniNum}>{detailedStats.bossesDefeated}</Text>
              <Text style={styles.statMiniLabel}>Bosses Defeated</Text>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniIcon}>🎖️</Text>
              <Text style={styles.statMiniNum}>{hero.unlockedAchievements.length}</Text>
              <Text style={styles.statMiniLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* 2. EQUIPPED LOADOUT SLOTS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🛡️ Active Gear Loadout</Text>
            <TouchableOpacity onPress={() => router.push("/inventory" as any)}>
              <Text style={styles.armoryLinkText}>Armory Vault →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slotsGrid}>
            {SLOTS.map((slotKey) => {
              const item = hero.equipment[slotKey];
              const slotInfo = SLOT_LABELS[slotKey];

              return (
                <View
                  key={slotKey}
                  style={[
                    styles.slotBox,
                    item && { borderColor: getRarityColor(item.rarity) },
                  ]}
                >
                  {item ? (
                    <View style={styles.slotFilled}>
                      <Text style={styles.slotIcon}>{item.icon}</Text>
                      <Text style={styles.slotName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.slotEmpty}>
                      <Text style={styles.slotEmptyIcon}>{slotInfo.icon}</Text>
                      <Text style={styles.slotEmptyLabel}>{slotInfo.title}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* 3. PROGRESS CARDS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📈 Progression Overview</Text>

          {/* Level Progress */}
          <View style={styles.progressBox}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Level {hero.level} → {hero.level + 1} Progress</Text>
              <Text style={styles.progressValue}>{currentXP} / {xpNeeded} XP ({xpProgress}%)</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${xpProgress}%`, backgroundColor: "#7C3AED" }]} />
            </View>
          </View>

          {/* Achievement Progress */}
          <View style={styles.progressBox}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Achievement Mastery</Text>
              <Text style={styles.progressValue}>{hero.unlockedAchievements.length} / {totalAchievementsCount} Unlocked ({achievementProgress}%)</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${achievementProgress}%`, backgroundColor: "#F59E0B" }]} />
            </View>
          </View>

          {/* Inventory Completion */}
          <View style={styles.progressBox}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Armory Collection</Text>
              <Text style={styles.progressValue}>{detailedStats.inventoryItemCount} / {totalCatalogItems} Items ({inventoryProgress}%)</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${inventoryProgress}%`, backgroundColor: "#3B82F6" }]} />
            </View>
          </View>
        </View>

        {/* 4. RECENT ACTIVITY SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⏱️ Recent Activity</Text>

          <Text style={styles.subSectionTitle}>📜 Last 5 Completed Quests</Text>
          {recentQuests.length === 0 ? (
            <Text style={styles.emptyText}>No recent quest activity recorded.</Text>
          ) : (
            recentQuests.map((item) => (
              <View key={item.id} style={styles.recentItemRow}>
                <Text style={styles.recentItemIcon}>{item.emoji || "📜"}</Text>
                <Text style={styles.recentItemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.recentItemTime}>{item.completedAt}</Text>
              </View>
            ))
          )}

          <View style={styles.divider} />

          <View style={styles.activityPairRow}>
            <View style={styles.activityPairBox}>
              <Text style={styles.subSectionTitle}>🎁 Last Unlocked Item</Text>
              {lastUnlockedItem ? (
                <View style={styles.recentBadgeBox}>
                  <Text style={styles.recentBadgeIcon}>{lastUnlockedItem.icon}</Text>
                  <Text style={styles.recentBadgeName} numberOfLines={1}>{lastUnlockedItem.name}</Text>
                  <Text style={[styles.rarityTag, { color: getRarityColor(lastUnlockedItem.rarity) }]}>
                    {lastUnlockedItem.rarity}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>None unlocked yet</Text>
              )}
            </View>

            <View style={styles.activityPairBox}>
              <Text style={styles.subSectionTitle}>🎖️ Last Achievement</Text>
              {lastAchievement ? (
                <View style={styles.recentBadgeBox}>
                  <Text style={styles.recentBadgeIcon}>{lastAchievement.emoji}</Text>
                  <Text style={styles.recentBadgeName} numberOfLines={1}>{lastAchievement.title}</Text>
                  <Text style={styles.rarityTag}>UNLOCKED</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>None unlocked yet</Text>
              )}
            </View>
          </View>
        </View>

        {/* HERO SKILLS PROGRESSION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>✨ Hero Skill Attributes</Text>

          <View style={styles.skillsGrid}>
            {SKILL_KEYS.map((key) => {
              const meta = SKILL_METADATA[key];
              const levelValue = hero.skills[key] || 1;
              const bon = (gearStats as any)[key] || 0;

              return (
                <View key={key} style={styles.skillBox}>
                  <Text style={styles.skillIcon}>{meta.emoji}</Text>
                  <Text style={styles.skillName}>{meta.name}</Text>
                  <Text style={styles.skillLevelText}>
                    Lvl {levelValue} {bon > 0 ? `(+${bon})` : ""}
                  </Text>
                </View>
              );
            })}
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
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: RPGTheme.colors.textPrimary,
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
  },

  // HERO PORTRAIT CARD
  heroPortraitCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.3)",
    marginBottom: 16,
  },
  portraitFrame: {
    position: "relative",
    marginBottom: 12,
  },
  levelBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  heroName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  heroClass: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  rankTag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  playerTitleBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  playerTitleText: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900",
  },
  editProfileButton: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editProfileText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  armoryLinkText: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "800",
  },

  // STATS GRID (10 CARDS)
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statMiniCard: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
  },
  statMiniIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  statMiniNum: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  statMiniLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  // SLOTS GRID
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotBox: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  slotFilled: {
    alignItems: "center",
  },
  slotIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  slotName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  slotEmpty: {
    alignItems: "center",
  },
  slotEmptyIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  slotEmptyLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  // PROGRESS CARDS
  progressBox: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  progressValue: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },

  // RECENT ACTIVITY
  subSectionTitle: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    gap: 8,
  },
  recentItemIcon: {
    fontSize: 16,
  },
  recentItemTitle: {
    flex: 1,
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  recentItemTime: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    marginVertical: 12,
  },
  activityPairRow: {
    flexDirection: "row",
    gap: 10,
  },
  activityPairBox: {
    flex: 1,
  },
  recentBadgeBox: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  recentBadgeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  recentBadgeName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  rarityTag: {
    color: "#F59E0B",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
  },
  emptyText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },

  // SKILLS GRID
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  skillBox: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  skillIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  skillName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  skillLevelText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});