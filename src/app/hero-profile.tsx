import { auth, db } from "@/lib/firebase";
import LevelService from "@/services/levelService";
import { router } from "expo-router";
import { collection, doc, onSnapshot, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import AvatarImage from "@/components/AvatarImage";

// ============================================
// TYPES
// ============================================

type HeroData = {
  heroName: string;
  email: string;
  class: string;
  level: number;
  xp: number;
  totalXP: number;
  coins: number;
  streak: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  createdAt?: any;
  equippedAvatar?: string;
  avatarUrl?: string | null;
  unlockedAchievements: string[];
};

type EquippedItemDetail = {
  name: string;
  icon: string;
  rarity: string;
  attack?: number;
  defense?: number;
};

type ActivityItem = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  time: string;
};

type AchievementBadge = {
  id: string;
  title: string;
  icon: string;
  description: string;
};

const ALL_ACHIEVEMENTS: AchievementBadge[] = [
  { id: "first-step", title: "First Step", icon: "🌱", description: "Completed your first quest" },
  { id: "rising-hero", title: "Rising Hero", icon: "⭐", description: "Reached Level 5" },
  { id: "quest-master", title: "Quest Master", icon: "⚔️", description: "Completed 25 total quests" },
  { id: "streak-3", title: "3-Day Warrior", icon: "🥉", description: "Maintained a 3-day streak" },
  { id: "streak-7", title: "7-Day Champion", icon: "🔥", description: "Maintained a 7-day streak" },
  { id: "streak-14", title: "14-Day Master", icon: "🥇", description: "Maintained a 14-day streak" },
  { id: "streak-30", title: "30-Day Legend", icon: "👑", description: "Maintained a 30-day streak" },
  { id: "boss-slayer", title: "Boss Slayer", icon: "🐉", description: "Defeated your first Realm Boss" },
  { id: "treasure-hunter", title: "Treasure Hunter", icon: "🎁", description: "Unlocked 10 inventory items" },
];

export function getHeroTitleByLevel(level: number): string {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Champion";
  if (level >= 10) return "Warrior";
  if (level >= 5) return "Adventurer";
  return "Rookie";
}

export function getRarityColorHex(rarity?: string): string {
  const r = (rarity || "").toLowerCase();
  if (r === "legendary") return "#F59E0B";
  if (r === "epic") return "#A855F7";
  if (r === "rare") return "#3B82F6";
  return "#64748B";
}

export default function HeroProfileDashboardScreen() {
  const [hero, setHero] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalRank, setGlobalRank] = useState<number>(1);

  // Equipped Gear Breakdown
  const [equippedGear, setEquippedGear] = useState<Record<string, EquippedItemDetail | null>>({
    weapon: null,
    helmet: null,
    armor: null,
    shield: null,
    boots: null,
    accessory: null,
  });

  // Lifetime Statistics Counters
  const [stats, setStats] = useState({
    totalQuestsCompleted: 0,
    dailyQuestsCompleted: 0,
    customQuestsCompleted: 0,
    bossesDefeated: 0,
    inventoryCount: 0,
  });

  // Recent Activities (Last 5 completed quests)
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // 1. User document listener
    const userRef = doc(db, "users", uid);
    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const unlockedAchievements = Array.isArray(data.unlockedAchievements)
          ? data.unlockedAchievements.map((id: any) => String(id))
          : [];

        const currentStreak = Number(data.currentStreak ?? data.streak ?? 1);
        const longestStreak = Number(data.longestStreak ?? currentStreak);

        setHero({
          heroName: data.heroName || "Hero of the Realm",
          email: data.email || auth.currentUser?.email || "",
          class: data.heroClass || data.class || "Paladin",
          level: data.level ?? 1,
          xp: data.xp ?? 0,
          totalXP: data.totalXP ?? 0,
          coins: data.coins ?? 0,
          streak: currentStreak,
          currentStreak,
          longestStreak,
          lastCompletedDate: data.lastCompletedDate || "",
          createdAt: data.createdAt,
          equippedAvatar: data.equippedAvatar || "warrior",
          avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
          unlockedAchievements,
        });
      }
      setLoading(false);
    });

    // 2. Global Rank Calculation
    const usersCol = collection(db, "users");
    getDocs(usersCol).then((usersSnap) => {
      const allUsers = usersSnap.docs.map((d) => ({
        id: d.id,
        totalXP: Number(d.data().totalXP ?? 0),
        currentStreak: Number(d.data().currentStreak ?? d.data().streak ?? 0),
      }));
      allUsers.sort((a, b) => {
        if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
        return b.currentStreak - a.currentStreak;
      });
      const myRank = allUsers.findIndex((u) => u.id === uid) + 1;
      setGlobalRank(myRank > 0 ? myRank : 1);
    }).catch((e) => console.error("Global rank calc error:", e));

    // 3. Inventory & Equipped Gear Listener
    const inventoryRef = collection(db, "users", uid, "inventory");
    const unsubInv = onSnapshot(inventoryRef, (snapshot) => {
      const gear: Record<string, EquippedItemDetail | null> = {
        weapon: null,
        helmet: null,
        armor: null,
        shield: null,
        boots: null,
        accessory: null,
      };

      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.equipped) {
          const itemDetail: EquippedItemDetail = {
            name: d.name || "Equipped Item",
            icon: d.icon || "🛡️",
            rarity: d.rarity || "Common",
            attack: Number(d.attack ?? 0),
            defense: Number(d.defense ?? 0),
          };

          const cat = (d.category || "").toLowerCase();
          const slot = (d.slot || "").toLowerCase();

          if (cat === "weapons" || cat === "weapon" || slot === "weapon") gear.weapon = itemDetail;
          else if (cat === "helmets" || cat === "helmet" || slot === "helmet") gear.helmet = itemDetail;
          else if (cat === "armor" || cat === "armors" || slot === "armor") gear.armor = itemDetail;
          else if (cat === "shields" || cat === "shield" || slot === "shield") gear.shield = itemDetail;
          else if (cat === "boots" || cat === "boot" || slot === "boots") gear.boots = itemDetail;
          else if (cat === "accessories" || cat === "accessory" || slot === "accessory") gear.accessory = itemDetail;
        }
      });

      setEquippedGear(gear);
      setStats((prev) => ({ ...prev, inventoryCount: snapshot.docs.length }));
    });

    // 4. Daily Quests Completed Listener
    const dailyRef = collection(db, "users", uid, "dailyQuests");
    const unsubDaily = onSnapshot(dailyRef, (snap) => {
      const count = snap.docs.filter((d) => d.data().completed === true).length;
      setStats((prev) => ({ ...prev, dailyQuestsCompleted: count }));
    });

    // 5. Custom Quests Completed Listener
    const customRef = collection(db, "users", uid, "quests");
    const unsubCustom = onSnapshot(customRef, (snap) => {
      const count = snap.docs.filter((d) => d.data().completed === true).length;
      setStats((prev) => ({ ...prev, customQuestsCompleted: count }));
    });

    // 6. Boss Victories Listener
    const bossRef = collection(db, "users", uid, "bossVictories");
    const unsubBoss = onSnapshot(bossRef, (snap) => {
      setStats((prev) => ({ ...prev, bossesDefeated: snap.docs.length }));
    });

    // 7. Quest History Listener (Last 5 completed quests)
    const historyRef = collection(db, "users", uid, "questHistory");
    const unsubHistory = onSnapshot(historyRef, (snap) => {
      const activityList: ActivityItem[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const xp = d.xpEarned ?? d.xp ?? 20;
        return {
          id: docSnap.id,
          icon: d.emoji || "⚔️",
          title: d.title || d.questTitle || "Completed Quest",
          detail: `+${xp} XP`,
          time: d.completedAt ? new Date(d.completedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today",
        };
      });

      setRecentActivities(activityList.slice(0, 5));
      setStats((prev) => ({
        ...prev,
        totalQuestsCompleted: snap.docs.length > 0 ? snap.docs.length : prev.totalQuestsCompleted,
      }));
    });

    return () => {
      unsubUser();
      unsubInv();
      unsubDaily();
      unsubCustom();
      unsubBoss();
      unsubHistory();
    };
  }, [uid]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Opening Hero Sanctuary...</Text>
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Hero Profile Not Found</Text>
      </View>
    );
  }

  // Derived Calculations
  const heroTitle = getHeroTitleByLevel(hero.level);
  const xpNeeded = LevelService.calculateXPForNextLevel(hero.level);
  const currentXP = hero.xp ?? (hero.totalXP % 100);
  const xpPct = Math.min(100, Math.max(0, Math.round((currentXP / xpNeeded) * 100)));

  // Compute Account Created Date
  let accountCreatedStr = "Recently";
  if (hero.createdAt) {
    const createdDate = hero.createdAt.seconds ? new Date(hero.createdAt.seconds * 1000) : new Date(hero.createdAt);
    accountCreatedStr = createdDate.toLocaleDateString();
  }

  // Recent 3 Unlocked Achievements
  const unlockedBadges = ALL_ACHIEVEMENTS.filter((ach) =>
    hero.unlockedAchievements.includes(ach.id)
  );
  const recent3Achievements = (unlockedBadges.length > 0 ? unlockedBadges : ALL_ACHIEVEMENTS.slice(0, 3)).slice(-3);

  return (
    <View style={styles.screen}>
      <RPGHeader title="👤 HERO PROFILE" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ====================================================
            SECTION 1: HERO IDENTITY
        ==================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>👤 Hero Identity</Text>
            
            {/* EDIT PROFILE BUTTON */}
            <TouchableOpacity
              style={styles.editProfileButton}
              activeOpacity={0.8}
              onPress={() => router.push("/edit-hero")}
            >
              <Text style={styles.editProfileButtonText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroIdentityBody}>
            <View style={styles.avatarContainer}>
              <AvatarImage avatarUrl={hero.avatarUrl} equippedAvatar={hero.equippedAvatar} size={84} />
            </View>

            <View style={styles.identityDetails}>
              <Text style={styles.heroNameText}>{hero.heroName}</Text>
              <View style={styles.titlePill}>
                <Text style={styles.titlePillText}>👑 {heroTitle}</Text>
              </View>
              <Text style={styles.identitySubText}>⚔ Class: <Text style={styles.whiteHighlight}>{hero.class}</Text></Text>
              <Text style={styles.identitySubText}>📅 Join Date: <Text style={styles.whiteHighlight}>{accountCreatedStr}</Text></Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            SECTION 2: HERO PROGRESS
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📈 Hero Progress</Text>

          {/* Level & XP Progress Bar */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeaderRow}>
              <Text style={styles.levelBadge}>Level {hero.level}</Text>
              <Text style={styles.xpText}>{currentXP} / {xpNeeded} XP ({xpPct}%)</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
            </View>
          </View>

          {/* Progress Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statVal}>{hero.totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🪙</Text>
              <Text style={styles.statVal}>{hero.coins}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statVal}>{hero.currentStreak}d</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statVal}>{hero.longestStreak}d</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>

            <View style={[styles.statBox, { width: "100%" }]}>
              <Text style={styles.statIcon}>🏅</Text>
              <Text style={styles.statVal}>#{globalRank}</Text>
              <Text style={styles.statLabel}>Global Rank</Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            SECTION 3: LIFETIME STATISTICS
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📊 Lifetime Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>📜</Text>
              <Text style={styles.statVal}>{stats.totalQuestsCompleted}</Text>
              <Text style={styles.statLabel}>Total Quests</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>☀️</Text>
              <Text style={styles.statVal}>{stats.dailyQuestsCompleted}</Text>
              <Text style={styles.statLabel}>Daily Quests</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statVal}>{stats.customQuestsCompleted}</Text>
              <Text style={styles.statLabel}>Custom Quests</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🐉</Text>
              <Text style={styles.statVal}>{stats.bossesDefeated}</Text>
              <Text style={styles.statLabel}>Bosses Defeated</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🎖️</Text>
              <Text style={styles.statVal}>{hero.unlockedAchievements.length}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🎒</Text>
              <Text style={styles.statVal}>{stats.inventoryCount}</Text>
              <Text style={styles.statLabel}>Inventory Items</Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            SECTION 4: EQUIPPED GEAR
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛡️ Equipped Gear</Text>

          <View style={styles.gearGrid}>
            {(["weapon", "helmet", "armor", "shield", "boots", "accessory"] as const).map((slotKey) => {
              const item = equippedGear[slotKey];
              const rarityColor = getRarityColorHex(item?.rarity);

              return (
                <View key={slotKey} style={[styles.gearCard, { borderColor: rarityColor }]}>
                  <Text style={styles.gearSlotLabel}>{slotKey.toUpperCase()}</Text>
                  <Text style={styles.gearIcon}>{item?.icon || "📦"}</Text>
                  <Text style={styles.gearName} numberOfLines={1}>{item?.name || "Empty Slot"}</Text>

                  {item ? (
                    <View style={[styles.rarityPill, { backgroundColor: rarityColor }]}>
                      <Text style={styles.rarityPillText}>{item.rarity.toUpperCase()}</Text>
                    </View>
                  ) : (
                    <Text style={styles.gearEmptyText}>Unequipped</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ====================================================
            SECTION 5: RECENT ACTIVITY (LAST 5 COMPLETED QUESTS)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⏱ Recent Activity (Last 5 Completed Quests)</Text>

          {recentActivities.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity logged yet.</Text>
          ) : (
            recentActivities.map((act) => (
              <View key={act.id} style={styles.actRow}>
                <Text style={styles.actIcon}>{act.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>{act.title}</Text>
                  <Text style={styles.actDetail}>{act.detail}</Text>
                </View>
                <Text style={styles.actTime}>{act.time}</Text>
              </View>
            ))
          )}
        </View>

        {/* ====================================================
            SECTION 6: RECENT ACHIEVEMENTS (LAST 3 UNLOCKED)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🏅 Recent Achievements (Last 3 Unlocked)</Text>

          <View style={styles.recentAchievementsList}>
            {recent3Achievements.map((ach) => (
              <View key={ach.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{ach.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementTitle}>{ach.title}</Text>
                  <Text style={styles.achievementSub}>{ach.description}</Text>
                </View>
                <View style={styles.unlockedPill}>
                  <Text style={styles.unlockedPillText}>UNLOCKED</Text>
                </View>
              </View>
            ))}
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
    color: RPGTheme.colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  errorEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 16,
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
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  editProfileButton: {
    backgroundColor: "rgba(124, 58, 237, 0.3)",
    borderColor: "#7C3AED",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editProfileButtonText: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "900",
  },
  heroIdentityBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  identityDetails: {
    flex: 1,
  },
  heroNameText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  titlePill: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginVertical: 4,
  },
  titlePillText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
  },
  identitySubText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  whiteHighlight: {
    color: RPGTheme.colors.textPrimary,
    fontWeight: "800",
  },
  xpCard: {
    marginBottom: 14,
  },
  xpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  levelBadge: {
    color: RPGTheme.colors.purplePrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  xpText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  xpTrack: {
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 5,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 12,
    alignItems: "center",
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statVal: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  statLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },
  gearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gearCard: {
    width: "31%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
  },
  gearSlotLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gearIcon: {
    fontSize: 24,
    marginVertical: 4,
  },
  gearName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  gearEmptyText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontStyle: "italic",
    marginTop: 4,
  },
  rarityPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  rarityPillText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  recentAchievementsList: {
    gap: 10,
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 10,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  achievementSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  unlockedPill: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unlockedPillText: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "900",
  },
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    padding: 10,
    gap: 10,
    marginBottom: 8,
  },
  actIcon: {
    fontSize: 18,
  },
  actTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  actDetail: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "700",
  },
  actTime: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
  },
  emptyText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },
});
