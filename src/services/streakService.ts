import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { InventoryService } from "./inventoryService";

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  isNewDay: boolean;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class StreakService {
  /**
   * Updates user streak upon quest completion.
   * - Rules:
   *   1. Completing at least one quest in a day increases streak by 1.
   *   2. Completing multiple quests on the same day does not increase streak again.
   *   3. If a day is missed, resets currentStreak to 1 on new completion.
   *   4. Updates longestStreak whenever currentStreak exceeds it.
   */
  static async updateUserStreak(uid: string): Promise<StreakUpdateResult> {
    if (!uid) {
      return { currentStreak: 0, longestStreak: 0, lastCompletedDate: "", isNewDay: false };
    }

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { currentStreak: 0, longestStreak: 0, lastCompletedDate: "", isNewDay: false };
      }

      const userData = userSnap.data() || {};
      const todayStr = getTodayDateString();
      const yesterdayStr = getYesterdayDateString();

      const lastCompletedDate = userData.lastCompletedDate || "";
      let currentStreak = Number(userData.currentStreak ?? userData.streak ?? 0);
      let longestStreak = Number(userData.longestStreak ?? currentStreak);

      let isNewDay = false;

      if (lastCompletedDate === todayStr) {
        // Quest completed on the SAME day! Do NOT increment streak again.
        console.log(`[StreakService] Same day completion for user ${uid}. Streak remains ${currentStreak}.`);
      } else if (lastCompletedDate === yesterdayStr) {
        // Quest completed on CONSECUTIVE day!
        currentStreak += 1;
        isNewDay = true;
        console.log(`[StreakService] Consecutive day completion! Streak increased to ${currentStreak}.`);
      } else {
        // First quest or day missed -> start new streak at 1
        currentStreak = 1;
        isNewDay = true;
        console.log(`[StreakService] New streak started for user ${uid} (Day 1).`);
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // Persist fields in Firestore users/{uid}
      await updateDoc(userRef, {
        currentStreak,
        longestStreak,
        streak: currentStreak,
        lastCompletedDate: todayStr,
        updatedAt: serverTimestamp(),
      });

      // Unlock Streak Badge Rewards
      if (currentStreak >= 7) {
        await InventoryService.unlockItem(uid, {
          id: "badge_streak_7",
          name: "Streak Badge",
          description: "Earned by maintaining a 7-day quest streak!",
          category: "badge",
          rarity: "Rare",
          icon: "🔥",
          attack: 0,
          defense: 0,
          intelligence: 0,
          vitality: 0,
          speed: 0,
        });
      }

      if (currentStreak >= 30) {
        await InventoryService.unlockItem(uid, {
          id: "badge_golden_flame",
          name: "Golden Flame Badge",
          description: "Earned by maintaining a 30-day quest streak!",
          category: "badge",
          rarity: "Epic",
          icon: "🟡",
          attack: 0,
          defense: 0,
          intelligence: 0,
          vitality: 0,
          speed: 0,
        });
      }

      if (currentStreak >= 100) {
        await InventoryService.unlockItem(uid, {
          id: "badge_legend",
          name: "Legend Badge",
          description: "Earned by maintaining an extraordinary 100-day quest streak!",
          category: "badge",
          rarity: "Legendary",
          icon: "👑",
          attack: 0,
          defense: 0,
          intelligence: 0,
          vitality: 0,
          speed: 0,
        });
      }

      return {
        currentStreak,
        longestStreak,
        lastCompletedDate: todayStr,
        isNewDay,
      };
    } catch (error) {
      console.error("[StreakService] Error updating user streak:", error);
      return { currentStreak: 0, longestStreak: 0, lastCompletedDate: "", isNewDay: false };
    }
  }
}

export const updateUserStreak = StreakService.updateUserStreak;
export default StreakService;
