import { auth, db } from "@/lib/firebase";
import LevelService from "@/services/levelService";
import { router } from "expo-router";
import { collection, doc, onSnapshot, query, orderBy, limit, getDocs } from "firebase/firestore";
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
  intelligence?: number;
  vitality?: number;
  speed?: number;
};

type ActivityItem = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  time: string;
};

type BadgeItem = {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
};

// ============================================
// SYSTEM BADGES DEFINITION
// ============================================
const ALL_BADGES: BadgeItem[] = [
  { id: "first-step", title: "First Step", icon: "🌱", unlocked: false },
  { id: "rising-hero", title: "Rising Hero", icon: "⭐", unlocked: false },
  { id: "quest-master", title: "Quest Master", icon: "⚔️", unlocked: false },
  { id: "streak-7", title: "Streak Flame", icon: "🔥", unlocked: false },
  { id: "streak-30", title: "30-Day Legend", icon: "👑", unlocked: false },
  { id: "streak-100", title: "100-Day Mythic", icon: "🛡️", unlocked: false },
  { id: "boss-slayer", title: "Boss Slayer", icon: "🐉", unlocked: false },
  { id: "treasure-hunter", title: "Treasure Hunter", icon: "🎁", unlocked: false },
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

  // Character Stats (Sum of equipped items)
  const [charStats, setCharStats] = useState({
    attack: 0,
    defense: 0,
    intelligence: 0,
    vitality: 0,
    speed: 0,
  });

  // Equipped Gear Breakdown
  const [equippedGear, setEquippedGear] = useState<Record<string, EquippedItemDetail | null>>({
    weapon: null,
    armor: null,
    helmet: null,
    shield: null,
    boots: null,
    accessory: null,
  });

  // Progression Counters
  const [progression, setProgression] = useState({
    totalQuestsCompleted: 0,
    dailyQuestsCompleted: 0,
    customQuestsCompleted: 0,
    bossesDefeated: 0,
    achievementsUnlocked: 0,
    inventoryItemCount: 0,
  });

  // Latest 10 Activities Stream
  const [activities, setActivities] = useState<ActivityItem[]>([]);

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

    // 2. Calculate Global Rank by querying users sorted by totalXP
    const usersCol = collection(db, "users");
    getDocs(usersCol).then((usersSnap) => {
      const allUsers = usersSnap.docs.map((d) => ({
        id: d.id,
        totalXP: Number(d.data().totalXP ?? 0),
      }));
      allUsers.sort((a, b) => b.totalXP - a.totalXP);
      const myRank = allUsers.findIndex((u) => u.id === uid) + 1;
      setGlobalRank(myRank > 0 ? myRank : 1);
    }).catch((e) => console.error("Global rank calc error:", e));

    // 3. Inventory & Equipped Stats Listener
    const inventoryRef = collection(db, "users", uid, "inventory");
    const unsubInv = onSnapshot(inventoryRef, (snapshot) => {
      const stats = { attack: 0, defense: 0, intelligence: 0, vitality: 0, speed: 0 };
      const gear: Record<string, EquippedItemDetail | null> = {
        weapon: null,
        armor: null,
        helmet: null,
        shield: null,
        boots: null,
        accessory: null,
      };

      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.equipped) {
          const atk = Number(d.attack ?? 0);
          const def = Number(d.defense ?? 0);
          const intel = Number(d.intelligence ?? 0);
          const vit = Number(d.vitality ?? 0);
          const spd = Number(d.speed ?? 0);

          stats.attack += atk;
          stats.defense += def;
          stats.intelligence += intel;
          stats.vitality += vit;
          stats.speed += spd;

          const itemDetail: EquippedItemDetail = {
            name: d.name || "Equipped Item",
            icon: d.icon || "🛡️",
            rarity: d.rarity || "Common",
            attack: atk,
            defense: def,
            intelligence: intel,
            vitality: vit,
            speed: spd,
          };

          const cat = (d.category || "").toLowerCase();
          const slot = (d.slot || "").toLowerCase();

          if (cat === "weapons" || cat === "weapon" || slot === "weapon") gear.weapon = itemDetail;
          else if (cat === "armor" || cat === "armors" || slot === "armor") gear.armor = itemDetail;
          else if (cat === "helmets" || cat === "helmet" || slot === "helmet") gear.helmet = itemDetail;
          else if (cat === "shields" || cat === "shield" || slot === "shield") gear.shield = itemDetail;
          else if (cat === "boots" || cat === "boot" || slot === "boots") gear.boots = itemDetail;
          else if (cat === "accessories" || cat === "accessory" || slot === "accessory") gear.accessory = itemDetail;
        }
      });

      setCharStats(stats);
      setEquippedGear(gear);
      setProgression((prev) => ({ ...prev, inventoryItemCount: snapshot.docs.length }));
    });

    // 4. Daily Quests Listener
    const dailyRef = collection(db, "users", uid, "dailyQuests");
    const unsubDaily = onSnapshot(dailyRef, (snap) => {
      const count = snap.docs.filter((d) => d.data().completed === true).length;
      setProgression((prev) => ({ ...prev, dailyQuestsCompleted: count }));
    });

    // 5. Custom Quests Listener
    const customRef = collection(db, "users", uid, "customQuests");
    const unsubCustom = onSnapshot(customRef, (snap) => {
      const count = snap.docs.filter((d) => d.data().completed === true).length;
      setProgression((prev) => ({ ...prev, customQuestsCompleted: count }));
    });

    // 6. Boss Victories Listener
    const bossRef = collection(db, "users", uid, "bossVictories");
    const unsubBoss = onSnapshot(bossRef, (snap) => {
      setProgression((prev) => ({ ...prev, bossesDefeated: snap.docs.length }));
    });

    // 7. Quest History Listener for Recent 10 Activities
    const historyRef = collection(db, "users", uid, "questHistory");
    const unsubHistory = onSnapshot(historyRef, (snap) => {
      const activityList: ActivityItem[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const xp = d.xpEarned ?? d.xp ?? 20;
        return {
          id: docSnap.id,
          icon: d.emoji || "✔",
          title: d.title || d.questTitle || "Completed Quest",
          detail: `+${xp} XP`,
          time: d.completedAt ? new Date(d.completedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today",
        };
      });

      setActivities(activityList.slice(0, 10));
      setProgression((prev) => ({
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

  // Progression Percentages
  const questPct = Math.min(100, Math.round((progression.totalQuestsCompleted / 50) * 100));
  const dailyPct = Math.min(100, Math.round((progression.dailyQuestsCompleted / 20) * 100));
  const customPct = Math.min(100, Math.round((progression.customQuestsCompleted / 10) * 100));
  const bossPct = Math.min(100, Math.round((progression.bossesDefeated / 5) * 100));
  const achPct = Math.min(100, Math.round((hero.unlockedAchievements.length / 12) * 100));
  const invPct = Math.min(100, Math.round((progression.inventoryItemCount / 30) * 100));

  // Compute Account Created Date
  let accountCreatedStr = "Recently";
  let daysActive = 1;
  if (hero.createdAt) {
    const createdDate = hero.createdAt.seconds ? new Date(hero.createdAt.seconds * 1000) : new Date(hero.createdAt);
    accountCreatedStr = createdDate.toLocaleDateString();
    daysActive = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="⚔ HERO PROFILE" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ====================================================
            TOP PLAYER RANK CARD BANNER
        ==================================================== */}
        <View style={styles.rankBannerCard}>
          <View style={styles.rankBannerHeader}>
            <Text style={styles.rankBannerTitle}>⚔ HERO PROFILE</Text>
          </View>
          <View style={styles.rankBannerContent}>
            <View style={styles.rankBannerRow}>
              <Text style={styles.rankBannerText}>👤 <Text style={styles.rankHighlight}>{hero.heroName}</Text></Text>
              <Text style={styles.rankBannerText}>🏅 <Text style={styles.rankHighlight}>{heroTitle}</Text></Text>
            </View>
            <View style={styles.rankBannerRow}>
              <Text style={styles.rankBannerText}>⭐ Level <Text style={styles.rankHighlight}>{hero.level}</Text></Text>
              <Text style={styles.rankBannerText}>🏆 Global Rank <Text style={styles.rankHighlight}>#{globalRank}</Text></Text>
            </View>
            <View style={styles.rankBannerRow}>
              <Text style={styles.rankBannerText}>🔥 <Text style={styles.rankHighlight}>{hero.currentStreak} Day Streak</Text></Text>
              <Text style={styles.rankBannerText}>⚡ <Text style={styles.rankHighlight}>{hero.totalXP} XP</Text></Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            1. HERO CARD
        ==================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.heroCardTop}>
            <View style={styles.avatarBox}>
              <AvatarImage avatarUrl={hero.avatarUrl} equippedAvatar={hero.equippedAvatar} size={80} />
            </View>

            <View style={styles.heroInfoBox}>
              <Text style={styles.heroUsername}>{hero.heroName}</Text>
              <View style={styles.titleTag}>
                <Text style={styles.titleTagText}>👑 {heroTitle}</Text>
              </View>
              <Text style={styles.heroClassSub}>Level {hero.level} {hero.class}</Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpBox}>
            <View style={styles.xpLabelRow}>
              <Text style={styles.xpLabel}>Current XP</Text>
              <Text style={styles.xpVal}>{currentXP} / {xpNeeded} XP ({xpPct}%)</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
            </View>
          </View>

          {/* Coins & Streak Stats */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatIcon}>🪙</Text>
              <Text style={styles.heroStatNum}>{hero.coins}</Text>
              <Text style={styles.heroStatLabel}>Coins</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatIcon}>🔥</Text>
              <Text style={styles.heroStatNum}>{hero.currentStreak} Days</Text>
              <Text style={styles.heroStatLabel}>Current Streak</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatIcon}>🏆</Text>
              <Text style={styles.heroStatNum}>{hero.longestStreak} Days</Text>
              <Text style={styles.heroStatLabel}>Longest Streak</Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            2. CHARACTER STATS (AUTO-UPDATED FROM EQUIPPED GEAR)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚔ Character Stats</Text>
          <Text style={styles.sectionSub}>Calculated live from your equipped equipment</Text>

          <View style={styles.statsStripGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⚔</Text>
              <Text style={styles.statVal}>{charStats.attack}</Text>
              <Text style={styles.statName}>Attack</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🛡</Text>
              <Text style={styles.statVal}>{charStats.defense}</Text>
              <Text style={styles.statName}>Defense</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🧠</Text>
              <Text style={styles.statVal}>{charStats.intelligence}</Text>
              <Text style={styles.statName}>Intelligence</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statVal}>{charStats.vitality}</Text>
              <Text style={styles.statName}>Vitality</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statVal}>{charStats.speed}</Text>
              <Text style={styles.statName}>Speed</Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            3. EQUIPMENT (SHOWS ITEM ICON, RARITY & STATS)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛡 Equipment Loadout</Text>

          <View style={styles.equipmentGrid}>
            {(["weapon", "armor", "helmet", "shield", "boots", "accessory"] as const).map((slotKey) => {
              const item = equippedGear[slotKey];
              const rarityColor = getRarityColorHex(item?.rarity);

              return (
                <View key={slotKey} style={[styles.equipCard, { borderColor: rarityColor }]}>
                  <Text style={styles.equipSlotLabel}>{slotKey.toUpperCase()}</Text>
                  <Text style={styles.equipIcon}>{item?.icon || "📦"}</Text>
                  <Text style={styles.equipName} numberOfLines={1}>{item?.name || "Empty Slot"}</Text>

                  {item ? (
                    <>
                      <View style={[styles.rarityPill, { backgroundColor: rarityColor }]}>
                        <Text style={styles.rarityPillText}>{item.rarity.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.equipStatSub}>
                        {item.attack ? `⚔+${item.attack} ` : ""}
                        {item.defense ? `🛡+${item.defense} ` : ""}
                        {item.vitality ? `❤️+${item.vitality}` : ""}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.equipEmptyText}>Unequipped</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ====================================================
            4. PROGRESSION (ANIMATED PROGRESS BARS)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📊 Progression Milestones</Text>

          {/* Total Quests */}
          <View style={styles.progRow}>
            <View style={styles.progHeader}>
              <Text style={styles.progTitle}>📜 Total Quests Completed</Text>
              <Text style={styles.progVal}>{progression.totalQuestsCompleted} / 50 ({questPct}%)</Text>
            </View>
            <View style={styles.progTrack}><View style={[styles.progFill, { width: `${questPct}%`, backgroundColor: "#7C3AED" }]} /></View>
          </View>

          {/* Daily Quests */}
          <View style={styles.progRow}>
            <View style={styles.progHeader}>
              <Text style={styles.progTitle}>☀️ Daily Quests</Text>
              <Text style={styles.progVal}>{progression.dailyQuestsCompleted} / 20 ({dailyPct}%)</Text>
            </View>
            <View style={styles.progTrack}><View style={[styles.progFill, { width: `${dailyPct}%`, backgroundColor: "#3B82F6" }]} /></View>
          </View>

          {/* Custom Quests */}
          <View style={styles.progRow}>
            <View style={styles.progHeader}>
              <Text style={styles.progTitle}>🎯 Custom Quests</Text>
              <Text style={styles.progVal}>{progression.customQuestsCompleted} / 10 ({customPct}%)</Text>
            </View>
            <View style={styles.progTrack}><View style={[styles.progFill, { width: `${customPct}%`, backgroundColor: "#10B981" }]} /></View>
          </View>

          {/* Bosses Defeated */}
          <View style={styles.progRow}>
            <View style={styles.progHeader}>
              <Text style={styles.progTitle}>🐉 Bosses Defeated</Text>
              <Text style={styles.progVal}>{progression.bossesDefeated} / 5 ({bossPct}%)</Text>
            </View>
            <View style={styles.progTrack}><View style={[styles.progFill, { width: `${bossPct}%`, backgroundColor: "#EF4444" }]} /></View>
          </View>

          {/* Achievements Unlocked */}
          <View style={styles.progRow}>
            <View style={styles.progHeader}>
              <Text style={styles.progTitle}>🎖️ Achievements Unlocked</Text>
              <Text style={styles.progVal}>{hero.unlockedAchievements.length} / 12 ({achPct}%)</Text>
            </View>
            <View style={styles.progTrack}><View style={[styles.progFill, { width: `${achPct}%`, backgroundColor: "#F59E0B" }]} /></View>
          </View>

          {/* Inventory Completion */}
          <View style={styles.progRow}>
            <View style={styles.progHeader}>
              <Text style={styles.progTitle}>🎒 Inventory Completion</Text>
              <Text style={styles.progVal}>{progression.inventoryItemCount} / 30 ({invPct}%)</Text>
            </View>
            <View style={styles.progTrack}><View style={[styles.progFill, { width: `${invPct}%`, backgroundColor: "#8B5CF6" }]} /></View>
          </View>
        </View>

        {/* ====================================================
            5. RECENT ACTIVITY (LATEST 10 ACTIVITIES)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⏱ Recent Activity (Latest 10)</Text>

          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity logged yet.</Text>
          ) : (
            activities.map((act) => (
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
            6. BADGES (ALL SYSTEM BADGES, GREYED OUT IF LOCKED)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🏅 Earned Badges</Text>

          <View style={styles.badgesGrid}>
            {ALL_BADGES.map((badge) => {
              const isUnlocked = hero.unlockedAchievements.includes(badge.id);

              return (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeCard,
                    !isUnlocked && styles.badgeLocked,
                  ]}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
                  <Text style={isUnlocked ? styles.badgeStatusUnlocked : styles.badgeStatusLocked}>
                    {isUnlocked ? "UNLOCKED" : "LOCKED"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ====================================================
            7. ADVENTURE PROGRESS
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🗺 Adventure Progress</Text>

          <View style={styles.advInfoRow}>
            <Text style={styles.advLabel}>Current Region:</Text>
            <Text style={styles.advVal}>Valoria Realm</Text>
          </View>

          <View style={styles.advInfoRow}>
            <Text style={styles.advLabel}>Current Chapter:</Text>
            <Text style={styles.advVal}>Chapter {Math.min(5, Math.ceil(hero.level / 4))} - Shadow Citadel</Text>
          </View>

          <View style={styles.advInfoRow}>
            <Text style={styles.advLabel}>Current Mission:</Text>
            <Text style={styles.advVal}>Defeat Realm Boss & Guard Streak</Text>
          </View>

          <View style={styles.advInfoRow}>
            <Text style={styles.advLabel}>Next Unlock:</Text>
            <Text style={styles.advVal}>Level {Math.ceil(hero.level / 4) * 4 + 1} Portal Gate</Text>
          </View>
        </View>

        {/* ====================================================
            8. PLAYER SUMMARY
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📜 Player Account Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Account Created</Text>
              <Text style={styles.summaryVal}>{accountCreatedStr}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Days Active</Text>
              <Text style={styles.summaryVal}>{daysActive} Days</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total XP Earned</Text>
              <Text style={styles.summaryVal}>{hero.totalXP} XP</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Coins Earned</Text>
              <Text style={styles.summaryVal}>{hero.coins} Coins</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Highest Level</Text>
              <Text style={styles.summaryVal}>Level {hero.level}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Inventory Items</Text>
              <Text style={styles.summaryVal}>{progression.inventoryItemCount} Items</Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            9. QUICK ACTIONS (BUTTONS)
        ==================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/inventory" as any)}>
              <Text style={styles.actionBtnText}>🎒 Go to Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/quests" as any)}>
              <Text style={styles.actionBtnText}>📜 Go to Quests</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/leaderboard" as any)}>
              <Text style={styles.actionBtnText}>🏆 Go to Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/achievements" as any)}>
              <Text style={styles.actionBtnText}>🎖️ Go to Achievements</Text>
            </TouchableOpacity>
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
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },

  // RANK BANNER CARD
  rankBannerCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: "#F59E0B",
    marginBottom: 16,
  },
  rankBannerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 158, 11, 0.3)",
    paddingBottom: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  rankBannerTitle: {
    color: "#F59E0B",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  rankBannerContent: {
    gap: 8,
  },
  rankBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rankBannerText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  rankHighlight: {
    color: RPGTheme.colors.textPrimary,
    fontWeight: "900",
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
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  sectionSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },

  // HERO CARD
  heroCardTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  avatarBox: {
    position: "relative",
  },
  heroInfoBox: {
    flex: 1,
  },
  heroUsername: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  titleTag: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 4,
  },
  titleTagText: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900",
  },
  heroClassSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
  },
  xpBox: {
    marginBottom: 12,
  },
  xpLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  xpLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  xpVal: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
  },
  xpTrack: {
    height: 10,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 5,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 5,
  },
  heroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 12,
    padding: 10,
  },
  heroStatItem: {
    alignItems: "center",
  },
  heroStatIcon: {
    fontSize: 18,
  },
  heroStatNum: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  heroStatLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
  },

  // STATS GRID
  statsStripGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statBox: {
    width: "18%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statVal: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  statName: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  // EQUIPMENT GRID
  equipmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  equipCard: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
  },
  equipSlotLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: "900",
    marginBottom: 4,
  },
  equipIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  equipName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  rarityPill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 4,
  },
  rarityPillText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  equipStatSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
  equipEmptyText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 4,
  },

  // PROGRESSION
  progRow: {
    marginBottom: 10,
  },
  progHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progTitle: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  progVal: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
  },
  progTrack: {
    height: 8,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progFill: {
    height: "100%",
    borderRadius: 4,
  },

  // RECENT ACTIVITY
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
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
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "700",
  },
  actTime: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
  },

  // BADGES
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  badgeCard: {
    width: "23%",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  badgeLocked: {
    opacity: 0.35,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  badgeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  badgeTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  badgeStatusUnlocked: {
    color: "#F59E0B",
    fontSize: 7,
    fontWeight: "900",
    marginTop: 2,
  },
  badgeStatusLocked: {
    color: RPGTheme.colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    marginTop: 2,
  },

  // ADVENTURE PROGRESS
  advInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.1)",
  },
  advLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  advVal: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  // PLAYER SUMMARY
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  summaryItem: {
    width: "48%",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 10,
    padding: 10,
  },
  summaryLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  summaryVal: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },

  // QUICK ACTIONS
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    width: "48%",
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },
});
