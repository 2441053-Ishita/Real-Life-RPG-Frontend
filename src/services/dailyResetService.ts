import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export const CANONICAL_DAILY_QUESTS = [
  {
    id: "daily-1",
    emoji: "💪",
    title: "Morning Workout",
    description: "Exercise for at least 30 minutes to boost vitality.",
    xp: 20,
    difficulty: "medium",
    category: "Fitness",
  },
  {
    id: "daily-2",
    emoji: "📚",
    title: "Study Session",
    description: "Focus and study for 1 hour to gain intelligence.",
    xp: 30,
    difficulty: "hard",
    category: "Study",
  },
  {
    id: "daily-3",
    emoji: "💧",
    title: "Stay Hydrated",
    description: "Drink enough water throughout the day.",
    xp: 10,
    difficulty: "easy",
    category: "Health",
  },
  {
    id: "daily-4",
    emoji: "🧘",
    title: "Mindfulness",
    description: "Meditate or reflect for 10 minutes to train discipline.",
    xp: 15,
    difficulty: "easy",
    category: "Meditation",
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class DailyResetService {
  private static isResetting = false;

  /**
   * SOLE DAILY RESET SERVICE FOR THE APP
   * Enforces that users/{uid}/dailyQuests has EXACTLY 4 documents:
   * Document IDs: daily-1, daily-2, daily-3, daily-4
   */
  static async checkAndPerformDailyReset(uid: string): Promise<boolean> {
    if (!uid || DailyResetService.isResetting) return false;

    DailyResetService.isResetting = true;

    try {
      const userRef = doc(db, "users", uid);
      const dailyRef = collection(db, "users", uid, "dailyQuests");
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();

      const [userSnap, dailySnap] = await Promise.all([
        getDoc(userRef),
        getDocs(dailyRef),
      ]);

      if (!userSnap.exists()) {
        DailyResetService.isResetting = false;
        return false;
      }

      const userData = userSnap.data() || {};
      const storedQuestDate = userData.questDate || userData.lastQuestDate || "";
      const lastActiveDate = userData.lastActiveDate || "";
      const currentStreak = Number(userData.streak ?? 0);

      // Check if doc IDs match daily-1..daily-4 exactly
      const validIds = new Set(["daily-1", "daily-2", "daily-3", "daily-4"]);
      const existingIds = dailySnap.docs.map((d) => d.id);
      const isStructureCorrupted =
        dailySnap.size !== 4 ||
        !existingIds.every((id) => validIds.has(id));

      const needsReset = storedQuestDate !== today || isStructureCorrupted;

      if (needsReset) {
        console.log(`[DailyResetService] Before reset: ${dailySnap.size} daily quests`);

        const batch = writeBatch(db);

        // 1. Delete every document inside users/{uid}/dailyQuests
        dailySnap.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // 2. Recreate exactly 4 documents with fixed explicit keys daily-1..daily-4
        CANONICAL_DAILY_QUESTS.forEach((dq, index) => {
          const questDocRef = doc(db, "users", uid, "dailyQuests", dq.id);
          batch.set(questDocRef, {
            title: dq.title,
            description: dq.description,
            emoji: dq.emoji,
            difficulty: dq.difficulty.toLowerCase(),
            category: dq.category || "general",
            xpReward: dq.xp,
            coinReward: Math.floor(dq.xp / 2),
            completed: false,
            active: index === 0,
            locked: index !== 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        // 3. Update user profile metadata
        const userUpdates: Record<string, any> = {
          completedQuests: [],
          questDate: today,
          lastQuestDate: today,
          updatedAt: serverTimestamp(),
        };

        const streakExpired =
          lastActiveDate !== "" &&
          lastActiveDate !== today &&
          lastActiveDate !== yesterday;

        if (streakExpired && currentStreak !== 0) {
          userUpdates.streak = 0;
        }

        batch.update(userRef, userUpdates);
        await batch.commit();

        // Verify count after reset
        const postResetSnap = await getDocs(dailyRef);
        console.log(`[DailyResetService] After reset: ${postResetSnap.size} daily quests`);

        DailyResetService.isResetting = false;
        return true;
      } else {
        const streakExpired =
          lastActiveDate !== "" &&
          lastActiveDate !== today &&
          lastActiveDate !== yesterday;

        if (streakExpired && currentStreak !== 0) {
          const batch = writeBatch(db);
          batch.update(userRef, {
            streak: 0,
            updatedAt: serverTimestamp(),
          });
          await batch.commit();
        }
      }

      DailyResetService.isResetting = false;
      return false;
    } catch (error) {
      console.error("[DailyResetService] Error during daily reset:", error);
      DailyResetService.isResetting = false;
      return false;
    }
  }
}

export default DailyResetService;
