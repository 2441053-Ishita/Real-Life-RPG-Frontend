export type SkillType =
  | "strength"
  | "intelligence"
  | "discipline"
  | "wisdom"
  | "vitality"
  | "creativity";

export type HeroSkills = {
  strength: number;
  intelligence: number;
  discipline: number;
  wisdom: number;
  vitality: number;
  creativity: number;
};

export const DEFAULT_SKILLS: HeroSkills = {
  strength: 0,
  intelligence: 0,
  discipline: 0,
  wisdom: 0,
  vitality: 0,
  creativity: 0,
};

export type SkillMetadata = {
  key: SkillType;
  name: string;
  emoji: string;
  color: string;
  bgLight: string;
  description: string;
};

export const SKILL_METADATA: Record<SkillType, SkillMetadata> = {
  strength: {
    key: "strength",
    name: "Strength",
    emoji: "💪",
    color: "#EF4444",
    bgLight: "rgba(239, 68, 68, 0.15)",
    description: "Physical power gained from workout & fitness quests",
  },
  intelligence: {
    key: "intelligence",
    name: "Intelligence",
    emoji: "🧠",
    color: "#3B82F6",
    bgLight: "rgba(59, 130, 246, 0.15)",
    description: "Mental acumen gained from studying & coding",
  },
  discipline: {
    key: "discipline",
    name: "Discipline",
    emoji: "⚡",
    color: "#EAB308",
    bgLight: "rgba(234, 179, 8, 0.15)",
    description: "Willpower gained from work & focused habits",
  },
  wisdom: {
    key: "wisdom",
    name: "Wisdom",
    emoji: "📚",
    color: "#8B5CF6",
    bgLight: "rgba(139, 92, 246, 0.15)",
    description: "Insight gained from reading & meditation",
  },
  vitality: {
    key: "vitality",
    name: "Vitality",
    emoji: "❤️",
    color: "#10B981",
    bgLight: "rgba(16, 185, 129, 0.15)",
    description: "Health & stamina gained from hydration & self-care",
  },
  creativity: {
    key: "creativity",
    name: "Creativity",
    emoji: "🎨",
    color: "#EC4899",
    bgLight: "rgba(236, 72, 153, 0.15)",
    description: "Artistic spirit gained from creative & writing quests",
  },
};

export function getSkillForCategory(category: string = "", title: string = ""): SkillType {
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();

  // 1. Fitness -> Strength
  if (
    cat.includes("fit") ||
    cat.includes("workout") ||
    cat.includes("gym") ||
    cat.includes("strength") ||
    t.includes("workout") ||
    t.includes("exercise") ||
    t.includes("gym") ||
    t.includes("pushup") ||
    t.includes("run") ||
    t.includes("cardio")
  ) {
    return "strength";
  }

  // 2. Study / Coding -> Intelligence
  if (
    cat.includes("study") ||
    cat.includes("code") ||
    cat.includes("coding") ||
    cat.includes("intel") ||
    t.includes("study") ||
    t.includes("code") ||
    t.includes("program") ||
    t.includes("math") ||
    t.includes("algorithm")
  ) {
    return "intelligence";
  }

  // 3. Meditation / Reading -> Wisdom
  if (
    cat.includes("meditat") ||
    cat.includes("read") ||
    cat.includes("mind") ||
    cat.includes("wisdom") ||
    t.includes("meditat") ||
    t.includes("read") ||
    t.includes("book") ||
    t.includes("mindful") ||
    t.includes("reflect")
  ) {
    return "wisdom";
  }

  // 4. Health / Hydration -> Vitality
  if (
    cat.includes("health") ||
    cat.includes("vitality") ||
    cat.includes("water") ||
    t.includes("water") ||
    t.includes("hydrate") ||
    t.includes("sleep") ||
    t.includes("eat") ||
    t.includes("diet") ||
    t.includes("walk")
  ) {
    return "vitality";
  }

  // 5. Creative -> Creativity
  if (
    cat.includes("creative") ||
    cat.includes("art") ||
    cat.includes("design") ||
    t.includes("write") ||
    t.includes("draw") ||
    t.includes("paint") ||
    t.includes("music") ||
    t.includes("design") ||
    t.includes("sketch")
  ) {
    return "creativity";
  }

  // 6. Work / Tasks -> Discipline (Default)
  return "discipline";
}

export function calculateSkillStats(points: number = 0) {
  const pointsPerLevel = 50;
  const level = Math.floor(points / pointsPerLevel) + 1;
  const currentLevelPts = points % pointsPerLevel;
  const progressPct = Math.min(Math.round((currentLevelPts / pointsPerLevel) * 100), 100);

  return {
    level,
    currentLevelPts,
    maxLevelPts: pointsPerLevel,
    progressPct,
    totalPoints: points,
  };
}
