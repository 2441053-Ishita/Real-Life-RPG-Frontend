import { auth, db } from "@/lib/firebase";
import { getHeroRank } from "../utils/rank";
import {
  DEFAULT_SKILLS,
  HeroSkills,
  SKILL_METADATA,
  SkillType,
} from "../utils/skills";
import {
  DEFAULT_EQUIPMENT,
  EquipmentState,
  SLOT_LABELS,
  calculateTotalEquipmentStats,
  getRarityColor,
} from "../utils/inventory";
import { RPGTheme } from "../utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";
import { router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
    completedQuests: [],
    totalQuestsCompleted: 0,
    skills: DEFAULT_SKILLS,
    equipment: DEFAULT_EQUIPMENT,
  });

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHero({
          heroName: data.heroName || "Hero of the Realm",
          className: data.className || "Paladin Adventurer",
          level: data.level ?? 1,
          xp: data.xp ?? 0,
          totalXP: data.totalXP ?? 0,
          coins: data.coins ?? 0,
          streak: data.streak ?? 1,
          completedQuests: (data.completedQuests || []).map((id: any) => String(id)),
          totalQuestsCompleted: data.totalQuestsCompleted ?? 0,
          skills: { ...DEFAULT_SKILLS, ...(data.skills || {}) },
          equipment: { ...DEFAULT_EQUIPMENT, ...(data.equipment || {}) },
          equippedAvatar: data.equippedAvatar || "warrior",
          avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
        });
      } else {
        import("firebase/firestore").then(({ setDoc, serverTimestamp }) => {
          setDoc(
            doc(db, "users", uid),
            {
              uid,
              heroName: "Hero of the Realm",
              class: "Paladin Adventurer",
              level: 1,
              xp: 0,
              totalXP: 0,
              coins: 0,
              streak: 1,
              skills: DEFAULT_SKILLS,
              equipment: DEFAULT_EQUIPMENT,
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

  const rank = getHeroRank(hero.level);
  const gearStats = calculateTotalEquipmentStats(hero.equipment);

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

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* LARGE HERO PORTRAIT CARD */}
        <View style={styles.heroPortraitCard}>
          <View style={styles.portraitFrame}>
            <AvatarImage
              avatarUrl={hero.avatarUrl}
              equippedAvatar={hero.equippedAvatar}
              size={84}
            />
            <View style={[styles.levelBadge, { backgroundColor: rank.color }]}>
              <Text style={styles.levelBadgeText}>Lvl {hero.level}</Text>
            </View>
          </View>

          <Text style={styles.heroName}>{hero.heroName}</Text>
          <Text style={styles.heroClass}>{hero.className}</Text>

          <View style={[styles.rankTag, { backgroundColor: rank.color }]}>
            <Text style={styles.rankTagText}>👑 {rank.name} RANK</Text>
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push("/edit-hero" as any)}
          >
            <Text style={styles.editProfileText}>Edit Hero Profile ⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* EQUIPPED LOADOUT SLOTS */}
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

        {/* HERO SKILLS PROGRESSION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>⚡ Hero Skill Masteries</Text>

          <View style={styles.skillsList}>
            {SKILL_KEYS.map((skillKey) => {
              const meta = SKILL_METADATA[skillKey];
              const points = hero.skills[skillKey] || 0;
              const level = Math.floor(points / 20) + 1;
              const percentage = Math.min(100, Math.round(((points % 20) / 20) * 100));

              return (
                <View key={skillKey} style={styles.skillItemCard}>
                  <View style={styles.skillHeaderRow}>
                    <Text style={styles.skillEmojiTitle}>
                      {meta.emoji} {meta.name}
                    </Text>
                    <Text style={styles.skillLvlText}>Lvl {level}</Text>
                  </View>

                  <View style={styles.skillTrack}>
                    <View
                      style={[
                        styles.skillFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: meta.color,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.skillSubRow}>
                    <Text style={styles.skillDesc}>{meta.description}</Text>
                    <Text style={styles.skillPtsText}>
                      {points} PTS ({percentage}%)
                    </Text>
                  </View>
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

  // HERO PORTRAIT CARD
  heroPortraitCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.goldBorder,
    marginBottom: 20,
  },
  portraitFrame: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: RPGTheme.colors.secondaryCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: RPGTheme.colors.purplePrimary,
    marginBottom: 12,
    position: "relative",
  },
  portraitEmoji: {
    fontSize: 42,
  },
  levelBadge: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 10,
    fontWeight: "900",
  },
  heroName: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heroName,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 2,
  },
  heroClass: {
    color: RPGTheme.colors.textSecondary,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  rankTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 16,
  },
  rankTagText: {
    color: "#FFFFFF",
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 11,
    fontWeight: "900",
  },
  editProfileButton: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
  },
  editProfileText: {
    color: RPGTheme.colors.purpleSecondary,
    fontFamily: RPGTheme.fonts.button,
    fontSize: 12,
    fontWeight: "800",
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "900",
  },
  armoryLinkText: {
    color: RPGTheme.colors.purpleSecondary,
    fontFamily: RPGTheme.fonts.button,
    fontSize: 12,
    fontWeight: "800",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotBox: {
    width: (Dimensions.get("window").width - 72) / 3,
    height: 80,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  slotFilled: {
    alignItems: "center",
  },
  slotIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  slotName: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  slotEmpty: {
    alignItems: "center",
  },
  slotEmptyIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  slotEmptyLabel: {
    color: RPGTheme.colors.textMuted,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },

  // SKILLS LIST
  skillsList: {
    gap: 12,
    marginTop: 12,
  },
  skillItemCard: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  skillHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  skillEmojiTitle: {
    color: RPGTheme.colors.textPrimary,
    fontFamily: RPGTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "900",
  },
  skillLvlText: {
    color: RPGTheme.colors.goldLight,
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 12,
    fontWeight: "900",
  },
  skillTrack: {
    height: 8,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  skillFill: {
    height: "100%",
    borderRadius: 8,
  },
  skillSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skillDesc: {
    color: RPGTheme.colors.textMuted,
    fontFamily: RPGTheme.fonts.body,
    fontSize: 10,
  },
  skillPtsText: {
    color: RPGTheme.colors.textSecondary,
    fontFamily: RPGTheme.fonts.stats,
    fontSize: 10,
    fontWeight: "800",
  },
});