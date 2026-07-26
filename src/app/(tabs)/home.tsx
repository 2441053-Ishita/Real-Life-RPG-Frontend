import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type HeroData = {
  heroName: string;
  email: string;
  class: string;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;
  completedQuests: number[];
};

const classEmoji: Record<string, string> = {
  warrior: "🛡️",
  mage: "🧙",
  archer: "🏹",
  assassin: "🥷",
};

export default function HomeScreen() {
  const [hero, setHero] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setHero({
            heroName: data.heroName || "Hero",
            email: data.email || user.email || "",
            class: data.class || "warrior",
            level: data.level ?? 1,
            xp: data.xp ?? 0,
            totalXP: data.totalXP ?? 0,
            streak: data.streak ?? 1,
            completedQuests:
              data.completedQuests || [],
          });
        } else {
          console.log(
            "No Firestore hero document found."
          );
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          "HOME FIRESTORE ERROR:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#7C3AED"
        />

        <Text style={styles.loadingText}>
          Loading your adventure...
        </Text>
      </View>
    );
  }

  if (!hero) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorEmoji}>
          ⚠️
        </Text>

        <Text style={styles.errorTitle}>
          Hero profile not found
        </Text>

        <Text style={styles.errorText}>
          Create a new hero to begin your adventure.
        </Text>

        <TouchableOpacity
          style={styles.createHeroButton}
          onPress={() =>
            router.replace("/register")
          }
        >
          <Text
            style={styles.createHeroButtonText}
          >
            Create Hero
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const xpNeeded = 100;

  const xpProgress = Math.min(
    (hero.xp / xpNeeded) * 100,
    100
  );

  const remainingXP = Math.max(
    xpNeeded - hero.xp,
    0
  );

  const heroClass =
    hero.class.charAt(0).toUpperCase() +
    hero.class.slice(1);

  const heroEmoji =
    classEmoji[hero.class] || "⚔️";

  const completedCount =
    hero.completedQuests.length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>
              WELCOME BACK
            </Text>

            <Text style={styles.heroName}>
              {heroEmoji} {hero.heroName}
            </Text>

            <Text style={styles.heroClass}>
              {heroClass}
            </Text>
          </View>

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              LVL {hero.level}
            </Text>
          </View>
        </View>

        {/* HERO PROGRESS */}

        <View style={styles.mainCard}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardLabel}>
                YOUR PROGRESS
              </Text>

              <Text style={styles.levelTitle}>
                Level {hero.level} {heroClass}
              </Text>
            </View>

            <Text style={styles.trophy}>
              🏆
            </Text>
          </View>

          <View style={styles.xpRow}>
            <Text style={styles.xpText}>
              XP Progress
            </Text>

            <Text style={styles.xpNumber}>
              {hero.xp} / {xpNeeded} XP
            </Text>
          </View>

          <View
            style={styles.progressBackground}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${xpProgress}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.nextLevel}>
            {remainingXP > 0
              ? `${remainingXP} XP remaining until Level ${hero.level + 1
              }`
              : "Ready to level up!"}
          </Text>
        </View>

        {/* STATS */}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>
              🔥
            </Text>

            <Text style={styles.statValue}>
              {hero.streak}
            </Text>

            <Text style={styles.statLabel}>
              Day Streak
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>
              ⚔️
            </Text>

            <Text style={styles.statValue}>
              {completedCount}
            </Text>

            <Text style={styles.statLabel}>
              Quests
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>
              ⭐
            </Text>

            <Text style={styles.statValue}>
              {hero.totalXP}
            </Text>

            <Text style={styles.statLabel}>
              Total XP
            </Text>
          </View>
        </View>

        {/* TODAY'S QUESTS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Today's Quests
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Complete quests to earn XP
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push("/quests")
            }
          >
            <Text style={styles.viewAll}>
              View All →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.questCard}>
          <View style={styles.questIcon}>
            <Text style={styles.questEmoji}>
              💪
            </Text>
          </View>

          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>
              Morning Workout
            </Text>

            <Text
              style={styles.questDescription}
            >
              Exercise for 30 minutes
            </Text>
          </View>

          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>
              +20 XP
            </Text>
          </View>
        </View>

        <View style={styles.questCard}>
          <View style={styles.questIcon}>
            <Text style={styles.questEmoji}>
              📚
            </Text>
          </View>

          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>
              Study Session
            </Text>

            <Text
              style={styles.questDescription}
            >
              Focus and study for 1 hour
            </Text>
          </View>

          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>
              +30 XP
            </Text>
          </View>
        </View>

        <View style={styles.questCard}>
          <View style={styles.questIcon}>
            <Text style={styles.questEmoji}>
              💧
            </Text>
          </View>

          <View style={styles.questInfo}>
            <Text style={styles.questTitle}>
              Stay Hydrated
            </Text>

            <Text
              style={styles.questDescription}
            >
              Drink enough water today
            </Text>
          </View>

          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>
              +10 XP
            </Text>
          </View>
        </View>

        {/* MOTIVATION */}

        <View style={styles.motivationCard}>
          <Text
            style={styles.motivationEmoji}
          >
            ⚔️
          </Text>

          <View
            style={styles.motivationInfo}
          >
            <Text
              style={styles.motivationTitle}
            >
              Your adventure continues!
            </Text>

            <Text
              style={styles.motivationText}
            >
              Complete today's quests and
              become stronger.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  loadingText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 15,
  },

  errorEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },

  errorText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },

  createHeroButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  createHeroButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  container: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  smallText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 5,
  },

  heroName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },

  heroClass: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  levelBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  levelText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },

  mainCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 18,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  cardLabel: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  levelTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  trophy: {
    fontSize: 35,
  },

  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  xpText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600",
  },

  xpNumber: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "700",
  },

  progressBackground: {
    height: 10,
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },

  nextLevel: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 9,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },

  statEmoji: {
    fontSize: 22,
    marginBottom: 5,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  statLabel: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
  },

  viewAll: {
    color: "#A78BFA",
    fontWeight: "700",
    fontSize: 12,
  },

  questCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  questIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  questEmoji: {
    fontSize: 21,
  },

  questInfo: {
    flex: 1,
  },

  questTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  questDescription: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
  },

  xpBadge: {
    backgroundColor: "#312E81",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  xpBadgeText: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "800",
  },

  motivationCard: {
    backgroundColor: "#312E81",
    borderRadius: 18,
    padding: 17,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  motivationEmoji: {
    fontSize: 30,
    marginRight: 13,
  },

  motivationInfo: {
    flex: 1,
  },

  motivationTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },

  motivationText: {
    color: "#C4B5FD",
    fontSize: 11,
    lineHeight: 17,
  },
});