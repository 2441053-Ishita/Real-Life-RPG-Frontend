import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
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
  unlockedNextId?: string | null;
}

export class RewardService {
  /**
   * Calculates XP reward based on quest difficulty.
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
   * Completes a quest atomically in Firestore:
   * 1. Marks target quest completed=true.
   * 2. Unlocks ONLY the immediate next quest in sequence (active=true, locked=false).
   * 3. Rewards user with XP and Coins on users/{uid}.
   * 4. Updates completedQuests array and lastActiveDate.
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

    try {
      const userRef = doc(db, "users", uid);
      const initialQuestRef = doc(db, "users", uid, collectionName, questId);

      let questTitle = "Completed Quest";
      let questDescription = "";
      let questDifficulty = "easy";
      let questEmoji = "⚔️";

      const result = await runTransaction(db, async (transaction) => {
        let questRef = initialQuestRef;
        let questSnap = await transaction.get(questRef);

        if (!questSnap.exists()) {
          const fallbackCol =
            collectionName === "dailyQuests" ? "quests" : "dailyQuests";
          const fallbackRef = doc(db, "users", uid, fallbackCol, questId);
          const fallbackSnap = await transaction.get(fallbackRef);
          if (fallbackSnap.exists()) {
            questRef = fallbackRef;
            questSnap = fallbackSnap;
            collectionName = fallbackCol;
          } else {
            throw new Error(`Quest ${questId} not found.`);
          }
        }

        const questData = questSnap.data() || {};
        questTitle = questData.title || "Completed Quest";
        questDescription = questData.description || "";
        questDifficulty = questData.difficulty || "easy";
        questEmoji = questData.emoji || "⚔️";

        // Prevent double completion
        if (questData.completed) {
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

        const userData = userSnap.data() || {};
        const xpEarned =
          typeof questData.xpReward === "number" && questData.xpReward > 0
            ? questData.xpReward
            : RewardService.calculateXP(questDifficulty);

        const coinsEarned =
          typeof questData.coinReward === "number" && questData.coinReward > 0
            ? questData.coinReward
            : RewardService.calculateCoins(questDifficulty);

        const currentXP = userData.xp ?? 0;
        const currentTotalXP = userData.totalXP ?? 0;
        const currentCoins = userData.coins ?? 0;
        const existingCompleted: string[] = userData.completedQuests || [];

        const newXP = currentXP + xpEarned;
        const newTotalXP = currentTotalXP + xpEarned;
        const newCoins = currentCoins + coinsEarned;

        // 1. Mark target quest completed
        transaction.update(questRef, {
          completed: true,
          active: false,
          updatedAt: serverTimestamp(),
        });

        // 2. Update user profile statistics
        const updatedCompletedList = existingCompleted.includes(questId)
          ? existingCompleted
          : [...existingCompleted, questId];

        const todayKey = new Date().toISOString().split("T")[0];

        transaction.update(userRef, {
          xp: newXP,
          totalXP: newTotalXP,
          coins: newCoins,
          completedQuests: updatedCompletedList,
          lastActiveDate: todayKey,
          updatedAt: serverTimestamp(),
        });

        return {
          completed: true,
          xpEarned,
          coinsEarned,
          newXP,
          newTotalXP,
          newCoins,
        };
      });

      // 3. Unlock ONLY the next quest sequentially in Firestore
      if (result && result.completed) {
        try {
          const subColRef = collection(db, "users", uid, collectionName);
          const subColSnap = await getDocs(subColRef);
          const docList: any[] = subColSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          // Sort naturally by ID to preserve Quest 1 -> Quest 2 -> Quest 3 -> Quest 4 order
          docList.sort((a, b) => a.id.localeCompare(b.id));

          const currentIndex = docList.findIndex((q) => q.id === questId);
          if (currentIndex !== -1 && currentIndex + 1 < docList.length) {
            const nextQuest = docList[currentIndex + 1];
            if (nextQuest && !nextQuest.completed) {
              const nextDocRef = doc(db, "users", uid, collectionName, nextQuest.id);
              await updateDoc(nextDocRef, {
                active: true,
                locked: false,
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch (unlockError) {
          console.error("[RewardService] Error unlocking next quest:", unlockError);
        }

        // Auxiliary RPG updates (History, Level, Achievements, Streak)
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
        } catch (err) {
          console.error("[RewardService] History recording error:", err);
        }

        try {
          await LevelService.checkAndUpdateLevel(uid, result.newTotalXP);
        } catch (err) {
          console.error("[RewardService] Level update error:", err);
        }

        try {
          await AchievementService.checkAchievements(uid);
        } catch (err) {
          console.error("[RewardService] Achievement check error:", err);
        }

        try {
          await StreakService.updateUserStreak(uid);
        } catch (err) {
          console.error("[RewardService] Streak update error:", err);
        }

        try {
          await InventoryService.checkInventoryUnlocks(uid);
        } catch (err) {
          console.error("[RewardService] Inventory unlock check error:", err);
        }
      }

      return result;
    } catch (error) {
      console.error("[RewardService] Error completing quest:", error);
      throw error;
    }
  }
}

export const completeQuest = RewardService.completeQuest;
export const calculateXP = RewardService.calculateXP;
export const calculateCoins = RewardService.calculateCoins;

export default RewardService;
