import { db } from "@/lib/firebase";
import NotificationService from "./notificationService";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (userData: any) => boolean;
}

export const DEFAULT_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first_quest",
    title: "First Quest",
    description: "Complete your first quest.",
    icon: "🌱",
    condition: (userData) => {
      const completedCount =
        userData?.totalQuestsCompleted ??
        (Array.isArray(userData?.completedQuests) ? userData.completedQuests.length : 0);
      return completedCount >= 1;
    },
  },
  {
    id: "complete_10_quests",
    title: "Complete 10 Quests",
    description: "Complete 10 quests.",
    icon: "⚔️",
    condition: (userData) => {
      const completedCount =
        userData?.totalQuestsCompleted ??
        (Array.isArray(userData?.completedQuests) ? userData.completedQuests.length : 0);
      return completedCount >= 10;
    },
  },
  {
    id: "level_5",
    title: "Reach Level 5",
    description: "Reach Hero Level 5.",
    icon: "⭐",
    condition: (userData) => {
      const level = userData?.level ?? 1;
      return level >= 5;
    },
  },
  {
    id: "earn_500_coins",
    title: "Earn 500 Coins",
    description: "Earn 500 gold coins.",
    icon: "🪙",
    condition: (userData) => {
      const coins = userData?.coins ?? 0;
      return coins >= 500;
    },
  },
  {
    id: "streak_7_days",
    title: "7 Day Streak",
    description: "Maintain a 7 day streak.",
    icon: "🔥",
    condition: (userData) => {
      const streak = userData?.streak ?? 0;
      return streak >= 7;
    },
  },
];

export class AchievementService {
  /**
   * Checks achievements for user {uid}.
   * Creates default achievement documents in users/{uid}/achievements/{achievementId} if they don't exist.
   * Unlocks any newly earned achievements in a batched write without re-unlocking previously unlocked ones.
   */
  static async checkAchievements(uid: string): Promise<string[]> {
    if (!uid) return [];

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn(`[AchievementService] User profile not found for uid: ${uid}`);
        return [];
      }

      const userData = userSnap.data();

      // Fetch existing achievement documents from users/{uid}/achievements
      const achievementsColl = collection(db, "users", uid, "achievements");
      const existingSnaps = await getDocs(achievementsColl);

      const existingMap = new Map<string, any>();
      existingSnaps.docs.forEach((docSnap) => {
        existingMap.set(docSnap.id, docSnap.data());
      });

      const batch = writeBatch(db);
      let batchOpsCount = 0;
      const newlyUnlocked: string[] = [];

      const currentUnlockedArray: string[] = Array.isArray(userData.unlockedAchievements)
        ? [...userData.unlockedAchievements]
        : [];

      for (const def of DEFAULT_ACHIEVEMENTS) {
        const achievementDocRef = doc(db, "users", uid, "achievements", def.id);
        const existingData = existingMap.get(def.id);
        const isAlreadyUnlocked = existingData?.unlocked === true;

        if (isAlreadyUnlocked) {
          // Never unlock an achievement twice
          continue;
        }

        const metCondition = def.condition(userData);

        if (!existingData) {
          // Create default achievement document if it doesn't exist
          if (metCondition) {
            batch.set(achievementDocRef, {
              title: def.title,
              description: def.description,
              icon: def.icon,
              unlocked: true,
              unlockedAt: serverTimestamp(),
            });
            newlyUnlocked.push(def.id);
            if (!currentUnlockedArray.includes(def.id)) {
              currentUnlockedArray.push(def.id);
            }
          } else {
            batch.set(achievementDocRef, {
              title: def.title,
              description: def.description,
              icon: def.icon,
              unlocked: false,
              unlockedAt: null,
            });
          }
          batchOpsCount++;
        } else if (metCondition && !isAlreadyUnlocked) {
          // Unlock newly earned achievement
          batch.update(achievementDocRef, {
            unlocked: true,
            unlockedAt: serverTimestamp(),
          });
          newlyUnlocked.push(def.id);
          if (!currentUnlockedArray.includes(def.id)) {
            currentUnlockedArray.push(def.id);
          }
          batchOpsCount++;
        }
      }

      if (newlyUnlocked.length > 0) {
        batch.update(userRef, {
          unlockedAchievements: currentUnlockedArray,
          updatedAt: serverTimestamp(),
        });
        batchOpsCount++;

        newlyUnlocked.forEach((achId) => {
          const def = DEFAULT_ACHIEVEMENTS.find((a) => a.id === achId);
          if (def) {
            NotificationService.addNotification(uid, {
              type: "achievement_unlocked",
              title: "Achievement Unlocked! 🏆",
              message: `Unlocked "${def.title}"! ${def.description}`,
            }).catch((e) => console.error("Notification error:", e));
          }
        });
      }

      if (batchOpsCount > 0) {
        await batch.commit();
        console.log(`[AchievementService] Batch committed (${batchOpsCount} ops). Newly unlocked:`, newlyUnlocked);
      }

      return newlyUnlocked;
    } catch (error) {
      console.error("[AchievementService] Error checking achievements:", error);
      return [];
    }
  }
}

export const checkAchievements = AchievementService.checkAchievements;
export default AchievementService;
