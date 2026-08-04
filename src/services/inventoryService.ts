import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export type ItemCategory =
  | "weapons"
  | "armor"
  | "helmets"
  | "boots"
  | "shields"
  | "accessories"
  | "potions"
  | "scrolls"
  | "special"
  | "badge"
  | "avatar"
  | "theme"
  | "boost"
  | string;

export type ItemRarity = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic" | string;

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
  attack: number;
  defense: number;
  intelligence: number;
  vitality: number;
  speed: number;
  equipped: boolean;
  unlockedAt?: any;
  slot?: string | null;
  value?: number;
  unlockRequirement?: string;
  unlocked?: boolean;
}

export type UnlockableItemInput = Omit<InventoryItem, "unlockedAt" | "equipped"> & {
  equipped?: boolean;
  unlockRequirement?: string;
};

export const ALL_RPG_ITEMS: (UnlockableItemInput & { unlockRequirement: string })[] = [
  // --- WEAPONS ---
  {
    id: "wooden_sword",
    name: "Wooden Sword",
    description: "A basic wooden training sword.",
    category: "weapons",
    rarity: "Common",
    icon: "🗡️",
    attack: 5,
    defense: 0,
    intelligence: 0,
    vitality: 0,
    speed: 0,
    slot: "weapon",
    unlockRequirement: "Starter Item",
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    description: "Forged iron blade for tough battles.",
    category: "weapons",
    rarity: "Rare",
    icon: "⚔️",
    attack: 15,
    defense: 2,
    intelligence: 0,
    vitality: 0,
    speed: 2,
    slot: "weapon",
    unlockRequirement: "Reach Level 7",
  },
  {
    id: "steel_greatsword",
    name: "Steel Greatsword",
    description: "Heavy steel blade built for massive damage.",
    category: "weapons",
    rarity: "Epic",
    icon: "⚔️",
    attack: 28,
    defense: 5,
    intelligence: 0,
    vitality: 0,
    speed: -2,
    slot: "weapon",
    unlockRequirement: "Reach Level 11",
  },
  {
    id: "battle_axe",
    name: "Battle Axe",
    description: "A ferocious double-bladed axe.",
    category: "weapons",
    rarity: "Rare",
    icon: "🪓",
    attack: 18,
    defense: 0,
    intelligence: 0,
    vitality: 2,
    speed: 0,
    slot: "weapon",
    unlockRequirement: "Reach Level 8",
  },
  {
    id: "war_hammer",
    name: "War Hammer",
    description: "Heavy warhammer crushing enemy armor.",
    category: "weapons",
    rarity: "Epic",
    icon: "🔨",
    attack: 32,
    defense: 5,
    intelligence: 0,
    vitality: 0,
    speed: -4,
    slot: "weapon",
    unlockRequirement: "Complete 40 Quests",
  },
  {
    id: "long_bow",
    name: "Long Bow",
    description: "Precision ranged bow for swift strikes.",
    category: "weapons",
    rarity: "Rare",
    icon: "🏹",
    attack: 20,
    defense: 0,
    intelligence: 0,
    vitality: 0,
    speed: 5,
    slot: "weapon",
    unlockRequirement: "Reach Level 9",
  },
  {
    id: "crossbow",
    name: "Crossbow",
    description: "High-powered mechanized crossbow.",
    category: "weapons",
    rarity: "Epic",
    icon: "🏹",
    attack: 30,
    defense: 0,
    intelligence: 0,
    vitality: 0,
    speed: 8,
    slot: "weapon",
    unlockRequirement: "Complete 60 Quests",
  },
  {
    id: "assassin_dagger",
    name: "Assassin Dagger",
    description: "Deadly stealth dagger with lightning swiftness.",
    category: "weapons",
    rarity: "Epic",
    icon: "🗡️",
    attack: 25,
    defense: 0,
    intelligence: 5,
    vitality: 0,
    speed: 15,
    slot: "weapon",
    unlockRequirement: "Reach Level 14",
  },
  {
    id: "crystal_blade",
    name: "Crystal Blade",
    description: "Infused with pure arcane energy.",
    category: "weapons",
    rarity: "Legendary",
    icon: "💎",
    attack: 60,
    defense: 10,
    intelligence: 20,
    vitality: 0,
    speed: 10,
    slot: "weapon",
    unlockRequirement: "Complete 120 Quests",
  },
  {
    id: "dragon_slayer_sword",
    name: "Dragon Slayer Sword",
    description: "Ultimate blade forged from ancient dragon steel.",
    category: "weapons",
    rarity: "Legendary",
    icon: "🐲",
    attack: 85,
    defense: 20,
    intelligence: 10,
    vitality: 15,
    speed: 5,
    slot: "weapon",
    unlockRequirement: "Reach Level 20",
  },

  // --- ARMOR ---
  {
    id: "cloth_armor",
    name: "Cloth Armor",
    description: "Lightweight cloth armor providing basic protection.",
    category: "armor",
    rarity: "Common",
    icon: "🥋",
    attack: 0,
    defense: 5,
    intelligence: 0,
    vitality: 2,
    speed: 0,
    slot: "armor",
    unlockRequirement: "Starter Item",
  },
  {
    id: "leather_armor",
    name: "Leather Armor",
    description: "Flexible leather armor for agile movement.",
    category: "armor",
    rarity: "Common",
    icon: "🦺",
    attack: 0,
    defense: 8,
    intelligence: 0,
    vitality: 3,
    speed: 3,
    slot: "armor",
    unlockRequirement: "Reach Level 3",
  },
  {
    id: "iron_armor",
    name: "Iron Armor",
    description: "Reinforced iron plates offering solid defense.",
    category: "armor",
    rarity: "Rare",
    icon: "🛡️",
    attack: 0,
    defense: 15,
    intelligence: 0,
    vitality: 5,
    speed: 0,
    slot: "armor",
    unlockRequirement: "Reach Level 6",
  },
  {
    id: "steel_armor",
    name: "Steel Armor",
    description: "Tempered steel plate mail built for war.",
    category: "armor",
    rarity: "Epic",
    icon: "🛡️",
    attack: 0,
    defense: 22,
    intelligence: 0,
    vitality: 8,
    speed: -1,
    slot: "armor",
    unlockRequirement: "Reach Level 10",
  },
  {
    id: "knight_armor",
    name: "Knight Armor",
    description: "Heavy plate armor worn by legendary knights.",
    category: "armor",
    rarity: "Epic",
    icon: "🛡️",
    attack: 5,
    defense: 25,
    intelligence: 0,
    vitality: 15,
    speed: -2,
    slot: "armor",
    unlockRequirement: "Complete 25 Quests",
  },
  {
    id: "guardian_armor",
    name: "Guardian Armor",
    description: "Sacred plate armor imbued with guardian aura.",
    category: "armor",
    rarity: "Legendary",
    icon: "🛡️",
    attack: 0,
    defense: 40,
    intelligence: 10,
    vitality: 25,
    speed: 0,
    slot: "armor",
    unlockRequirement: "Reach Level 16",
  },
  {
    id: "dragon_armor",
    name: "Dragon Armor",
    description: "Forged from invincible dragon scales.",
    category: "armor",
    rarity: "Legendary",
    icon: "🐲",
    attack: 15,
    defense: 60,
    intelligence: 10,
    vitality: 35,
    speed: 0,
    slot: "armor",
    unlockRequirement: "Complete 120 Quests",
  },
  {
    id: "shadow_armor",
    name: "Shadow Armor",
    description: "Stealthy plate woven from shadow threads.",
    category: "armor",
    rarity: "Epic",
    icon: "🥋",
    attack: 0,
    defense: 28,
    intelligence: 10,
    vitality: 10,
    speed: 15,
    slot: "armor",
    unlockRequirement: "Complete 80 Quests",
  },
  {
    id: "paladin_armor",
    name: "Paladin Armor",
    description: "Holy blessed armor of supreme justice.",
    category: "armor",
    rarity: "Legendary",
    icon: "✨",
    attack: 10,
    defense: 50,
    intelligence: 20,
    vitality: 30,
    speed: 0,
    slot: "armor",
    unlockRequirement: "Reach Level 18",
  },

  // --- HELMETS ---
  {
    id: "leather_cap",
    name: "Leather Cap",
    description: "A simple leather cap for head protection.",
    category: "helmets",
    rarity: "Common",
    icon: "🧢",
    attack: 0,
    defense: 2,
    intelligence: 1,
    vitality: 1,
    speed: 0,
    slot: "helmet",
    unlockRequirement: "Starter Item",
  },
  {
    id: "iron_helmet",
    name: "Iron Helmet",
    description: "Sturdy iron helmet providing high defense.",
    category: "helmets",
    rarity: "Rare",
    icon: "🪖",
    attack: 0,
    defense: 8,
    intelligence: 2,
    vitality: 5,
    speed: 0,
    slot: "helmet",
    unlockRequirement: "Reach Level 5",
  },
  {
    id: "viking_helmet",
    name: "Viking Helmet",
    description: "Horned helm boosting battle morale.",
    category: "helmets",
    rarity: "Rare",
    icon: "🪖",
    attack: 4,
    defense: 12,
    intelligence: 0,
    vitality: 5,
    speed: 0,
    slot: "helmet",
    unlockRequirement: "Reach Level 8",
  },
  {
    id: "knight_helmet",
    name: "Knight Helmet",
    description: "Full visor helm of honorable knights.",
    category: "helmets",
    rarity: "Epic",
    icon: "🪖",
    attack: 0,
    defense: 18,
    intelligence: 5,
    vitality: 8,
    speed: 0,
    slot: "helmet",
    unlockRequirement: "Complete 30 Quests",
  },
  {
    id: "shadow_hood",
    name: "Shadow Hood",
    description: "Enchanted hood hiding presence in darkness.",
    category: "helmets",
    rarity: "Epic",
    icon: "🧢",
    attack: 0,
    defense: 20,
    intelligence: 15,
    vitality: 5,
    speed: 10,
    slot: "helmet",
    unlockRequirement: "Reach Level 12",
  },
  {
    id: "golden_helmet",
    name: "Golden Helmet",
    description: "Shining crown helm for noble warriors.",
    category: "helmets",
    rarity: "Epic",
    icon: "👑",
    attack: 0,
    defense: 25,
    intelligence: 12,
    vitality: 10,
    speed: 0,
    slot: "helmet",
    unlockRequirement: "Complete 70 Quests",
  },
  {
    id: "guardian_helm",
    name: "Guardian Helm",
    description: "Sanctified helmet granting divine vision.",
    category: "helmets",
    rarity: "Legendary",
    icon: "🪖",
    attack: 0,
    defense: 38,
    intelligence: 15,
    vitality: 20,
    speed: 0,
    slot: "helmet",
    unlockRequirement: "Reach Level 15",
  },
  {
    id: "dragon_helm",
    name: "Dragon Helm",
    description: "Carved from dragon skull with blazing fury.",
    category: "helmets",
    rarity: "Legendary",
    icon: "🐲",
    attack: 20,
    defense: 55,
    intelligence: 10,
    vitality: 25,
    speed: 0,
    slot: "helmet",
    unlockRequirement: "Complete 110 Quests",
  },

  // --- BOOTS ---
  {
    id: "traveler_boots",
    name: "Traveler Boots",
    description: "Sturdy boots for fast travel.",
    category: "boots",
    rarity: "Common",
    icon: "🥾",
    attack: 0,
    defense: 1,
    intelligence: 0,
    vitality: 1,
    speed: 5,
    slot: "boots",
    unlockRequirement: "Starter Item",
  },
  {
    id: "leather_boots",
    name: "Leather Boots",
    description: "Light leather boots boosting speed.",
    category: "boots",
    rarity: "Common",
    icon: "🥾",
    attack: 0,
    defense: 3,
    intelligence: 0,
    vitality: 2,
    speed: 8,
    slot: "boots",
    unlockRequirement: "Reach Level 3",
  },
  {
    id: "ranger_boots",
    name: "Ranger Boots",
    description: "Reinforced boots designed for wild terrain.",
    category: "boots",
    rarity: "Rare",
    icon: "🥾",
    attack: 0,
    defense: 6,
    intelligence: 0,
    vitality: 4,
    speed: 12,
    slot: "boots",
    unlockRequirement: "Reach Level 6",
  },
  {
    id: "iron_boots",
    name: "Iron Boots",
    description: "Heavy iron boots providing extra stability.",
    category: "boots",
    rarity: "Rare",
    icon: "🥾",
    attack: 0,
    defense: 12,
    intelligence: 0,
    vitality: 8,
    speed: 5,
    slot: "boots",
    unlockRequirement: "Reach Level 9",
  },
  {
    id: "swift_boots",
    name: "Swift Boots",
    description: "Enchanted boots granting extreme mobility.",
    category: "boots",
    rarity: "Epic",
    icon: "🥾",
    attack: 0,
    defense: 10,
    intelligence: 0,
    vitality: 5,
    speed: 22,
    slot: "boots",
    unlockRequirement: "Complete 45 Quests",
  },
  {
    id: "shadow_boots",
    name: "Shadow Boots",
    description: "Silent boots moving without a sound.",
    category: "boots",
    rarity: "Epic",
    icon: "🥾",
    attack: 0,
    defense: 15,
    intelligence: 10,
    vitality: 5,
    speed: 25,
    slot: "boots",
    unlockRequirement: "Reach Level 13",
  },
  {
    id: "guardian_boots",
    name: "Guardian Boots",
    description: "Blessed boots guarding every step.",
    category: "boots",
    rarity: "Legendary",
    icon: "🥾",
    attack: 0,
    defense: 30,
    intelligence: 10,
    vitality: 20,
    speed: 15,
    slot: "boots",
    unlockRequirement: "Reach Level 17",
  },
  {
    id: "dragon_boots",
    name: "Dragon Boots",
    description: "Dragon-scale boots stomping through lava.",
    category: "boots",
    rarity: "Legendary",
    icon: "🐲",
    attack: 10,
    defense: 45,
    intelligence: 10,
    vitality: 25,
    speed: 20,
    slot: "boots",
    unlockRequirement: "Complete 130 Quests",
  },

  // --- SHIELDS ---
  {
    id: "wooden_shield",
    name: "Wooden Shield",
    description: "A simple wooden shield.",
    category: "shields",
    rarity: "Common",
    icon: "🛡️",
    attack: 0,
    defense: 4,
    intelligence: 0,
    vitality: 1,
    speed: 0,
    slot: "shield",
    unlockRequirement: "Reach Level 2",
  },
  {
    id: "bronze_shield",
    name: "Bronze Shield",
    description: "Solid bronze shield built for defense.",
    category: "shields",
    rarity: "Common",
    icon: "🛡️",
    attack: 0,
    defense: 7,
    intelligence: 0,
    vitality: 2,
    speed: 0,
    slot: "shield",
    unlockRequirement: "Starter Item",
  },
  {
    id: "iron_shield",
    name: "Iron Shield",
    description: "Heavy iron shield deflecting heavy blows.",
    category: "shields",
    rarity: "Rare",
    icon: "🛡️",
    attack: 0,
    defense: 14,
    intelligence: 0,
    vitality: 5,
    speed: 0,
    slot: "shield",
    unlockRequirement: "Reach Level 6",
  },
  {
    id: "steel_shield",
    name: "Steel Shield",
    description: "Reinforced steel shield with high block power.",
    category: "shields",
    rarity: "Epic",
    icon: "🛡️",
    attack: 0,
    defense: 22,
    intelligence: 0,
    vitality: 8,
    speed: -1,
    slot: "shield",
    unlockRequirement: "Reach Level 10",
  },
  {
    id: "knight_shield",
    name: "Knight Shield",
    description: "Crested shield of chivalric order.",
    category: "shields",
    rarity: "Epic",
    icon: "🛡️",
    attack: 4,
    defense: 28,
    intelligence: 0,
    vitality: 12,
    speed: 0,
    slot: "shield",
    unlockRequirement: "Complete 35 Quests",
  },
  {
    id: "guardian_shield",
    name: "Guardian Shield",
    description: "Sacred aegis protecting champions.",
    category: "shields",
    rarity: "Legendary",
    icon: "🛡️",
    attack: 0,
    defense: 42,
    intelligence: 10,
    vitality: 22,
    speed: 0,
    slot: "shield",
    unlockRequirement: "Reach Level 16",
  },
  {
    id: "dragon_shield",
    name: "Dragon Shield",
    description: "Forged from impenetrable dragon head bone.",
    category: "shields",
    rarity: "Legendary",
    icon: "🐲",
    attack: 10,
    defense: 62,
    intelligence: 10,
    vitality: 30,
    speed: 0,
    slot: "shield",
    unlockRequirement: "Complete 125 Quests",
  },
  {
    id: "magic_barrier_shield",
    name: "Magic Barrier Shield",
    description: "Arcane barrier converting spells to armor.",
    category: "shields",
    rarity: "Legendary",
    icon: "🔮",
    attack: 0,
    defense: 50,
    intelligence: 35,
    vitality: 25,
    speed: 5,
    slot: "shield",
    unlockRequirement: "Reach Level 19",
  },

  // --- ACCESSORIES ---
  {
    id: "lucky_ring",
    name: "Lucky Ring",
    description: "Simple ring bringing good fortune.",
    category: "accessories",
    rarity: "Common",
    icon: "💍",
    attack: 0,
    defense: 2,
    intelligence: 2,
    vitality: 2,
    speed: 2,
    slot: "accessory",
    unlockRequirement: "Starter Item",
  },
  {
    id: "silver_ring",
    name: "Silver Ring",
    description: "Polished silver ring boosting stats.",
    category: "accessories",
    rarity: "Rare",
    icon: "💍",
    attack: 0,
    defense: 5,
    intelligence: 5,
    vitality: 0,
    speed: 0,
    slot: "accessory",
    unlockRequirement: "Reach Level 4",
  },
  {
    id: "warrior_necklace",
    name: "Warrior Necklace",
    description: "Tooth necklace inspiring fierce strength.",
    category: "accessories",
    rarity: "Rare",
    icon: "📿",
    attack: 8,
    defense: 0,
    intelligence: 0,
    vitality: 5,
    speed: 0,
    slot: "accessory",
    unlockRequirement: "Reach Level 7",
  },
  {
    id: "magic_ring",
    name: "Magic Ring",
    description: "Enchanted ring boosting Intelligence and Vitality.",
    category: "accessories",
    rarity: "Epic",
    icon: "💍",
    attack: 5,
    defense: 5,
    intelligence: 20,
    vitality: 10,
    speed: 5,
    slot: "accessory",
    unlockRequirement: "Reach Level 10",
  },
  {
    id: "magic_amulet",
    name: "Magic Amulet",
    description: "Mystic pendant absorbing damage into mana.",
    category: "accessories",
    rarity: "Epic",
    icon: "📿",
    attack: 0,
    defense: 10,
    intelligence: 18,
    vitality: 8,
    speed: 0,
    slot: "accessory",
    unlockRequirement: "Complete 40 Quests",
  },
  {
    id: "power_bracelet",
    name: "Power Bracelet",
    description: "Heavy band amplifying attack strength.",
    category: "accessories",
    rarity: "Epic",
    icon: "⌚",
    attack: 20,
    defense: 0,
    intelligence: 0,
    vitality: 10,
    speed: 0,
    slot: "accessory",
    unlockRequirement: "Reach Level 12",
  },
  {
    id: "emerald_pendant",
    name: "Emerald Pendant",
    description: "Radiant gem sharpening mind and agility.",
    category: "accessories",
    rarity: "Epic",
    icon: "📿",
    attack: 0,
    defense: 0,
    intelligence: 25,
    vitality: 15,
    speed: 10,
    slot: "accessory",
    unlockRequirement: "Complete 65 Quests",
  },
  {
    id: "ruby_ring",
    name: "Ruby Ring",
    description: "Crimson ring pulsating with dragon fire.",
    category: "accessories",
    rarity: "Legendary",
    icon: "💍",
    attack: 35,
    defense: 0,
    intelligence: 15,
    vitality: 20,
    speed: 0,
    slot: "accessory",
    unlockRequirement: "Reach Level 16",
  },
  {
    id: "crown_of_kings",
    name: "Crown of Kings",
    description: "Relic crown worn by sovereign emperors.",
    category: "accessories",
    rarity: "Legendary",
    icon: "👑",
    attack: 20,
    defense: 25,
    intelligence: 45,
    vitality: 35,
    speed: 0,
    slot: "accessory",
    unlockRequirement: "Complete 150 Quests",
  },
  {
    id: "phoenix_charm",
    name: "Phoenix Charm",
    description: "Warm charm granting undying vitality.",
    category: "accessories",
    rarity: "Legendary",
    icon: "🪶",
    attack: 20,
    defense: 0,
    intelligence: 30,
    vitality: 50,
    speed: 20,
    slot: "accessory",
    unlockRequirement: "Complete 180 Quests",
  },
  {
    id: "heros_emblem",
    name: "Hero's Emblem",
    description: "Ultimate insignia awarded to true realm champions.",
    category: "accessories",
    rarity: "Legendary",
    icon: "🏅",
    attack: 60,
    defense: 60,
    intelligence: 60,
    vitality: 60,
    speed: 60,
    slot: "accessory",
    unlockRequirement: "Complete 200 Quests",
  },

  // --- POTIONS ---
  {
    id: "health_potion",
    name: "Health Potion",
    description: "Restores health during tough battles.",
    category: "potions",
    rarity: "Common",
    icon: "🧪",
    attack: 0,
    defense: 0,
    intelligence: 0,
    vitality: 5,
    speed: 0,
    unlockRequirement: "Starter Item",
  },
  {
    id: "mana_potion",
    name: "Mana Potion",
    description: "Restores mana and boosts Intelligence.",
    category: "potions",
    rarity: "Common",
    icon: "🧪",
    attack: 0,
    defense: 0,
    intelligence: 5,
    vitality: 0,
    speed: 0,
    unlockRequirement: "Reach Level 4",
  },
  {
    id: "strength_potion",
    name: "Strength Potion",
    description: "Temporarily boosts attack power.",
    category: "potions",
    rarity: "Rare",
    icon: "🧪",
    attack: 10,
    defense: 0,
    intelligence: 0,
    vitality: 0,
    speed: 0,
    unlockRequirement: "Reach Level 6",
  },
  {
    id: "defense_potion",
    name: "Defense Potion",
    description: "Hardens skin to boost defense.",
    category: "potions",
    rarity: "Rare",
    icon: "🧪",
    attack: 0,
    defense: 10,
    intelligence: 0,
    vitality: 0,
    speed: 0,
    unlockRequirement: "Reach Level 8",
  },
  {
    id: "speed_potion",
    name: "Speed Potion",
    description: "Grants swiftness to move faster.",
    category: "potions",
    rarity: "Epic",
    icon: "🧪",
    attack: 0,
    defense: 0,
    intelligence: 0,
    vitality: 0,
    speed: 15,
    unlockRequirement: "Reach Level 10",
  },
  {
    id: "elixir_of_life",
    name: "Elixir of Life",
    description: "Ancient elixir granting immense Vitality.",
    category: "potions",
    rarity: "Legendary",
    icon: "🧪",
    attack: 5,
    defense: 5,
    intelligence: 5,
    vitality: 30,
    speed: 5,
    unlockRequirement: "Complete 100 Quests",
  },

  // --- SCROLLS ---
  {
    id: "scroll_fireball",
    name: "Scroll of Fireball",
    description: "Contains a powerful fiery spell.",
    category: "scrolls",
    rarity: "Rare",
    icon: "📜",
    attack: 12,
    defense: 0,
    intelligence: 8,
    vitality: 0,
    speed: 0,
    unlockRequirement: "Reach Level 5",
  },
  {
    id: "scroll_ice_blast",
    name: "Scroll of Ice Blast",
    description: "Freezes enemies with a blast of frost.",
    category: "scrolls",
    rarity: "Rare",
    icon: "📜",
    attack: 8,
    defense: 5,
    intelligence: 10,
    vitality: 0,
    speed: 0,
    unlockRequirement: "Reach Level 7",
  },
  {
    id: "scroll_lightning",
    name: "Scroll of Lightning",
    description: "Summons a destructive lightning strike.",
    category: "scrolls",
    rarity: "Epic",
    icon: "📜",
    attack: 25,
    defense: 0,
    intelligence: 15,
    vitality: 0,
    speed: 5,
    unlockRequirement: "Reach Level 9",
  },
  {
    id: "scroll_teleportation",
    name: "Scroll of Teleportation",
    description: "Instantly teleports the user to safety.",
    category: "scrolls",
    rarity: "Epic",
    icon: "📜",
    attack: 0,
    defense: 5,
    intelligence: 10,
    vitality: 0,
    speed: 25,
    unlockRequirement: "Complete 50 Quests",
  },
  {
    id: "scroll_wisdom",
    name: "Scroll of Wisdom",
    description: "Ancient knowledge boosting Intelligence.",
    category: "scrolls",
    rarity: "Legendary",
    icon: "📜",
    attack: 10,
    defense: 10,
    intelligence: 40,
    vitality: 10,
    speed: 5,
    unlockRequirement: "Complete 75 Quests",
  },
  {
    id: "scroll_resurrection",
    name: "Scroll of Resurrection",
    description: "Revives and fully restores hero power.",
    category: "scrolls",
    rarity: "Legendary",
    icon: "📜",
    attack: 20,
    defense: 20,
    intelligence: 20,
    vitality: 50,
    speed: 10,
    unlockRequirement: "Complete 150 Quests",
  },

  // --- SPECIAL ITEMS ---
  {
    id: "ancient_key",
    name: "Ancient Key",
    description: "Unlocks ancient dungeon vaults.",
    category: "special",
    rarity: "Common",
    icon: "🔑",
    attack: 0,
    defense: 2,
    intelligence: 5,
    vitality: 0,
    speed: 0,
    unlockRequirement: "Complete 10 Quests",
  },
  {
    id: "treasure_map",
    name: "Treasure Map",
    description: "Points to hidden realm treasures.",
    category: "special",
    rarity: "Common",
    icon: "🗺️",
    attack: 0,
    defense: 0,
    intelligence: 10,
    vitality: 0,
    speed: 5,
    unlockRequirement: "Complete 20 Quests",
  },
  {
    id: "magic_crystal",
    name: "Magic Crystal",
    description: "Pulsates with raw arcane energy.",
    category: "special",
    rarity: "Rare",
    icon: "🔮",
    attack: 5,
    defense: 5,
    intelligence: 15,
    vitality: 5,
    speed: 0,
    unlockRequirement: "Reach Level 8",
  },
  {
    id: "phoenix_feather",
    name: "Phoenix Feather",
    description: "Warm feather of an immortal phoenix.",
    category: "special",
    rarity: "Epic",
    icon: "🪶",
    attack: 10,
    defense: 5,
    intelligence: 15,
    vitality: 20,
    speed: 10,
    unlockRequirement: "Reach Level 12",
  },
  {
    id: "dragon_egg",
    name: "Dragon Egg",
    description: "A heavy egg radiating intense heat.",
    category: "special",
    rarity: "Legendary",
    icon: "🥚",
    attack: 30,
    defense: 30,
    intelligence: 10,
    vitality: 30,
    speed: 0,
    unlockRequirement: "Complete 100 Quests",
  },
  {
    id: "mystic_orb",
    name: "Mystic Orb",
    description: "Glows with mysterious cosmic light.",
    category: "special",
    rarity: "Epic",
    icon: "🔮",
    attack: 15,
    defense: 10,
    intelligence: 35,
    vitality: 15,
    speed: 5,
    unlockRequirement: "Reach Level 15",
  },
  {
    id: "royal_crown",
    name: "Royal Crown",
    description: "Symbol of supreme kingdom rule.",
    category: "special",
    rarity: "Legendary",
    icon: "👑",
    attack: 25,
    defense: 25,
    intelligence: 30,
    vitality: 30,
    speed: 10,
    unlockRequirement: "Complete 200 Quests",
  },
  {
    id: "golden_compass",
    name: "Golden Compass",
    description: "Guides dedicated adventurers on long streaks.",
    category: "special",
    rarity: "Rare",
    icon: "🧭",
    attack: 0,
    defense: 5,
    intelligence: 10,
    vitality: 5,
    speed: 20,
    unlockRequirement: "30 Day Streak",
  },
  {
    id: "time_relic",
    name: "Time Relic",
    description: "Controls the flow of time itself.",
    category: "special",
    rarity: "Legendary",
    icon: "⏳",
    attack: 20,
    defense: 20,
    intelligence: 40,
    vitality: 20,
    speed: 30,
    unlockRequirement: "Reach Level 20",
  },
  {
    id: "heros_medal",
    name: "Hero's Medal",
    description: "Awarded only to true champions who master all achievements.",
    category: "special",
    rarity: "Legendary",
    icon: "🏅",
    attack: 50,
    defense: 50,
    intelligence: 50,
    vitality: 50,
    speed: 50,
    unlockRequirement: "Complete All Achievements",
  },
];

export const STARTER_ITEMS = ALL_RPG_ITEMS.filter(
  (item) => item.unlockRequirement === "Starter Item"
);

export class InventoryService {
  /**
   * Initializes starter items for a new user in users/{uid}/inventory/{itemId}.
   */
  static async initializeStarterInventory(uid: string): Promise<void> {
    if (!uid) return;

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const userData = userSnap.data() || {};
      if (userData.starterInventoryInitialized) {
        return; // Inserted only once
      }

      const batch = writeBatch(db);

      for (const item of STARTER_ITEMS) {
        const itemRef = doc(db, "users", uid, "inventory", item.id);
        batch.set(
          itemRef,
          {
            ...item,
            unlockedAt: serverTimestamp(),
            equipped: false,
          },
          { merge: true }
        );
      }

      batch.update(userRef, {
        starterInventoryInitialized: true,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      console.log(`[InventoryService] Starter inventory initialized for user ${uid}`);
    } catch (error) {
      console.error("[InventoryService] Error initializing starter inventory:", error);
    }
  }

  /**
   * Unlocks an item for a user if it does not already exist in users/{uid}/inventory/{itemId}.
   */
  static async unlockItem(
    uid: string,
    item: UnlockableItemInput
  ): Promise<boolean> {
    if (!uid || !item.id) return false;

    try {
      const itemRef = doc(db, "users", uid, "inventory", item.id);
      const snap = await getDoc(itemRef);

      if (snap.exists()) {
        return false; // Item already unlocked
      }

      await setDoc(itemRef, {
        id: item.id,
        name: item.name,
        description: item.description || "",
        category: item.category,
        rarity: item.rarity,
        icon: item.icon,
        attack: item.attack ?? 0,
        defense: item.defense ?? 0,
        intelligence: item.intelligence ?? 0,
        vitality: item.vitality ?? 0,
        speed: item.speed ?? 0,
        slot: item.slot ?? null,
        unlockedAt: serverTimestamp(),
        equipped: item.equipped ?? false,
      });

      console.log(`[InventoryService] Unlocked item '${item.id}' for user ${uid}`);
      return true;
    } catch (error) {
      console.error("[InventoryService] Error unlocking item:", error);
      return false;
    }
  }

  /**
   * Fetches all inventory items from users/{uid}/inventory.
   */
  static async getInventory(uid: string): Promise<InventoryItem[]> {
    if (!uid) return [];

    try {
      const inventoryRef = collection(db, "users", uid, "inventory");
      const snap = await getDocs(inventoryRef);

      return snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "Unknown Item",
          description: data.description || "",
          category: data.category || "weapons",
          rarity: data.rarity || "Common",
          icon: data.icon || "⚔️",
          attack: Number(data.attack ?? 0),
          defense: Number(data.defense ?? 0),
          intelligence: Number(data.intelligence ?? 0),
          vitality: Number(data.vitality ?? 0),
          speed: Number(data.speed ?? 0),
          equipped: Boolean(data.equipped),
          unlockedAt: data.unlockedAt,
          slot: data.slot || null,
        };
      });
    } catch (error) {
      console.error("[InventoryService] Error fetching inventory:", error);
      return [];
    }
  }

  /**
   * Recalculates total stats from all equipped items and updates users/{uid} in Firestore.
   */
  static async updateCharacterStatsFromEquipped(
    uid: string
  ): Promise<Record<string, number>> {
    if (!uid) return { attack: 0, defense: 0, intelligence: 0, vitality: 0, speed: 0 };

    try {
      const inventoryRef = collection(db, "users", uid, "inventory");
      const snap = await getDocs(inventoryRef);

      const totalStats = {
        attack: 0,
        defense: 0,
        intelligence: 0,
        vitality: 0,
        speed: 0,
      };

      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.equipped) {
          totalStats.attack += Number(data.attack ?? 0);
          totalStats.defense += Number(data.defense ?? 0);
          totalStats.intelligence += Number(data.intelligence ?? 0);
          totalStats.vitality += Number(data.vitality ?? 0);
          totalStats.speed += Number(data.speed ?? 0);
        }
      });

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        characterStats: totalStats,
        stats: totalStats,
        updatedAt: serverTimestamp(),
      });

      console.log(`[InventoryService] Character stats updated for user ${uid}:`, totalStats);
      return totalStats;
    } catch (error) {
      console.error("[InventoryService] Error updating character stats:", error);
      return { attack: 0, defense: 0, intelligence: 0, vitality: 0, speed: 0 };
    }
  }

  /**
   * Equips an item and automatically unequips any other item in the same category.
   * Requirement: Allow equipping one item at a time per category.
   * Recalculates character stats based on equipped items.
   */
  static async equipItem(uid: string, itemId: string): Promise<void> {
    if (!uid || !itemId) return;

    try {
      const targetDocRef = doc(db, "users", uid, "inventory", itemId);
      const targetSnap = await getDoc(targetDocRef);

      if (!targetSnap.exists()) {
        throw new Error(`Item ${itemId} not found in inventory.`);
      }

      const targetData = targetSnap.data();
      const targetCategory = targetData.category;

      const inventoryRef = collection(db, "users", uid, "inventory");
      const inventorySnap = await getDocs(inventoryRef);

      const batch = writeBatch(db);

      inventorySnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.category === targetCategory) {
          const docRef = doc(db, "users", uid, "inventory", docSnap.id);
          if (docSnap.id === itemId) {
            batch.update(docRef, { equipped: true, updatedAt: serverTimestamp() });
          } else if (data.equipped) {
            batch.update(docRef, { equipped: false, updatedAt: serverTimestamp() });
          }
        }
      });

      await batch.commit();

      // Requirement 5: Character stats automatically update based on equipped items
      await InventoryService.updateCharacterStatsFromEquipped(uid);

      console.log(`[InventoryService] Equipped item '${itemId}' in category '${targetCategory}' for user ${uid}`);
    } catch (error) {
      console.error("[InventoryService] Error equipping item:", error);
      throw error;
    }
  }

  /**
   * Unequips an item and recalculates character stats.
   */
  static async unequipItem(uid: string, itemId: string): Promise<void> {
    if (!uid || !itemId) return;

    try {
      const itemRef = doc(db, "users", uid, "inventory", itemId);
      await updateDoc(itemRef, {
        equipped: false,
        updatedAt: serverTimestamp(),
      });

      await InventoryService.updateCharacterStatsFromEquipped(uid);
      console.log(`[InventoryService] Unequipped item '${itemId}' for user ${uid}`);
    } catch (error) {
      console.error("[InventoryService] Error unequipping item:", error);
      throw error;
    }
  }

  /**
   * Checks milestone conditions and automatically unlocks RPG reward items across all categories.
   */
  static async checkInventoryUnlocks(uid: string): Promise<string[]> {
    if (!uid) return [];

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return [];

      const userData = userSnap.data() || {};
      const level = userData.level ?? 1;
      const totalQuestsCompleted =
        userData.totalQuestsCompleted ??
        (Array.isArray(userData.completedQuests) ? userData.completedQuests.length : 0);
      const streak = userData.streak ?? 0;
      const unlockedAchievements = Array.isArray(userData.unlockedAchievements)
        ? userData.unlockedAchievements
        : [];

      const newlyUnlocked: string[] = [];

      for (const item of ALL_RPG_ITEMS) {
        if (item.unlockRequirement === "Starter Item") continue;

        let shouldUnlock = false;

        // Weapons
        if (item.id === "iron_sword" && level >= 7) shouldUnlock = true;
        if (item.id === "steel_greatsword" && level >= 11) shouldUnlock = true;
        if (item.id === "battle_axe" && level >= 8) shouldUnlock = true;
        if (item.id === "war_hammer" && totalQuestsCompleted >= 40) shouldUnlock = true;
        if (item.id === "long_bow" && level >= 9) shouldUnlock = true;
        if (item.id === "crossbow" && totalQuestsCompleted >= 60) shouldUnlock = true;
        if (item.id === "assassin_dagger" && level >= 14) shouldUnlock = true;
        if (item.id === "crystal_blade" && totalQuestsCompleted >= 120) shouldUnlock = true;
        if (item.id === "dragon_slayer_sword" && level >= 20) shouldUnlock = true;
        if (item.id === "epic_sword" && totalQuestsCompleted >= 50) shouldUnlock = true;
        if (item.id === "legendary_sword" && totalQuestsCompleted >= 100) shouldUnlock = true;

        // Armor
        if (item.id === "leather_armor" && level >= 3) shouldUnlock = true;
        if (item.id === "iron_armor" && level >= 6) shouldUnlock = true;
        if (item.id === "steel_armor" && level >= 10) shouldUnlock = true;
        if (item.id === "knight_armor" && totalQuestsCompleted >= 25) shouldUnlock = true;
        if (item.id === "guardian_armor" && level >= 16) shouldUnlock = true;
        if (item.id === "dragon_armor" && totalQuestsCompleted >= 120) shouldUnlock = true;
        if (item.id === "shadow_armor" && totalQuestsCompleted >= 80) shouldUnlock = true;
        if (item.id === "paladin_armor" && level >= 18) shouldUnlock = true;

        // Helmets
        if (item.id === "iron_helmet" && level >= 5) shouldUnlock = true;
        if (item.id === "viking_helmet" && level >= 8) shouldUnlock = true;
        if (item.id === "knight_helmet" && totalQuestsCompleted >= 30) shouldUnlock = true;
        if (item.id === "shadow_hood" && level >= 12) shouldUnlock = true;
        if (item.id === "golden_helmet" && totalQuestsCompleted >= 70) shouldUnlock = true;
        if (item.id === "guardian_helm" && level >= 15) shouldUnlock = true;
        if (item.id === "dragon_helm" && totalQuestsCompleted >= 110) shouldUnlock = true;

        // Boots
        if (item.id === "leather_boots" && level >= 3) shouldUnlock = true;
        if (item.id === "ranger_boots" && level >= 6) shouldUnlock = true;
        if (item.id === "iron_boots" && level >= 9) shouldUnlock = true;
        if (item.id === "swift_boots" && totalQuestsCompleted >= 45) shouldUnlock = true;
        if (item.id === "shadow_boots" && level >= 13) shouldUnlock = true;
        if (item.id === "guardian_boots" && level >= 17) shouldUnlock = true;
        if (item.id === "dragon_boots" && totalQuestsCompleted >= 130) shouldUnlock = true;

        // Shields
        if (item.id === "wooden_shield" && level >= 2) shouldUnlock = true;
        if (item.id === "iron_shield" && level >= 6) shouldUnlock = true;
        if (item.id === "steel_shield" && level >= 10) shouldUnlock = true;
        if (item.id === "knight_shield" && totalQuestsCompleted >= 35) shouldUnlock = true;
        if (item.id === "guardian_shield" && level >= 16) shouldUnlock = true;
        if (item.id === "dragon_shield" && totalQuestsCompleted >= 125) shouldUnlock = true;
        if (item.id === "magic_barrier_shield" && level >= 19) shouldUnlock = true;

        // Accessories
        if (item.id === "silver_ring" && level >= 4) shouldUnlock = true;
        if (item.id === "warrior_necklace" && level >= 7) shouldUnlock = true;
        if (item.id === "magic_ring" && level >= 10) shouldUnlock = true;
        if (item.id === "magic_amulet" && totalQuestsCompleted >= 40) shouldUnlock = true;
        if (item.id === "power_bracelet" && level >= 12) shouldUnlock = true;
        if (item.id === "emerald_pendant" && totalQuestsCompleted >= 65) shouldUnlock = true;
        if (item.id === "ruby_ring" && level >= 16) shouldUnlock = true;
        if (item.id === "crown_of_kings" && totalQuestsCompleted >= 150) shouldUnlock = true;
        if (item.id === "phoenix_charm" && totalQuestsCompleted >= 180) shouldUnlock = true;
        if (item.id === "heros_emblem" && totalQuestsCompleted >= 200) shouldUnlock = true;

        // Potions
        if (item.id === "health_potion") shouldUnlock = true;
        if (item.id === "mana_potion" && level >= 4) shouldUnlock = true;
        if (item.id === "strength_potion" && level >= 6) shouldUnlock = true;
        if (item.id === "defense_potion" && level >= 8) shouldUnlock = true;
        if (item.id === "speed_potion" && level >= 10) shouldUnlock = true;
        if (item.id === "elixir_of_life" && totalQuestsCompleted >= 100) shouldUnlock = true;

        // Scrolls
        if (item.id === "scroll_fireball" && level >= 5) shouldUnlock = true;
        if (item.id === "scroll_ice_blast" && level >= 7) shouldUnlock = true;
        if (item.id === "scroll_lightning" && level >= 9) shouldUnlock = true;
        if (item.id === "scroll_teleportation" && totalQuestsCompleted >= 50) shouldUnlock = true;
        if (item.id === "scroll_wisdom" && totalQuestsCompleted >= 75) shouldUnlock = true;
        if (item.id === "scroll_resurrection" && totalQuestsCompleted >= 150) shouldUnlock = true;

        // Special Items
        if (item.id === "ancient_key" && totalQuestsCompleted >= 10) shouldUnlock = true;
        if (item.id === "treasure_map" && totalQuestsCompleted >= 20) shouldUnlock = true;
        if (item.id === "magic_crystal" && level >= 8) shouldUnlock = true;
        if (item.id === "phoenix_feather" && level >= 12) shouldUnlock = true;
        if (item.id === "dragon_egg" && totalQuestsCompleted >= 100) shouldUnlock = true;
        if (item.id === "mystic_orb" && level >= 15) shouldUnlock = true;
        if (item.id === "royal_crown" && totalQuestsCompleted >= 200) shouldUnlock = true;
        if (item.id === "golden_compass" && streak >= 30) shouldUnlock = true;
        if (item.id === "time_relic" && level >= 20) shouldUnlock = true;
        if (item.id === "heros_medal" && unlockedAchievements.length >= 5) shouldUnlock = true;

        if (shouldUnlock) {
          const unlocked = await InventoryService.unlockItem(uid, item);
          if (unlocked) newlyUnlocked.push(item.id);
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error("[InventoryService] Error checking inventory unlocks:", error);
      return [];
    }
  }
}

export const initializeStarterInventory = InventoryService.initializeStarterInventory;
export const unlockItem = InventoryService.unlockItem;
export const getInventory = InventoryService.getInventory;
export const equipItem = InventoryService.equipItem;
export const unequipItem = InventoryService.unequipItem;
export const checkInventoryUnlocks = InventoryService.checkInventoryUnlocks;
export const updateCharacterStatsFromEquipped = InventoryService.updateCharacterStatsFromEquipped;

export default InventoryService;
