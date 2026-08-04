import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification behavior for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requirement 1: Ask notification permission on first launch.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      const res = await window.Notification.requestPermission();
      return res === "granted";
    }
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("[Notifications] Error requesting permission:", error);
    return false;
  }
}

/**
 * Requirement 3: Send a local notification every day at selected daily reminder time:
 * Title: ⚔️ Hero, your quests are waiting!
 * Body: Complete today's quests and protect your streak!
 *
 * Requirement 4: Evening streak reminder at 20:00 (8:00 PM):
 * Title: 🔥 Don't lose your streak!
 * Body: Complete at least one quest today.
 */
export async function scheduleDailyNotifications(
  reminderTimeStr: string = "09:00",
  streak: number = 1
) {
  if (Platform.OS === "web") {
    console.log(`[Notifications] Web fallback: Daily reminder set for ${reminderTimeStr}`);
    return;
  }

  try {
    // Cancel existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Parse HH:mm from reminderTimeStr (default "09:00")
    const [hourStr, minStr] = (reminderTimeStr || "09:00").split(":");
    const hour = parseInt(hourStr || "9", 10);
    const minute = parseInt(minStr || "0", 10);

    // 1. Daily Quest Reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚔️ Hero, your quests are waiting!",
        body: "Complete today's quests and protect your streak!",
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      } as any,
    });

    // 2. Evening Streak Guard Reminder (8:00 PM / 20:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Don't lose your streak!",
        body: "Complete at least one quest today.",
        sound: true,
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      } as any,
    });

    console.log(`[Notifications] Scheduled daily reminder for ${reminderTimeStr} and evening streak guard at 20:00.`);
  } catch (error) {
    console.error("[Notifications] Error scheduling notifications:", error);
  }
}

/**
 * Cancel all scheduled reminders
 */
export async function cancelAllReminders() {
  if (Platform.OS === "web") {
    console.log("[Notifications] Cancelled web reminders.");
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("[Notifications] Cancelled all local push notifications.");
  } catch (error) {
    console.error("[Notifications] Error cancelling reminders:", error);
  }
}

/**
 * Send test notification
 */
export async function sendTestNotification(streak: number = 1) {
  const title = "⚔️ Hero, your quests are waiting!";
  const body = `Complete today's quests and protect your ${streak}-day streak!`;

  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
      new window.Notification(title, { body });
    } else {
      alert(`${title}\n\n${body}`);
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // Immediate trigger
    });
  } catch (error) {
    alert(`${title}\n\n${body}`);
  }
}
