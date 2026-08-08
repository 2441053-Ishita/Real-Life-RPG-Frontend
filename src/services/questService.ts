import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";

export type QuestDifficulty = "easy" | "medium" | "hard" | "epic";

export interface QuestData {
  id?: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty | string;
  category: string;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  active?: boolean;
  locked?: boolean;
  emoji?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export type CreateQuestInput = Omit<
  QuestData,
  "id" | "createdAt" | "updatedAt"
>;

export class QuestService {
  /**
   * Subscribes to real-time updates for custom quests from users/{uid}/quests.
   */
  static listenToUserQuests(
    uid: string,
    onNext: (quests: QuestData[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const questsRef = collection(db, "users", uid, "quests");
    const q = query(questsRef, orderBy("createdAt", "asc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const quests: QuestData[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          return {
            id: docSnap.id,
            title: data.title ?? "",
            description: data.description ?? "",
            difficulty: data.difficulty ?? "easy",
            category: data.category ?? "general",
            xpReward: data.xpReward ?? 10,
            coinReward: data.coinReward ?? 5,
            completed: Boolean(data.completed),
            active: Boolean(data.active),
            locked: Boolean(data.locked),
            emoji: data.emoji || "📜",
            createdAt: data.createdAt ?? null,
            updatedAt: data.updatedAt ?? null,
            ...data,
          };
        });
        onNext(quests);
      },
      (err) => {
        console.error("[QuestService] Error listening to user quests:", err);
        if (onError) onError(err);
      }
    );
  }

  /**
   * Subscribes to real-time updates for daily quests from users/{uid}/dailyQuests.
   */
  static listenToDailyQuests(
    uid: string,
    onNext: (quests: QuestData[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const dailyRef = collection(db, "users", uid, "dailyQuests");

    return onSnapshot(
      dailyRef,
      (snapshot) => {
        const quests: QuestData[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() || {};
          return {
            id: docSnap.id,
            title: data.title ?? "Daily Quest",
            description: data.description ?? "",
            difficulty: data.difficulty ?? "easy",
            category: data.category ?? "general",
            xpReward: data.xpReward ?? 10,
            coinReward: data.coinReward ?? 5,
            completed: Boolean(data.completed),
            active: Boolean(data.active),
            locked: Boolean(data.locked),
            emoji: data.emoji || "⚔️",
            createdAt: data.createdAt ?? null,
            updatedAt: data.updatedAt ?? null,
            ...data,
          };
        });

        // Ensure natural ordering by ID (daily-1, daily-2, daily-3, daily-4)
        quests.sort((a, b) => (a.id || "").localeCompare(b.id || ""));
        onNext(quests);
      },
      (err) => {
        console.error("[QuestService] Error listening to daily quests:", err);
        if (onError) onError(err);
      }
    );
  }

  /**
   * Fetches all quests for a given user from users/{uid}/quests collection.
   */
  static async getUserQuests(uid: string): Promise<QuestData[]> {
    try {
      const questsRef = collection(db, "users", uid, "quests");
      const q = query(questsRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          id: docSnap.id,
          title: data.title ?? "",
          description: data.description ?? "",
          difficulty: data.difficulty ?? "easy",
          category: data.category ?? "general",
          xpReward: data.xpReward ?? 0,
          coinReward: data.coinReward ?? 0,
          completed: data.completed ?? false,
          active: Boolean(data.active),
          locked: Boolean(data.locked),
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
          ...data,
        };
      });
    } catch (error) {
      console.error("[QuestService] Error getting user quests:", error);
      return [];
    }
  }

  /**
   * Creates a new quest document in users/{uid}/quests/{questId}.
   */
  static async createQuest(
    uid: string,
    questData: CreateQuestInput
  ): Promise<string> {
    try {
      const questsRef = collection(db, "users", uid, "quests");
      const payload = {
        title: questData.title,
        description: questData.description ?? "",
        difficulty: questData.difficulty ?? "easy",
        category: questData.category ?? "general",
        xpReward: questData.xpReward ?? 10,
        coinReward: questData.coinReward ?? 5,
        completed: questData.completed ?? false,
        active: questData.active ?? true,
        locked: questData.locked ?? false,
        emoji: questData.emoji || "📜",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(questsRef, payload);
      return docRef.id;
    } catch (error) {
      console.error("[QuestService] Error creating quest:", error);
      throw error;
    }
  }

  /**
   * Updates an existing quest document at users/{uid}/quests/{questId}.
   */
  static async updateQuest(
    uid: string,
    questId: string,
    data: Partial<QuestData>
  ): Promise<void> {
    try {
      const questRef = doc(db, "users", uid, "quests", questId);
      const payload: Record<string, any> = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      delete payload.id;

      await updateDoc(questRef, payload);
    } catch (error) {
      console.error("[QuestService] Error updating quest:", error);
      throw error;
    }
  }

  /**
   * Deletes a quest document at users/{uid}/quests/{questId}.
   */
  static async deleteQuest(uid: string, questId: string): Promise<void> {
    try {
      const questRef = doc(db, "users", uid, "quests", questId);
      await deleteDoc(questRef);
    } catch (error) {
      console.error("[QuestService] Error deleting quest:", error);
      throw error;
    }
  }
}

export const getUserQuests = QuestService.getUserQuests;
export const createQuest = QuestService.createQuest;
export const updateQuest = QuestService.updateQuest;
export const deleteQuest = QuestService.deleteQuest;
export const listenToUserQuests = QuestService.listenToUserQuests;
export const listenToDailyQuests = QuestService.listenToDailyQuests;

export default QuestService;
