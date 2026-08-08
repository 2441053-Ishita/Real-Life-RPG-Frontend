import { auth, db } from "@/lib/firebase";
import { RPGTheme } from "@/utils/rpgTheme";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import RPGDrawer from "./RPGDrawer";
import NotificationCenterModal from "./NotificationCenterModal";
import { HeadingText, ButtonText, StatsText, AppText } from "./Typography";

function RPGHeader({ title }: { title?: string }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(1);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsubUser = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCoins(data.coins ?? 0);
        setStreak(data.streak ?? 1);
      }
    });

    const notifRef = collection(db, "users", uid, "notifications");
    const unsubNotif = onSnapshot(notifRef, (snap) => {
      const unread = snap.docs.filter((d) => !d.data().read).length;
      setUnreadNotifCount(unread);
    });

    return () => {
      unsubUser();
      unsubNotif();
    };
  }, [uid]);

  return (
    <>
      <View style={styles.headerContainer}>
        {/* DRAWER TOGGLE BUTTON */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setDrawerVisible(true)}
          style={styles.drawerToggleButton}
        >
          <AppText style={styles.menuIcon}>🐉</AppText>
          <ButtonText style={styles.menuLabel}>MENU</ButtonText>
        </TouchableOpacity>

        {title ? (
          <HeadingText style={styles.headerTitle} numberOfLines={1}>
            {title}
          </HeadingText>
        ) : (
          <View style={styles.realmTag}>
            <HeadingText style={styles.realmTagText}>⚔️ REALM RPG</HeadingText>
          </View>
        )}

        {/* TOP BADGES & NOTIFICATION BELL */}
        <View style={styles.badgesRow}>
          {/* NOTIFICATION BELL BUTTON */}
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.8}
            onPress={() => setNotifVisible(true)}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadNotifCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.streakBadge}>
            <StatsText style={styles.streakText}>🔥 {streak}</StatsText>
          </View>

          <View style={styles.coinsBadge}>
            <StatsText style={styles.coinsText}>🪙 {coins}</StatsText>
          </View>
        </View>
      </View>

      <RPGDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <NotificationCenterModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
    </>
  );
}

export default React.memo(RPGHeader);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: RPGTheme.colors.bg,
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  drawerToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RPGTheme.colors.primaryCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    gap: 6,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuLabel: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  realmTag: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: RPGTheme.colors.goldBorder,
  },
  realmTagText: {
    color: RPGTheme.colors.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bellButton: {
    position: "relative",
    backgroundColor: RPGTheme.colors.primaryCard,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  bellIcon: {
    fontSize: 14,
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  streakBadge: {
    backgroundColor: RPGTheme.colors.primaryCard,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  streakText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
  },
  coinsBadge: {
    backgroundColor: RPGTheme.colors.primaryCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RPGTheme.colors.goldBorder,
  },
  coinsText: {
    color: RPGTheme.colors.goldLight,
    fontSize: 11,
    fontWeight: "900",
  },
});
