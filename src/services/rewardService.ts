import { db } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { AchievementService } from "./achievementService";
import { HistoryService } from "./historyService";
import { InventoryService } from "./inventoryService";
import { LevelService } from "./levelService";
import { StreakService } from "./streakService";

export type QuestDifficultyInput = "easy" | "medium" | "hard" | string;

export interface RewardResult {
  completed: boolean;
  xpEarned: number;
  coinsEarned: number;
  newXP: number;
  newTotalXP: number;
  newCoins: number;
}

export class RewardService {
  /**
   * Calculates XP reward based on quest difficulty.
   * Easy: 10, Medium: 20, Hard: 40
   */
  static calculateXP(difficulty: QuestDifficultyInput): number {
    const diff = (difficulty || "").toLowerCase();
    switch (diff) {
      case "easy":
        return 10;
      case "medium":
        return 20;
      case "hard":
        return 40;
      default:
        return 10;
    }
  }

  /**
   * Calculates Coin reward based on quest difficulty.
   * Easy: 5, Medium: 10, Hard: 20
   */
  static calculateCoins(difficulty: QuestDifficultyInput): number {
    const diff = (difficulty || "").toLowerCase();
    switch (diff) {
      case "easy":
        return 5;
      case "medium":
        return 10;
      case "hard":
        return 20;
      default:
        return 5;
    }
  }

  /**
   * Completes a quest atomically using a Firestore transaction:
   * - Checks if quest is already completed (prevents duplicate rewards).
   * - Marks quest as completed: { completed: true, updatedAt: serverTimestamp() }.
   * - Adds XP and Coins to user document users/{uid}.
   * - Automatically records quest history, calculates level, and checks achievements.
   */
  static async completeQuest(
    uid: string,
    arg2: string,
    arg3?: string
  ): Promise<RewardResult> {
    let collectionName = "quests";
    let questId = arg2;
    if (arg3 !== undefined) {
      collectionName = arg2;
      questId = arg3;
    }

    console.log("[DEBUG 4] RewardService.completeQuest called for uid:", uid, "collectionName:", collectionName, "questId:", questId);
    try {
      const userRef = doc(db, "users", uid);
      const questRef = doc(db, "users", uid, collectionName, questId);

      let questTitle = "Completed Quest";
      let questDescription = "";
      let questDifficulty = "easy";
      let questEmoji = "⚔️";

      const result = await runTransaction(db, async (transaction) => {
        console.log("[DEBUG 5] Firestore transaction started for questId:", questId);
        const questSnap = await transaction.get(questRef);
        console.log("[DEBUG 5.1] Quest snapshot fetched. Exists?:", questSnap.exists());
        if (!questSnap.exists()) {
          throw new Error(`Quest ${questId} not found.`);
        }

        const questData = questSnap.data() || {};
        questTitle = questData.title || "Completed Quest";
        questDescription = questData.description || "";
        questDifficulty = questData.difficulty || "easy";
        questEmoji = questData.emoji || "⚔️";

        console.log("==========================================");
        console.log("[INSPECTION] FIRESTORE QUEST DOCUMENT:");
        console.log("quest.id:", questId);
        console.log("completed:", questData.completed);
        console.log("status:", questData.status ?? "N/A");
        console.log("all document fields:", JSON.stringify(questData, null, 2));
        console.log("==========================================");

        // Prevent duplicate rewards if quest is already completed
        if (questData.completed) {
          console.log("[DEBUG 5.2] Quest already completed in Firestore. Returning early.");
          const userSnap = await transaction.get(userRef);
          const userData = userSnap.data() || {};
          return {
            completed: false,
            xpEarned: 0,
            coinsEarned: 0,
            newXP: userData.xp ?? 0,
            newTotalXP: userData.totalXP ?? 0,
            newCoins: userData.coins ?? 0,
          };
        }

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error(`User ${uid} profile not found.`);
        }

        const userData = userSnap.data();
        const difficulty = questData.difficulty || "easy";

        const xpEarned =
          typeof questData.xpReward === "number" && questData.xpReward > 0
            ? questData.xpReward
            : RewardService.calculateXP(difficulty);

        const coinsEarned =
          typeof questData.coinReward === "number" && questData.coinReward > 0
            ? questData.coinReward
            : RewardService.calculateCoins(difficulty);

        const currentXP = userData.xp ?? 0;
        const currentTotalXP = userData.totalXP ?? 0;
        const currentCoins = userData.coins ?? 0;

        const newXP = currentXP + xpEarned;
        const newTotalXP = currentTotalXP + xpEarned;
        const newCoins = currentCoins + coinsEarned;

        // Mark quest as completed
        transaction.update(questRef, {
          completed: true,
          updatedAt: serverTimestamp(),
        });

        // Update user profile with XP and Coins
        transaction.update(userRef, {
          xp: newXP,
          totalXP: newTotalXP,
          coins: newCoins,
          updatedAt: serverTimestamp(),
        });

        console.log("[DEBUG 6] Transaction operations queued. Committing transaction...");

        return {
          completed: true,
          xpEarned,
          coinsEarned,
          newXP,
          newTotalXP,
          newCoins,
        };
      });

      // Automatically record quest history, calculate level, and check achievements
      if (result && result.completed) {
        try {
          await HistoryService.recordHistory(uid, {
            title: questTitle,
            description: questDescription,
            difficulty: questDifficulty,
            xpEarned: result.xpEarned,
            coinsEarned: result.coinsEarned,
            questType: collectionName === "dailyQuests" ? "daily" : "custom",
            emoji: questEmoji,
            questId,
          });
        } catch (historyError) {
          console.error("[RewardService] Error recording quest history:", historyError);
        }

        try {
          await LevelService.checkAndUpdateLevel(uid, result.newTotalXP);
        } catch (levelError) {
          console.error("[RewardService] Error checking level:", levelError);
        }

        try {
          await AchievementService.checkAchievements(uid);
        } catch (achievementError) {
          console.error("[RewardService] Error checking achievements:", achievementError);
        }

        try {
          await StreakService.updateUserStreak(uid);
        } catch (streakError) {
          console.error("[RewardService] Error updating daily streak:", streakError);
        }

        try {
          await InventoryService.checkInventoryUnlocks(uid);
        } catch (inventoryError) {
          console.error("[RewardService] Error checking inventory unlocks:", inventoryError);
        }
      }

      return result;
    } catch (error) {
      console.error("[RewardService] Error completing quest:", error);
      throw error;
    }
  }
}

// Standalone function exports
export const completeQuest = RewardService.completeQuest;
export const calculateXP = RewardService.calculateXP;
export const calculateCoins = RewardService.calculateCoins;

export default RewardService;
