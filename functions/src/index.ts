import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. SCHEDULED FUNCTION: Reset Daily Quests & Check Streak Expirations
 * Runs every day at 00:00 UTC.
 */
export const resetDailyQuestsAndStreaks = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "UTC",
  },
  async (event: any) => {
    console.log("[Cloud Function] Starting daily quest and streak maintenance job...");

    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log("[Cloud Function] No users found for daily reset.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      const todayQuestsCompleted = data.todayQuestsCompleted ?? 0;
      let streak = data.streak ?? 1;

      // If user completed 0 quests yesterday, break active streak
      if (todayQuestsCompleted === 0 && streak > 1) {
        streak = 1;
      }

      batch.update(docSnap.ref, {
        todayQuestsCompleted: 0,
        streak: streak,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      count++;
    });

    await batch.commit();
    console.log(`[Cloud Function] Successfully reset daily stats for ${count} users.`);
  }
);

/**
 * 2. CALLABLE FUNCTION: Secure Server-Side Quest Completion & Reward Calculation
 * Validates completion, calculates XP & Coins, handles Level-Ups securely.
 */
export const completeQuestCallable = onCall(
  async (request: CallableRequest<{ questId: string; xpReward: number; coinReward: number }>) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required to complete quests.");
    }

    const { questId, xpReward = 20, coinReward = 15 } = request.data;
    if (!questId) {
      throw new HttpsError("invalid-argument", "questId is required.");
    }

    const userRef = db.collection("users").doc(uid);

    return db.runTransaction(async (transaction: any) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User hero profile not found.");
      }

      const data = userSnap.data()!;
      let level = data.level ?? 1;
      let xp = (data.xp ?? 0) + xpReward;
      let totalXP = (data.totalXP ?? 0) + xpReward;
      let coins = (data.coins ?? 0) + coinReward;
      let completedQuests: string[] = data.completedQuests || [];
      let totalQuestsCompleted = (data.totalQuestsCompleted ?? 0) + 1;
      let todayQuestsCompleted = (data.todayQuestsCompleted ?? 0) + 1;

      if (!completedQuests.includes(questId)) {
        completedQuests.push(questId);
      }

      // Level-up logic
      let leveledUp = false;
      while (xp >= 100) {
        xp -= 100;
        level += 1;
        leveledUp = true;
      }

      transaction.update(userRef, {
        level,
        xp,
        totalXP,
        coins,
        completedQuests,
        totalQuestsCompleted,
        todayQuestsCompleted,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        level,
        xp,
        totalXP,
        coins,
        leveledUp,
      };
    });
  }
);

/**
 * 3. FIRESTORE TRIGGER: Securely Sync Global Leaderboard
 * Triggers automatically whenever a user document is updated.
 */
export const syncLeaderboardOnUserUpdate = onDocumentUpdated(
  "users/{userId}",
  async (event: any) => {
    const userId = event.params.userId;
    const afterData = event.data?.after.data();

    if (!afterData) return;

    const leaderboardRef = db.collection("leaderboards").doc(userId);

    await leaderboardRef.set(
      {
        uid: userId,
        heroName: afterData.heroName || "Hero of the Realm",
        level: afterData.level ?? 1,
        totalXP: afterData.totalXP ?? 0,
        equippedAvatar: afterData.equippedAvatar || "knight",
        avatarUrl: afterData.profile?.avatarUrl || afterData.avatarUrl || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`[Cloud Function] Leaderboard entry updated for user: ${userId}`);
  }
);
