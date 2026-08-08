import { auth, db } from "@/lib/firebase";
import NotificationService, { RPGNotification } from "@/services/notificationService";
import { RPGTheme } from "@/utils/rpgTheme";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function getNotificationIcon(type: string): string {
  switch (type) {
    case "quest_completed":
      return "📜";
    case "achievement_unlocked":
      return "🏆";
    case "level_up":
      return "⭐";
    case "daily_reward":
      return "🎁";
    case "boss_victory":
      return "🐉";
    case "item_purchased":
      return "🪙";
    default:
      return "🔔";
  }
}

export default function NotificationCenterModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState<RPGNotification[]>([]);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !visible) return;

    const notifCol = collection(db, "users", uid, "notifications");
    const q = query(notifCol, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: RPGNotification[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type || "quest_completed",
          title: data.title || "Notification",
          message: data.message || "",
          read: !!data.read,
          createdAt: data.createdAt,
        };
      });
      setNotifications(list);
    }, (err) => {
      console.warn("Notifications onSnapshot error:", err);
    });

    return () => unsub();
  }, [uid, visible]);

  const handleMarkAsRead = async (id: string) => {
    if (uid) {
      await NotificationService.markAsRead(uid, id);
    }
  };

  const handleMarkAllRead = async () => {
    if (uid) {
      await NotificationService.markAllAsRead(uid);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>🔔 RPG NOTIFICATIONS</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} NEW</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* MARK ALL AS READ BUTTON */}
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.8}
            >
              <Text style={styles.markAllBtnText}>✓ Mark All as Read</Text>
            </TouchableOpacity>
          )}

          {/* NOTIFICATION LIST */}
          <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📜</Text>
                <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                <Text style={styles.emptySub}>
                  Complete quests, level up, defeat realm bosses, or purchase items to earn scroll logs!
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const icon = getNotificationIcon(item.type);
                let timeStr = "Recently";
                if (item.createdAt?.seconds) {
                  timeStr = new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      !item.read && styles.unreadCard,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleMarkAsRead(item.id)}
                  >
                    <Text style={styles.cardIcon}>{icon}</Text>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        {!item.read && <View style={styles.glowDot} />}
                      </View>
                      <Text style={styles.cardMessage}>{item.message}</Text>
                      <Text style={styles.cardTime}>{timeStr}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "85%",
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  unreadBadge: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 18,
    fontWeight: "900",
  },
  markAllBtn: {
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "#7C3AED",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  markAllBtnText: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "900",
  },
  listContainer: {
    paddingBottom: 10,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptyTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  emptySub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    padding: 12,
    marginBottom: 10,
  },
  unreadCard: {
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    borderColor: "#7C3AED",
  },
  cardIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  cardMessage: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  cardTime: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 6,
  },
});
