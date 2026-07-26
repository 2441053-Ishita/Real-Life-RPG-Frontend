import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// Get difference between two dates
const getDayDifference = (
    oldDate: string,
    newDate: string
) => {
    const oldTime = new Date(
        `${oldDate}T00:00:00`
    ).getTime();

    const newTime = new Date(
        `${newDate}T00:00:00`
    ).getTime();

    return Math.round(
        (newTime - oldTime) /
        (1000 * 60 * 60 * 24)
    );
};

export const checkDailyReset = async (
    userId: string
) => {
    try {
        const userRef = doc(
            db,
            "users",
            userId
        );

        const snapshot = await getDoc(
            userRef
        );

        if (!snapshot.exists()) {
            console.log(
                "Daily reset: User document not found."
            );

            return;
        }

        const data = snapshot.data();

        const today = getTodayDate();

        const lastQuestDate =
            data.lastQuestDate || null;

        // First time using daily reset system
        if (!lastQuestDate) {
            await updateDoc(userRef, {
                lastQuestDate: today,
                updatedAt: serverTimestamp(),
            });

            console.log(
                "Daily reset initialized:",
                today
            );

            return;
        }

        // Same day = nothing to reset
        if (lastQuestDate === today) {
            console.log(
                "Daily quests already current."
            );

            return;
        }

        const dayDifference =
            getDayDifference(
                lastQuestDate,
                today
            );

        let newStreak =
            data.streak ?? 0;

        const completedQuests =
            data.completedQuests || [];

        // If user completed at least one quest
        // on the previous day
        if (
            dayDifference === 1 &&
            completedQuests.length > 0
        ) {
            newStreak += 1;
        }

        // User missed one or more days
        else if (dayDifference > 1) {
            newStreak = 0;
        }

        await updateDoc(userRef, {
            completedQuests: [],

            streak: newStreak,

            lastQuestDate: today,

            updatedAt: serverTimestamp(),
        });

        console.log(
            "DAILY QUEST RESET COMPLETE"
        );

        console.log(
            "New streak:",
            newStreak
        );
    } catch (error) {
        console.error(
            "DAILY RESET ERROR:",
            error
        );

        throw error;
    }
};