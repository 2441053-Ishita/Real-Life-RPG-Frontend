import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { InventoryItem, InventoryService } from "./inventoryService";
import { LevelService } from "./levelService";

export interface BossData {
  id: string;
  name: string;
  levelReq: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  rewardXP: number;
  rewardCoins: number;
  rewardItem: InventoryItem;
  image: string; // Emoji / Icon
  description: string;
}

export const RPG_BOSSES: BossData[] = [
  {
    id: "goblin_king",
    name: "Goblin King",
    levelReq: 1,
    hp: 120,
    maxHp: 120,
    attack: 15,
    defense: 5,
    rewardXP: 100,
    rewardCoins: 50,
    rewardItem: {
      id: "weapon_goblin_dagger",
      name: "Goblin Dagger",
      description: "A rusty yet razor-sharp dagger won from the Goblin King.",
      category: "weapons",
      rarity: "Common",
      icon: "🗡️",
      attack: 12,
      defense: 2,
      intelligence: 0,
      vitality: 0,
      speed: 5,
      equipped: false,
    },
    image: "👹",
    description: "The ruthless chieftain of the forest goblins.",
  },
  {
    id: "skeleton_knight",
    name: "Skeleton Knight",
    levelReq: 3,
    hp: 250,
    maxHp: 250,
    attack: 30,
    defense: 12,
    rewardXP: 250,
    rewardCoins: 100,
    rewardItem: {
      id: "shield_bone",
      name: "Bone Shield",
      description: "A sturdy shield forged from ancient dragon bones.",
      category: "shields",
      rarity: "Rare",
      icon: "🛡️",
      attack: 0,
      defense: 18,
      intelligence: 0,
      vitality: 8,
      speed: 0,
      equipped: false,
    },
    image: "💀",
    description: "An undead warlord guarding the catacombs.",
  },
  {
    id: "dark_mage",
    name: "Dark Mage",
    levelReq: 5,
    hp: 450,
    maxHp: 450,
    attack: 55,
    defense: 20,
    rewardXP: 500,
    rewardCoins: 250,
    rewardItem: {
      id: "weapon_shadow_wand",
      name: "Shadow Wand",
      description: "A mystical orb-tipped staff infused with dark mana.",
      category: "weapons",
      rarity: "Epic",
      icon: "🪄",
      attack: 25,
      defense: 5,
      intelligence: 35,
      vitality: 0,
      speed: 10,
      equipped: false,
    },
    image: "🧙‍♂️",
    description: "A corrupt sorcerer mastering void magic.",
  },
  {
    id: "fire_dragon",
    name: "Fire Dragon",
    levelReq: 8,
    hp: 800,
    maxHp: 800,
    attack: 90,
    defense: 40,
    rewardXP: 1000,
    rewardCoins: 500,
    rewardItem: {
      id: "armor_dragon_scale",
      name: "Dragon Scale Armor",
      description: "Impenetrable plate armor crafted from dragon scales.",
      category: "armor",
      rarity: "Legendary",
      icon: "🥋",
      attack: 15,
      defense: 60,
      intelligence: 0,
      vitality: 30,
      speed: 5,
      equipped: false,
    },
    image: "🐉",
    description: "A fiery behemoth ruling the volcanic peaks.",
  },
  {
    id: "shadow_emperor",
    name: "Shadow Emperor",
    levelReq: 10,
    hp: 1500,
    maxHp: 1500,
    attack: 140,
    defense: 70,
    rewardXP: 2500,
    rewardCoins: 1200,
    rewardItem: {
      id: "accessory_shadow_crown",
      name: "Crown of the Shadow Emperor",
      description: "The ultimate crown granting immense power across all attributes.",
      category: "accessories",
      rarity: "Legendary",
      icon: "👑",
      attack: 50,
      defense: 50,
      intelligence: 50,
      vitality: 50,
      speed: 50,
      equipped: false,
    },
    image: "👑",
    description: "The supreme ruler of darkness across the realm.",
  },
];

export class BossService {
  /**
   * Complete boss victory in Firestore:
   * - Award XP & Coins
   * - Update Level via LevelService
   * - Unlock reward item in inventory
   * - Record boss victory in users/{uid}.bossesDefeated
   */
  static async recordBossVictory(uid: string, bossId: string): Promise<{ newXP: number; newTotalXP: number; newCoins: number }> {
    if (!uid || !bossId) {
      throw new Error("Invalid uid or bossId");
    }

    const boss = RPG_BOSSES.find((b) => b.id === bossId);
    if (!boss) {
      throw new Error(`Boss ${bossId} not found`);
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error(`User ${uid} doc not found`);
    }

    const userData = userSnap.data() || {};
    const currentXP = Number(userData.xp ?? 0);
    const currentTotalXP = Number(userData.totalXP ?? 0);
    const currentCoins = Number(userData.coins ?? 0);
    const bossesDefeated = userData.bossesDefeated || {};

    const newXP = currentXP + boss.rewardXP;
    const newTotalXP = currentTotalXP + boss.rewardXP;
    const newCoins = currentCoins + boss.rewardCoins;

    bossesDefeated[bossId] = true;

    // Update Firestore user document
    await updateDoc(userRef, {
      xp: newXP,
      totalXP: newTotalXP,
      coins: newCoins,
      bossesDefeated,
      updatedAt: serverTimestamp(),
    });

    // Automatically check and update user level
    await LevelService.checkAndUpdateLevel(uid, newTotalXP);

    // Automatically unlock boss reward item in inventory
    await InventoryService.unlockItem(uid, boss.rewardItem);

    return {
      newXP,
      newTotalXP,
      newCoins,
    };
  }
}

export default BossService;
