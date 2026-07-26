import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CharacterScreen() {
  const stats = [
    { icon: "💪", name: "Strength", value: 10 },
    { icon: "🧠", name: "Intelligence", value: 10 },
    { icon: "⚡", name: "Agility", value: 10 },
    { icon: "❤️", name: "Vitality", value: 10 },
  ];

  const achievements = [
    {
      icon: "🌱",
      title: "First Step",
      description: "Begin your adventure",
      unlocked: true,
    },
    {
      icon: "🔥",
      title: "On Fire",
      description: "Reach a 7 day streak",
      unlocked: false,
    },
    {
      icon: "⚔️",
      title: "Quest Master",
      description: "Complete 25 quests",
      unlocked: false,
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <Text style={styles.eyebrow}>YOUR HERO</Text>
        <Text style={styles.title}>⚔️ Character</Text>
        <Text style={styles.subtitle}>
          Grow stronger with every quest you complete.
        </Text>

        {/* CHARACTER CARD */}

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🛡️</Text>
          </View>

          <Text style={styles.heroName}>Hero</Text>

          <Text style={styles.heroClass}>
            Level 1 • Warrior
          </Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              LVL 1
            </Text>
          </View>

          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>
              EXPERIENCE
            </Text>

            <Text style={styles.xpValue}>
              20 / 100 XP
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.nextLevel}>
            80 XP until your next level
          </Text>
        </View>

        {/* STATS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Hero Stats
          </Text>

          <Text style={styles.sectionHint}>
            Base attributes
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View
              key={stat.name}
              style={styles.statCard}
            >
              <Text style={styles.statIcon}>
                {stat.icon}
              </Text>

              <Text style={styles.statValue}>
                {stat.value}
              </Text>

              <Text style={styles.statName}>
                {stat.name}
              </Text>
            </View>
          ))}
        </View>

        {/* BATTLE RECORD */}

        <Text style={styles.sectionTitle}>
          Adventure Record
        </Text>

        <View style={styles.recordCard}>
          <View style={styles.recordItem}>
            <Text style={styles.recordValue}>0</Text>
            <Text style={styles.recordLabel}>
              Quests
            </Text>
          </View>

          <View style={styles.recordDivider} />

          <View style={styles.recordItem}>
            <Text style={styles.recordValue}>1</Text>
            <Text style={styles.recordLabel}>
              Day Streak
            </Text>
          </View>

          <View style={styles.recordDivider} />

          <View style={styles.recordItem}>
            <Text style={styles.recordValue}>20</Text>
            <Text style={styles.recordLabel}>
              Total XP
            </Text>
          </View>
        </View>

        {/* ACHIEVEMENTS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Achievements
          </Text>

          <Text style={styles.sectionHint}>
            1 / {achievements.length}
          </Text>
        </View>

        {achievements.map((achievement) => (
          <View
            key={achievement.title}
            style={[
              styles.achievementCard,
              !achievement.unlocked &&
              styles.lockedAchievement,
            ]}
          >
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>
                {achievement.unlocked
                  ? achievement.icon
                  : "🔒"}
              </Text>
            </View>

            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>
                {achievement.title}
              </Text>

              <Text
                style={styles.achievementDescription}
              >
                {achievement.description}
              </Text>
            </View>

            {achievement.unlocked && (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedText}>
                  UNLOCKED
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* MOTIVATION */}

        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>
            🏆
          </Text>

          <View style={styles.motivationInfo}>
            <Text style={styles.motivationTitle}>
              Become Legendary
            </Text>

            <Text style={styles.motivationText}>
              Your real-life actions shape your hero.
              Complete quests, earn XP and level up.
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

  container: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 50,
  },

  eyebrow: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 7,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 7,
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },

  heroCard: {
    backgroundColor: "#1E293B",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 28,
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: "#312E81",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#7C3AED",
    marginBottom: 12,
  },

  avatarEmoji: {
    fontSize: 42,
  },

  heroName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  heroClass: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 5,
  },

  levelBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 12,
    marginBottom: 20,
  },

  levelBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  xpHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  xpLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  xpValue: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
  },

  progressTrack: {
    width: "100%",
    height: 9,
    borderRadius: 10,
    backgroundColor: "#334155",
    overflow: "hidden",
  },

  progressFill: {
    width: "20%",
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },

  nextLevel: {
    alignSelf: "flex-start",
    color: "#64748B",
    fontSize: 10,
    marginTop: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },

  sectionHint: {
    color: "#64748B",
    fontSize: 11,
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 26,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    paddingVertical: 17,
    marginBottom: 10,
  },

  statIcon: {
    fontSize: 24,
    marginBottom: 5,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  statName: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 3,
  },

  recordCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    marginBottom: 28,
  },

  recordItem: {
    flex: 1,
    alignItems: "center",
  },

  recordValue: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  recordLabel: {
    color: "#94A3B8",
    fontSize: 9,
    marginTop: 4,
  },

  recordDivider: {
    height: 30,
    width: 1,
    backgroundColor: "#334155",
  },

  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    marginBottom: 11,
  },

  lockedAchievement: {
    opacity: 0.55,
  },

  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  achievementEmoji: {
    fontSize: 21,
  },

  achievementInfo: {
    flex: 1,
  },

  achievementTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  achievementDescription: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 4,
  },

  unlockedBadge: {
    backgroundColor: "#312E81",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  unlockedText: {
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "900",
  },

  motivationCard: {
    backgroundColor: "#312E81",
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
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
    marginBottom: 5,
  },

  motivationText: {
    color: "#C4B5FD",
    fontSize: 10,
    lineHeight: 16,
  },
});