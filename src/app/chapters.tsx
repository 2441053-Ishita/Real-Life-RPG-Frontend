import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { doc, onSnapshot, runTransaction, setDoc, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CHAPTERS_DATA,
  Chapter,
  ChapterBoss,
  getChapterProgress,
} from "@/utils/chapters";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import { HeadingText, TitleText, BodyText, StatsText, ButtonText, AppText } from "@/components/Typography";

export default function ChaptersScreen() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [currentChapter, setCurrentChapter] = useState(1);
  const [unlockedChapters, setUnlockedChapters] = useState<number[]>([1]);
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [bossesDefeated, setBossesDefeated] = useState<Record<string, boolean>>({});

  const [selectedBoss, setSelectedBoss] = useState<{
    boss: ChapterBoss;
    chapter: Chapter;
  } | null>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(
      userRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCurrentChapter(data.currentChapter ?? 1);
          setUnlockedChapters(data.unlockedChapters ?? [1]);
          setCompletedChapters(data.completedChapters ?? []);
          setCompletedQuests((data.completedQuests || []).map((id: any) => String(id)));
          setBossesDefeated(data.chapterBossesDefeated || {});
        } else {
          // Auto-initialize chapter progress if user document doesn't exist
          try {
            await setDoc(userRef, {
              uid,
              currentChapter: 1,
              unlockedChapters: [1],
              completedChapters: [],
              chapterBossesDefeated: {},
              completedQuests: [],
              createdAt: serverTimestamp(),
            }, { merge: true });
          } catch (e) {
            console.error("Auto init user error:", e);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("CHAPTERS FIRESTORE PERMISSION OR READ ERROR:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const showToast = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleDefeatBoss = async (boss: ChapterBoss, chapter: Chapter) => {
    if (!uid) return;

    try {
      setUpdating(true);
      const userRef = doc(db, "users", uid);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.exists() ? snap.data() : {};

        const currentXP = data.xp ?? 0;
        const currentTotalXP = data.totalXP ?? 0;
        const currentCoins = data.coins ?? 0;
        const currentDefeated = data.chapterBossesDefeated || {};

        const newDefeated = {
          ...currentDefeated,
          [boss.id]: true,
        };

        const earnedXP = boss.rewardXP;
        const earnedCoins = boss.rewardCoins;

        const newXP = currentXP + earnedXP;
        const newTotalXP = currentTotalXP + earnedXP;
        const newCoins = currentCoins + earnedCoins;
        const newLevel = Math.floor(newTotalXP / 100) + 1;

        const updatedProgress = getChapterProgress(
          chapter,
          (data.completedQuests || []).map((id: any) => String(id)),
          newDefeated
        );

        const currentUnlocked: number[] = data.unlockedChapters || [1];
        const currentCompleted: number[] = data.completedChapters || [];

        let newUnlocked = [...currentUnlocked];
        let newCompleted = [...currentCompleted];

        if (updatedProgress.isChapterComplete) {
          if (!newCompleted.includes(chapter.id)) {
            newCompleted.push(chapter.id);
          }
          if (chapter.id < CHAPTERS_DATA.length && !newUnlocked.includes(chapter.id + 1)) {
            newUnlocked.push(chapter.id + 1);
          }
        }

        const inventory = data.inventory || [];
        const titles = data.ownedTitles || ["novice"];
        let updatedInventory = [...inventory];
        let updatedTitles = [...titles];

        if (updatedProgress.isChapterComplete && !currentCompleted.includes(chapter.id)) {
          if (chapter.reward.item && !updatedInventory.some((i) => i.id === chapter.reward.item.id)) {
            updatedInventory.push(chapter.reward.item);
          }
          const titleSlug = chapter.reward.title.toLowerCase().replace(/\s+/g, "-");
          if (!updatedTitles.includes(titleSlug)) {
            updatedTitles.push(titleSlug);
          }
        }

        tx.set(
          userRef,
          {
            chapterBossesDefeated: newDefeated,
            unlockedChapters: newUnlocked,
            completedChapters: newCompleted,
            currentChapter: Math.max(...newUnlocked),
            xp: newXP,
            totalXP: newTotalXP,
            coins: newCoins,
            level: newLevel,
            inventory: updatedInventory,
            ownedTitles: updatedTitles,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      setSelectedBoss(null);
      showToast(
        `Boss Defeated! ⚔️`,
        `You defeated ${boss.name}!\n\n⭐ +${boss.rewardXP} XP\n🪙 +${boss.rewardCoins} Coins`
      );
    } catch (err: any) {
      console.error("BOSS BATTLE ERROR:", err);
      showToast("Battle Error", err?.message || "Failed to complete boss fight.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <BodyText style={styles.loadingText}>Loading World Map...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="🗺️ World Map & Bosses" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <BodyText style={styles.eyebrow}>REALM PROGRESSION</BodyText>
        <HeadingText style={styles.title}>🗺️ World Map & Chapters</HeadingText>

        {CHAPTERS_DATA.map((ch) => {
          const isUnlocked = unlockedChapters.includes(ch.id);
          const isCompleted = completedChapters.includes(ch.id);
          const progress = getChapterProgress(ch, completedQuests, bossesDefeated);

          return (
            <View
              key={ch.id}
              style={[
                styles.chapterCard,
                { borderColor: isUnlocked ? ch.accentColor : RPGTheme.colors.cardBorder },
                !isUnlocked && styles.lockedChapterCard,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.emojiBadge,
                    { backgroundColor: isUnlocked ? ch.bgGradient : RPGTheme.colors.secondaryCard },
                  ]}
                >
                  <AppText style={styles.emojiText}>{ch.emoji}</AppText>
                </View>

                <View style={styles.chapterTitleGroup}>
                  <View style={styles.chapterMetaRow}>
                    <HeadingText style={styles.chapterNumberText}>CHAPTER {ch.id}</HeadingText>
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <ButtonText style={styles.completedBadgeText}>✓ CLEARED</ButtonText>
                      </View>
                    )}
                    {!isUnlocked && (
                      <View style={styles.lockedBadge}>
                        <ButtonText style={styles.lockedBadgeText}>🔒 LOCKED</ButtonText>
                      </View>
                    )}
                  </View>

                  <HeadingText style={styles.chapterName}>{ch.name}</HeadingText>
                  <BodyText style={styles.chapterSubtitle}>{ch.subtitle}</BodyText>
                </View>
              </View>

              <BodyText style={styles.chapterDesc}>{ch.description}</BodyText>

              {isUnlocked && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeaderRow}>
                    <BodyText style={styles.progressLabel}>Chapter Progress</BodyText>
                    <StatsText style={[styles.progressPercent, { color: ch.accentColor }]}>
                      {progress.percent}% ({progress.completedSteps}/{progress.totalSteps})
                    </StatsText>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress.percent}%`,
                          backgroundColor: ch.accentColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {isUnlocked && (
                <View style={styles.bossesSection}>
                  <HeadingText style={styles.bossesSectionTitle}>Chapter Bosses</HeadingText>
                  <View style={styles.bossRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={progress.miniDefeated || updating}
                      onPress={() => setSelectedBoss({ boss: ch.miniBoss, chapter: ch })}
                      style={[
                        styles.bossBox,
                        progress.miniDefeated && styles.bossDefeatedBox,
                      ]}
                    >
                      <AppText style={styles.bossEmoji}>{ch.miniBoss.emoji}</AppText>
                      <View style={{ flex: 1 }}>
                        <HeadingText style={styles.bossName}>{ch.miniBoss.name}</HeadingText>
                        <BodyText style={styles.bossSub}>Mini Boss • {ch.miniBoss.hp} HP</BodyText>
                      </View>
                      <View
                        style={[
                          styles.bossStateTag,
                          progress.miniDefeated
                            ? styles.bossStateDefeated
                            : styles.bossStateFight,
                        ]}
                      >
                        <ButtonText style={styles.bossStateTagText}>
                          {progress.miniDefeated ? "Defeated ✓" : "Fight ⚔️"}
                        </ButtonText>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={progress.finalDefeated || updating}
                      onPress={() => setSelectedBoss({ boss: ch.finalBoss, chapter: ch })}
                      style={[
                        styles.bossBox,
                        progress.finalDefeated && styles.bossDefeatedBox,
                      ]}
                    >
                      <AppText style={styles.bossEmoji}>{ch.finalBoss.emoji}</AppText>
                      <View style={{ flex: 1 }}>
                        <HeadingText style={styles.bossName}>{ch.finalBoss.name}</HeadingText>
                        <BodyText style={styles.bossSub}>Final Boss • {ch.finalBoss.hp} HP</BodyText>
                      </View>
                      <View
                        style={[
                          styles.bossStateTag,
                          progress.finalDefeated
                            ? styles.bossStateDefeated
                            : styles.bossStateFight,
                        ]}
                      >
                        <ButtonText style={styles.bossStateTagText}>
                          {progress.finalDefeated ? "Defeated ✓" : "Fight ⚔️"}
                        </ButtonText>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.rewardCard}>
                <HeadingText style={styles.rewardTitle}>Chapter Clear Rewards</HeadingText>
                <View style={styles.rewardGrid}>
                  <StatsText style={styles.rewardPill}>⭐ +{ch.reward.xp} XP</StatsText>
                  <StatsText style={styles.rewardPill}>🪙 +{ch.reward.coins} Coins</StatsText>
                  <StatsText style={styles.rewardPill}>
                    {ch.reward.item.icon} {ch.reward.item.name}
                  </StatsText>
                  <StatsText style={styles.rewardPill}>👑 "{ch.reward.title}" Title</StatsText>
                </View>
              </View>

              {!isUnlocked && (
                <View style={styles.lockedBanner}>
                  <BodyText style={styles.lockedBannerText}>
                    🔒 Complete Chapter {ch.id - 1} to unlock this realm.
                  </BodyText>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* BOSS BATTLE MODAL */}
      <Modal
        visible={!!selectedBoss}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBoss(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedBoss(null)}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            {selectedBoss && (
              <>
                <View style={styles.modalHeader}>
                  <AppText style={styles.modalBossEmoji}>{selectedBoss.boss.emoji}</AppText>
                  <View style={{ flex: 1 }}>
                    <HeadingText style={styles.modalBossTitle}>{selectedBoss.boss.name}</HeadingText>
                    <StatsText style={styles.modalBossType}>
                      {selectedBoss.boss.type === "final" ? "🔴 Final Boss" : "🟠 Mini Boss"}{" "}
                      • {selectedBoss.boss.hp} HP
                    </StatsText>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedBoss(null)}>
                    <BodyText style={{ color: "#94A3B8", fontSize: 18 }}>✕</BodyText>
                  </TouchableOpacity>
                </View>

                <BodyText style={styles.modalBossDesc}>{selectedBoss.boss.description}</BodyText>

                <View style={styles.modalRewardCard}>
                  <HeadingText style={styles.modalRewardTitle}>Victory Rewards</HeadingText>
                  <StatsText style={styles.modalRewardText}>
                    ⭐ +{selectedBoss.boss.rewardXP} XP • 🪙 +{selectedBoss.boss.rewardCoins}{" "}
                    Coins
                  </StatsText>
                </View>

                <TouchableOpacity
                  disabled={updating}
                  onPress={() => handleDefeatBoss(selectedBoss.boss, selectedBoss.chapter)}
                  style={styles.fightButton}
                >
                  {updating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ButtonText style={styles.fightButtonText}>Engage Boss Battle ⚔️</ButtonText>
                  )}
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
    color: RPGTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
  },
  container: {
    padding: 16,
    paddingBottom: 60,
  },
  eyebrow: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  title: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 20,
  },

  chapterCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  lockedChapterCard: {
    opacity: 0.55,
    backgroundColor: "#0B1120",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  emojiBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  emojiText: {
    fontSize: 26,
  },
  chapterTitleGroup: {
    flex: 1,
  },
  chapterMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  chapterNumberText: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  completedBadge: {
    backgroundColor: RPGTheme.colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  lockedBadge: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedBadgeText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 8,
    fontWeight: "900",
  },
  chapterName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  chapterSubtitle: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  chapterDesc: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },

  progressSection: {
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: "900",
  },
  progressTrack: {
    height: 9,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  bossesSection: {
    marginBottom: 16,
  },
  bossesSectionTitle: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  bossRow: {
    gap: 8,
  },
  bossBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RPGTheme.colors.secondaryCard,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 10,
  },
  bossDefeatedBox: {
    opacity: 0.7,
    borderColor: RPGTheme.colors.success,
  },
  bossEmoji: {
    fontSize: 22,
  },
  bossName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  bossSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
  },
  bossStateTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bossStateFight: {
    backgroundColor: RPGTheme.colors.purplePrimary,
  },
  bossStateDefeated: {
    backgroundColor: RPGTheme.colors.success,
  },
  bossStateTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  rewardCard: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RPGTheme.colors.goldBorder,
  },
  rewardTitle: {
    color: RPGTheme.colors.gold,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },
  rewardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  rewardPill: {
    backgroundColor: RPGTheme.colors.primaryCard,
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedBanner: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  lockedBannerText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: RPGTheme.colors.purplePrimary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  modalBossEmoji: {
    fontSize: 32,
  },
  modalBossTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  modalBossType: {
    color: RPGTheme.colors.goldLight,
    fontSize: 11,
    fontWeight: "700",
  },
  modalBossDesc: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalRewardCard: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  modalRewardTitle: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
  },
  modalRewardText: {
    color: RPGTheme.colors.goldLight,
    fontSize: 12,
    fontWeight: "800",
  },
  fightButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  fightButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
