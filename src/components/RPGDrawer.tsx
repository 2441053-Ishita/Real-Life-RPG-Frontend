import { auth, db } from "@/lib/firebase";
import { router, usePathname } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { getHeroRank } from "@/utils/rank";
import { RPGTheme } from "@/utils/rpgTheme";
import { HeadingText, TitleText, BodyText, StatsText, ButtonText, AppText } from "./Typography";

import AvatarImage from "./AvatarImage";

export default function RPGDrawer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [hero, setHero] = useState({
    heroName: "Brave Adventurer",
    level: 1,
    xp: 0,
    totalXP: 0,
    coins: 0,
    streak: 1,
    equippedAvatar: "warrior",
    avatarUrl: null as string | null,
  });

  const pathname = usePathname();
  const uid = auth.currentUser?.uid;

  // Slide animation
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -320,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHero({
          heroName: data.heroName || "Brave Adventurer",
          level: data.level ?? 1,
          xp: data.xp ?? 0,
          totalXP: data.totalXP ?? 0,
          coins: data.coins ?? 0,
          streak: data.streak ?? 1,
          equippedAvatar: data.equippedAvatar || "warrior",
          avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
        });
      }
    });
    return () => unsub();
  }, [uid]);

  const rank = getHeroRank(hero.level);

  const menuItems = [
    { title: "Home", icon: "🏰", route: "/home" },
    { title: "Quests", icon: "📜", route: "/quests" },
    { title: "Skill Tree Matrix", icon: "⚡", route: "/skill-tree" },
    { title: "Hero Statistics", icon: "📊", route: "/statistics" },
    { title: "History", icon: "📖", route: "/quest-history" },
    { title: "Character", icon: "👤", route: "/character" },
    { title: "Inventory", icon: "🎒", route: "/inventory" },
    { title: "Leaderboard", icon: "🏆", route: "/leaderboard" },
    { title: "Shop", icon: "🪙", route: "/shop" },
    { title: "Achievements", icon: "🏆", route: "/achievements" },
    { title: "Boss Battles & Map", icon: "🐉", route: "/boss-battle" },
    { title: "Settings & Preferences", icon: "⚙️", route: "/settings" },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const handleLogout = async () => {
    onClose();
    await auth.signOut();
    router.replace("/login" as any);
  };

  if (!visible) return null;

  const xpPercent = Math.min(100, Math.round((hero.xp / 100) * 100));

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={styles.overlayContainer}>
        {/* BACKDROP */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* DRAWER PANEL */}
        <Animated.View
          style={[
            styles.drawerPanel,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.drawerContent}
          >
            {/* HERO PROFILE HEADER */}
            <View style={styles.heroProfileCard}>
              <View style={styles.avatarFrame}>
                <AvatarImage
                  avatarUrl={hero.avatarUrl}
                  equippedAvatar={hero.equippedAvatar}
                  size={58}
                />
                <View style={[styles.levelRing, { backgroundColor: rank.color }]}>
                  <StatsText style={styles.levelRingText}>Lvl {hero.level}</StatsText>
                </View>
              </View>

              <TitleText variant="hero" style={styles.heroName} numberOfLines={1}>
                {hero.heroName}
              </TitleText>

              <View style={[styles.rankTag, { backgroundColor: rank.color }]}>
                <HeadingText style={styles.rankText}>{rank.name}</HeadingText>
              </View>

              {/* XP PROGRESS BAR */}
              <View style={styles.xpSection}>
                <View style={styles.xpHeaderRow}>
                  <BodyText style={styles.xpLabel}>XP Progress</BodyText>
                  <StatsText style={styles.xpVal}>{hero.xp} / 100 XP</StatsText>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
                </View>
              </View>
            </View>

            {/* NAVIGATION MENU */}
            <View style={styles.menuGroup}>
              {menuItems.map((item) => {
                const isSelected = pathname === item.route;
                return (
                  <TouchableOpacity
                    key={item.route}
                    activeOpacity={0.8}
                    onPress={() => handleNavigate(item.route)}
                    style={[
                      styles.menuItem,
                      isSelected && styles.menuItemSelected,
                    ]}
                  >
                    <AppText style={styles.menuIcon}>{item.icon}</AppText>
                    <TitleText
                      variant="menu"
                      style={[
                        styles.menuText,
                        isSelected && styles.menuTextSelected,
                      ]}
                    >
                      {item.title}
                    </TitleText>
                    {isSelected && <View style={styles.selectedGlowDot} />}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogout}
                style={[styles.menuItem, styles.logoutItem]}
              >
                <AppText style={styles.menuIcon}>🚪</AppText>
                <ButtonText style={[styles.menuText, styles.logoutText]}>Logout</ButtonText>
              </TouchableOpacity>
            </View>

            {/* APP FOOTER */}
            <View style={styles.drawerFooter}>
              <HeadingText style={styles.footerAppTitle}>⚔️ REALM HABIT RPG</HeadingText>
              <StatsText style={styles.footerVersion}>v2.5.0 AAA RPG Edition</StatsText>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  drawerPanel: {
    width: 290,
    height: "100%",
    backgroundColor: RPGTheme.colors.bg,
    borderRightWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.4)",
    paddingTop: 50,
  },
  drawerContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroProfileCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RPGTheme.colors.goldBorder,
    marginBottom: 20,
  },
  avatarFrame: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: RPGTheme.colors.secondaryCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: RPGTheme.colors.purplePrimary,
    marginBottom: 10,
    position: "relative",
  },
  avatarEmoji: {
    fontSize: 30,
  },
  levelRing: {
    position: "absolute",
    bottom: -6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  levelRingText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  heroName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  rankTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 14,
  },
  rankText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  xpSection: {
    width: "100%",
  },
  xpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  xpLabel: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  xpVal: {
    color: RPGTheme.colors.goldLight,
    fontSize: 10,
    fontWeight: "800",
  },
  xpTrack: {
    height: 7,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 8,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: RPGTheme.colors.purplePrimary,
    borderRadius: 8,
  },
  menuGroup: {
    gap: 6,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RPGTheme.colors.primaryCard,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 12,
  },
  menuItemSelected: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderColor: RPGTheme.colors.purplePrimary,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  menuTextSelected: {
    color: RPGTheme.colors.textPrimary,
    fontWeight: "900",
  },
  selectedGlowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RPGTheme.colors.purpleSecondary,
  },
  logoutItem: {
    marginTop: 10,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  logoutText: {
    color: RPGTheme.colors.danger,
  },
  drawerFooter: {
    alignItems: "center",
    paddingTop: 10,
  },
  footerAppTitle: {
    color: RPGTheme.colors.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footerVersion: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
});
