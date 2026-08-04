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
   * Fetches all quests for a given user from users/{uid}/quests collection.
   */
  static async getUserQuests(uid: string): Promise<QuestData[]> {
    try {
      const questsRef = collection(db, "users", uid, "quests");
      const q = query(questsRef, orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);

      const quests: QuestData[] = snapshot.docs.map((docSnap) => {
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
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
          ...data,
        };
      });

      return quests;
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

// Standalone function exports for maximum convenience
export const getUserQuests = QuestService.getUserQuests;
export const createQuest = QuestService.createQuest;
export const updateQuest = QuestService.updateQuest;
export const deleteQuest = QuestService.deleteQuest;

export default QuestService;
