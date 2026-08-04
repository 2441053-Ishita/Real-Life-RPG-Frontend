import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { InventoryItem, InventoryService } from "./inventoryService";
import { LevelService } from "./levelService";

export interface DailyRewardItem {
  day: number;
  title: string;
  subtitle: string;
  type: "coins" | "xp" | "item";
  icon: string;
  rarity?: string;
  coinsReward?: number;
  xpReward?: number;
  inventoryItem?: InventoryItem;
}

export const DAILY_REWARDS_SCHEDULE: DailyRewardItem[] = [
  {
    day: 1,
    title: "50 Gold Coins",
    subtitle: "Day 1 Login Reward",
    type: "coins",
    icon: "🪙",
    coinsReward: 50,
  },
  {
    day: 2,
    title: "100 XP Boost",
    subtitle: "Day 2 Login Reward",
    type: "xp",
    icon: "⚡",
    xpReward: 100,
  },
  {
    day: 3,
    title: "Health Potion",
    subtitle: "Day 3 Login Reward",
    type: "item",
    icon: "🧪",
    rarity: "Common",
    inventoryItem: {
      id: "potion_health_daily",
      name: "Health Potion",
      description: "Restores 30% HP during battle.",
      category: "potions",
      rarity: "Common",
      icon: "🧪",
      attack: 0,
      defense: 0,
      intelligence: 0,
      vitality: 20,
      speed: 0,
      equipped: false,
    },
  },
  {
    day: 4,
    title: "100 Gold Coins",
    subtitle: "Day 4 Login Reward",
    type: "coins",
    icon: "🪙",
    coinsReward: 100,
  },
  {
    day: 5,
    title: "Ranger Blade",
    subtitle: "Day 5 Login Reward",
    type: "item",
    icon: "⚔️",
    rarity: "Rare",
    inventoryItem: {
      id: "weapon_ranger_blade",
      name: "Ranger Blade",
      description: "A finely balanced steel blade awarded to loyal heroes.",
      category: "weapons",
      rarity: "Rare",
      icon: "⚔️",
      attack: 22,
      defense: 4,
      intelligence: 0,
      vitality: 0,
      speed: 8,
      equipped: false,
    },
  },
  {
    day: 6,
    title: "250 XP Boost",
    subtitle: "Day 6 Login Reward",
    type: "xp",
    icon: "⚡",
    xpReward: 250,
  },
  {
    day: 7,
    title: "Epic Treasure Chest",
    subtitle: "Day 7 Grand Reward",
    type: "item",
    icon: "🎁",
    rarity: "Epic",
    coinsReward: 200,
    xpReward: 200,
    inventoryItem: {
      id: "chest_epic_daily",
      name: "Epic Treasure Chest",
      description: "A grand chest packed with epic equipment and treasure.",
      category: "special",
      rarity: "Epic",
      icon: "🎁",
      attack: 10,
      defense: 10,
      intelligence: 10,
      vitality: 10,
      speed: 10,
      equipped: false,
    },
  },
];

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class DailyRewardService {
  /**
   * Claims today's daily login reward:
   * - Enforces 1 claim per calendar day (lastLoginClaimDate === today).
   * - If a day is missed, continues cycle smoothly without resetting.
   * - Awards Coins / XP / Inventory Items / Chest.
   * - Updates Firestore user profile.
   */
  static async claimDailyReward(uid: string): Promise<DailyRewardItem> {
    if (!uid) {
      throw new Error("User ID is required");
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found");
    }

    const userData = userSnap.data() || {};
    const todayStr = getTodayDateString();
    const lastClaimDate = userData.lastLoginClaimDate || "";

    if (lastClaimDate === todayStr) {
      throw new Error("You have already claimed today's login reward! Come back tomorrow.");
    }

    let currentDay = Number(userData.dailyLoginDay ?? 1);
    if (currentDay < 1 || currentDay > 7) currentDay = 1;

    const rewardConfig = DAILY_REWARDS_SCHEDULE.find((r) => r.day === currentDay) || DAILY_REWARDS_SCHEDULE[0];

    const currentCoins = Number(userData.coins ?? 0);
    const currentXP = Number(userData.xp ?? 0);
    const currentTotalXP = Number(userData.totalXP ?? 0);

    const updates: Record<string, any> = {
      lastLoginClaimDate: todayStr,
      dailyLoginDay: (currentDay % 7) + 1, // Advance to next day for tomorrow
      updatedAt: serverTimestamp(),
    };

    // 1. Process Coins
    if (rewardConfig.coinsReward) {
      updates.coins = currentCoins + rewardConfig.coinsReward;
    }

    // 2. Process XP
    if (rewardConfig.xpReward) {
      const newXP = currentXP + rewardConfig.xpReward;
      const newTotalXP = currentTotalXP + rewardConfig.xpReward;
      updates.xp = newXP;
      updates.totalXP = newTotalXP;
      await LevelService.checkAndUpdateLevel(uid, newTotalXP);
    }

    // 3. Process Item
    if (rewardConfig.inventoryItem) {
      await InventoryService.unlockItem(uid, rewardConfig.inventoryItem);
    }

    // Persist updates in Firestore
    await updateDoc(userRef, updates);

    return rewardConfig;
  }
}

export default DailyRewardService;
