import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export type UserHeroSchema = {
  uid: string;
  heroName: string;
  class: string;
  level: number;
  xp: number;
  totalXP: number;
  coins: number;
  streak: number;
  longestStreak: number;
  equippedTitle: string;
  equippedAvatar: string;
  completedQuests: string[];
  totalQuestsCompleted: number;
  todayQuestsCompleted: number;
  chapterBossesDefeated: Record<string, boolean>;
  currentChapter: number;
  unlockedAchievements: string[];
  profile: {
    avatarUrl: string | null;
    bio?: string;
  };
  settings: {
    notifications: boolean;
    reminderTime: string;
    soundEffects: boolean;
    backgroundMusic: boolean;
    vibration: boolean;
  };
  skills: Record<string, number>;
  equipment: Record<string, any>;
  createdAt: any;
  updatedAt: any;
};

export const DEFAULT_INITIAL_HERO: Partial<UserHeroSchema> = {
  heroName: "Paladin Adventurer",
  class: "warrior",
  level: 1,
  xp: 0,
  totalXP: 0,
  coins: 50,
  streak: 1,
  longestStreak: 1,
  equippedTitle: "Novice Adventurer",
  equippedAvatar: "knight",
  completedQuests: [],
  totalQuestsCompleted: 0,
  todayQuestsCompleted: 0,
  chapterBossesDefeated: {},
  currentChapter: 1,
  unlockedAchievements: [],
  profile: {
    avatarUrl: null,
  },
  settings: {
    notifications: true,
    reminderTime: "20:00",
    soundEffects: true,
    backgroundMusic: true,
    vibration: true,
  },
  skills: {
    warrior_attack: 0,
    guardian_defense: 0,
    scholar_xp: 0,
    fortune_coins: 0,
  },
  equipment: {},
};

export async function initializeUserSchema(
  uid: string,
  heroName: string = "Paladin Adventurer",
  heroClass: string = "warrior"
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const newUserData = {
        ...DEFAULT_INITIAL_HERO,
        uid,
        heroName,
        class: heroClass,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserData, { merge: true });

      // Initialize global leaderboard entry
      const leaderboardRef = doc(db, "leaderboards", uid);
      await setDoc(leaderboardRef, {
        uid,
        heroName,
        level: 1,
        totalXP: 0,
        equippedAvatar: "knight",
        updatedAt: serverTimestamp(),
      }, { merge: true });

      console.log(`[Schema Initializer] Successfully initialized Firestore schema for user: ${uid}`);
    }
  } catch (error) {
    console.error("[Schema Initializer] Error initializing user schema:", error);
  }
}
