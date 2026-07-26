import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Quest = {
  id: number;
  emoji: string;
  title: string;
  description: string;
  xp: number;
  difficulty: "Easy" | "Medium" | "Hard";
};

const QUESTS: Quest[] = [
  {
    id: 1,
    emoji: "💪",
    title: "Morning Workout",
    description: "Exercise for at least 30 minutes",
    xp: 20,
    difficulty: "Medium",
  },
  {
    id: 2,
    emoji: "📚",
    title: "Study Session",
    description: "Focus and study for 1 hour",
    xp: 30,
    difficulty: "Hard",
  },
  {
    id: 3,
    emoji: "💧",
    title: "Stay Hydrated",
    description: "Drink enough water throughout the day",
    xp: 10,
    difficulty: "Easy",
  },
  {
    id: 4,
    emoji: "🧘",
    title: "Mindfulness",
    description: "Meditate or reflect for 10 minutes",
    xp: 15,
    difficulty: "Easy",
  },
];

export default function QuestsScreen() {
  const [completedQuests, setCompletedQuests] = useState<number[]>([]);

  const completeQuest = (questId: number) => {
    if (completedQuests.includes(questId)) {
      return;
    }

    setCompletedQuests((current) => [...current, questId]);
  };

  const earnedXP = QUESTS.filter((quest) =>
    completedQuests.includes(quest.id)
  ).reduce((total, quest) => total + quest.xp, 0);

  const progress =
    QUESTS.length === 0
      ? 0
      : (completedQuests.length / QUESTS.length) * 100;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>QUEST BOARD</Text>

            <Text style={styles.title}>
              📜 Daily Quests
            </Text>

            <Text style={styles.subtitle}>
              Complete real-life missions and earn XP.
            </Text>
          </View>
        </View>

        {/* DAILY PROGRESS */}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>
                TODAY'S PROGRESS
              </Text>

              <Text style={styles.progressTitle}>
                {completedQuests.length} / {QUESTS.length} Completed
              </Text>
            </View>

            <Text style={styles.progressEmoji}>
              ⚔️
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          <View style={styles.rewardRow}>
            <Text style={styles.rewardLabel}>
              XP earned today
            </Text>

            <Text style={styles.rewardValue}>
              +{earnedXP} XP
            </Text>
          </View>
        </View>

        {/* QUEST LIST */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Available Quests
          </Text>

          <Text style={styles.questCount}>
            {QUESTS.length - completedQuests.length} remaining
          </Text>
        </View>

        {QUESTS.map((quest) => {
          const completed = completedQuests.includes(
            quest.id
          );

          return (
            <View
              key={quest.id}
              style={[
                styles.questCard,
                completed && styles.completedCard,
              ]}
            >
              <View style={styles.questTop}>
                <View style={styles.questIcon}>
                  <Text style={styles.questEmoji}>
                    {completed ? "✅" : quest.emoji}
                  </Text>
                </View>

                <View style={styles.questInformation}>
                  <Text
                    style={[
                      styles.questTitle,
                      completed &&
                      styles.completedQuestTitle,
                    ]}
                  >
                    {quest.title}
                  </Text>

                  <Text style={styles.questDescription}>
                    {quest.description}
                  </Text>
                </View>
              </View>

              <View style={styles.questMeta}>
                <View style={styles.badges}>
                  <View style={styles.difficultyBadge}>
                    <Text
                      style={styles.difficultyText}
                    >
                      {quest.difficulty}
                    </Text>
                  </View>

                  <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>
                      +{quest.xp} XP
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={completed}
                  onPress={() =>
                    completeQuest(quest.id)
                  }
                  activeOpacity={0.75}
                  style={[
                    styles.completeButton,
                    completed &&
                    styles.completedButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.completeButtonText,
                      completed &&
                      styles.completedButtonText,
                    ]}
                  >
                    {completed
                      ? "Completed ✓"
                      : "Complete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* ALL COMPLETE */}

        {completedQuests.length === QUESTS.length && (
          <View style={styles.victoryCard}>
            <Text style={styles.victoryEmoji}>
              🏆
            </Text>

            <Text style={styles.victoryTitle}>
              Daily Quest Clear!
            </Text>

            <Text style={styles.victoryText}>
              You completed every quest today and earned{" "}
              {earnedXP} XP.
            </Text>
          </View>
        )}
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

  header: {
    marginBottom: 24,
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
  },

  progressCard: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  progressLabel: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  progressTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  progressEmoji: {
    fontSize: 30,
  },

  progressTrack: {
    height: 9,
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },

  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rewardLabel: {
    color: "#94A3B8",
    fontSize: 12,
  },

  rewardValue: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "800",
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
  },

  questCount: {
    color: "#64748B",
    fontSize: 11,
  },

  questCard: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },

  completedCard: {
    opacity: 0.65,
    borderColor: "#4C1D95",
  },

  questTop: {
    flexDirection: "row",
    marginBottom: 15,
  },

  questIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  questEmoji: {
    fontSize: 23,
  },

  questInformation: {
    flex: 1,
  },

  questTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },

  completedQuestTitle: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },

  questDescription: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
  },

  questMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badges: {
    flexDirection: "row",
    gap: 7,
  },

  difficultyBadge: {
    backgroundColor: "#334155",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  difficultyText: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "700",
  },

  xpBadge: {
    backgroundColor: "#312E81",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  xpText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "800",
  },

  completeButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
  },

  completedButton: {
    backgroundColor: "#334155",
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  completedButtonText: {
    color: "#94A3B8",
  },

  victoryCard: {
    backgroundColor: "#312E81",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginTop: 8,
  },

  victoryEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },

  victoryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 7,
  },

  victoryText: {
    color: "#C4B5FD",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
});