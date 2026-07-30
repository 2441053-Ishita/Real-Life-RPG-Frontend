export type RarityType = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

export type ItemCategory =
  | "weapons"
  | "armor"
  | "helmets"
  | "boots"
  | "shields"
  | "potions"
  | "scrolls"
  | "special";

export type EquipmentSlot =
  | "weapon"
  | "helmet"
  | "armor"
  | "boots"
  | "shield"
  | "accessory";

export type StatBonus = {
  strength?: number;
  intelligence?: number;
  discipline?: number;
  wisdom?: number;
  vitality?: number;
  creativity?: number;
  hp?: number;
  attack?: number;
  defense?: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  slot?: EquipmentSlot;
  rarity: RarityType;
  icon: string;
  value: number;
  statBonus: StatBonus;
  quantity?: number;
};

export type EquipmentState = {
  weapon: InventoryItem | null;
  helmet: InventoryItem | null;
  armor: InventoryItem | null;
  boots: InventoryItem | null;
  shield: InventoryItem | null;
  accessory: InventoryItem | null;
};

export const DEFAULT_EQUIPMENT: EquipmentState = {
  weapon: null,
  helmet: null,
  armor: null,
  boots: null,
  shield: null,
  accessory: null,
};

export const CATEGORY_LABELS: Record<ItemCategory | "all", string> = {
  all: "All Items",
  weapons: "Weapons",
  armor: "Armor",
  helmets: "Helmets",
  boots: "Boots",
  shields: "Shields",
  potions: "Potions",
  scrolls: "Scrolls",
  special: "Special Items",
};

export const CATEGORY_ICONS: Record<ItemCategory | "all", string> = {
  all: "🎒",
  weapons: "⚔️",
  armor: "🛡️",
  helmets: "🪖",
  boots: "🥾",
  shields: "🛡️",
  potions: "🧪",
  scrolls: "📜",
  special: "✨",
};

export const SLOT_LABELS: Record<EquipmentSlot, { title: string; icon: string }> = {
  weapon: { title: "Weapon", icon: "⚔️" },
  helmet: { title: "Helmet", icon: "🪖" },
  armor: { title: "Armor", icon: "🛡️" },
  boots: { title: "Boots", icon: "🥾" },
  shield: { title: "Shield", icon: "🛡️" },
  accessory: { title: "Accessory", icon: "📿" },
};

export function getRarityColor(rarity: RarityType = "Common"): string {
  switch (rarity) {
    case "Mythic":
      return "#EF4444";
    case "Legendary":
      return "#F59E0B";
    case "Epic":
      return "#A855F7";
    case "Rare":
      return "#3B82F6";
    case "Common":
    default:
      return "#94A3B8";
  }
}

export function getRarityBg(rarity: RarityType = "Common"): string {
  switch (rarity) {
    case "Mythic":
      return "rgba(239, 68, 68, 0.15)";
    case "Legendary":
      return "rgba(245, 158, 11, 0.15)";
    case "Epic":
      return "rgba(168, 85, 247, 0.15)";
    case "Rare":
      return "rgba(59, 130, 246, 0.15)";
    case "Common":
    default:
      return "rgba(148, 163, 184, 0.15)";
  }
}

export const INITIAL_STARTER_ITEMS: InventoryItem[] = [
  {
    id: "iron-sword",
    name: "Iron Broadsword",
    description: "A trusty iron blade forged for brave adventurers.",
    category: "weapons",
    slot: "weapon",
    rarity: "Common",
    icon: "⚔️",
    value: 50,
    statBonus: { strength: 8, attack: 12 },
  },
  {
    id: "dragon-blade",
    name: "Dragon Slayer Blade",
    description: "Imbued with dragon flame. Increases Strength and Attack.",
    category: "weapons",
    slot: "weapon",
    rarity: "Legendary",
    icon: "🗡️",
    value: 500,
    statBonus: { strength: 30, attack: 45, discipline: 15 },
  },
  {
    id: "iron-helm",
    name: "Knight's Iron Helm",
    description: "Sturdy headgear protecting against incoming blows.",
    category: "helmets",
    slot: "helmet",
    rarity: "Common",
    icon: "🪖",
    value: 40,
    statBonus: { defense: 10, vitality: 5 },
  },
  {
    id: "crown-wisdom",
    name: "Crown of Wisdom",
    description: "Ancient relic that sharpens the wearer's mind.",
    category: "helmets",
    slot: "helmet",
    rarity: "Epic",
    icon: "👑",
    value: 350,
    statBonus: { wisdom: 25, intelligence: 20 },
  },
  {
    id: "heavy-cuirass",
    name: "Heavy Steel Armor",
    description: "Thick plate armor providing high defensive capability.",
    category: "armor",
    slot: "armor",
    rarity: "Rare",
    icon: "🛡️",
    value: 180,
    statBonus: { defense: 25, vitality: 15, strength: 5 },
  },
  {
    id: "swift-greaves",
    name: "Boots of Swiftness",
    description: "Lightweight boots that grant agility and discipline.",
    category: "boots",
    slot: "boots",
    rarity: "Rare",
    icon: "🥾",
    value: 120,
    statBonus: { discipline: 12, vitality: 8 },
  },
  {
    id: "guardian-shield",
    name: "Guardian Shield",
    description: "Heavy tower shield capable of deflecting boss strikes.",
    category: "shields",
    slot: "shield",
    rarity: "Epic",
    icon: "🛡️",
    value: 320,
    statBonus: { defense: 35, vitality: 15, strength: 8 },
  },
  {
    id: "amethyst-amulet",
    name: "Amulet of Creativity",
    description: "Glows with arcane energy. Boosts all mental stats.",
    category: "special",
    slot: "accessory",
    rarity: "Mythic",
    icon: "📿",
    value: 750,
    statBonus: { creativity: 30, wisdom: 20, intelligence: 20 },
  },
  {
    id: "health-potion",
    name: "Health Elixir",
    description: "Restores vitality and health points immediately.",
    category: "potions",
    rarity: "Common",
    icon: "🧪",
    value: 30,
    statBonus: { hp: 50, vitality: 5 },
  },
  {
    id: "xp-scroll",
    name: "Ancient XP Scroll",
    description: "Contains forgotten battle wisdom to aid in levelling.",
    category: "scrolls",
    rarity: "Rare",
    icon: "📜",
    value: 80,
    statBonus: { intelligence: 15, wisdom: 10 },
  },
];

export function calculateTotalEquipmentStats(equipment: EquipmentState): StatBonus {
  const total: StatBonus = {
    strength: 0,
    intelligence: 0,
    discipline: 0,
    wisdom: 0,
    vitality: 0,
    creativity: 0,
    hp: 0,
    attack: 0,
    defense: 0,
  };

  if (!equipment) return total;

  const slots: EquipmentSlot[] = ["weapon", "helmet", "armor", "boots", "shield", "accessory"];

  slots.forEach((slot) => {
    const item = equipment[slot];
    if (item && item.statBonus) {
      Object.entries(item.statBonus).forEach(([key, val]) => {
        const k = key as keyof StatBonus;
        total[k] = (total[k] || 0) + (val || 0);
      });
    }
  });

  return total;
}
