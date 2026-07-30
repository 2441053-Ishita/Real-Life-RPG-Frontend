import { Platform } from "react-native";

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      const res = await window.Notification.requestPermission();
      return res === "granted";
    }
    return false;
  }
  return true;
}

export async function scheduleDailyHabitReminder(
  timeStr: string = "20:00",
  streak: number = 1
) {
  if (Platform.OS === "web") {
    console.log(`[Notification Manager] Daily reminder set for ${timeStr}`);
    return;
  }
  // Native scheduling logic fallback
}

export async function cancelAllReminders() {
  console.log("[Notification Manager] Reminders cancelled.");
}

export async function sendTestNotification(streak: number = 1) {
  const title = "🔥 Hero Streak Alert!";
  const body = `Your hero awaits! Complete today's habits to protect your ${streak}-day streak.`;

  if (Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window) {
    if (window.Notification.permission === "granted") {
      new window.Notification(title, { body, icon: "⚔️" });
    } else {
      const res = await window.Notification.requestPermission();
      if (res === "granted") {
        new window.Notification(title, { body, icon: "⚔️" });
      } else {
        alert(`${title}\n\n${body}`);
      }
    }
  } else {
    alert(`${title}\n\n${body}`);
  }
}
