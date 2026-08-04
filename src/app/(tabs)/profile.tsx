import { auth, db } from "@/lib/firebase";
import LevelService from "@/services/levelService";
import ProfileService from "@/services/profileService";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";

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
  avatar: string;
  equippedAvatar?: string;
  avatarUrl?: string | null;
  completedQuests: string[];
  totalQuestsCompleted: number;
  unlockedAchievements: string[];
};

type RecentQuestItem = {
  id: string;
  title: string;
  emoji?: string;
  completedAt?: string;
};

type EquippedItemSummary = {
  name: string;
  icon: string;
  rarity: string;
};

// ============================================
// HELPER: PLAYER TITLE BASED ON LEVEL
// Level 1–4 → Rookie
// Level 5–9 → Adventurer
// Level 10–14 → Warrior
// Level 15–19 → Champion
// Level 20+ → Legend
// ============================================
export function getPlayerTitle(level: number): string {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Champion";
  if (level >= 10) return "Warrior";
  if (level >= 5) return "Adventurer";
  return "Rookie";
}

export function getRarityColor(rarity?: string): string {
  const r = (rarity || "").toLowerCase();
  if (r === "legendary") return "#F59E0B";
  if (r === "epic") return "#A855F7";
  if (r === "rare") return "#3B82F6";
  return "#64748B";
}

// ============================================
// PROFILE SCREEN
// ============================================

export default function ProfileScreen() {
  const [hero, setHero] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Character Stats from Equipped Items
  const [charStats, setCharStats] = useState({
    attack: 0,
    defense: 0,
    intelligence: 0,
    vitality: 0,
    speed: 0,
  });

  // Equipped Items per Category
  const [equippedSlots, setEquippedSlots] = useState<{
    weapon: EquippedItemSummary | null;
    armor: EquippedItemSummary | null;
    helmet: EquippedItemSummary | null;
    shield: EquippedItemSummary | null;
    boots: EquippedItemSummary | null;
    accessory: EquippedItemSummary | null;
  }>({
    weapon: null,
    armor: null,
    helmet: null,
    shield: null,
    boots: null,
    accessory: null,
  });

  // Real-time Detailed Player Statistics
  const [detailedStats, setDetailedStats] = useState({
    totalQuestsCompleted: 0,
    dailyQuestsCompleted: 0,
    customQuestsCompleted: 0,
    bossesDefeated: 0,
    achievementsUnlocked: 0,
    inventoryItemCount: 0,
  });

  // Recent Activity Data
  const [recentQuests, setRecentQuests] = useState<RecentQuestItem[]>([]);
  const [lastUnlockedItem, setLastUnlockedItem] = useState<EquippedItemSummary | null>(null);
  const [lastAchievement, setLastAchievement] = useState<{ title: string; emoji: string } | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Auto-populate missing fields if any without overwriting existing data
    ProfileService.getProfile(user.uid);

    // 1. Subscribe to users/{uid} document
    const userRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          const completedQuests = Array.isArray(data.completedQuests)
            ? data.completedQuests.map((id: unknown) => String(id))
            : [];

          const unlockedAchievements = Array.isArray(data.unlockedAchievements)
            ? data.unlockedAchievements.map((id: unknown) => String(id))
            : [];

          const currentStreak = Number(data.currentStreak ?? data.streak ?? 0);
          const longestStreak = Number(data.longestStreak ?? currentStreak);
          const lastCompletedDate = String(data.lastCompletedDate || "");

          setHero({
            heroName: data.heroName || "Paladin Adventurer",
            email: data.email || user.email || "",
            class: data.heroClass || data.class || "warrior",
            level: data.level ?? 1,
            xp: data.xp ?? 0,
            totalXP: data.totalXP ?? 0,
            coins: data.coins ?? 50,
            streak: currentStreak,
            currentStreak,
            longestStreak,
            lastCompletedDate,
            avatar: data.avatar || data.equippedAvatar || "avatar_knight_01",
            equippedAvatar: data.equippedAvatar || "warrior",
            avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
            completedQuests,
            totalQuestsCompleted: data.totalQuestsCompleted ?? completedQuests.length,
            unlockedAchievements,
          });

          // Last achievement formatting
          if (unlockedAchievements.length > 0) {
            const lastAchId = unlockedAchievements[unlockedAchievements.length - 1];
            setLastAchievement({
              title: lastAchId.replace(/_/g, " ").toUpperCase(),
              emoji: "🏆",
            });
          }
        } else {
          setHero(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("PROFILE FIRESTORE ERROR:", error);
        setLoading(false);
      }
    );

    // 2. Subscribe to users/{uid}/inventory
    const inventoryRef = collection(db, "users", user.uid, "inventory");
    const unsubInventory = onSnapshot(inventoryRef, (snapshot) => {
      const stats = { attack: 0, defense: 0, intelligence: 0, vitality: 0, speed: 0 };
      const eq = {
        weapon: null as EquippedItemSummary | null,
        armor: null as EquippedItemSummary | null,
        helmet: null as EquippedItemSummary | null,
        shield: null as EquippedItemSummary | null,
        boots: null as EquippedItemSummary | null,
        accessory: null as EquippedItemSummary | null,
      };
      let lastItem: EquippedItemSummary | null = null;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const itemSummary: EquippedItemSummary = {
          name: data.name || "Equipment Item",
          icon: data.icon || "🛡️",
          rarity: data.rarity || "Common",
        };
        lastItem = itemSummary;

        if (data.equipped) {
          stats.attack += Number(data.attack ?? 0);
          stats.defense += Number(data.defense ?? 0);
          stats.intelligence += Number(data.intelligence ?? 0);
          stats.vitality += Number(data.vitality ?? 0);
          stats.speed += Number(data.speed ?? 0);

          const cat = (data.category || "").toLowerCase();
          const slot = (data.slot || "").toLowerCase();

          if (cat === "weapons" || cat === "weapon" || slot === "weapon") eq.weapon = itemSummary;
          else if (cat === "armor" || cat === "armors" || slot === "armor") eq.armor = itemSummary;
          else if (cat === "helmets" || cat === "helmet" || slot === "helmet") eq.helmet = itemSummary;
          else if (cat === "shields" || cat === "shield" || slot === "shield") eq.shield = itemSummary;
          else if (cat === "boots" || cat === "boot" || slot === "boots") eq.boots = itemSummary;
          else if (cat === "accessories" || cat === "accessory" || slot === "accessory") eq.accessory = itemSummary;
        }
      });

      setCharStats(stats);
      setEquippedSlots(eq);
      if (lastItem) setLastUnlockedItem(lastItem);

      setDetailedStats((prev) => ({
        ...prev,
        inventoryItemCount: snapshot.docs.length,
      }));
    });

    // 3. Subscribe to Daily Quests count
    const dailyQuestsRef = collection(db, "users", user.uid, "dailyQuests");
    const unsubDaily = onSnapshot(dailyQuestsRef, (snap) => {
      const completedCount = snap.docs.filter((d) => d.data().completed === true).length;
      setDetailedStats((prev) => ({
        ...prev,
        dailyQuestsCompleted: completedCount,
      }));
    });

    // 4. Subscribe to Custom Quests count
    const customQuestsRef = collection(db, "users", user.uid, "customQuests");
    const unsubCustom = onSnapshot(customQuestsRef, (snap) => {
      const completedCount = snap.docs.filter((d) => d.data().completed === true).length;
      setDetailedStats((prev) => ({
        ...prev,
        customQuestsCompleted: completedCount,
      }));
    });

    // 5. Subscribe to Boss Victories
    const bossRef = collection(db, "users", user.uid, "bossVictories");
    const unsubBoss = onSnapshot(bossRef, (snap) => {
      setDetailedStats((prev) => ({
        ...prev,
        bossesDefeated: snap.docs.length,
      }));
    });

    // 6. Subscribe to Quest History (Last 5 completed quests)
    const historyRef = collection(db, "users", user.uid, "questHistory");
    const unsubHistory = onSnapshot(historyRef, (snap) => {
      const questsList: RecentQuestItem[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          title: d.title || d.questTitle || "Completed Mission",
          emoji: d.emoji || "📜",
          completedAt: d.completedAt ? new Date(d.completedAt.seconds * 1000).toLocaleDateString() : "Recently",
        };
      });

      setRecentQuests(questsList.slice(0, 5));
      setDetailedStats((prev) => ({
        ...prev,
        totalQuestsCompleted: snap.docs.length > 0 ? snap.docs.length : prev.totalQuestsCompleted,
      }));
    });

    return () => {
      unsubscribeUser();
      unsubInventory();
      unsubDaily();
      unsubCustom();
      unsubBoss();
      unsubHistory();
    };
  }, []);

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        setLoggingOut(true);
        await signOut(auth);
        router.replace("/login");
      } catch (err: any) {
        Alert.alert("Logout Error", err?.message || "Failed to log out.");
      } finally {
        setLoggingOut(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to log out?")) doLogout();
    } else {
      Alert.alert("Log Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Opening Hero Records...</Text>
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculations for level titles & progress
  const title = getPlayerTitle(hero.level);
  const xpNeeded = LevelService.calculateXPForNextLevel(hero.level);
  const currentXP = hero.xp ?? (hero.totalXP % 100);
  const xpProgress = Math.min(100, Math.max(0, Math.round((currentXP / xpNeeded) * 100)));
  const totalAchievementsCount = 12;
  const achievementProgress = Math.min(100, Math.round((hero.unlockedAchievements.length / totalAchievementsCount) * 100));
  const totalCatalogItems = 30;
  const inventoryProgress = Math.min(100, Math.round((detailedStats.inventoryItemCount / totalCatalogItems) * 100));

  return (
    <View style={styles.screen}>
      <RPGHeader title="👤 Player Profile" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* HERO PORTRAIT & TITLE CARD */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrapper}>
            <AvatarImage avatarUrl={hero.avatarUrl} equippedAvatar={hero.equippedAvatar} size={88} />
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>{title.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.heroNameText}>{hero.heroName}</Text>
          <Text style={styles.heroEmailText}>{hero.email}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.heroClassBadge}>
              <Text style={styles.heroClassText}>🛡️ Level {hero.level} {hero.class}</Text>
            </View>
            <View style={styles.heroTitleBadge}>
              <Text style={styles.heroTitleText}>👑 Title: {title}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push("/edit-hero" as any)}>
            <Text style={styles.editProfileBtnText}>Edit Hero Profile ⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* 1. PLAYER STATISTICS GRID (10 CARDS) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📊 Player Statistics</Text>

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

        {/* 2. EQUIPPED GEAR DISPLAY (6 SLOTS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🛡️ Equipped Equipment</Text>
            <TouchableOpacity onPress={() => router.push("/inventory" as any)}>
              <Text style={styles.linkText}>Inventory →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.equippedGrid}>
            {/* Weapon */}
            <View style={[styles.equippedSlotBox, { borderColor: getRarityColor(equippedSlots.weapon?.rarity) }]}>
              <Text style={styles.slotLabel}>Weapon</Text>
              <Text style={styles.slotIcon}>{equippedSlots.weapon?.icon || "🗡️"}</Text>
              <Text style={styles.slotName} numberOfLines={1}>
                {equippedSlots.weapon?.name || "No Weapon"}
              </Text>
            </View>

            {/* Armor */}
            <View style={[styles.equippedSlotBox, { borderColor: getRarityColor(equippedSlots.armor?.rarity) }]}>
              <Text style={styles.slotLabel}>Armor</Text>
              <Text style={styles.slotIcon}>{equippedSlots.armor?.icon || "🥋"}</Text>
              <Text style={styles.slotName} numberOfLines={1}>
                {equippedSlots.armor?.name || "No Armor"}
              </Text>
            </View>

            {/* Helmet */}
            <View style={[styles.equippedSlotBox, { borderColor: getRarityColor(equippedSlots.helmet?.rarity) }]}>
              <Text style={styles.slotLabel}>Helmet</Text>
              <Text style={styles.slotIcon}>{equippedSlots.helmet?.icon || "🪖"}</Text>
              <Text style={styles.slotName} numberOfLines={1}>
                {equippedSlots.helmet?.name || "No Helmet"}
              </Text>
            </View>

            {/* Shield */}
            <View style={[styles.equippedSlotBox, { borderColor: getRarityColor(equippedSlots.shield?.rarity) }]}>
              <Text style={styles.slotLabel}>Shield</Text>
              <Text style={styles.slotIcon}>{equippedSlots.shield?.icon || "🛡️"}</Text>
              <Text style={styles.slotName} numberOfLines={1}>
                {equippedSlots.shield?.name || "No Shield"}
              </Text>
            </View>

            {/* Boots */}
            <View style={[styles.equippedSlotBox, { borderColor: getRarityColor(equippedSlots.boots?.rarity) }]}>
              <Text style={styles.slotLabel}>Boots</Text>
              <Text style={styles.slotIcon}>{equippedSlots.boots?.icon || "👢"}</Text>
              <Text style={styles.slotName} numberOfLines={1}>
                {equippedSlots.boots?.name || "No Boots"}
              </Text>
            </View>

            {/* Accessory */}
            <View style={[styles.equippedSlotBox, { borderColor: getRarityColor(equippedSlots.accessory?.rarity) }]}>
              <Text style={styles.slotLabel}>Accessory</Text>
              <Text style={styles.slotIcon}>{equippedSlots.accessory?.icon || "💍"}</Text>
              <Text style={styles.slotName} numberOfLines={1}>
                {equippedSlots.accessory?.name || "No Accessory"}
              </Text>
            </View>
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

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} disabled={loggingOut} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{loggingOut ? "Signing Out..." : "Sign Out of Citadel 🚪"}</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  loadingText: {
    color: RPGTheme.colors.textPrimary,
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 16,
  },

  // PROFILE HEADER
  profileHeaderCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.3)",
    marginBottom: 16,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  titleBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#A78BFA",
  },
  titleBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroNameText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  heroEmailText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  heroClassBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    borderColor: "#7C3AED",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroClassText: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
  },
  heroTitleBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroTitleText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "800",
  },
  editProfileBtn: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editProfileBtnText: {
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
  sectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  linkText: {
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

  // EQUIPPED GRID
  equippedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  equippedSlotBox: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  slotLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  slotIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  slotName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
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

  // LOGOUT BUTTON
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  logoutBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "900",
  },
});