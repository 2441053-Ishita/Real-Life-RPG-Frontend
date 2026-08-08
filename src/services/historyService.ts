import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import NotificationService from "./notificationService";

export interface QuestHistoryEntryInput {
  title: string;
  description: string;
  difficulty: string;
  xpEarned: number;
  coinsEarned: number;
  questType: "daily" | "custom";
  emoji?: string;
  questId?: string;
}

export class HistoryService {
  /**
   * Adds a completed quest record to users/{uid}/history/{historyId}
   * and users/{uid}/questHistory/{historyId}.
   */
  static async recordHistory(
    uid: string,
    entry: QuestHistoryEntryInput
  ): Promise<void> {
    if (!uid) return;

    try {
      const historyData = {
        title: entry.title || "Completed Quest",
        description: entry.description || "",
        difficulty: entry.difficulty || "easy",
        xpEarned: entry.xpEarned ?? 0,
        coinsEarned: entry.coinsEarned ?? 0,
        questType: entry.questType || "daily",
        emoji: entry.emoji || "⚔️",
        questId: entry.questId || "",
        completedAt: serverTimestamp(),
      };

      const primaryHistoryRef = collection(db, "users", uid, "history");
      const secondaryHistoryRef = collection(db, "users", uid, "questHistory");

      await Promise.all([
        addDoc(primaryHistoryRef, historyData),
        addDoc(secondaryHistoryRef, historyData),
      ]);

      // Record Quest Completed Notification
      NotificationService.addNotification(uid, {
        type: "quest_completed",
        title: "Quest Completed! 📜",
        message: `Completed "${entry.title}" and earned +${entry.xpEarned} XP & +${entry.coinsEarned} Gold!`,
      }).catch((e) => console.error("Notification error:", e));

      console.log(`[HistoryService] Quest history recorded for user ${uid} in users/${uid}/history`);
    } catch (error) {
      console.error("[HistoryService] Error recording quest history:", error);
    }
  }
}

export const recordHistory = HistoryService.recordHistory;
export default HistoryService;
