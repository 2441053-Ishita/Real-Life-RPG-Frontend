import RPGHeader from "@/components/RPGHeader";
import { auth, db } from "@/lib/firebase";
import BossService, { BossData, RPG_BOSSES } from "@/services/bossService";
import InventoryService from "@/services/inventoryService";
import { RPGTheme } from "@/utils/rpgTheme";
import { router } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PotionItem = {
  id: string;
  name: string;
};

type RandomLoot = {
  name: string;
  icon: string;
  bonusCoins: number;
  bonusXP: number;
};

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
  const [potionsList, setPotionsList] = useState<PotionItem[]>([]);

  // Active battle state
  const [activeBoss, setActiveBoss] = useState<BossData | null>(null);
  const [playerHp, setPlayerHp] = useState(100);
  const [maxPlayerHp, setMaxPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const [maxBossHp, setMaxBossHp] = useState(100);
  const [turnLog, setTurnLog] = useState<string[]>([]);
  const [battleState, setBattleState] = useState<"idle" | "fighting" | "victory" | "defeat">("idle");
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [victoryLoot, setVictoryLoot] = useState<RandomLoot | null>(null);

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

    // 1. Subscribe to users/{uid} for level & bossesDefeated
    const userRef = doc(db, "users", uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPlayerLevel(Number(data.level ?? 1));
        setBossesDefeated(data.bossesDefeated || {});
      }
    });

    // 2. Subscribe to users/{uid}/inventory for equipped stats and health potions
    const inventoryRef = collection(db, "users", uid, "inventory");
    const unsubInventory = onSnapshot(inventoryRef, (snapshot) => {
      let atk = 20;
      let def = 10;
      let vit = 10;
      const potions: PotionItem[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.equipped) {
          atk += Number(data.attack ?? 0);
          def += Number(data.defense ?? 0);
          vit += Number(data.vitality ?? 0);
        }

        const cat = (data.category || "").toLowerCase();
        const name = (data.name || "").toLowerCase();
        const docId = docSnap.id.toLowerCase();
        if (cat === "potions" || cat === "potion" || name.includes("potion") || docId.includes("potion")) {
          potions.push({
            id: docSnap.id,
            name: data.name || "Health Potion",
          });
        }
      });

      setPlayerStats({ attack: atk, defense: def, vitality: vit });
      setPotionsList(potions);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubInventory();
    };
  }, [uid]);

  // Start battle with selected boss
  const startBattle = (boss: BossData) => {
    const computedMaxPlayerHp = 100 + playerLevel * 20 + playerStats.vitality * 10;
    setActiveBoss(boss);
    setPlayerHp(computedMaxPlayerHp);
    setMaxPlayerHp(computedMaxPlayerHp);
    setBossHp(boss.hp);
    setMaxBossHp(boss.hp);
    setTurnLog([`⚔️ Battle commenced against ${boss.name}!`]);
    setBattleState("fighting");
    setIsProcessingTurn(false);
    setVictoryLoot(null);
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

  // 1. ATTACK BUTTON & RANDOM DAMAGE CALCULATION
  const handlePlayerAttack = async () => {
    if (!activeBoss || isProcessingTurn || battleState !== "fighting") return;
    setIsProcessingTurn(true);

    triggerAttackAnimation(true);

    // Random Damage Calculation with Critical Hit chance (20%)
    const isCrit = Math.random() < 0.2;
    const baseDamage = Math.max(8, playerStats.attack * 1.4 - activeBoss.defense * 0.5);
    const randomFactor = 0.85 + Math.random() * 0.35; // 85% to 120%
    const rawDamage = baseDamage * randomFactor * (isCrit ? 1.5 : 1.0);
    const playerDamage = Math.round(rawDamage);

    const newBossHp = Math.max(0, bossHp - playerDamage);
    setBossHp(newBossHp);

    const attackMsg = isCrit
      ? `⚡ CRITICAL HIT! You slashed ${activeBoss.name} for ${playerDamage} damage!`
      : `💥 You hit ${activeBoss.name} for ${playerDamage} damage!`;
    setTurnLog((prev) => [attackMsg, ...prev]);

    // Check Victory
    if (newBossHp <= 0) {
      await handleVictory(activeBoss);
      setIsProcessingTurn(false);
      return;
    }

    // 2. BOSS COUNTER ATTACK
    setTimeout(() => {
      triggerBossCounterAttack(activeBoss, playerHp);
    }, 600);
  };

  // DEFEND ACTION
  const handlePlayerDefend = () => {
    if (!activeBoss || isProcessingTurn || battleState !== "fighting") return;
    setIsProcessingTurn(true);

    setTurnLog((prev) => [`🛡️ You raised your shield in defensive posture!`, ...prev]);

    setTimeout(() => {
      triggerAttackAnimation(false);
      const bossBaseDamage = Math.max(5, activeBoss.attack * 1.3 - playerStats.defense * 0.5);
      const bossDamage = Math.round(bossBaseDamage * 0.45); // 55% damage reduction

      const newPlayerHp = Math.max(0, playerHp - bossDamage);
      setPlayerHp(newPlayerHp);
      setTurnLog((prev) => [
        `🔥 ${activeBoss.name} attacked! You blocked and took only ${bossDamage} damage.`,
        ...prev,
      ]);

      if (newPlayerHp <= 0) {
        setBattleState("defeat");
      }
      setIsProcessingTurn(false);
    }, 500);
  };

  // 3. POTION USAGE FROM INVENTORY
  const handlePlayerHeal = async () => {
    if (!activeBoss || isProcessingTurn || battleState !== "fighting") return;
    setIsProcessingTurn(true);

    if (potionsList.length === 0) {
      setTurnLog((prev) => [`⚠️ No Health Potions in inventory! Buy potions in Shop.`, ...prev]);
      setIsProcessingTurn(false);
      return;
    }

    // Consume 1 potion doc from inventory in Firestore
    const targetPotion = potionsList[0];
    if (uid) {
      try {
        await deleteDoc(doc(db, "users", uid, "inventory", targetPotion.id));
      } catch (e) {
        console.error("Error consuming potion from inventory:", e);
      }
    }

    const healAmount = Math.round(maxPlayerHp * 0.4);
    const newPlayerHp = Math.min(maxPlayerHp, playerHp + healAmount);
    setPlayerHp(newPlayerHp);
    const remainingCount = Math.max(0, potionsList.length - 1);
    setTurnLog((prev) => [
      `🧪 Drank ${targetPotion.name}! Recovered +${healAmount} HP (${remainingCount} Potion(s) left)`,
      ...prev,
    ]);

    // Boss counter attack after healing
    setTimeout(() => {
      triggerBossCounterAttack(activeBoss, newPlayerHp);
    }, 500);
  };

  // BOSS COUNTER ATTACK HELPER
  const triggerBossCounterAttack = (boss: BossData, currentHeroHp: number) => {
    triggerAttackAnimation(false);
    const bossBaseDamage = Math.max(5, boss.attack * 1.3 - playerStats.defense * 0.5);
    const bossDamage = Math.round(bossBaseDamage * (0.85 + Math.random() * 0.3));

    const updatedPlayerHp = Math.max(0, currentHeroHp - bossDamage);
    setPlayerHp(updatedPlayerHp);
    setTurnLog((prev) => [`🔥 ${boss.name} counter-attacked for ${bossDamage} damage!`, ...prev]);

    if (updatedPlayerHp <= 0) {
      setBattleState("defeat");
    }
    setIsProcessingTurn(false);
  };

  // 4. VICTORY HANDLER (RANDOM LOOT & FIRESTORE SAVE)
  const handleVictory = async (boss: BossData) => {
    setBattleState("victory");
    Animated.spring(victoryScaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Random Loot Rewards Calculation
    const bonusCoins = Math.floor(boss.rewardCoins * (0.2 + Math.random() * 0.4));
    const bonusXP = Math.floor(boss.rewardXP * (0.15 + Math.random() * 0.3));

    const lootOptions = [
      { name: "Elixir of Life", icon: "🧪" },
      { name: "Boss Essence Crystal", icon: "💎" },
      { name: "Ancient Relic Gem", icon: "🔮" },
    ];
    const pickedLoot = lootOptions[Math.floor(Math.random() * lootOptions.length)];

    const lootReward: RandomLoot = {
      name: pickedLoot.name,
      icon: pickedLoot.icon,
      bonusCoins,
      bonusXP,
    };
    setVictoryLoot(lootReward);

    if (uid) {
      try {
        // Save boss victory to users/{uid} & unlock primary reward item
        await BossService.recordBossVictory(uid, boss.id);

        // Unlock random bonus loot item to inventory
        await InventoryService.unlockItem(uid, {
          id: `loot_${boss.id}_${Date.now()}`,
          name: pickedLoot.name,
          category: "potions",
          rarity: "Epic",
          icon: pickedLoot.icon,
          description: `Random bonus loot won from defeating ${boss.name}.`,
          attack: 0,
          defense: 0,
          intelligence: 5,
          vitality: 10,
          speed: 0,
          equipped: false,
        });

        // Record victory subcollection document in users/{uid}/bossVictories/{bossId}
        await setDoc(doc(db, "users", uid, "bossVictories", boss.id), {
          bossId: boss.id,
          bossName: boss.name,
          defeatedAt: serverTimestamp(),
          rewardXP: boss.rewardXP + bonusXP,
          rewardCoins: boss.rewardCoins + bonusCoins,
          rewardItem: boss.rewardItem.name,
          bonusLoot: pickedLoot.name,
        }, { merge: true });
      } catch (e) {
        console.error("Error processing victory records:", e);
      }
    }
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
                    style={[styles.actionBtn, styles.healBtn, potionsList.length === 0 && styles.healBtnDisabled]}
                    disabled={isProcessingTurn}
                    onPress={handlePlayerHeal}
                  >
                    <Text style={styles.actionBtnText}>
                      🧪 Heal ({potionsList.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* TURN LOG */}
              <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
                {turnLog.map((log, index) => (
                  <Text key={index} style={styles.logText}>{log}</Text>
                ))}
              </ScrollView>

              {/* VICTORY POPUP OVERLAY */}
              {battleState === "victory" && (
                <Animated.View style={[styles.resultOverlay, { transform: [{ scale: victoryScaleAnim }] }]}>
                  <Text style={styles.resultEmoji}>🏆</Text>
                  <Text style={styles.victoryTitle}>VICTORY!</Text>
                  <Text style={styles.resultSubtitle}>You defeated {activeBoss.name}!</Text>

                  <View style={styles.rewardCard}>
                    <Text style={styles.rewardCardTitle}>VICTORY REWARDS</Text>
                    <Text style={styles.rewardCardText}>
                      +{activeBoss.rewardXP + (victoryLoot?.bonusXP ?? 0)} XP
                    </Text>
                    <Text style={styles.rewardCardText}>
                      +{activeBoss.rewardCoins + (victoryLoot?.bonusCoins ?? 0)} Gold Coins
                    </Text>
                    <View style={styles.unlockedItemBox}>
                      <Text style={styles.unlockedItemEmoji}>{activeBoss.rewardItem.icon}</Text>
                      <Text style={styles.unlockedItemName}>{activeBoss.rewardItem.name} Unlocked!</Text>
                    </View>

                    {victoryLoot && (
                      <View style={[styles.unlockedItemBox, { marginTop: 6, borderColor: "#F59E0B" }]}>
                        <Text style={styles.unlockedItemEmoji}>{victoryLoot.icon}</Text>
                        <Text style={styles.unlockedItemName}>Bonus Loot: {victoryLoot.name}!</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.resultButton}
                    onPress={() => setBattleState("idle")}
                  >
                    <Text style={styles.resultButtonText}>Claim Rewards & Continue</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* DEFEAT POPUP OVERLAY */}
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
    gap: 14,
    alignItems: "center",
  },
  bossImageEmoji: {
    fontSize: 48,
  },
  bossName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  defeatedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defeatedText: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "900",
  },
  bossDesc: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  bossReqText: {
    color: RPGTheme.colors.purplePrimary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  bossStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    padding: 10,
    marginVertical: 12,
  },
  bossStatItem: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  rewardBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  rewardTitle: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rewardText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  battleButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  battleButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  battleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  backButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  damageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(239, 68, 68, 0.35)",
    pointerEvents: "none",
  },
  battleContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 16,
  },
  arenaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
    marginBottom: 10,
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
    fontWeight: "800",
  },
  hpTrack: {
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5,
    overflow: "hidden",
  },
  hpFillBoss: {
    height: "100%",
    backgroundColor: "#EF4444",
    borderRadius: 5,
  },
  hpFillPlayer: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 5,
  },
  spritesArena: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 14,
    paddingVertical: 20,
    marginVertical: 10,
  },
  spriteBox: {
    alignItems: "center",
  },
  spriteEmoji: {
    fontSize: 48,
  },
  spriteName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  vsText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  attackBtn: {
    backgroundColor: "#EF4444",
  },
  defendBtn: {
    backgroundColor: "#3B82F6",
  },
  healBtn: {
    backgroundColor: "#10B981",
  },
  healBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  logContainer: {
    maxHeight: 100,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  logText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 12, 29, 0.95)",
    borderRadius: 20,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  resultEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  victoryTitle: {
    color: "#F59E0B",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 4,
  },
  defeatTitle: {
    color: "#EF4444",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 4,
  },
  resultSubtitle: {
    color: RPGTheme.colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  rewardCard: {
    width: "100%",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  rewardCardTitle: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6,
  },
  rewardCardText: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  unlockedItemBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: RPGTheme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  unlockedItemEmoji: {
    fontSize: 18,
  },
  unlockedItemName: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "900",
  },
  resultButton: {
    width: "100%",
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  resultButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
