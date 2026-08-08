import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ============================================
// TYPES
// ============================================

type HeroData = {
    heroName: string;
    level: number;
    totalXP: number;
    coins: number;
    streak: number;
    totalQuestsCompleted: number;
    completedQuests: string[];
    unlockedAchievements: string[];
};

type Achievement = {
    id: string;
    emoji: string;
    title: string;
    description: string;
    category: string;
    current: number;
    target: number;
    unit: string;
};

// ============================================
// ACHIEVEMENTS SCREEN
// ============================================

export default function AchievementsScreen() {
    const [hero, setHero] = useState<HeroData | null>(null);
    const [inventoryCount, setInventoryCount] = useState<number>(0);
    const [bossesDefeated, setBossesDefeated] = useState<number>(0);
    const [historyCount, setHistoryCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // ============================================
    // LOAD HERO & FIRESTORE METRICS LIVE
    // ============================================

    useEffect(() => {
        const user = auth.currentUser;

        if (!user) {
            setLoading(false);
            return;
        }

        const userRef = doc(db, "users", user.uid);
        const unsubUser = onSnapshot(
            userRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setHero(null);
                    setLoading(false);
                    return;
                }

                const data = snapshot.data();

                const completedQuests = Array.isArray(data.completedQuests)
                    ? data.completedQuests.map((id: unknown) => String(id))
                    : [];

                const unlockedAchievements = Array.isArray(data.unlockedAchievements)
                    ? data.unlockedAchievements.map((id: unknown) => String(id))
                    : [];

                setHero({
                    heroName: data.heroName || "Hero",
                    level: data.level ?? 1,
                    totalXP: data.totalXP ?? data.xp ?? 0,
                    coins: data.coins ?? 0,
                    streak: Number(data.currentStreak ?? data.streak ?? 0),
                    totalQuestsCompleted: data.totalQuestsCompleted ?? completedQuests.length,
                    completedQuests,
                    unlockedAchievements,
                });

                setLoading(false);
            },
            (error) => {
                console.error("ACHIEVEMENTS FIRESTORE ERROR:", error);
                setLoading(false);
            }
        );

        // 2. Inventory collection snapshot
        const inventoryRef = collection(db, "users", user.uid, "inventory");
        const unsubInv = onSnapshot(inventoryRef, (snap) => {
            setInventoryCount(snap.docs.length);
        });

        // 3. Boss Victories collection snapshot
        const bossRef = collection(db, "users", user.uid, "bossVictories");
        const unsubBoss = onSnapshot(bossRef, (snap) => {
            setBossesDefeated(snap.docs.length);
        });

        // 4. Quest History collection snapshot
        const historyRef = collection(db, "users", user.uid, "questHistory");
        const unsubHistory = onSnapshot(historyRef, (snap) => {
            setHistoryCount(snap.docs.length);
        });

        return () => {
            unsubUser();
            unsubInv();
            unsubBoss();
            unsubHistory();
        };
    }, []);

    // ============================================
    // VALUES
    // ============================================

    const totalQuests = Math.max(hero?.totalQuestsCompleted ?? 0, historyCount);
    const coins = hero?.coins ?? 0;
    const streak = hero?.streak ?? 0;
    const totalXP = hero?.totalXP ?? 0;

    const achievements: Achievement[] = hero
        ? [
            {
                id: "first-step",
                emoji: "🌱",
                title: "First Step",
                description: "Complete your first quest.",
                category: "QUESTS",
                current: totalQuests,
                target: 1,
                unit: "Quests",
            },
            {
                id: "rising-hero",
                emoji: "⭐",
                title: "Rising Hero",
                description: "Earn 100 total XP.",
                category: "XP",
                current: totalXP,
                target: 100,
                unit: "XP",
            },
            {
                id: "quest-master",
                emoji: "⚔️",
                title: "Quest Master",
                description: "Complete 20 quests.",
                category: "QUESTS",
                current: totalQuests,
                target: 20,
                unit: "Quests",
            },
            {
                id: "collector",
                emoji: "🎒",
                title: "Collector",
                description: "Collect 50 inventory items.",
                category: "COLLECTION",
                current: inventoryCount,
                target: 50,
                unit: "Items",
            },
            {
                id: "boss-slayer",
                emoji: "🐉",
                title: "Boss Slayer",
                description: "Defeat 5 Realm Bosses.",
                category: "COMBAT",
                current: bossesDefeated,
                target: 5,
                unit: "Bosses",
            },
            {
                id: "rich-hero",
                emoji: "🪙",
                title: "Rich Hero",
                description: "Accumulate 1000 gold coins.",
                category: "WEALTH",
                current: coins,
                target: 1000,
                unit: "Coins",
            },
            {
                id: "streak-3",
                emoji: "🔥",
                title: "Streak King",
                description: "Reach a 3 day streak.",
                category: "STREAK",
                current: streak,
                target: 3,
                unit: "Days",
            },
            {
                id: "streak-7",
                emoji: "🔥",
                title: "On Fire",
                description: "Reach a 7 day streak.",
                category: "STREAK",
                current: streak,
                target: 7,
                unit: "Days",
            },
            {
                id: "streak-14",
                emoji: "⚡",
                title: "Unstoppable",
                description: "Reach a 14 day streak.",
                category: "STREAK",
                current: streak,
                target: 14,
                unit: "Days",
            },
            {
                id: "streak-30",
                emoji: "👑",
                title: "Legendary Discipline",
                description: "Reach a 30 day streak.",
                category: "STREAK",
                current: streak,
                target: 30,
                unit: "Days",
            },
        ]
        : [];

    // ============================================
    // UNLOCKED CHECK
    // ============================================

    const unlockedIds = new Set(
        hero?.unlockedAchievements ?? []
    );

    const isAchievementUnlocked = (
        achievement: Achievement
    ) => {
        // Firestore is the main source.
        // Progress condition is also used as a safe fallback
        // for older accounts.

        return (
            unlockedIds.has(achievement.id) ||
            achievement.current >= achievement.target
        );
    };

    const unlockedCount = achievements.filter(
        isAchievementUnlocked
    ).length;

    const completionPercent =
        achievements.length > 0
            ? Math.round(
                (unlockedCount / achievements.length) * 100
            )
            : 0;

    // ============================================
    // NEXT ACHIEVEMENT
    // ============================================

    const nextAchievement = useMemo(() => {
        if (!hero) return null;

        const locked = achievements.filter(
            (achievement) =>
                !isAchievementUnlocked(achievement)
        );

        if (locked.length === 0) {
            return null;
        }

        return locked
            .map((achievement) => {
                const progress = Math.min(
                    achievement.current / achievement.target,
                    1
                );

                return {
                    achievement,
                    progress,
                };
            })
            .sort((a, b) => b.progress - a.progress)[0]
            .achievement;
    }, [
        hero?.totalXP,
        hero?.streak,
        hero?.totalQuestsCompleted,
        hero?.unlockedAchievements,
    ]);

    // ============================================
    // LOADING
    // ============================================

    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator
                    size="large"
                    color="#7C3AED"
                />

                <Text style={styles.loadingText}>
                    Loading achievements...
                </Text>
            </View>
        );
    }

    // ============================================
    // HERO NOT FOUND
    // ============================================

    if (!hero) {
        return (
            <View style={styles.loadingScreen}>
                <Text style={styles.errorEmoji}>⚠️</Text>

                <Text style={styles.errorTitle}>
                    Achievements unavailable
                </Text>

                <Text style={styles.errorText}>
                    Your hero profile could not be loaded.
                </Text>

                <TouchableOpacity
                    style={styles.backErrorButton}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/(tabs)/profile");
                        }
                    }}
                >
                    <Text style={styles.backErrorText}>
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ============================================
    // UI
    // ============================================

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* BACK */}

                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/(tabs)/profile");
                        }
                    }}
                >
                    <Text style={styles.backIcon}>‹</Text>

                    <Text style={styles.backText}>
                        Profile
                    </Text>
                </TouchableOpacity>

                {/* HEADER */}

                <Text style={styles.eyebrow}>
                    HERO TROPHIES
                </Text>

                <Text style={styles.title}>
                    🏆 Achievements
                </Text>

                <Text style={styles.subtitle}>
                    Complete quests, build streaks and earn XP
                    to unlock rewards.
                </Text>

                {/* OVERVIEW */}

                <View style={styles.overviewCard}>
                    <View style={styles.trophyCircle}>
                        <Text style={styles.trophyEmoji}>
                            🏆
                        </Text>
                    </View>

                    <Text style={styles.overviewTitle}>
                        {hero.heroName}
                    </Text>

                    <Text style={styles.overviewSubtitle}>
                        Achievement Collection
                    </Text>

                    <Text style={styles.bigProgress}>
                        {unlockedCount}
                        <Text style={styles.bigProgressMuted}>
                            {" "}
                            / {achievements.length}
                        </Text>
                    </Text>

                    <Text style={styles.unlockedLabel}>
                        ACHIEVEMENTS UNLOCKED
                    </Text>

                    <View style={styles.overallTrack}>
                        <View
                            style={[
                                styles.overallFill,
                                {
                                    width: `${completionPercent}%`,
                                },
                            ]}
                        />
                    </View>

                    <Text style={styles.percentText}>
                        {completionPercent}% complete
                    </Text>
                </View>

                {/* NEXT ACHIEVEMENT */}

                {nextAchievement ? (
                    <>
                        <Text style={styles.sectionTitle}>
                            Next Achievement
                        </Text>

                        <View style={styles.nextCard}>
                            <View style={styles.nextIcon}>
                                <Text style={styles.nextEmoji}>
                                    {nextAchievement.emoji}
                                </Text>
                            </View>

                            <View style={styles.nextInfo}>
                                <Text style={styles.nextLabel}>
                                    ALMOST THERE
                                </Text>

                                <Text style={styles.nextTitle}>
                                    {nextAchievement.title}
                                </Text>

                                <Text style={styles.nextDescription}>
                                    {nextAchievement.description}
                                </Text>

                                <View style={styles.nextProgressHeader}>
                                    <Text style={styles.nextProgressText}>
                                        {Math.min(
                                            nextAchievement.current,
                                            nextAchievement.target
                                        )}{" "}
                                        / {nextAchievement.target}
                                    </Text>

                                    <Text style={styles.nextProgressText}>
                                        {Math.min(
                                            Math.round(
                                                (nextAchievement.current /
                                                    nextAchievement.target) *
                                                100
                                            ),
                                            100
                                        )}
                                        %
                                    </Text>
                                </View>

                                <View style={styles.smallTrack}>
                                    <View
                                        style={[
                                            styles.smallFill,
                                            {
                                                width: `${Math.min(
                                                    (nextAchievement.current /
                                                        nextAchievement.target) *
                                                    100,
                                                    100
                                                )}%`,
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.allUnlockedCard}>
                        <Text style={styles.allUnlockedEmoji}>
                            👑
                        </Text>

                        <View style={styles.allUnlockedInfo}>
                            <Text style={styles.allUnlockedTitle}>
                                Legendary Hero
                            </Text>

                            <Text style={styles.allUnlockedText}>
                                You have unlocked every achievement.
                            </Text>
                        </View>
                    </View>
                )}

                {/* COLLECTION */}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Collection
                    </Text>

                    <Text style={styles.sectionHint}>
                        {unlockedCount} / {achievements.length}
                    </Text>
                </View>

                {achievements.map((achievement) => {
                    const unlocked =
                        isAchievementUnlocked(achievement);

                    const progressPercent = Math.min(
                        (achievement.current /
                            achievement.target) *
                        100,
                        100
                    );

                    return (
                        <View
                            key={achievement.id}
                            style={[
                                styles.achievementCard,

                                unlocked
                                    ? styles.unlockedCard
                                    : styles.lockedCard,
                            ]}
                        >
                            {/* ICON */}

                            <View
                                style={[
                                    styles.achievementIcon,

                                    unlocked &&
                                    styles.unlockedIcon,
                                ]}
                            >
                                <Text style={styles.achievementEmoji}>
                                    {unlocked
                                        ? achievement.emoji
                                        : "🔒"}
                                </Text>
                            </View>

                            {/* INFO */}

                            <View style={styles.achievementInfo}>
                                <View style={styles.achievementTop}>
                                    <Text
                                        style={[
                                            styles.achievementTitle,

                                            !unlocked &&
                                            styles.lockedTitle,
                                        ]}
                                    >
                                        {achievement.title}
                                    </Text>

                                    {unlocked ? (
                                        <View style={styles.unlockedBadge}>
                                            <Text
                                                style={styles.unlockedBadgeText}
                                            >
                                                UNLOCKED
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.lockedBadge}>
                                            <Text
                                                style={styles.lockedBadgeText}
                                            >
                                                LOCKED
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <Text
                                    style={styles.achievementDescription}
                                >
                                    {achievement.description}
                                </Text>

                                <Text style={styles.category}>
                                    {achievement.category}
                                </Text>

                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressText}>
                                        Progress ({Math.min(100, Math.round(progressPercent))}%)
                                    </Text>

                                    <Text style={styles.progressText}>
                                        {Math.min(
                                            achievement.current,
                                            achievement.target
                                        )}{" "}
                                        / {achievement.target} {achievement.unit}
                                    </Text>
                                </View>

                                <View style={styles.progressTrack}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${progressPercent}%`,
                                                backgroundColor: unlocked ? "#F59E0B" : "#7C3AED",
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* STATS */}

                <Text style={styles.sectionTitle}>
                    Your Progress
                </Text>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>
                            ⚔️
                        </Text>

                        <Text style={styles.statValue}>
                            {totalQuests}
                        </Text>

                        <Text style={styles.statLabel}>
                            Quests
                        </Text>
                    </View>

                    <View style={styles.verticalDivider} />

                    <View style={styles.statItem}>
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

                    <View style={styles.verticalDivider} />

                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>
                            🔥
                        </Text>

                        <Text style={styles.statValue}>
                            {hero.streak}
                        </Text>

                        <Text style={styles.statLabel}>
                            Streak
                        </Text>
                    </View>
                </View>

                {/* MOTIVATION */}

                <View style={styles.motivationCard}>
                    <Text style={styles.motivationEmoji}>
                        ⚔️
                    </Text>

                    <View style={styles.motivationInfo}>
                        <Text style={styles.motivationTitle}>
                            Keep Adventuring
                        </Text>

                        <Text style={styles.motivationText}>
                            Every completed quest moves you closer
                            to your next achievement.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// ============================================
// STYLES
// ============================================

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

    backErrorButton: {
        backgroundColor: "#7C3AED",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },

    backErrorText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
    },

    container: {
        padding: 20,
        paddingTop: 45,
        paddingBottom: 55,
    },

    // ============================================
    // BACK
    // ============================================

    backButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 24,
        minHeight: 35,
    },

    backIcon: {
        color: "#A78BFA",
        fontSize: 30,
        lineHeight: 30,
        marginRight: 5,
    },

    backText: {
        color: "#A78BFA",
        fontSize: 12,
        fontWeight: "700",
    },

    // ============================================
    // HEADER
    // ============================================

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

    // ============================================
    // OVERVIEW
    // ============================================

    overviewCard: {
        backgroundColor: "#1E293B",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#334155",
        padding: 22,
        alignItems: "center",
        marginBottom: 28,
    },

    trophyCircle: {
        width: 75,
        height: 75,
        borderRadius: 38,
        backgroundColor: "#312E81",
        borderWidth: 2,
        borderColor: "#7C3AED",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 13,
    },

    trophyEmoji: {
        fontSize: 35,
    },

    overviewTitle: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "900",
    },

    overviewSubtitle: {
        color: "#94A3B8",
        fontSize: 10,
        marginTop: 4,
    },

    bigProgress: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "900",
        marginTop: 17,
    },

    bigProgressMuted: {
        color: "#64748B",
        fontSize: 18,
    },

    unlockedLabel: {
        color: "#A78BFA",
        fontSize: 8,
        fontWeight: "900",
        letterSpacing: 1.2,
        marginTop: 3,
    },

    overallTrack: {
        width: "100%",
        height: 8,
        backgroundColor: "#334155",
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 15,
    },

    overallFill: {
        height: "100%",
        backgroundColor: "#7C3AED",
        borderRadius: 10,
    },

    percentText: {
        color: "#64748B",
        fontSize: 9,
        marginTop: 7,
        alignSelf: "flex-end",
    },

    // ============================================
    // SECTIONS
    // ============================================

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 13,
    },

    sectionHint: {
        color: "#64748B",
        fontSize: 10,
        marginBottom: 13,
    },

    // ============================================
    // NEXT ACHIEVEMENT
    // ============================================

    nextCard: {
        backgroundColor: "#312E81",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#4C1D95",
        padding: 15,
        flexDirection: "row",
        marginBottom: 28,
    },

    nextIcon: {
        width: 52,
        height: 52,
        borderRadius: 15,
        backgroundColor: "#1E1B4B",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },

    nextEmoji: {
        fontSize: 26,
    },

    nextInfo: {
        flex: 1,
    },

    nextLabel: {
        color: "#A78BFA",
        fontSize: 8,
        fontWeight: "900",
        letterSpacing: 1,
    },

    nextTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
        marginTop: 3,
    },

    nextDescription: {
        color: "#C4B5FD",
        fontSize: 9,
        marginTop: 4,
    },

    nextProgressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },

    nextProgressText: {
        color: "#A78BFA",
        fontSize: 8,
        fontWeight: "700",
    },

    smallTrack: {
        height: 6,
        backgroundColor: "#1E1B4B",
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 5,
    },

    smallFill: {
        height: "100%",
        backgroundColor: "#A78BFA",
        borderRadius: 10,
    },

    allUnlockedCard: {
        backgroundColor: "#312E81",
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
    },

    allUnlockedEmoji: {
        fontSize: 32,
        marginRight: 13,
    },

    allUnlockedInfo: {
        flex: 1,
    },

    allUnlockedTitle: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "900",
    },

    allUnlockedText: {
        color: "#C4B5FD",
        fontSize: 9,
        marginTop: 4,
    },

    // ============================================
    // ACHIEVEMENT CARDS
    // ============================================

    achievementCard: {
        borderRadius: 17,
        borderWidth: 1,
        padding: 14,
        flexDirection: "row",
        marginBottom: 11,
    },

    unlockedCard: {
        backgroundColor: "#1E293B",
        borderColor: "#4C1D95",
    },

    lockedCard: {
        backgroundColor: "#172033",
        borderColor: "#334155",
    },

    achievementIcon: {
        width: 49,
        height: 49,
        borderRadius: 14,
        backgroundColor: "#0F172A",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    unlockedIcon: {
        backgroundColor: "#312E81",
    },

    achievementEmoji: {
        fontSize: 24,
    },

    achievementInfo: {
        flex: 1,
    },

    achievementTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    achievementTitle: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "900",
        flex: 1,
        paddingRight: 8,
    },

    lockedTitle: {
        color: "#94A3B8",
    },

    achievementDescription: {
        color: "#64748B",
        fontSize: 9,
        lineHeight: 14,
        marginTop: 4,
    },

    category: {
        color: "#A78BFA",
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 1,
        marginTop: 7,
    },

    unlockedBadge: {
        backgroundColor: "#312E81",
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 4,
    },

    unlockedBadgeText: {
        color: "#C4B5FD",
        fontSize: 7,
        fontWeight: "900",
    },

    lockedBadge: {
        backgroundColor: "#0F172A",
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 4,
    },

    lockedBadgeText: {
        color: "#64748B",
        fontSize: 7,
        fontWeight: "900",
    },

    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 9,
    },

    progressText: {
        color: "#64748B",
        fontSize: 8,
    },

    progressTrack: {
        height: 5,
        backgroundColor: "#0F172A",
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 5,
    },

    progressFill: {
        height: "100%",
        backgroundColor: "#7C3AED",
        borderRadius: 10,
    },

    // ============================================
    // STATS
    // ============================================

    statsCard: {
        backgroundColor: "#1E293B",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#334155",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
        marginBottom: 27,
    },

    statItem: {
        flex: 1,
        alignItems: "center",
    },

    statEmoji: {
        fontSize: 20,
        marginBottom: 5,
    },

    statValue: {
        color: "#FFFFFF",
        fontSize: 19,
        fontWeight: "900",
    },

    statLabel: {
        color: "#94A3B8",
        fontSize: 9,
        marginTop: 4,
    },

    verticalDivider: {
        width: 1,
        height: 38,
        backgroundColor: "#334155",
    },

    // ============================================
    // MOTIVATION
    // ============================================

    motivationCard: {
        backgroundColor: "#312E81",
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
    },

    motivationEmoji: {
        fontSize: 29,
        marginRight: 13,
    },

    motivationInfo: {
        flex: 1,
    },

    motivationTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
        marginBottom: 4,
    },

    motivationText: {
        color: "#C4B5FD",
        fontSize: 9,
        lineHeight: 15,
    },
});