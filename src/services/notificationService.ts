import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export type NotificationType =
  | "quest_completed"
  | "achievement_unlocked"
  | "level_up"
  | "daily_reward"
  | "boss_victory"
  | "item_purchased";

export interface RPGNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export class NotificationService {
  /**
   * Adds a new notification document to users/{uid}/notifications.
   */
  static async addNotification(
    uid: string,
    data: { type: NotificationType; title: string; message: string }
  ): Promise<string | null> {
    if (!uid) return null;
    try {
      const colRef = collection(db, "users", uid, "notifications");
      const docRef = await addDoc(colRef, {
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (e) {
      console.error("[NotificationService] Error adding notification:", e);
      return null;
    }
  }

  /**
   * Marks a single notification as read in users/{uid}/notifications/{notificationId}.
   */
  static async markAsRead(uid: string, notificationId: string): Promise<void> {
    if (!uid || !notificationId) return;
    try {
      const docRef = doc(db, "users", uid, "notifications", notificationId);
      await updateDoc(docRef, { read: true });
    } catch (e) {
      console.error("[NotificationService] Error marking as read:", e);
    }
  }

  /**
   * Marks all unread notifications as read.
   */
  static async markAllAsRead(uid: string): Promise<void> {
    if (!uid) return;
    try {
      const colRef = collection(db, "users", uid, "notifications");
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      let count = 0;

      snap.docs.forEach((docSnap) => {
        if (!docSnap.data().read) {
          batch.update(docSnap.ref, { read: true });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.error("[NotificationService] Error marking all as read:", e);
    }
  }
}

export default NotificationService;
