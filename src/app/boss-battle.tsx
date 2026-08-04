import RPGHeader from "@/components/RPGHeader";
import { auth, db } from "@/lib/firebase";
import BossService, { BossData, RPG_BOSSES } from "@/services/bossService";
import { RPGTheme } from "@/utils/rpgTheme";
import { router } from "expo-router";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BossBattleScreen() {
  const [loading, setLoading] = useState(true);

  // Player state from Firestore
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerStats, setPlayerStats] = useState({
    attack: 20,
    defense: 10,
    vitality: 10,
  });
  const [bossesDefeated, setBossesDefeated] = useState<Record<string, boolean>>({});

  // Active battle state
  const [activeBoss, setActiveBoss] = useState<BossData | null>(null);
  const [playerHp, setPlayerHp] = useState(100);
  const [maxPlayerHp, setMaxPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const [maxBossHp, setMaxBossHp] = useState(100);
  const [turnLog, setTurnLog] = useState<string[]>([]);
  const [battleState, setBattleState] = useState<"idle" | "fighting" | "victory" | "defeat">("idle");
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);

  // Animations
  const playerAnim = useRef(new Animated.Value(0)).current;
  const bossAnim = useRef(new Animated.Value(0)).current;
  const damageFlashAnim = useRef(new Animated.Value(0)).current;
  const victoryScaleAnim = useRef(new Animated.Value(0.5)).current;

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // Subscribe to users/{uid} for level & bossesDefeated
    const userRef = doc(db, "users", uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPlayerLevel(Number(data.level ?? 1));
        setBossesDefeated(data.bossesDefeated || {});
      }
    });

    // Subscribe to users/{uid}/inventory for equipped character stats
    const inventoryRef = collection(db, "users", uid, "inventory");
    const unsubInventory = onSnapshot(inventoryRef, (snapshot) => {
      let atk = 20;
      let def = 10;
      let vit = 10;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.equipped) {
          atk += Number(data.attack ?? 0);
          def += Number(data.defense ?? 0);
          vit += Number(data.vitality ?? 0);
        }
      });

      setPlayerStats({ attack: atk, defense: def, vitality: vit });
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubInventory();
    };
  }, [uid]);

  // Start battle with selected boss
  const startBattle = (boss: BossData) => {
    const computedMaxPlayerHp = 100 + (playerLevel * 20) + (playerStats.vitality * 10);
    setActiveBoss(boss);
    setPlayerHp(computedMaxPlayerHp);
    setMaxPlayerHp(computedMaxPlayerHp);
    setBossHp(boss.hp);
    setMaxBossHp(boss.hp);
    setTurnLog([`⚔️ Battle commenced against ${boss.name}!`]);
    setBattleState("fighting");
    setIsProcessingTurn(false);
  };

  // Trigger attack animation
  const triggerAttackAnimation = (isPlayer: boolean) => {
    const anim = isPlayer ? playerAnim : bossAnim;
    Animated.sequence([
      Animated.timing(anim, {
        toValue: isPlayer ? 40 : -40,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Damage flash
    Animated.sequence([
      Animated.timing(damageFlashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(damageFlashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle Player Action: Attack
  const handlePlayerAttack = async () => {
    if (!activeBoss || isProcessingTurn || battleState !== "fighting") return;
    setIsProcessingTurn(true);

    triggerAttackAnimation(true);

    // 1. Calculate Player Damage
    const baseDamage = Math.max(8, (playerStats.attack * 1.4) - (activeBoss.defense * 0.5));
    const randomFactor = 0.85 + Math.random() * 0.3; // 85% to 115%
    const playerDamage = Math.round(baseDamage * randomFactor);

    const newBossHp = Math.max(0, bossHp - playerDamage);
    setBossHp(newBossHp);
    setTurnLog((prev) => [`💥 You hit ${activeBoss.name} for ${playerDamage} damage!`, ...prev]);

    // Check Victory
    if (newBossHp <= 0) {
      setBattleState("victory");
      Animated.spring(victoryScaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();

      if (uid) {
        try {
          await BossService.recordBossVictory(uid, activeBoss.id);
        } catch (e) {
          console.error("Error recording boss victory:", e);
        }
      }
      setIsProcessingTurn(false);
      return;
    }

    // 2. Boss Counter-Attack after short delay
    setTimeout(() => {
      triggerAttackAnimation(false);
      const bossBaseDamage = Math.max(5, (activeBoss.attack * 1.3) - (playerStats.defense * 0.5));
      const bossDamage = Math.round(bossBaseDamage * (0.85 + Math.random() * 0.3));

      const newPlayerHp = Math.max(0, playerHp - bossDamage);
      setPlayerHp(newPlayerHp);
      setTurnLog((prev) => [`🔥 ${activeBoss.name} attacked you for ${bossDamage} damage!`, ...prev]);

      if (newPlayerHp <= 0) {
        setBattleState("defeat");
      }
      setIsProcessingTurn(false);
    }, 600);
  };

  // Handle Player Action: Defend
  const handlePlayerDefend = () => {
    if (!activeBoss || isProcessingTurn || battleState !== "fighting") return;
    setIsProcessingTurn(true);

    setTurnLog((prev) => [`🛡️ You raised your shield in defensive posture!`, ...prev]);

    setTimeout(() => {
      triggerAttackAnimation(false);
      const bossBaseDamage = Math.max(5, (activeBoss.attack * 1.3) - (playerStats.defense * 0.5));
      const bossDamage = Math.round(bossBaseDamage * 0.5); // 50% reduced damage

      const newPlayerHp = Math.max(0, playerHp - bossDamage);
      setPlayerHp(newPlayerHp);
      setTurnLog((prev) => [`🔥 ${activeBoss.name} attacked! You blocked and took only ${bossDamage} damage.`, ...prev]);

      if (newPlayerHp <= 0) {
        setBattleState("defeat");
      }
      setIsProcessingTurn(false);
    }, 500);
  };

  // Handle Player Action: Heal Potion
  const handlePlayerHeal = () => {
    if (!activeBoss || isProcessingTurn || battleState !== "fighting") return;
    setIsProcessingTurn(true);

    const healAmount = Math.round(maxPlayerHp * 0.35);
    const newPlayerHp = Math.min(maxPlayerHp, playerHp + healAmount);
    setPlayerHp(newPlayerHp);
    setTurnLog((prev) => [`🧪 You drank a Health Potion and recovered +${healAmount} HP!`, ...prev]);

    setTimeout(() => {
      triggerAttackAnimation(false);
      const bossBaseDamage = Math.max(5, (activeBoss.attack * 1.3) - (playerStats.defense * 0.5));
      const bossDamage = Math.round(bossBaseDamage * (0.85 + Math.random() * 0.3));

      const updatedPlayerHp = Math.max(0, newPlayerHp - bossDamage);
      setPlayerHp(updatedPlayerHp);
      setTurnLog((prev) => [`🔥 ${activeBoss.name} strikes for ${bossDamage} damage!`, ...prev]);

      if (updatedPlayerHp <= 0) {
        setBattleState("defeat");
      }
      setIsProcessingTurn(false);
    }, 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Loading Boss Arena...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="Boss Battles & Map" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>EPIC ENCOUNTERS</Text>
        <Text style={styles.title}>🐉 Realm Boss Battles</Text>
        <Text style={styles.subtitle}>Test your strength against formidable boss titans to earn legendary rewards!</Text>

        {/* BOSS LIST */}
        {RPG_BOSSES.map((boss) => {
          const isLocked = playerLevel < boss.levelReq;
          const isDefeated = !!bossesDefeated[boss.id];

          return (
            <View key={boss.id} style={[styles.bossCard, isLocked && styles.bossCardLocked]}>
              <View style={styles.bossHeaderRow}>
                <Text style={styles.bossImageEmoji}>{boss.image}</Text>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.bossName}>{boss.name}</Text>
                    {isDefeated && (
                      <View style={styles.defeatedBadge}>
                        <Text style={styles.defeatedText}>⚔️ DEFEATED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.bossDesc}>{boss.description}</Text>
                  <Text style={styles.bossReqText}>Requires Lvl {boss.levelReq}</Text>
                </View>
              </View>

              {/* BOSS STATS */}
              <View style={styles.bossStatsRow}>
                <Text style={styles.bossStatItem}>❤️ {boss.hp} HP</Text>
                <Text style={styles.bossStatItem}>⚔️ {boss.attack} ATK</Text>
                <Text style={styles.bossStatItem}>🛡️ {boss.defense} DEF</Text>
              </View>

              {/* REWARDS */}
              <View style={styles.rewardBanner}>
                <Text style={styles.rewardTitle}>REWARDS:</Text>
                <Text style={styles.rewardText}>
                  +{boss.rewardXP} XP • +{boss.rewardCoins} 🪙 • {boss.rewardItem.icon} {boss.rewardItem.name}
                </Text>
              </View>

              {/* BATTLE BUTTON */}
              <TouchableOpacity
                style={[styles.battleButton, isLocked && styles.battleButtonDisabled]}
                disabled={isLocked}
                activeOpacity={0.8}
                onPress={() => startBattle(boss)}
              >
                <Text style={styles.battleButtonText}>
                  {isLocked ? `🔒 Locked (Requires Lvl ${boss.levelReq})` : isDefeated ? "⚔️ Re-enter Battle" : "⚔️ Challenge Boss"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Return to Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BATTLE ARENA MODAL */}
      <Modal
        visible={battleState !== "idle"}
        transparent
        animationType="fade"
        onRequestClose={() => setBattleState("idle")}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.damageOverlay, { opacity: damageFlashAnim }]} />

          {activeBoss && (
            <View style={styles.battleContainer}>
              {/* ARENA HEADER */}
              <View style={styles.arenaHeader}>
                <Text style={styles.arenaTitle}>⚔️ BOSS BATTLE</Text>
                <TouchableOpacity onPress={() => setBattleState("idle")}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* BOSS HP BAR */}
              <View style={styles.fighterCard}>
                <View style={styles.fighterInfoRow}>
                  <Text style={styles.fighterName}>{activeBoss.name}</Text>
                  <Text style={styles.hpText}>{bossHp} / {maxBossHp} HP</Text>
                </View>
                <View style={styles.hpTrack}>
                  <View
                    style={[
                      styles.hpFillBoss,
                      { width: `${Math.max(0, Math.round((bossHp / maxBossHp) * 100))}%` },
                    ]}
                  />
                </View>
              </View>

              {/* BATTLE SPRITES ARENA */}
              <View style={styles.spritesArena}>
                <Animated.View style={[styles.spriteBox, { transform: [{ translateX: playerAnim }] }]}>
                  <Text style={styles.spriteEmoji}>🛡️</Text>
                  <Text style={styles.spriteName}>You (Lvl {playerLevel})</Text>
                </Animated.View>

                <Text style={styles.vsText}>VS</Text>

                <Animated.View style={[styles.spriteBox, { transform: [{ translateX: bossAnim }] }]}>
                  <Text style={styles.spriteEmoji}>{activeBoss.image}</Text>
                  <Text style={styles.spriteName}>{activeBoss.name}</Text>
                </Animated.View>
              </View>

              {/* PLAYER HP BAR */}
              <View style={styles.fighterCard}>
                <View style={styles.fighterInfoRow}>
                  <Text style={styles.fighterName}>Player (You)</Text>
                  <Text style={styles.hpText}>{playerHp} / {maxPlayerHp} HP</Text>
                </View>
                <View style={styles.hpTrack}>
                  <View
                    style={[
                      styles.hpFillPlayer,
                      { width: `${Math.max(0, Math.round((playerHp / maxPlayerHp) * 100))}%` },
                    ]}
                  />
                </View>
              </View>

              {/* ACTION BUTTONS */}
              {battleState === "fighting" && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.attackBtn]}
                    disabled={isProcessingTurn}
                    onPress={handlePlayerAttack}
                  >
                    <Text style={styles.actionBtnText}>⚔️ Attack</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.defendBtn]}
                    disabled={isProcessingTurn}
                    onPress={handlePlayerDefend}
                  >
                    <Text style={styles.actionBtnText}>🛡️ Defend</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.healBtn]}
                    disabled={isProcessingTurn}
                    onPress={handlePlayerHeal}
                  >
                    <Text style={styles.actionBtnText}>🧪 Heal</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* TURN LOG */}
              <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
                {turnLog.map((log, index) => (
                  <Text key={index} style={styles.logText}>{log}</Text>
                ))}
              </ScrollView>

              {/* VICTORY MODAL OVERLAY */}
              {battleState === "victory" && (
                <Animated.View style={[styles.resultOverlay, { transform: [{ scale: victoryScaleAnim }] }]}>
                  <Text style={styles.resultEmoji}>🏆</Text>
                  <Text style={styles.victoryTitle}>VICTORY!</Text>
                  <Text style={styles.resultSubtitle}>You defeated {activeBoss.name}!</Text>

                  <View style={styles.rewardCard}>
                    <Text style={styles.rewardCardTitle}>VICTORY REWARDS</Text>
                    <Text style={styles.rewardCardText}>+{activeBoss.rewardXP} XP</Text>
                    <Text style={styles.rewardCardText}>+{activeBoss.rewardCoins} Gold Coins</Text>
                    <View style={styles.unlockedItemBox}>
                      <Text style={styles.unlockedItemEmoji}>{activeBoss.rewardItem.icon}</Text>
                      <Text style={styles.unlockedItemName}>{activeBoss.rewardItem.name} Unlocked!</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.resultButton}
                    onPress={() => setBattleState("idle")}
                  >
                    <Text style={styles.resultButtonText}>Claim Rewards & Continue</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* DEFEAT MODAL OVERLAY */}
              {battleState === "defeat" && (
                <View style={styles.resultOverlay}>
                  <Text style={styles.resultEmoji}>💀</Text>
                  <Text style={styles.defeatTitle}>DEFEATED!</Text>
                  <Text style={styles.resultSubtitle}>{activeBoss.name} overpowered your defenses.</Text>

                  <TouchableOpacity
                    style={styles.resultButton}
                    onPress={() => startBattle(activeBoss)}
                  >
                    <Text style={styles.resultButtonText}>🔄 Retry Battle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resultButton, { backgroundColor: "transparent", marginTop: 8 }]}
                    onPress={() => setBattleState("idle")}
                  >
                    <Text style={[styles.resultButtonText, { color: RPGTheme.colors.textMuted }]}>Retreat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
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
  bossCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  bossCardLocked: {
    opacity: 0.6,
  },
  bossHeaderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  bossImageEmoji: {
    fontSize: 36,
  },
  bossName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  bossDesc: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  bossReqText: {
    color: RPGTheme.colors.purplePrimary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  defeatedBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "#22C55E",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defeatedText: {
    color: "#22C55E",
    fontSize: 9,
    fontWeight: "900",
  },
  bossStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  bossStatItem: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
  },
  rewardBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  rewardTitle: {
    color: "#F59E0B",
    fontSize: 9,
    fontWeight: "900",
  },
  rewardText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  battleButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  battleButtonDisabled: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  battleButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
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

  // BATTLE MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  damageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  battleContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 18,
  },
  arenaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  arenaTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  closeText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 18,
    fontWeight: "900",
  },
  fighterCard: {
    marginVertical: 6,
  },
  fighterInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  fighterName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  hpText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  hpTrack: {
    height: 12,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
  },
  hpFillBoss: {
    height: "100%",
    backgroundColor: "#EF4444",
    borderRadius: 6,
  },
  hpFillPlayer: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 6,
  },
  spritesArena: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  spriteBox: {
    alignItems: "center",
    width: 100,
  },
  spriteEmoji: {
    fontSize: 44,
  },
  spriteName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },
  vsText: {
    color: "#F59E0B",
    fontSize: 22,
    fontWeight: "900",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  attackBtn: {
    backgroundColor: "#DC2626",
  },
  defendBtn: {
    backgroundColor: "#2563EB",
  },
  healBtn: {
    backgroundColor: "#059669",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  logContainer: {
    height: 90,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  logText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  resultOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  victoryTitle: {
    color: "#F59E0B",
    fontSize: 26,
    fontWeight: "900",
  },
  defeatTitle: {
    color: "#EF4444",
    fontSize: 26,
    fontWeight: "900",
  },
  resultSubtitle: {
    color: RPGTheme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  rewardCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderColor: "#F59E0B",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 18,
  },
  rewardCardTitle: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
  },
  rewardCardText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  unlockedItemBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unlockedItemEmoji: {
    fontSize: 18,
  },
  unlockedItemName: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "800",
  },
  resultButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  resultButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
