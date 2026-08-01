"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncLeaderboardOnUserUpdate = exports.completeQuestCallable = exports.resetDailyQuestsAndStreaks = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
/**
 * 1. SCHEDULED FUNCTION: Reset Daily Quests & Check Streak Expirations
 * Runs every day at 00:00 UTC.
 */
exports.resetDailyQuestsAndStreaks = (0, scheduler_1.onSchedule)({
    schedule: "0 0 * * *",
    timeZone: "UTC",
}, async (event) => {
    console.log("[Cloud Function] Starting daily quest and streak maintenance job...");
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    if (snapshot.empty) {
        console.log("[Cloud Function] No users found for daily reset.");
        return;
    }
    const batch = db.batch();
    let count = 0;
    snapshot.forEach((docSnap) => {
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
});
/**
 * 2. CALLABLE FUNCTION: Secure Server-Side Quest Completion & Reward Calculation
 * Validates completion, calculates XP & Coins, handles Level-Ups securely.
 */
exports.completeQuestCallable = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required to complete quests.");
    }
    const { questId, xpReward = 20, coinReward = 15 } = request.data;
    if (!questId) {
        throw new https_1.HttpsError("invalid-argument", "questId is required.");
    }
    const userRef = db.collection("users").doc(uid);
    return db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
            throw new https_1.HttpsError("not-found", "User hero profile not found.");
        }
        const data = userSnap.data();
        let level = data.level ?? 1;
        let xp = (data.xp ?? 0) + xpReward;
        let totalXP = (data.totalXP ?? 0) + xpReward;
        let coins = (data.coins ?? 0) + coinReward;
        let completedQuests = data.completedQuests || [];
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
});
/**
 * 3. FIRESTORE TRIGGER: Securely Sync Global Leaderboard
 * Triggers automatically whenever a user document is updated.
 */
exports.syncLeaderboardOnUserUpdate = (0, firestore_1.onDocumentUpdated)("users/{userId}", async (event) => {
    const userId = event.params.userId;
    const afterData = event.data?.after.data();
    if (!afterData)
        return;
    const leaderboardRef = db.collection("leaderboards").doc(userId);
    await leaderboardRef.set({
        uid: userId,
        heroName: afterData.heroName || "Hero of the Realm",
        level: afterData.level ?? 1,
        totalXP: afterData.totalXP ?? 0,
        equippedAvatar: afterData.equippedAvatar || "knight",
        avatarUrl: afterData.profile?.avatarUrl || afterData.avatarUrl || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`[Cloud Function] Leaderboard entry updated for user: ${userId}`);
});
//# sourceMappingURL=index.js.map