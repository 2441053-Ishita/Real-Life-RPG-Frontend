import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SKILL_TREE_BRANCHES,
  SkillBranch,
  SkillBranchId,
  SkillTreeNode,
  calculateSkillTreeBonuses,
  isSkillUnlocked,
} from "@/utils/skillTree";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import { HeadingText, TitleText, BodyText, StatsText, ButtonText, AppText } from "@/components/Typography";

const { width } = Dimensions.get("window");

export default function SkillTreeScreen() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [skillPoints, setSkillPoints] = useState(0);
  const [allocatedSkills, setAllocatedSkills] = useState<Record<string, number>>({});
  const [activeBranch, setActiveBranch] = useState<SkillBranchId>("warrior");
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSkillPoints(data.skillPoints ?? (data.level ? data.level - 1 : 0));
        setAllocatedSkills(data.skillTreeAllocated || {});
      }
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const showToast = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleUpgradeSkill = async (node: SkillTreeNode) => {
    if (!uid) return;
    const currentLvl = allocatedSkills[node.id] || 0;

    if (skillPoints < 1) {
      showToast("No Skill Points", "Earn skill points by leveling up!");
      return;
    }

    if (currentLvl >= node.maxLevel) {
      showToast("Max Level Reached", `${node.name} is already at level ${node.maxLevel}!`);
      return;
    }

    if (!isSkillUnlocked(node, allocatedSkills)) {
      showToast("Skill Locked 🔒", "Upgrade the prerequisite skill first!");
      return;
    }

    try {
      setUpdating(true);
      const userRef = doc(db, "users", uid);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) return;
        const data = snap.data();

        const currentPoints = data.skillPoints ?? (data.level ? data.level - 1 : 0);
        const currentAllocated = data.skillTreeAllocated || {};

        if (currentPoints < 1) {
          throw new Error("No skill points available.");
        }

        const nodeCurrentLvl = currentAllocated[node.id] || 0;
        if (nodeCurrentLvl >= node.maxLevel) {
          throw new Error("Skill is already at max level.");
        }

        const updatedAllocated = {
          ...currentAllocated,
          [node.id]: nodeCurrentLvl + 1,
        };

        tx.update(userRef, {
          skillPoints: currentPoints - 1,
          skillTreeAllocated: updatedAllocated,
        });
      });

      showToast("Skill Upgraded! ⚡", `${node.name} upgraded to Lvl ${currentLvl + 1}!`);
    } catch (err: any) {
      showToast("Upgrade Error", err?.message || "Failed to upgrade skill.");
    } finally {
      setUpdating(false);
    }
  };

  const currentBranch = SKILL_TREE_BRANCHES.find((b) => b.id === activeBranch)!;
  const bonuses = calculateSkillTreeBonuses(allocatedSkills);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <BodyText style={styles.loadingText}>Opening Skill Tree Matrix...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="⚡ Skill Tree Matrix" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* SKILL POINTS HEADER BANNER */}
        <Animated.View
          style={[styles.pointsBanner, { transform: [{ scale: pulseAnim }] }]}
        >
          <View style={styles.pointsBannerContent}>
            <AppText style={styles.pointsIcon}>⚡</AppText>
            <View>
              <HeadingText style={styles.pointsTitle}>Available Skill Points</HeadingText>
              <BodyText style={styles.pointsSub}>Level up to earn +1 Skill Point</BodyText>
            </View>
          </View>
          <View style={styles.pointsBadge}>
            <StatsText style={styles.pointsValue}>{skillPoints} PTS</StatsText>
          </View>
        </Animated.View>

        {/* BRANCH TABS */}
        <View style={styles.branchTabsRow}>
          {SKILL_TREE_BRANCHES.map((b) => {
            const isActive = b.id === activeBranch;
            return (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.8}
                onPress={() => setActiveBranch(b.id)}
                style={[
                  styles.branchTab,
                  isActive && { backgroundColor: b.color, borderColor: "#FFFFFF" },
                ]}
              >
                <AppText style={styles.branchTabEmoji}>{b.emoji}</AppText>
                <ButtonText
                  style={[
                    styles.branchTabText,
                    isActive && { color: "#FFFFFF", fontWeight: "900" },
                  ]}
                >
                  {b.name}
                </ButtonText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ACTIVE BRANCH INFO CARD */}
        <View style={[styles.branchInfoCard, { borderColor: currentBranch.color }]}>
          <HeadingText style={[styles.branchInfoTitle, { color: currentBranch.color }]}>
            {currentBranch.emoji} {currentBranch.name} Mastery
          </HeadingText>
          <BodyText style={styles.branchInfoDesc}>{currentBranch.description}</BodyText>
        </View>

        {/* SKILL TREE NODES VIEW WITH CONNECTING PATH LINES */}
        <View style={styles.nodesContainer}>
          {currentBranch.skills.map((node, index) => {
            const currentLvl = allocatedSkills[node.id] || 0;
            const unlocked = isSkillUnlocked(node, allocatedSkills);
            const isMax = currentLvl >= node.maxLevel;

            return (
              <React.Fragment key={node.id}>
                {/* CONNECTING CONNECTOR LINE BEFORE CHILD NODES */}
                {index > 0 && (
                  <View style={styles.connectorLineContainer}>
                    <View
                      style={[
                        styles.connectorLine,
                        currentLvl > 0 && { backgroundColor: currentBranch.color },
                      ]}
                    />
                  </View>
                )}

                {/* SKILL NODE CARD */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!unlocked || updating}
                  onPress={() => handleUpgradeSkill(node)}
                  style={[
                    styles.nodeCard,
                    unlocked && { borderColor: currentBranch.color },
                    !unlocked && styles.lockedNodeCard,
                    isMax && styles.maxNodeCard,
                  ]}
                >
                  <View
                    style={[
                      styles.nodeIconBg,
                      unlocked ? { backgroundColor: currentBranch.color } : styles.lockedIconBg,
                    ]}
                  >
                    <AppText style={styles.nodeEmoji}>{unlocked ? node.emoji : "🔒"}</AppText>
                  </View>

                  <View style={styles.nodeDetails}>
                    <View style={styles.nodeHeaderRow}>
                      <HeadingText style={styles.nodeName}>{node.name}</HeadingText>
                      <StatsText style={styles.nodeLevelBadge}>
                        {currentLvl} / {node.maxLevel}
                      </StatsText>
                    </View>

                    <BodyText style={styles.nodeDesc}>{node.description}</BodyText>
                    <StatsText style={styles.nodeBonusText}>{node.statBonusPerLevel}</StatsText>
                  </View>

                  <TouchableOpacity
                    disabled={!unlocked || isMax || skillPoints < 1 || updating}
                    onPress={() => handleUpgradeSkill(node)}
                    style={[
                      styles.upgradeBtn,
                      unlocked && skillPoints >= 1 && !isMax
                        ? { backgroundColor: currentBranch.color }
                        : styles.disabledUpgradeBtn,
                    ]}
                  >
                    <ButtonText style={styles.upgradeBtnText}>
                      {isMax ? "MAX" : !unlocked ? "LOCKED" : "+1 ⚡"}
                    </ButtonText>
                  </TouchableOpacity>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* ACTIVE PASSIVE STAT BONUSES SUMMARY */}
        <View style={styles.summaryCard}>
          <HeadingText style={styles.summaryTitle}>⚡ Active Skill Tree Modifiers</HeadingText>
          <View style={styles.summaryGrid}>
            <StatsText style={styles.summaryPill}>⚔️ +{bonuses.attackPct}% Attack</StatsText>
            <StatsText style={styles.summaryPill}>💥 +{bonuses.critDmgPct}% Crit Dmg</StatsText>
            <StatsText style={styles.summaryPill}>💪 +{bonuses.bonusStrength} STR</StatsText>
            <StatsText style={styles.summaryPill}>🛡️ +{bonuses.defensePct}% Defense</StatsText>
            <StatsText style={styles.summaryPill}>❤️ +{bonuses.bonusHp} Max HP</StatsText>
            <StatsText style={styles.summaryPill}>🧱 -{bonuses.dmgReductionPct}% Dmg Taken</StatsText>
            <StatsText style={styles.summaryPill}>✨ +{bonuses.xpBonusPct}% XP Bonus</StatsText>
            <StatsText style={styles.summaryPill}>🪙 +{bonuses.coinBonusPct}% Coins</StatsText>
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

  pointsBanner: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pointsBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pointsIcon: {
    fontSize: 28,
  },
  pointsTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  pointsSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 10,
  },
  pointsBadge: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.goldBorder,
  },
  pointsValue: {
    color: RPGTheme.colors.goldLight,
    fontSize: 14,
    fontWeight: "900",
  },

  branchTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  branchTab: {
    flex: 1,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  branchTabEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  branchTabText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },

  branchInfoCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  branchInfoTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  branchInfoDesc: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  nodesContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  connectorLineContainer: {
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  connectorLine: {
    width: 3,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },

  nodeCard: {
    width: "100%",
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lockedNodeCard: {
    opacity: 0.5,
    backgroundColor: "#0B1120",
  },
  maxNodeCard: {
    borderColor: RPGTheme.colors.gold,
  },

  nodeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedIconBg: {
    backgroundColor: RPGTheme.colors.secondaryCard,
  },
  nodeEmoji: {
    fontSize: 24,
  },
  nodeDetails: {
    flex: 1,
  },
  nodeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  nodeName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  nodeLevelBadge: {
    color: RPGTheme.colors.goldLight,
    fontSize: 11,
    fontWeight: "900",
  },
  nodeDesc: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 4,
  },
  nodeBonusText: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  upgradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  disabledUpgradeBtn: {
    backgroundColor: RPGTheme.colors.secondaryCard,
  },
  upgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  summaryCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  summaryTitle: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryPill: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
});
