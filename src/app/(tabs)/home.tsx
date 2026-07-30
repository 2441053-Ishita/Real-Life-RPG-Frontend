import { auth, db } from "@/lib/firebase";
import { getHeroRank } from "../utils/rank";
import { RPGTheme } from "../utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import { router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AvatarImage from "@/components/AvatarImage";

type HeroData = {
  heroName: string;
  className: string;
  level: number;
  xp: number;
  totalXP: number;
  coins: number;
  streak: number;
  completedQuests: string[];
  totalQuestsCompleted: number;
  equippedAvatar?: string;
  avatarUrl?: string | null;
};

const HOME_QUESTS = [
  { id: "daily-1", title: "Morning Workout", xp: 20, emoji: "💪" },
  { id: "daily-2", title: "Study Session", xp: 30, emoji: "📚" },
  { id: "daily-3", title: "Stay Hydrated", xp: 10, emoji: "💧" },
  { id: "daily-4", title: "Mindfulness", xp: 15, emoji: "🧘" },
];

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState<HeroData>({
    heroName: "Hero of the Realm",
    className: "Warrior",
    level: 1,
    xp: 0,
    totalXP: 0,
    coins: 0,
    streak: 1,
    completedQuests: [],
    totalQuestsCompleted: 0,
    equippedAvatar: "warrior-avatar",
  });

  const xpProgressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const level = data.level ?? 1;
        const xp = data.xp ?? 0;
        const totalXP = data.totalXP ?? 0;
        const coins = data.coins ?? 0;
        const streak = data.streak ?? 1;

        setHero({
          heroName: data.heroName || "Hero of the Realm",
          className: data.className || "Paladin Adventurer",
          level,
          xp,
          totalXP,
          coins,
          streak,
          completedQuests: (data.completedQuests || []).map((id: any) => String(id)),
          totalQuestsCompleted: data.totalQuestsCompleted ?? 0,
          equippedAvatar: data.equippedAvatar || "warrior",
          avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
        });

        Animated.timing(xpProgressAnim, {
          toValue: Math.min(100, (xp / 100) * 100),
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      } else {
        import("firebase/firestore").then(({ setDoc, serverTimestamp }) => {
          setDoc(
            userRef,
            {
              uid,
              heroName: "Hero of the Realm",
              class: "Paladin Adventurer",
              level: 1,
              xp: 0,
              totalXP: 0,
              coins: 0,
              streak: 1,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((e) => console.error("Auto init hero error:", e));
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rank = getHeroRank(hero.level);
  const completedTodayCount = HOME_QUESTS.filter((q) =>
    hero.completedQuests.includes(q.id)
  ).length;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Entering Citadel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================
            1. HERO WELCOME CASTLE CARD
        ==================================== */}
        <View style={styles.heroCastleCard}>
          <View style={styles.castleBackgroundDecor}>
            <Text style={styles.castleBgIcon}>🏰</Text>
          </View>

          <View style={styles.cardHeaderRow}>
            <View style={styles.avatarFrame}>
              <AvatarImage
                avatarUrl={hero.avatarUrl}
                equippedAvatar={hero.equippedAvatar}
                size={64}
              />
              <View style={[styles.levelRing, { backgroundColor: rank.color }]}>
                <Text style={styles.levelRingText}>Lvl {hero.level}</Text>
              </View>
            </View>

            <View style={styles.heroHeaderInfo}>
              <Text style={styles.heroNameText} numberOfLines={1}>
                {hero.heroName}
              </Text>
              <Text style={styles.heroClassSubtitle}>{hero.className}</Text>

              <View style={[styles.rankTag, { backgroundColor: rank.color }]}>
                <Text style={styles.rankTagText}>👑 {rank.name} RANK</Text>
              </View>
            </View>
          </View>

          {/* XP BAR */}
          <View style={styles.xpSection}>
            <View style={styles.xpRowLabel}>
              <Text style={styles.xpTitle}>HERO XP PROGRESS</Text>
              <Text style={styles.xpValueText}>{hero.xp} / 100 XP</Text>
            </View>
            <View style={styles.xpTrack}>
              <Animated.View
                style={[
                  styles.xpFill,
                  {
                    width: xpProgressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* STATS STRIP */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🪙</Text>
              <Text style={styles.statNum}>{hero.coins}</Text>
              <Text style={styles.statSub}>Coins</Text>
            </View>
            <View style={styles.statDivider} />
            <Animated.View
              style={[styles.statBox, { transform: [{ scale: pulseAnim }] }]}
            >
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statNum}>{hero.streak} Days</Text>
              <Text style={styles.statSub}>Streak</Text>
            </Animated.View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statNum}>{hero.totalXP}</Text>
              <Text style={styles.statSub}>Total XP</Text>
            </View>
          </View>
        </View>

        {/* ====================================
            2. TODAY'S QUEST PROGRESS
        ==================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionCardTitle}>📜 Today's Missions</Text>
            <TouchableOpacity onPress={() => router.push("/quests" as any)}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.missionProgressGrid}>
            <View style={styles.missionBox}>
              <Text style={styles.missionBoxNum}>{completedTodayCount} / {HOME_QUESTS.length}</Text>
              <Text style={styles.missionBoxLabel}>Completed</Text>
            </View>
            <View style={styles.missionBox}>
              <Text style={styles.missionBoxNum}>{HOME_QUESTS.length - completedTodayCount}</Text>
              <Text style={styles.missionBoxLabel}>Remaining</Text>
            </View>
            <View style={styles.missionBox}>
              <Text style={styles.missionBoxNum}>
                {Math.round((completedTodayCount / HOME_QUESTS.length) * 100)}%
              </Text>
              <Text style={styles.missionBoxLabel}>Clear %</Text>
            </View>
          </View>
        </View>

        {/* ====================================
            3. BOSS BATTLE CTA CARD
        ==================================== */}
        <View style={styles.bossCard}>
          <View style={styles.bossCardContent}>
            <Text style={styles.bossEmoji}>🐉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bossCardTitle}>World Map & Boss Battles</Text>
              <Text style={styles.bossCardSub}>
                Conquer 5 RPG realms & defeat legendary boss lords!
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/chapters" as any)}
            style={styles.bossFightButton}
          >
            <Text style={styles.bossFightButtonText}>Enter World Map ⚔️</Text>
          </TouchableOpacity>
        </View>

        {/* ====================================
            4. QUICK ACTIONS GRID
        ==================================== */}
        <Text style={styles.gridSectionTitle}>⚔️ Quick Navigation</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { borderColor: "#7C3AED" }]}
            onPress={() => router.push("/quests" as any)}
          >
            <Text style={styles.quickIcon}>📜</Text>
            <Text style={styles.quickTitle}>Quests</Text>
            <Text style={styles.quickSub}>Missions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: "#EC4899" }]}
            onPress={() => router.push("/inventory" as any)}
          >
            <Text style={styles.quickIcon}>🎒</Text>
            <Text style={styles.quickTitle}>Inventory</Text>
            <Text style={styles.quickSub}>Armory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: "#3B82F6" }]}
            onPress={() => router.push("/character" as any)}
          >
            <Text style={styles.quickIcon}>👤</Text>
            <Text style={styles.quickTitle}>Character</Text>
            <Text style={styles.quickSub}>Skills & Gear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: "#D4AF37" }]}
            onPress={() => router.push("/shop" as any)}
          >
            <Text style={styles.quickIcon}>🪙</Text>
            <Text style={styles.quickTitle}>Shop</Text>
            <Text style={styles.quickSub}>Marketplace</Text>
          </TouchableOpacity>
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
    marginTop: 16,
    fontWeight: "700",
  },
  container: {
    padding: 16,
    paddingBottom: 60,
  },

  // HERO CASTLE CARD
  heroCastleCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
  },
  castleBackgroundDecor: {
    position: "absolute",
    right: -10,
    bottom: -10,
    opacity: 0.08,
  },
  castleBgIcon: {
    fontSize: 120,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarFrame: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: RPGTheme.colors.secondaryCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: RPGTheme.colors.purplePrimary,
    marginRight: 14,
    position: "relative",
  },
  avatarEmoji: {
    fontSize: 32,
  },
  levelRing: {
    position: "absolute",
    bottom: -6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  levelRingText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  heroHeaderInfo: {
    flex: 1,
  },
  heroNameText: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heroName,
    fontSize: 22,
    fontWeight: "900",
  },
  heroClassSubtitle: {
    color: RPGTheme.colors.textSecondary,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  rankTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rankTagText: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 10,
    fontWeight: "900",
  },

  // XP SECTION
  xpSection: {
    marginBottom: 16,
  },
  xpRowLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  xpTitle: {
    color: RPGTheme.colors.textSecondary,
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  xpValueText: {
    color: RPGTheme.colors.goldLight,
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 11,
    fontWeight: "900",
  },
  xpTrack: {
    height: 9,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 10,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 10,
  },

  // STATS STRIP
  statsStrip: {
    flexDirection: "row",
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  statBox: {
    alignItems: "center",
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  statNum: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 14,
    fontWeight: "900",
  },
  statSub: {
    color: RPGTheme.colors.textMuted,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    marginBottom: 20,
  },
  sectionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionCardTitle: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "900",
  },
  viewAllText: {
    color: RPGTheme.colors.purpleSecondary,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 12,
    fontWeight: "800",
  },
  missionProgressGrid: {
    flexDirection: "row",
    gap: 10,
  },
  missionBox: {
    flex: 1,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  missionBoxNum: {
    color: RPGTheme.colors.goldLight,
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 16,
    fontWeight: "900",
  },
  missionBoxLabel: {
    color: RPGTheme.colors.textMuted,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
    marginTop: 2,
  },

  // BOSS CARD
  bossCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.purpleSecondary,
    marginBottom: 20,
    shadowColor: RPGTheme.colors.purplePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  bossCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  bossEmoji: {
    fontSize: 32,
  },
  bossCardTitle: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "900",
  },
  bossCardSub: {
    color: RPGTheme.colors.textSecondary,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 11,
    lineHeight: 16,
  },
  bossFightButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.purpleSecondary,
    shadowColor: RPGTheme.colors.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  bossFightButtonText: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // QUICK GRID
  gridSectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: (Dimensions.get("window").width - 44) / 2,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  quickIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  quickTitle: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "900",
  },
  quickSub: {
    color: RPGTheme.colors.textMuted,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
  },
});