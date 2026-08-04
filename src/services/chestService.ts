import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { InventoryItem, InventoryService } from "./inventoryService";
import { LevelService } from "./levelService";

export interface ChestReward {
  type: "coins" | "xp" | "weapon" | "armor" | "accessory" | "potion" | "badge";
  title: string;
  subtitle: string;
  emoji: string;
  rarity?: string;
  coinsEarned?: number;
  xpEarned?: number;
  item?: InventoryItem;
}

export class ChestService {
  /**
   * Opens one mystery chest if available (unlocked every 10 completed quests):
   * - Prevents opening the same chest twice (checks unlockedChests vs mysteryChestsOpened).
   * - Randomly awards Coins, XP, Weapon, Armor, Accessory, Potion, or Badge.
   * - Persists chest state in Firestore.
   */
  static async openMysteryChest(uid: string): Promise<ChestReward> {
    if (!uid) {
      throw new Error("User ID is required");
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found");
    }

    const userData = userSnap.data() || {};
    const completedQuests = Array.isArray(userData.completedQuests)
      ? userData.completedQuests.length
      : 0;
    const totalQuestsCompleted = Number(userData.totalQuestsCompleted ?? completedQuests);

    const unlockedChests = Math.floor(totalQuestsCompleted / 10);
    const openedChests = Number(userData.mysteryChestsOpened ?? 0);
    const availableChests = Math.max(0, unlockedChests - openedChests);

    if (availableChests <= 0) {
      throw new Error("No available mystery chests to open! Complete 10 quests to unlock your next chest.");
    }

    // Roll random reward (1 of 7 categories)
    const rewardRoll = Math.floor(Math.random() * 7);

    let reward: ChestReward;

    const currentCoins = Number(userData.coins ?? 0);
    const currentXP = Number(userData.xp ?? 0);
    const currentTotalXP = Number(userData.totalXP ?? 0);

    const updates: Record<string, any> = {
      mysteryChestsOpened: openedChests + 1,
      updatedAt: serverTimestamp(),
    };

    if (rewardRoll === 0) {
      // 1. Coins Reward (+150 Coins)
      const coinsEarned = 150;
      updates.coins = currentCoins + coinsEarned;
      reward = {
        type: "coins",
        title: "+150 Gold Coins!",
        subtitle: "Coins added to your wealth balance.",
        emoji: "🪙",
        rarity: "Rare",
        coinsEarned,
      };
    } else if (rewardRoll === 1) {
      // 2. XP Reward (+200 XP)
      const xpEarned = 200;
      const newXP = currentXP + xpEarned;
      const newTotalXP = currentTotalXP + xpEarned;

      updates.xp = newXP;
      updates.totalXP = newTotalXP;

      reward = {
        type: "xp",
        title: "+200 Bonus XP!",
        subtitle: "Experience added to your hero progression.",
        emoji: "⚡",
        rarity: "Epic",
        xpEarned,
      };

      await LevelService.checkAndUpdateLevel(uid, newTotalXP);
    } else if (rewardRoll === 2) {
      // 3. Mystery Weapon
      const weaponItem: InventoryItem = {
        id: "weapon_crystal_blade",
        name: "Crystal Blade",
        description: "A brilliant sword carved from refined mana crystal.",
        category: "weapons",
        rarity: "Legendary",
        icon: "🗡️",
        attack: 45,
        defense: 5,
        intelligence: 15,
        vitality: 0,
        speed: 10,
        equipped: false,
      };
      await InventoryService.unlockItem(uid, weaponItem);

      reward = {
        type: "weapon",
        title: "Crystal Blade!",
        subtitle: "Legendary Weapon added to your inventory.",
        emoji: "🗡️",
        rarity: "Legendary",
        item: weaponItem,
      };
    } else if (rewardRoll === 3) {
      // 4. Mystery Armor
      const armorItem: InventoryItem = {
        id: "armor_paladin_chestplate",
        name: "Paladin Chestplate",
        description: "Holy blessed steel armor offering formidable protection.",
        category: "armor",
        rarity: "Epic",
        icon: "🥋",
        attack: 10,
        defense: 35,
        intelligence: 5,
        vitality: 20,
        speed: 0,
        equipped: false,
      };
      await InventoryService.unlockItem(uid, armorItem);

      reward = {
        type: "armor",
        title: "Paladin Chestplate!",
        subtitle: "Epic Armor added to your inventory.",
        emoji: "🥋",
        rarity: "Epic",
        item: armorItem,
      };
    } else if (rewardRoll === 4) {
      // 5. Mystery Accessory
      const accessoryItem: InventoryItem = {
        id: "accessory_magic_ring",
        name: "Magic Ring",
        description: "An ancient ring glowing with arcane aura.",
        category: "accessories",
        rarity: "Rare",
        icon: "💍",
        attack: 10,
        defense: 10,
        intelligence: 20,
        vitality: 10,
        speed: 10,
        equipped: false,
      };
      await InventoryService.unlockItem(uid, accessoryItem);

      reward = {
        type: "accessory",
        title: "Magic Ring!",
        subtitle: "Rare Accessory added to your inventory.",
        emoji: "💍",
        rarity: "Rare",
        item: accessoryItem,
      };
    } else if (rewardRoll === 5) {
      // 6. Mystery Potion
      const potionItem: InventoryItem = {
        id: "potion_elixir_of_life",
        name: "Elixir of Life",
        description: "Restores vitality and grants full health boost.",
        category: "potions",
        rarity: "Legendary",
        icon: "🧪",
        attack: 0,
        defense: 0,
        intelligence: 0,
        vitality: 50,
        speed: 0,
        equipped: false,
      };
      await InventoryService.unlockItem(uid, potionItem);

      reward = {
        type: "potion",
        title: "Elixir of Life!",
        subtitle: "Legendary Potion added to your inventory.",
        emoji: "🧪",
        rarity: "Legendary",
        item: potionItem,
      };
    } else {
      // 7. Mystery Badge
      const badgeItem: InventoryItem = {
        id: "badge_treasure_hunter",
        name: "Treasure Hunter Badge",
        description: "Awarded for discovering a Mystery Treasure Chest!",
        category: "badge",
        rarity: "Epic",
        icon: "🎁",
        attack: 0,
        defense: 0,
        intelligence: 0,
        vitality: 0,
        speed: 0,
        equipped: false,
      };
      await InventoryService.unlockItem(uid, badgeItem);

      // Add to achievements array if not present
      const currentAchievements: string[] = Array.isArray(userData.unlockedAchievements)
        ? userData.unlockedAchievements.map((id: any) => String(id))
        : [];
      if (!currentAchievements.includes("badge_treasure_hunter")) {
        updates.unlockedAchievements = [...currentAchievements, "badge_treasure_hunter"];
      }

      reward = {
        type: "badge",
        title: "Treasure Hunter Badge!",
        subtitle: "Epic Badge added to your achievements.",
        emoji: "🎁",
        rarity: "Epic",
        item: badgeItem,
      };
    }

    // Persist changes in Firestore
    await updateDoc(userRef, updates);

    return reward;
  }
}

export default ChestService;
