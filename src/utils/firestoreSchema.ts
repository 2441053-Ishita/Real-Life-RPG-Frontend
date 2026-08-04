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
  lastLoginDate: string;
  equippedTitle: string;
  equippedAvatarId: string;
  currentChapter: number;
  stats: {
    strength: number;
    intelligence: number;
    discipline: number;
    wisdom: number;
    vitality: number;
    creativity: number;
  };
  equippedSlots: {
    weapon: string | null;
    helmet: string | null;
    armor: string | null;
    boots: string | null;
    shield: string | null;
    accessory: string | null;
  };
  settings: {
    notifications: boolean;
    reminderTime: string;
    soundEffects: boolean;
    backgroundMusic: boolean;
    vibration: boolean;
  };
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
  lastLoginDate: new Date().toISOString().split("T")[0],
  equippedTitle: "Novice Adventurer",
  equippedAvatarId: "avatar_knight_01",
  currentChapter: 1,
  stats: {
    strength: 10,
    intelligence: 10,
    discipline: 10,
    wisdom: 10,
    vitality: 10,
    creativity: 10,
  },
  equippedSlots: {
    weapon: null,
    helmet: null,
    armor: null,
    boots: null,
    shield: null,
    accessory: null,
  },
  settings: {
    notifications: true,
    reminderTime: "20:00",
    soundEffects: true,
    backgroundMusic: true,
    vibration: true,
  },
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
      const leaderboardRef = doc(db, "leaderboard", uid);
      await setDoc(
        leaderboardRef,
        {
          uid,
          heroName,
          class: heroClass,
          level: 1,
          totalXP: 0,
          streak: 1,
          equippedAvatarId: "avatar_knight_01",
          equippedTitle: "Novice Adventurer",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`[Schema Initializer] Successfully initialized Firestore schema for user: ${uid}`);
    }
  } catch (error) {
    console.error("[Schema Initializer] Error initializing user schema:", error);
  }
}
