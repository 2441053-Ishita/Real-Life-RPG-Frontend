import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";

import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { RPGTheme } from "./utils/rpgTheme";

// ============================================
// TYPES
// ============================================

type Hero = {
    id: string;
    heroName: string;
    class: string;
    level: number;
    totalXP: number;
    streak: number;
};

// ============================================
// SCREEN
// ============================================

export default function LeaderboardScreen() {
    const [heroes, setHeroes] = useState<Hero[]>([]);
    const [loading, setLoading] = useState(true);

    const currentUser = auth.currentUser;

    // ============================================
    // LOAD LEADERBOARD
    // ============================================

    useEffect(() => {
        const leaderboardQuery = query(
            collection(db, "users"),
            orderBy("totalXP", "desc")
        );

        const unsubscribe = onSnapshot(
            leaderboardQuery,

            (snapshot) => {
                const loadedHeroes: Hero[] = snapshot.docs.map((doc) => {
                    const data = doc.data();

                    return {
                        id: doc.id,
                        heroName: data.heroName ?? "Unknown Hero",
                        class: data.class ?? "Warrior",
                        level: data.level ?? 1,
                        totalXP: data.totalXP ?? 0,
                        streak: data.streak ?? 0,
                    };
                });

                setHeroes(loadedHeroes);
                setLoading(false);
            },

            (error) => {
                console.error("LEADERBOARD ERROR:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // ============================================
    // CURRENT USER RANK
    // ============================================

    const currentRank = useMemo(() => {
        if (!currentUser) return null;

        const index = heroes.findIndex(
            (hero) => hero.id === currentUser.uid
        );

        if (index === -1) return null;

        return index + 1;
    }, [heroes, currentUser]);

    // ============================================
    // MEDAL HELPER
    // ============================================

    const getRankLabel = (rank: number) => {
        switch (rank) {
            case 1:
                return "🥇";

            case 2:
                return "🥈";

            case 3:
                return "🥉";

            default:
                return `#${rank}`;
        }
    };

    // ============================================
    // CLASS EMOJI
    // ============================================

    const getClassEmoji = (heroClass: string) => {
        switch (heroClass.toLowerCase()) {
            case "warrior":
                return "⚔️";

            case "mage":
                return "🧙";

            case "archer":
                return "🏹";

            case "assassin":
                return "🥷";

            default:
                return "🛡️";
        }
    };

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
                    Loading leaderboard...
                </Text>
            </View>
        );
    }
    // ============================================
    // EMPTY STATE
    // ============================================

    if (heroes.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏆</Text>

                <Text style={styles.emptyTitle}>
                    No Heroes Yet
                </Text>

                <Text style={styles.emptySubtitle}>
                    Complete quests and become the first legend.
                </Text>
            </View>
        );
    }

    // ============================================
    // HERO CARD
    // ============================================

    const HeroCard = ({
        hero,
        rank,
    }: {
        hero: Hero;
        rank: number;
    }) => {
        const isCurrentUser =
            hero.id === currentUser?.uid;

        return (
            <View
                style={[
                    styles.heroCard,

                    rank === 1 &&
                    styles.goldCard,

                    rank === 2 &&
                    styles.silverCard,

                    rank === 3 &&
                    styles.bronzeCard,

                    isCurrentUser &&
                    styles.currentUserCard,
                ]}
            >
                <View style={styles.leftSection}>
                    <Text style={styles.rank}>
                        {getRankLabel(rank)}
                    </Text>

                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>
                            {getClassEmoji(hero.class)}
                        </Text>
                    </View>

                    <View style={styles.heroInfo}>
                        <View
                            style={styles.heroNameRow}
                        >
                            <Text
                                style={styles.heroName}
                            >
                                {hero.heroName}
                            </Text>

                            {isCurrentUser && (
                                <View
                                    style={
                                        styles.youBadge
                                    }
                                >
                                    <Text
                                        style={
                                            styles.youText
                                        }
                                    >
                                        YOU
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text
                            style={
                                styles.heroClass
                            }
                        >
                            {hero.class}
                        </Text>
                    </View>
                </View>

                <View style={styles.rightSection}>
                    <Text style={styles.level}>
                        Lv. {hero.level}
                    </Text>

                    <Text style={styles.totalXP}>
                        ⭐ {hero.totalXP}
                    </Text>

                    <Text style={styles.streak}>
                        🔥 {hero.streak}
                    </Text>
                </View>
            </View>
        );
    };

    // ============================================
    // UI
    // ============================================

    return (
        <View style={styles.screen}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.container
                }
            >
                {/* HEADER */}

                <View style={styles.header}>
                    <Text style={styles.eyebrow}>
                        GLOBAL RANKINGS
                    </Text>

                    <Text style={styles.title}>
                        🏆 Leaderboard
                    </Text>

                    <Text style={styles.subtitle}>
                        Rise through the ranks by
                        completing quests and earning
                        XP.
                    </Text>
                </View>

                {/* SUMMARY */}

                <View style={styles.summaryCard}>
                    <View>
                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            HEROES
                        </Text>

                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {heroes.length}
                        </Text>
                    </View>

                    <View>
                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            YOUR RANK
                        </Text>

                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {currentRank
                                ? `#${currentRank}`
                                : "--"}
                        </Text>
                    </View>
                </View>

                {/* HERO LIST */}

                {heroes.map((hero, index) => (
                    <HeroCard
                        key={hero.id}
                        hero={hero}
                        rank={index + 1}
                    />
                ))}

                {/* BACK BUTTON */}

                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.8}
                    onPress={() => router.back()}
                >
                    <Text
                        style={
                            styles.backButtonText
                        }
                    >
                        ← Back
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: RPGTheme.colors.bg,
    },
    container: {
        flex: 1,
        backgroundColor: RPGTheme.colors.bg,
    },
    loadingScreen: {
        flex: 1,
        backgroundColor: RPGTheme.colors.bg,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: RPGTheme.colors.bg,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: RPGTheme.colors.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        color: RPGTheme.colors.textPrimary,
        fontSize: 18,
        fontWeight: "bold",
    },
    emptySubtitle: {
        color: RPGTheme.colors.textSecondary,
        fontSize: 12,
        textAlign: "center",
        marginTop: 4,
    },
    heroCard: {
        flexDirection: "row",
        backgroundColor: RPGTheme.colors.primaryCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: RPGTheme.colors.cardBorder,
    },
    loadingText: {
        color: RPGTheme.colors.textSecondary,
        marginTop: 12,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 16,
    },
    eyebrow: {
        color: RPGTheme.colors.purpleSecondary,
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 2,
    },
    title: {
        color: RPGTheme.colors.textPrimary,
        fontSize: 24,
        fontWeight: "900",
    },
    subtitle: {
        color: RPGTheme.colors.textSecondary,
        fontSize: 12,
    },
    summaryCard: {
        flexDirection: "row",
        backgroundColor: RPGTheme.colors.primaryCard,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: RPGTheme.colors.goldBorder,
    },
    summaryItem: {
        flex: 1,
        alignItems: "center",
    },
    summaryLabel: {
        color: RPGTheme.colors.textMuted,
        fontSize: 10,
        marginBottom: 4,
    },
    summaryValue: {
        color: RPGTheme.colors.textPrimary,
        fontSize: 16,
        fontWeight: "bold",
    },
    card: {
        flexDirection: "row",
        backgroundColor: RPGTheme.colors.primaryCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: RPGTheme.colors.cardBorder,
    },
    goldCard: {
        borderColor: "#D4AF37",
        backgroundColor: "#1A1A24",
    },
    silverCard: {
        borderColor: "#C0C0C0",
    },
    bronzeCard: {
        borderColor: "#CD7F32",
    },
    currentUserCard: {
        backgroundColor: "#2E1065",
        borderColor: RPGTheme.colors.purpleSecondary,
    },
    leftSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    rank: {
        width: 30,
        fontSize: 14,
        fontWeight: "bold",
        color: RPGTheme.colors.gold,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: RPGTheme.colors.secondaryCard,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarEmoji: {
        fontSize: 20,
    },
    heroInfo: {
        flex: 1,
    },
    heroNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    heroName: {
        color: RPGTheme.colors.textPrimary,
        fontSize: 14,
        fontWeight: "bold",
    },
    youBadge: {
        backgroundColor: RPGTheme.colors.purplePrimary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    youText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "bold",
    },
    heroClass: {
        color: RPGTheme.colors.textMuted,
        fontSize: 11,
    },
    rightSection: {
        alignItems: "flex-end",
    },
    level: {
        color: RPGTheme.colors.goldLight,
        fontSize: 12,
        fontWeight: "bold",
    },
    totalXP: {
        color: RPGTheme.colors.textSecondary,
        fontSize: 11,
    },
    streak: {
        color: RPGTheme.colors.purpleSecondary,
        fontSize: 10,
    },
    backButton: {
        backgroundColor: RPGTheme.colors.secondaryCard,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
    },
    backButtonText: {
        color: RPGTheme.colors.purpleSecondary,
        fontWeight: "bold",
    },
});