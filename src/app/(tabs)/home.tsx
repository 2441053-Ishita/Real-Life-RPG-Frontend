import { auth, db } from "@/lib/firebase";
import { getHeroRank } from "@/utils/rank";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import { router } from "expo-router";
import { collection, doc, onSnapshot } from "firebase/firestore";
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
  Modal,
} from "react-native";

import AvatarImage from "@/components/AvatarImage";
import ChestService, { ChestReward } from "@/services/chestService";
import DailyRewardService, { DAILY_REWARDS_SCHEDULE, DailyRewardItem } from "@/services/dailyRewardService";

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
  mysteryChestsOpened: number;
  dailyLoginDay: number;
  lastLoginClaimDate: string;
  equippedAvatar?: string;
  avatarUrl?: string | null;
};

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
    mysteryChestsOpened: 0,
    dailyLoginDay: 1,
    lastLoginClaimDate: "",
    equippedAvatar: "warrior-avatar",
  });

  const xpProgressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const chestScaleAnim = useRef(new Animated.Value(0.4)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  const [openingChest, setOpeningChest] = useState(false);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);

  const uid = auth.currentUser?.uid;

  const handleOpenChest = async () => {
    if (!uid || openingChest) return;
    setOpeningChest(true);

    try {
      const reward = await ChestService.openMysteryChest(uid);
      setChestReward(reward);

      Animated.spring(chestScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      console.error("Error opening mystery chest:", error);
      alert(error?.message || "Failed to open mystery chest.");
    } finally {
      setOpeningChest(false);
    }
  };

  const [claimingDailyReward, setClaimingDailyReward] = useState(false);
  const [dailyRewardPopup, setDailyRewardPopup] = useState<DailyRewardItem | null>(null);

  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDailyRewardClaimedToday = hero.lastLoginClaimDate === getTodayStr();

  const handleClaimDailyReward = async () => {
    if (!uid || claimingDailyReward || isDailyRewardClaimedToday) return;
    setClaimingDailyReward(true);

    try {
      const reward = await DailyRewardService.claimDailyReward(uid);
      setDailyRewardPopup(reward);
    } catch (error: any) {
      console.error("Error claiming daily reward:", error);
      alert(error?.message || "Failed to claim daily reward.");
    } finally {
      setClaimingDailyReward(false);
    }
  };

  const [dailyMissions, setDailyMissions] = useState({
    total: 4,
    completed: 0,
    remaining: 4,
    clearPercentage: 0,
  });

  useEffect(() => {
    if (!uid) return;

    const dailyQuestsRef = collection(db, "users", uid, "dailyQuests");
    const unsubscribeDaily = onSnapshot(
      dailyQuestsRef,
      (snapshot: any) => {
        const totalDocs = snapshot.docs.length;
        const total = totalDocs > 0 ? totalDocs : 4;
        let completedCount = 0;

        snapshot.docs.forEach((docSnap: any) => {
          const data = docSnap.data();
          if (data.completed === true) {
            completedCount++;
          }
        });

        const remainingCount = Math.max(0, total - completedCount);
        const clearPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        setDailyMissions({
          total,
          completed: completedCount,
          remaining: remainingCount,
          clearPercentage: clearPct,
        });
      },
      (error: any) => {
        console.error("Daily Quests Subcollection Error:", error);
      }
    );

    return () => unsubscribeDaily();
  }, [uid]);

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
          totalQuestsCompleted: data.totalQuestsCompleted ?? (data.completedQuests || []).length,
          mysteryChestsOpened: data.mysteryChestsOpened ?? 0,
          dailyLoginDay: Number(data.dailyLoginDay ?? 1),
          lastLoginClaimDate: String(data.lastLoginClaimDate || ""),
          equippedAvatar: data.equippedAvatar || "warrior",
          avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
        });

        Animated.timing(xpProgressAnim, {
          toValue: Math.min(100, (xp / 100) * 100),
          duration: 900,
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
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rank = getHeroRank(hero.level);

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
            <View style={styles.avatarFrameContainer}>
              <View style={[styles.avatarGlow, { backgroundColor: rank.color }]} />
              <View style={[styles.avatarFrame, { borderColor: rank.color }]}>
                <AvatarImage
                  avatarUrl={hero.avatarUrl}
                  equippedAvatar={hero.equippedAvatar}
                  size={68}
                />
              </View>
              <View style={[styles.levelRing, { backgroundColor: rank.color }]}>
                <Text style={styles.levelRingText}>Lvl {hero.level}</Text>
              </View>
            </View>

            <View style={styles.heroHeaderInfo}>
              <Text style={styles.heroNameText} numberOfLines={1}>
                {hero.heroName}
              </Text>
              <Text style={styles.heroClassSubtitle}>🛡️ {hero.className}</Text>

              <View style={[styles.rankTag, { backgroundColor: rank.color }]}>
                <Text style={styles.rankTagText}>👑 {rank.name.toUpperCase()} RANK</Text>
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
              <View style={styles.statIconBadge}>
                <Text style={styles.statIcon}>🪙</Text>
              </View>
              <Text style={styles.statNum}>{hero.coins.toLocaleString()}</Text>
              <Text style={styles.statSub}>Coins</Text>
            </View>
            <View style={styles.statDivider} />
            <Animated.View
              style={[styles.statBox, { transform: [{ scale: pulseAnim }] }]}
            >
              <View style={[styles.statIconBadge, styles.streakIconBadge]}>
                <Text style={styles.statIcon}>🔥</Text>
              </View>
              <Text style={styles.statNum}>{hero.streak} Days</Text>
              <Text style={styles.statSub}>Streak</Text>
            </Animated.View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconBadge}>
                <Text style={styles.statIcon}>⭐</Text>
              </View>
              <Text style={styles.statNum}>{hero.totalXP.toLocaleString()}</Text>
              <Text style={styles.statSub}>Total XP</Text>
            </View>
          </View>
        </View>

        {/* ====================================
            MYSTERY TREASURE CHEST CARD
        ==================================== */}
        {(() => {
          const unlockedCount = Math.floor(hero.totalQuestsCompleted / 10);
          const openedCount = hero.mysteryChestsOpened ?? 0;
          const availableCount = Math.max(0, unlockedCount - openedCount);
          const remainingQuests = 10 - (hero.totalQuestsCompleted % 10);

          return (
            <View style={[styles.sectionCard, availableCount > 0 && styles.activeChestCard]}>
              <View style={styles.chestRow}>
                <View style={styles.chestIconWrapper}>
                  <Text style={styles.chestIconEmoji}>{availableCount > 0 ? "🎁" : "🧰"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chestCardTitle}>
                    {availableCount > 0
                      ? `Mystery Chest Ready! (${availableCount})`
                      : "Mystery Treasure Chest"}
                  </Text>
                  <Text style={styles.chestCardSub}>
                    {availableCount > 0
                      ? "Earned every 10 completed quests! Tap to unlock your reward."
                      : `Complete ${remainingQuests} more quest(s) to unlock next chest.`}
                  </Text>
                </View>
              </View>

              {/* CHEST UNLOCK PROGRESS BAR IF LOCKED */}
              {availableCount === 0 && (
                <View style={styles.chestProgressBox}>
                  <View style={styles.chestTrack}>
                    <View
                      style={[
                        styles.chestFill,
                        { width: `${Math.round(((10 - remainingQuests) / 10) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.chestProgressText}>
                    ⚡ {10 - remainingQuests} / 10 Quests Completed
                  </Text>
                </View>
              )}

              {/* OPEN CHEST BUTTON */}
              {availableCount > 0 && (
                <TouchableOpacity
                  style={styles.openChestBtn}
                  disabled={openingChest}
                  activeOpacity={0.85}
                  onPress={handleOpenChest}
                >
                  <Text style={styles.openChestBtnText}>
                    {openingChest ? "Opening Chest..." : "🎁 Open Mystery Chest Now"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}

        {/* ====================================
            DAILY LOGIN REWARDS CARD
        ==================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.titleBadgeGroup}>
              <Text style={styles.sectionCardTitle}>📅 Daily Login Rewards</Text>
            </View>
            <View style={styles.cycleBadge}>
              <Text style={styles.dailyRewardCycleText}>Cycle Day {hero.dailyLoginDay} / 7</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyStripContainer}>
            {DAILY_REWARDS_SCHEDULE.map((item) => {
              const isCurrentDay = item.day === hero.dailyLoginDay;
              const isPastClaimed = item.day < hero.dailyLoginDay || (isCurrentDay && isDailyRewardClaimedToday);

              return (
                <View
                  key={item.day}
                  style={[
                    styles.dailyItemBox,
                    isCurrentDay && !isDailyRewardClaimedToday && styles.activeDailyItemBox,
                    isPastClaimed && styles.claimedDailyItemBox,
                  ]}
                >
                  <Text style={styles.dailyDayText}>Day {item.day}</Text>
                  <Text style={styles.dailyIconEmoji}>{item.icon}</Text>
                  <Text style={styles.dailyTitleText} numberOfLines={1}>{item.title}</Text>
                  {isPastClaimed ? (
                    <View style={styles.claimedBadge}>
                      <Text style={styles.dailyCheckmark}>✓ Claimed</Text>
                    </View>
                  ) : isCurrentDay ? (
                    <View style={styles.readyBadge}>
                      <Text style={styles.dailyReadyBadge}>READY</Text>
                    </View>
                  ) : (
                    <Text style={styles.dailyUpcomingText}>Upcoming</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.claimDailyBtn,
              isDailyRewardClaimedToday && styles.claimedDailyBtn,
            ]}
            disabled={isDailyRewardClaimedToday || claimingDailyReward}
            activeOpacity={0.85}
            onPress={handleClaimDailyReward}
          >
            <Text style={styles.claimDailyBtnText}>
              {claimingDailyReward
                ? "Claiming..."
                : isDailyRewardClaimedToday
                  ? "✓ Reward Claimed Today (Come back tomorrow!)"
                  : `🎁 Claim Day ${hero.dailyLoginDay} Reward`}
            </Text>
          </TouchableOpacity>
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
              <Text style={styles.missionBoxNum}>
                {dailyMissions.completed} / {dailyMissions.total}
              </Text>
              <Text style={styles.missionBoxLabel}>Completed</Text>
            </View>
            <View style={styles.missionBox}>
              <Text style={styles.missionBoxNum}>{dailyMissions.remaining}</Text>
              <Text style={styles.missionBoxLabel}>Remaining</Text>
            </View>
            <View style={styles.missionBox}>
              <Text style={styles.missionBoxNum}>{dailyMissions.clearPercentage}%</Text>
              <Text style={styles.missionBoxLabel}>Clear %</Text>
            </View>
          </View>
        </View>

        {/* ====================================
            3. BOSS BATTLE CTA CARD
        ==================================== */}
        <View style={styles.bossCard}>
          <View style={styles.bossCardContent}>
            <View style={styles.bossEmojiWrapper}>
              <Text style={styles.bossEmoji}>🐉</Text>
            </View>
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
            activeOpacity={0.8}
            onPress={() => router.push("/quests" as any)}
          >
            <View style={[styles.quickIconBg, { backgroundColor: "rgba(124, 58, 237, 0.15)" }]}>
              <Text style={styles.quickIcon}>📜</Text>
            </View>
            <Text style={styles.quickTitle}>Quests</Text>
            <Text style={styles.quickSub}>Missions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: "#EC4899" }]}
            activeOpacity={0.8}
            onPress={() => router.push("/inventory" as any)}
          >
            <View style={[styles.quickIconBg, { backgroundColor: "rgba(236, 72, 153, 0.15)" }]}>
              <Text style={styles.quickIcon}>🎒</Text>
            </View>
            <Text style={styles.quickTitle}>Inventory</Text>
            <Text style={styles.quickSub}>Armory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: "#3B82F6" }]}
            activeOpacity={0.8}
            onPress={() => router.push("/character" as any)}
          >
            <View style={[styles.quickIconBg, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
              <Text style={styles.quickIcon}>👤</Text>
            </View>
            <Text style={styles.quickTitle}>Character</Text>
            <Text style={styles.quickSub}>Skills & Gear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: "#F59E0B" }]}
            activeOpacity={0.8}
            onPress={() => router.push("/shop" as any)}
          >
            <View style={[styles.quickIconBg, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Text style={styles.quickIcon}>🪙</Text>
            </View>
            <Text style={styles.quickTitle}>Shop</Text>
            <Text style={styles.quickSub}>Marketplace</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* REWARD REVEAL ANIMATION MODAL */}
      <Modal
        visible={!!chestReward}
        transparent
        animationType="fade"
        onRequestClose={() => setChestReward(null)}
      >
        <View style={styles.chestModalOverlay}>
          <Animated.View style={[styles.chestRewardCard, { transform: [{ scale: chestScaleAnim }] }]}>
            <Text style={styles.rewardSparkleEmoji}>✨ 🎁 ✨</Text>

            {chestReward && (
              <>
                <Text style={styles.rewardEmoji}>{chestReward.emoji}</Text>
                <Text style={styles.rewardTitleText}>{chestReward.title}</Text>
                <Text style={styles.rewardSubtitleText}>{chestReward.subtitle}</Text>

                {chestReward.rarity && (
                  <View style={styles.rarityBadge}>
                    <Text style={styles.rarityBadgeText}>{chestReward.rarity.toUpperCase()} REWARD</Text>
                  </View>
                )}

                {chestReward.item && (
                  <View style={styles.itemDetailBox}>
                    <Text style={styles.itemDetailName}>{chestReward.item.name}</Text>
                    <Text style={styles.itemDetailDesc}>{chestReward.item.description}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.claimRewardBtn}
                  onPress={() => {
                    setChestReward(null);
                    chestScaleAnim.setValue(0.4);
                  }}
                >
                  <Text style={styles.claimRewardBtnText}>Collect Reward</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* DAILY LOGIN REWARD CLAIMED MODAL */}
      <Modal
        visible={!!dailyRewardPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setDailyRewardPopup(null)}
      >
        <View style={styles.chestModalOverlay}>
          <View style={styles.chestRewardCard}>
            <Text style={styles.rewardSparkleEmoji}>🎉 📅 🎉</Text>

            {dailyRewardPopup && (
              <>
                <Text style={styles.rewardEmoji}>{dailyRewardPopup.icon}</Text>
                <Text style={styles.rewardTitleText}>Day {dailyRewardPopup.day} Claimed!</Text>
                <Text style={styles.rewardSubtitleText}>{dailyRewardPopup.title} • {dailyRewardPopup.subtitle}</Text>

                {dailyRewardPopup.rarity && (
                  <View style={styles.rarityBadge}>
                    <Text style={styles.rarityBadgeText}>{dailyRewardPopup.rarity.toUpperCase()} REWARD</Text>
                  </View>
                )}

                {dailyRewardPopup.inventoryItem && (
                  <View style={styles.itemDetailBox}>
                    <Text style={styles.itemDetailName}>{dailyRewardPopup.inventoryItem.name}</Text>
                    <Text style={styles.itemDetailDesc}>{dailyRewardPopup.inventoryItem.description}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.claimRewardBtn}
                  onPress={() => setDailyRewardPopup(null)}
                >
                  <Text style={styles.claimRewardBtnText}>Awesome!</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 60,
  },

  // HERO CASTLE CARD
  heroCastleCard: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  castleBackgroundDecor: {
    position: "absolute",
    right: -15,
    bottom: -15,
    opacity: 0.08,
  },
  castleBgIcon: {
    fontSize: 130,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatarFrameContainer: {
    position: "relative",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 26,
    opacity: 0.25,
  },
  avatarFrame: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    overflow: "hidden",
  },
  levelRing: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#0F172A",
    elevation: 4,
  },
  levelRingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroHeaderInfo: {
    flex: 1,
  },
  heroNameText: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heroName,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroClassSubtitle: {
    color: "#94A3B8",
    fontFamily: RPGTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 8,
  },
  rankTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  rankTagText: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  // XP SECTION
  xpSection: {
    marginBottom: 18,
  },
  xpRowLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  xpTitle: {
    color: "#94A3B8",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  xpValueText: {
    color: "#FDE68A",
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 12,
    fontWeight: "900",
  },
  xpTrack: {
    height: 10,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },

  // STATS STRIP
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  streakIconBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statIcon: {
    fontSize: 18,
  },
  statNum: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 15,
    fontWeight: "900",
  },
  statSub: {
    color: "#64748B",
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: "#1E293B",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#334155",
    marginBottom: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionCardTitle: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "900",
  },
  cycleBadge: {
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  viewAllText: {
    color: "#A78BFA",
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
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  missionBoxNum: {
    color: "#FDE68A",
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 17,
    fontWeight: "900",
  },
  missionBoxLabel: {
    color: "#64748B",
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  // BOSS CARD
  bossCard: {
    backgroundColor: "#1E293B",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#A78BFA",
    marginBottom: 22,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  bossCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  bossEmojiWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  bossEmoji: {
    fontSize: 30,
  },
  bossCardTitle: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "900",
  },
  bossCardSub: {
    color: "#94A3B8",
    fontFamily: RPGTheme.fonts.body,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  bossFightButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A78BFA",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  bossFightButtonText: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // QUICK GRID
  gridSectionTitle: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: (Dimensions.get("window").width - 44) / 2,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  quickIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickIcon: {
    fontSize: 24,
  },
  quickTitle: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "900",
  },
  quickSub: {
    color: "#64748B",
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  // CHEST CARD STYLES
  activeChestCard: {
    borderColor: "#F59E0B",
    borderWidth: 2,
    backgroundColor: "#271E10",
  },
  chestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  chestIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  chestIconEmoji: {
    fontSize: 30,
  },
  chestCardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  chestCardSub: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  chestProgressBox: {
    marginTop: 8,
  },
  chestTrack: {
    height: 9,
    backgroundColor: "#0F172A",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 5,
  },
  chestFill: {
    height: "100%",
    backgroundColor: "#F59E0B",
    borderRadius: 5,
  },
  chestProgressText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  openChestBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },
  openChestBtnText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // CHEST MODAL STYLES
  chestModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  chestRewardCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1E293B",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F59E0B",
    padding: 24,
    alignItems: "center",
  },
  rewardSparkleEmoji: {
    fontSize: 22,
    marginBottom: 8,
  },
  rewardEmoji: {
    fontSize: 54,
    marginBottom: 10,
  },
  rewardTitleText: {
    color: "#F59E0B",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  rewardSubtitleText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  rarityBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  rarityBadgeText: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900",
  },
  itemDetailBox: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  itemDetailName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  itemDetailDesc: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  claimRewardBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  claimRewardBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  // DAILY REWARD CARD STYLES
  dailyRewardCycleText: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dailyStripContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  dailyItemBox: {
    width: 92,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    padding: 10,
    alignItems: "center",
  },
  activeDailyItemBox: {
    borderColor: "#7C3AED",
    borderWidth: 2,
    backgroundColor: "rgba(124, 58, 237, 0.18)",
  },
  claimedDailyItemBox: {
    borderColor: "rgba(34, 197, 94, 0.3)",
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  dailyDayText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
  },
  dailyIconEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  dailyTitleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  claimedBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dailyCheckmark: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "900",
  },
  readyBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dailyReadyBadge: {
    color: "#F59E0B",
    fontSize: 9,
    fontWeight: "900",
  },
  dailyUpcomingText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
  },
  claimDailyBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },
  claimedDailyBtn: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  claimDailyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});