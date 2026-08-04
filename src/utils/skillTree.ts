export type SkillBranchId = "warrior" | "guardian" | "scholar" | "fortune";

export type SkillTreeNode = {
  id: string;
  name: string;
  emoji: string;
  branch: SkillBranchId;
  description: string;
  maxLevel: number;
  prerequisiteId?: string;
  prerequisiteMinLevel?: number;
  statBonusPerLevel: string;
};

export type SkillBranch = {
  id: SkillBranchId;
  name: string;
  emoji: string;
  color: string;
  description: string;
  skills: SkillTreeNode[];
};

export const SKILL_TREE_BRANCHES: SkillBranch[] = [
  {
    id: "warrior",
    name: "Warrior",
    emoji: "⚔️",
    color: "#EF4444",
    description: "Master of raw offense, critical hits, and physical power.",
    skills: [
      {
        id: "war_1",
        name: "Attack Power",
        emoji: "⚔️",
        branch: "warrior",
        description: "Increases raw attack power by +5% per level.",
        maxLevel: 5,
        statBonusPerLevel: "+5% Attack",
      },
      {
        id: "war_2",
        name: "Critical Strike",
        emoji: "💥",
        branch: "warrior",
        description: "Increases critical damage by +10% per level.",
        maxLevel: 5,
        prerequisiteId: "war_1",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "+10% Crit Dmg",
      },
      {
        id: "war_3",
        name: "Titanic Strength",
        emoji: "💪",
        branch: "warrior",
        description: "Increases Strength attribute by +2 per level.",
        maxLevel: 5,
        prerequisiteId: "war_2",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "+2 Strength",
      },
    ],
  },
  {
    id: "guardian",
    name: "Guardian",
    emoji: "🛡️",
    color: "#3B82F6",
    description: "Fortress of defense, resilience, and maximum health.",
    skills: [
      {
        id: "gua_1",
        name: "Iron Defense",
        emoji: "🛡️",
        branch: "guardian",
        description: "Increases defense by +5% per level.",
        maxLevel: 5,
        statBonusPerLevel: "+5% Defense",
      },
      {
        id: "gua_2",
        name: "Vital Reserve",
        emoji: "❤️",
        branch: "guardian",
        description: "Increases max Hero Health by +15 HP per level.",
        maxLevel: 5,
        prerequisiteId: "gua_1",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "+15 Max HP",
      },
      {
        id: "gua_3",
        name: "Damage Barrier",
        emoji: "🧱",
        branch: "guardian",
        description: "Reduces incoming damage by 2% per level.",
        maxLevel: 5,
        prerequisiteId: "gua_2",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "-2% Dmg Taken",
      },
    ],
  },
  {
    id: "scholar",
    name: "Scholar",
    emoji: "🧠",
    color: "#A855F7",
    description: "Seeker of wisdom, XP mastery, and intelligence.",
    skills: [
      {
        id: "sch_1",
        name: "XP Mastery",
        emoji: "✨",
        branch: "scholar",
        description: "Increases all XP gained from quests by +5% per level.",
        maxLevel: 5,
        statBonusPerLevel: "+5% XP Bonus",
      },
      {
        id: "sch_2",
        name: "Quest Scholar",
        emoji: "📜",
        branch: "scholar",
        description: "Increases quest rewards by +10% per level.",
        maxLevel: 5,
        prerequisiteId: "sch_1",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "+10% Quest Loot",
      },
      {
        id: "sch_3",
        name: "Arcane Mind",
        emoji: "🧠",
        branch: "scholar",
        description: "Increases Intelligence attribute by +2 per level.",
        maxLevel: 5,
        prerequisiteId: "sch_2",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "+2 Intelligence",
      },
    ],
  },
  {
    id: "fortune",
    name: "Fortune",
    emoji: "🍀",
    color: "#EAB308",
    description: "Favored by luck, coin bonus, and rare treasure.",
    skills: [
      {
        id: "for_1",
        name: "Coin Magnet",
        emoji: "🪙",
        branch: "fortune",
        description: "Increases Gold Coins earned by +5% per level.",
        maxLevel: 5,
        statBonusPerLevel: "+5% Coins",
      },
      {
        id: "for_2",
        name: "Loot Hunter",
        emoji: "💎",
        branch: "fortune",
        description: "Increases Rare item drop chance by +5% per level.",
        maxLevel: 5,
        prerequisiteId: "for_1",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "+5% Rare Drop",
      },
      {
        id: "for_3",
        name: "Lucky Strike",
        emoji: "🎰",
        branch: "fortune",
        description: "Grants +10% chance to double any reward per level.",
        maxLevel: 5,
        prerequisiteId: "for_2",
        prerequisiteMinLevel: 1,
        statBonusPerLevel: "+10% Double Drop",
      },
    ],
  },
];

export function calculateSkillTreeBonuses(allocated: Record<string, number> = {}) {
  let attackPct = 0;
  let critDmgPct = 0;
  let bonusStrength = 0;

  let defensePct = 0;
  let bonusHp = 0;
  let dmgReductionPct = 0;

  let xpBonusPct = 0;
  let questRewardPct = 0;
  let bonusIntelligence = 0;

  let coinBonusPct = 0;
  let rareLootPct = 0;
  let doubleDropPct = 0;

  // Warrior
  attackPct += (allocated["war_1"] || 0) * 5;
  critDmgPct += (allocated["war_2"] || 0) * 10;
  bonusStrength += (allocated["war_3"] || 0) * 2;

  // Guardian
  defensePct += (allocated["gua_1"] || 0) * 5;
  bonusHp += (allocated["gua_2"] || 0) * 15;
  dmgReductionPct += (allocated["gua_3"] || 0) * 2;

  // Scholar
  xpBonusPct += (allocated["sch_1"] || 0) * 5;
  questRewardPct += (allocated["sch_2"] || 0) * 10;
  bonusIntelligence += (allocated["sch_3"] || 0) * 2;

  // Fortune
  coinBonusPct += (allocated["for_1"] || 0) * 5;
  rareLootPct += (allocated["for_2"] || 0) * 5;
  doubleDropPct += (allocated["for_3"] || 0) * 10;

  return {
    attackPct,
    critDmgPct,
    bonusStrength,
    defensePct,
    bonusHp,
    dmgReductionPct,
    xpBonusPct,
    questRewardPct,
    bonusIntelligence,
    coinBonusPct,
    rareLootPct,
    doubleDropPct,
  };
}

export function isSkillUnlocked(
  node: SkillTreeNode,
  allocated: Record<string, number> = {}
): boolean {
  if (!node.prerequisiteId) return true;
  const prereqLevel = allocated[node.prerequisiteId] || 0;
  const requiredLevel = node.prerequisiteMinLevel || 1;
  return prereqLevel >= requiredLevel;
}
