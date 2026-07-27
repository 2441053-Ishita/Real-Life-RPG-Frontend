import { auth, db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

// ============================================
// TYPES
// ============================================

type QuestHistoryItem = {
    id: string;
    questId?: string | number;
    title: string;
    description?: string;
    xp: number;
    difficulty?: string;
    emoji?: string;
    type?: "Daily" | "Custom" | string;
    completedAt?: Timestamp | null;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (timestamp?: Timestamp | null) => {
    if (!timestamp) {
        return "Just now";
    }

    try {
        return timestamp.toDate().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "Unknown date";
    }
};

const formatTime = (timestamp?: Timestamp | null) => {
    if (!timestamp) {
        return "";
    }

    try {
        return timestamp.toDate().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
};

const getDifficultyEmoji = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
        case "easy":
            return "🌱";

        case "medium":
            return "⚔️";

        case "hard":
            return "🔥";

        default:
            return "⚔️";
    }
};

// ============================================
// SCREEN
// ============================================

export default function HistoryScreen() {
    const [history, setHistory] = useState<QuestHistoryItem[]>([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    // ============================================
    // LOAD QUEST HISTORY
    // ============================================

    useEffect(() => {
        const user = auth.currentUser;

        if (!user) {
            setLoading(false);
            return;
        }

        const historyRef = collection(
            db,
            "users",
            user.uid,
            "questHistory"
        );

        const historyQuery = query(
            historyRef,
            orderBy("completedAt", "desc")
        );

        const unsubscribe = onSnapshot(
            historyQuery,

            (snapshot) => {
                const historyData: QuestHistoryItem[] =
                    snapshot.docs.map((document) => {
                        const data = document.data();

                        return {
                            id: document.id,

                            questId: data.questId,

                            title:
                                data.title ||
                                data.questTitle ||
                                "Completed Quest",

                            description:
                                data.description || "",

                            xp:
                                Number(
                                    data.xp ??
                                    data.xpEarned ??
                                    0
                                ),

                            difficulty:
                                data.difficulty || "Easy",

                            emoji:
                                data.emoji ||
                                getDifficultyEmoji(
                                    data.difficulty
                                ),

                            type:
                                data.type ||
                                data.questType ||
                                "Daily",

                            completedAt:
                                data.completedAt || null,
                        };
                    });

                setHistory(historyData);

                setLoading(false);

                setRefreshing(false);
            },

            (error) => {
                console.error(
                    "HISTORY FIRESTORE ERROR:",
                    error
                );

                setLoading(false);

                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // ============================================
    // CALCULATIONS
    // ============================================

    const totalCompleted = history.length;

    const totalEarnedXP = useMemo(() => {
        return history.reduce(
            (total, item) =>
                total + Number(item.xp || 0),
            0
        );
    }, [history]);

    const customCompleted = useMemo(() => {
        return history.filter(
            (item) =>
                item.type?.toLowerCase() ===
                "custom"
        ).length;
    }, [history]);

    const dailyCompleted = useMemo(() => {
        return history.filter(
            (item) =>
                item.type?.toLowerCase() !==
                "custom"
        ).length;
    }, [history]);

    // ============================================
    // REFRESH
    // ============================================

    const handleRefresh = () => {
        setRefreshing(true);

        // onSnapshot already updates data in real time.
        // This simply gives visual refresh feedback.

        setTimeout(() => {
            setRefreshing(false);
        }, 700);
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
                    Loading adventure history...
                </Text>
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#A78BFA"
                    />
                }
            >
                {/* ====================================
            HEADER
        ==================================== */}

                <View style={styles.header}>
                    <Text style={styles.eyebrow}>
                        ADVENTURE LOG
                    </Text>

                    <Text style={styles.title}>
                        📖 Quest History
                    </Text>

                    <Text style={styles.subtitle}>
                        Every completed mission becomes
                        part of your hero's journey.
                    </Text>
                </View>

                {/* ====================================
            SUMMARY CARD
        ==================================== */}

                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View>
                            <Text style={styles.summaryLabel}>
                                YOUR JOURNEY
                            </Text>

                            <Text style={styles.summaryTitle}>
                                Adventure Record
                            </Text>
                        </View>

                        <Text style={styles.summaryEmoji}>
                            🏆
                        </Text>
                    </View>

                    <View style={styles.statsRow}>
                        {/* COMPLETED */}

                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>
                                ⚔️
                            </Text>

                            <Text style={styles.statValue}>
                                {totalCompleted}
                            </Text>

                            <Text style={styles.statLabel}>
                                Completed
                            </Text>
                        </View>

                        <View style={styles.statDivider} />

                        {/* XP */}

                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>
                                ⭐
                            </Text>

                            <Text style={styles.statValue}>
                                {totalEarnedXP}
                            </Text>

                            <Text style={styles.statLabel}>
                                XP Earned
                            </Text>
                        </View>

                        <View style={styles.statDivider} />

                        {/* CUSTOM */}

                        <View style={styles.statItem}>
                            <Text style={styles.statEmoji}>
                                ✨
                            </Text>

                            <Text style={styles.statValue}>
                                {customCompleted}
                            </Text>

                            <Text style={styles.statLabel}>
                                Custom
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ====================================
            SMALL STATS
        ==================================== */}

                <View style={styles.smallStatsRow}>
                    <View style={styles.smallStatCard}>
                        <Text style={styles.smallStatEmoji}>
                            📜
                        </Text>

                        <View>
                            <Text style={styles.smallStatValue}>
                                {dailyCompleted}
                            </Text>

                            <Text style={styles.smallStatLabel}>
                                Daily Quests
                            </Text>
                        </View>
                    </View>

                    <View style={styles.smallStatCard}>
                        <Text style={styles.smallStatEmoji}>
                            ✨
                        </Text>

                        <View>
                            <Text style={styles.smallStatValue}>
                                {customCompleted}
                            </Text>

                            <Text style={styles.smallStatLabel}>
                                Custom Quests
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ====================================
            SECTION HEADER
        ==================================== */}

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Completed Quests
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Your latest victories
                        </Text>
                    </View>

                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>
                            {totalCompleted}
                        </Text>
                    </View>
                </View>

                {/* ====================================
            EMPTY STATE
        ==================================== */}

                {history.length === 0 && (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyEmoji}>
                                📜
                            </Text>
                        </View>

                        <Text style={styles.emptyTitle}>
                            No adventures yet
                        </Text>

                        <Text style={styles.emptyText}>
                            Complete your first quest and
                            it will appear here in your
                            adventure history.
                        </Text>

                        <View style={styles.emptyHint}>
                            <Text style={styles.emptyHintText}>
                                ⚔️ Your first victory awaits
                            </Text>
                        </View>
                    </View>
                )}

                {/* ====================================
            HISTORY LIST
        ==================================== */}

                {history.map((item, index) => {
                    const isCustom =
                        item.type?.toLowerCase() ===
                        "custom";

                    const date =
                        formatDate(item.completedAt);

                    const time =
                        formatTime(item.completedAt);

                    return (
                        <View
                            key={item.id}
                            style={styles.historyCard}
                        >
                            {/* TOP */}

                            <View style={styles.historyTop}>
                                <View style={styles.questIcon}>
                                    <Text style={styles.questEmoji}>
                                        {item.emoji ||
                                            getDifficultyEmoji(
                                                item.difficulty
                                            )}
                                    </Text>
                                </View>

                                <View style={styles.questInfo}>
                                    <View style={styles.titleRow}>
                                        <Text
                                            style={styles.questTitle}
                                            numberOfLines={1}
                                        >
                                            {item.title}
                                        </Text>

                                        <View
                                            style={[
                                                styles.typeBadge,

                                                isCustom
                                                    ? styles.customBadge
                                                    : styles.dailyBadge,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.typeText,

                                                    isCustom
                                                        ? styles.customText
                                                        : styles.dailyText,
                                                ]}
                                            >
                                                {isCustom
                                                    ? "CUSTOM"
                                                    : "DAILY"}
                                            </Text>
                                        </View>
                                    </View>

                                    {item.description ? (
                                        <Text
                                            style={
                                                styles.questDescription
                                            }
                                            numberOfLines={2}
                                        >
                                            {item.description}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>

                            {/* BOTTOM */}

                            <View style={styles.historyBottom}>
                                <View style={styles.dateContainer}>
                                    <Text style={styles.dateEmoji}>
                                        🕐
                                    </Text>

                                    <View>
                                        <Text style={styles.dateText}>
                                            {date}
                                        </Text>

                                        {time ? (
                                            <Text
                                                style={styles.timeText}
                                            >
                                                {time}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                                <View style={styles.rewardContainer}>
                                    <Text style={styles.rewardLabel}>
                                        REWARD
                                    </Text>

                                    <Text style={styles.rewardXP}>
                                        +{item.xp} XP
                                    </Text>
                                </View>
                            </View>

                            {/* NUMBER */}

                            <View style={styles.questNumber}>
                                <Text
                                    style={styles.questNumberText}
                                >
                                    #{history.length - index}
                                </Text>
                            </View>
                        </View>
                    );
                })}

                {/* ====================================
            BOTTOM MOTIVATION
        ==================================== */}

                {history.length > 0 && (
                    <View style={styles.motivationCard}>
                        <Text style={styles.motivationEmoji}>
                            ⚔️
                        </Text>

                        <View style={styles.motivationInfo}>
                            <Text
                                style={styles.motivationTitle}
                            >
                                Keep moving forward!
                            </Text>

                            <Text
                                style={styles.motivationText}
                            >
                                Every completed quest makes
                                your hero stronger. Your
                                adventure is only beginning.
                            </Text>
                        </View>
                    </View>
                )}
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
    },

    loadingText: {
        color: "#94A3B8",
        fontSize: 13,
        marginTop: 15,
    },

    container: {
        padding: 20,
        paddingTop: 55,
        paddingBottom: 55,
    },

    // HEADER

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

    // SUMMARY

    summaryCard: {
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
    },

    summaryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    summaryLabel: {
        color: "#A78BFA",
        fontSize: 9,
        fontWeight: "900",
        letterSpacing: 1.5,
        marginBottom: 5,
    },

    summaryTitle: {
        color: "#FFFFFF",
        fontSize: 19,
        fontWeight: "900",
    },

    summaryEmoji: {
        fontSize: 32,
    },

    statsRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    statItem: {
        flex: 1,
        alignItems: "center",
    },

    statEmoji: {
        fontSize: 21,
        marginBottom: 5,
    },

    statValue: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "900",
    },

    statLabel: {
        color: "#94A3B8",
        fontSize: 9,
        marginTop: 4,
    },

    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: "#334155",
    },

    // SMALL STATS

    smallStatsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 28,
    },

    smallStatCard: {
        flex: 1,
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 15,
        padding: 13,
        flexDirection: "row",
        alignItems: "center",
    },

    smallStatEmoji: {
        fontSize: 22,
        marginRight: 10,
    },

    smallStatValue: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "900",
    },

    smallStatLabel: {
        color: "#94A3B8",
        fontSize: 9,
        marginTop: 2,
    },

    // SECTION

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },

    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "900",
    },

    sectionSubtitle: {
        color: "#64748B",
        fontSize: 10,
        marginTop: 3,
    },

    countBadge: {
        minWidth: 32,
        height: 28,
        paddingHorizontal: 9,
        borderRadius: 14,
        backgroundColor: "#312E81",
        justifyContent: "center",
        alignItems: "center",
    },

    countText: {
        color: "#C4B5FD",
        fontSize: 11,
        fontWeight: "900",
    },

    // EMPTY

    emptyCard: {
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 20,
        padding: 28,
        alignItems: "center",
    },

    emptyIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },

    emptyEmoji: {
        fontSize: 33,
    },

    emptyTitle: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "900",
        marginBottom: 7,
    },

    emptyText: {
        color: "#94A3B8",
        fontSize: 11,
        textAlign: "center",
        lineHeight: 18,
        maxWidth: 280,
    },

    emptyHint: {
        backgroundColor: "#312E81",
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 17,
    },

    emptyHintText: {
        color: "#C4B5FD",
        fontSize: 10,
        fontWeight: "800",
    },

    // HISTORY CARD

    historyCard: {
        position: "relative",
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 18,
        padding: 15,
        marginBottom: 13,
        overflow: "hidden",
    },

    historyTop: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    questIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    questEmoji: {
        fontSize: 23,
    },

    questInfo: {
        flex: 1,
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 10,
    },

    questTitle: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
        marginRight: 8,
    },

    questDescription: {
        color: "#94A3B8",
        fontSize: 10,
        lineHeight: 16,
        marginTop: 5,
    },

    // TYPE BADGES

    typeBadge: {
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 7,
    },

    dailyBadge: {
        backgroundColor: "#312E81",
    },

    customBadge: {
        backgroundColor: "#3F2D1D",
    },

    typeText: {
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 0.5,
    },

    dailyText: {
        color: "#C4B5FD",
    },

    customText: {
        color: "#FBBF24",
    },

    // HISTORY BOTTOM

    historyBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#334155",
        marginTop: 14,
        paddingTop: 12,
    },

    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
    },

    dateEmoji: {
        fontSize: 15,
        marginRight: 7,
    },

    dateText: {
        color: "#CBD5E1",
        fontSize: 10,
        fontWeight: "700",
    },

    timeText: {
        color: "#64748B",
        fontSize: 8,
        marginTop: 2,
    },

    rewardContainer: {
        alignItems: "flex-end",
    },

    rewardLabel: {
        color: "#64748B",
        fontSize: 7,
        fontWeight: "800",
        letterSpacing: 0.8,
    },

    rewardXP: {
        color: "#A78BFA",
        fontSize: 12,
        fontWeight: "900",
        marginTop: 2,
    },

    questNumber: {
        position: "absolute",
        right: -7,
        bottom: -7,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        alignItems: "center",
        opacity: 0.55,
    },

    questNumberText: {
        color: "#64748B",
        fontSize: 8,
        fontWeight: "900",
    },

    // MOTIVATION

    motivationCard: {
        backgroundColor: "#312E81",
        borderRadius: 18,
        padding: 17,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
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
        fontSize: 10,
        lineHeight: 16,
    },
});