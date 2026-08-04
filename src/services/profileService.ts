import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface UserProfileData {
  heroName: string;
  heroClass: string;
  class?: string;
  avatar: string;
  equippedAvatar?: string;
  equippedAvatarId?: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export const DEFAULT_PROFILE_VALUES: UserProfileData = {
  heroName: "Paladin Adventurer",
  heroClass: "warrior",
  avatar: "avatar_knight_01",
  level: 1,
  xp: 0,
  coins: 50,
  streak: 1,
};

export class ProfileService {
  /**
   * Retrieves user profile document from Firestore (users/{uid}).
   * If any required fields are missing, automatically populates them with default values
   * without overwriting existing data.
   */
  static async getProfile(uid: string): Promise<UserProfileData | null> {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const initialProfile: UserProfileData = {
          ...DEFAULT_PROFILE_VALUES,
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, initialProfile, { merge: true });
        return initialProfile;
      }

      const data = snap.data() || {};
      const updatesNeeded: Record<string, any> = {};

      const heroName = data.heroName ?? DEFAULT_PROFILE_VALUES.heroName;
      if (data.heroName === undefined) updatesNeeded.heroName = DEFAULT_PROFILE_VALUES.heroName;

      const heroClass = data.heroClass ?? data.class ?? DEFAULT_PROFILE_VALUES.heroClass;
      if (data.heroClass === undefined && data.class === undefined) {
        updatesNeeded.heroClass = DEFAULT_PROFILE_VALUES.heroClass;
        updatesNeeded.class = DEFAULT_PROFILE_VALUES.heroClass;
      }

      const avatar = data.avatar ?? data.equippedAvatar ?? data.equippedAvatarId ?? DEFAULT_PROFILE_VALUES.avatar;
      if (data.avatar === undefined) updatesNeeded.avatar = avatar;

      const level = data.level ?? DEFAULT_PROFILE_VALUES.level;
      if (data.level === undefined) updatesNeeded.level = DEFAULT_PROFILE_VALUES.level;

      const xp = data.xp ?? DEFAULT_PROFILE_VALUES.xp;
      if (data.xp === undefined) updatesNeeded.xp = DEFAULT_PROFILE_VALUES.xp;

      const coins = data.coins ?? DEFAULT_PROFILE_VALUES.coins;
      if (data.coins === undefined) updatesNeeded.coins = DEFAULT_PROFILE_VALUES.coins;

      const streak = data.streak ?? DEFAULT_PROFILE_VALUES.streak;
      if (data.streak === undefined) updatesNeeded.streak = DEFAULT_PROFILE_VALUES.streak;

      // Populate missing fields in Firestore without overwriting existing data
      if (Object.keys(updatesNeeded).length > 0) {
        updatesNeeded.updatedAt = serverTimestamp();
        await setDoc(userRef, updatesNeeded, { merge: true });
      }

      return {
        ...data,
        heroName,
        heroClass,
        class: heroClass,
        avatar,
        equippedAvatar: avatar,
        level,
        xp,
        coins,
        streak,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      } as UserProfileData;
    } catch (error) {
      console.error("[ProfileService] Error getting profile:", error);
      return null;
    }
  }

  /**
   * Updates specified user profile fields in Firestore (users/{uid}).
   */
  static async updateProfile(
    uid: string,
    data: Partial<UserProfileData>
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", uid);
      const payload: Record<string, any> = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      if (data.heroClass && !data.class) {
        payload.class = data.heroClass;
      } else if (data.class && !data.heroClass) {
        payload.heroClass = data.class;
      }

      if (data.avatar) {
        payload.equippedAvatar = data.avatar;
        payload.equippedAvatarId = data.avatar;
      }

      await updateDoc(userRef, payload);
    } catch (error) {
      console.error("[ProfileService] Error updating profile:", error);
      throw error;
    }
  }

  /**
   * Re-fetches user profile document from Firestore.
   */
  static async refreshProfile(uid: string): Promise<UserProfileData | null> {
    return ProfileService.getProfile(uid);
  }
}

export default ProfileService;
