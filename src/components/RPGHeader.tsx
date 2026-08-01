import { auth, db } from "@/lib/firebase";
import { RPGTheme } from "@/app/utils/rpgTheme";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import RPGDrawer from "./RPGDrawer";
import { HeadingText, ButtonText, StatsText, AppText } from "./Typography";

function RPGHeader({ title }: { title?: string }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(1);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCoins(data.coins ?? 0);
        setStreak(data.streak ?? 1);
      }
    });
    return () => unsub();
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

        {/* TOP BADGES */}
        <View style={styles.badgesRow}>
          <View style={styles.streakBadge}>
            <StatsText style={styles.streakText}>🔥 {streak}</StatsText>
          </View>

          <View style={styles.coinsBadge}>
            <StatsText style={styles.coinsText}>🪙 {coins}</StatsText>
          </View>
        </View>
      </View>

      <RPGDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
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
