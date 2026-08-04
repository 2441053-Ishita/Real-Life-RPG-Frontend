import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export interface LevelCheckResult {
  level: number;
  xpToNextLevel: number;
  leveledUp: boolean;
}

export class LevelService {
  /**
   * Calculates player level based on total XP progression table:
   * Level 1 = 0 XP
   * Level 2 = 100 XP
   * Level 3 = 250 XP
   * Level 4 = 450 XP
   * Level 5 = 700 XP
   * Level 6 = 1000 XP
   * Level 7 = 1400 XP
   * Level 8 = 1900 XP
   * Level 9 = 2500 XP
   * Level 10 = 3200 XP
   */
  static calculateLevel(totalXP: number): number {
    const xp = Math.max(0, totalXP || 0);

    if (xp >= 3200) {
      return 10 + Math.floor((xp - 3200) / 800);
    }
    if (xp >= 2500) return 9;
    if (xp >= 1900) return 8;
    if (xp >= 1400) return 7;
    if (xp >= 1000) return 6;
    if (xp >= 700) return 5;
    if (xp >= 450) return 4;
    if (xp >= 250) return 3;
    if (xp >= 100) return 2;
    return 1;
  }

  /**
   * Calculates total XP requirement for the next level (level + 1).
   */
  static calculateXPForNextLevel(level: number): number {
    const currentLevel = Math.max(1, level || 1);
    const nextLevel = currentLevel + 1;

    switch (nextLevel) {
      case 2:
        return 100;
      case 3:
        return 250;
      case 4:
        return 450;
      case 5:
        return 700;
      case 6:
        return 1000;
      case 7:
        return 1400;
      case 8:
        return 1900;
      case 9:
        return 2500;
      case 10:
        return 3200;
      default:
        return 3200 + (nextLevel - 10) * 800;
    }
  }

  /**
   * Checks totalXP for user {uid}, calculates new level, and updates Firestore document users/{uid}
   * ONLY if the calculated level has changed.
   * Updates fields: level, xpToNextLevel, updatedAt.
   * Does NOT reset XP.
   */
  static async updateUserLevel(
    uid: string,
    providedTotalXP?: number
  ): Promise<LevelCheckResult> {
    if (!uid) return { level: 1, xpToNextLevel: 100, leveledUp: false };

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn(`[LevelService] User profile not found for uid: ${uid}`);
        return { level: 1, xpToNextLevel: 100, leveledUp: false };
      }

      const userData = userSnap.data() || {};
      const currentTotalXP = providedTotalXP ?? userData.totalXP ?? userData.xp ?? 0;
      const currentLevel = userData.level ?? 1;

      const newLevel = LevelService.calculateLevel(currentTotalXP);
      const xpToNextLevel = LevelService.calculateXPForNextLevel(newLevel);

      // Requirement 6: Update only if the calculated level changed
      if (newLevel !== currentLevel) {
        // Requirement 5: Update only level, xpToNextLevel, updatedAt on users/{uid}
        await updateDoc(userRef, {
          level: newLevel,
          xpToNextLevel,
          updatedAt: serverTimestamp(),
        });
        console.log(`[LevelService] Level updated for user ${uid}: ${currentLevel} -> ${newLevel}`);
        return { level: newLevel, xpToNextLevel, leveledUp: newLevel > currentLevel };
      }

      return { level: currentLevel, xpToNextLevel, leveledUp: false };
    } catch (error) {
      console.error("[LevelService] Error updating user level:", error);
      return { level: 1, xpToNextLevel: 100, leveledUp: false };
    }
  }

  static async checkAndUpdateLevel(
    uid: string,
    providedTotalXP?: number
  ): Promise<LevelCheckResult> {
    return LevelService.updateUserLevel(uid, providedTotalXP);
  }
}

// Standalone function exports
export const calculateLevel = LevelService.calculateLevel;
export const calculateXPForNextLevel = LevelService.calculateXPForNextLevel;
export const updateUserLevel = LevelService.updateUserLevel;
export const checkAndUpdateLevel = LevelService.updateUserLevel;

export default LevelService;
