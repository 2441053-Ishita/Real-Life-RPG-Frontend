import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";

import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

import { useEffect, useState } from "react";

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

type QuestHistoryItem = {
    id: string;
    questId: string;
    title: string;
    description: string;
    emoji: string;
    difficulty: string;
    xpEarned: number;
    custom: boolean;
    completedDate: string;
    completedAt?: any;
};

// ============================================
// DATE FORMATTER
// ============================================

const formatDate = (dateString: string) => {
    if (!dateString) {
        return "Unknown date";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const [year, month, day] = parts;

    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
};

// ============================================
// QUEST HISTORY SCREEN
// ============================================

export default function QuestHistoryScreen() {
    const [history, setHistory] =
        useState<QuestHistoryItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    // ============================================
    // LOAD QUEST HISTORY
    // ============================================

    useEffect(() => {
        const user = auth.currentUser;

        if (!user) {
            setLoading(false);

            router.replace("/login");

            return;
        }

        const historyRef = collection(
            db,
            "users",
            user.uid,
            "history"
        );

        const historyQuery = query(
            historyRef,
            orderBy(
                "completedAt",
                "desc"
            )
        );

        const unsubscribe = onSnapshot(
            historyQuery,

            (snapshot) => {
                const loadedHistory:
                    QuestHistoryItem[] =
                    snapshot.docs.map(
                        (historyDocument) => {
                            const data =
                                historyDocument.data();

                            return {
                                id:
                                    historyDocument.id,

                                questId:
                                    data.questId || "",

                                title:
                                    data.title ||
                                    "Completed Quest",

                                description:
                                    data.description ||
                                    "",

                                emoji:
                                    data.emoji ||
                                    "⚔️",

                                difficulty:
                                    data.difficulty ||
                                    "Easy",

                                xpEarned:
                                    data.xpEarned ?? 0,

                                custom:
                                    data.questType === "custom" ||
                                    Boolean(data.custom),

                                completedDate:
                                    data.completedDate ||
                                    (data.completedAt?.toDate
                                        ? data.completedAt.toDate().toISOString().split("T")[0]
                                        : ""),

                                completedAt:
                                    data.completedAt,
                            };
                        }
                    );

                setHistory(
                    loadedHistory
                );

                setLoading(false);
            },

            (error) => {
                console.error(
                    "QUEST HISTORY ERROR:",
                    error
                );

                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // ============================================
    // TOTAL VALUES
    // ============================================

    const totalCompleted =
        history.length;

    const totalXPEarned =
        history.reduce(
            (total, item) =>
                total + item.xpEarned,
            0
        );

    const customCompleted =
        history.filter(
            (item) => item.custom
        ).length;

    // ============================================
    // LOADING
    // ============================================

    if (loading) {
        return (
            <View
                style={
                    styles.loadingScreen
                }
            >
                <ActivityIndicator
                    size="large"
                    color="#7C3AED"
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Loading quest history...
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
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* BACK BUTTON */}

                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/(tabs)/quests");
                        }
                    }}
                    style={
                        styles.backButton
                    }
                    activeOpacity={0.7}
                >
                    <Text
                        style={
                            styles.backText
                        }
                    >
                        ← Back
                    </Text>
                </TouchableOpacity>

                {/* HEADER */}

                <Text
                    style={styles.eyebrow}
                >
                    ADVENTURE LOG
                </Text>

                <Text
                    style={styles.title}
                >
                    📖 Quest History
                </Text>

                <Text
                    style={styles.subtitle}
                >
                    Every completed mission
                    becomes part of your
                    adventure.
                </Text>

                {/* SUMMARY */}

                <View
                    style={
                        styles.summaryCard
                    }
                >
                    <View
                        style={
                            styles.summaryItem
                        }
                    >
                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {totalCompleted}
                        </Text>

                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            Completed
                        </Text>
                    </View>

                    <View
                        style={
                            styles.summaryDivider
                        }
                    />

                    <View
                        style={
                            styles.summaryItem
                        }
                    >
                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {totalXPEarned}
                        </Text>

                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            XP Earned
                        </Text>
                    </View>

                    <View
                        style={
                            styles.summaryDivider
                        }
                    />

                    <View
                        style={
                            styles.summaryItem
                        }
                    >
                        <Text
                            style={
                                styles.summaryValue
                            }
                        >
                            {customCompleted}
                        </Text>

                        <Text
                            style={
                                styles.summaryLabel
                            }
                        >
                            Custom
                        </Text>
                    </View>
                </View>

                {/* SECTION */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Completed Quests
                    </Text>

                    <Text
                        style={
                            styles.sectionCount
                        }
                    >
                        {totalCompleted}
                    </Text>
                </View>

                {/* EMPTY HISTORY */}

                {history.length === 0 ? (
                    <View
                        style={
                            styles.emptyCard
                        }
                    >
                        <Text
                            style={
                                styles.emptyEmoji
                            }
                        >
                            📜
                        </Text>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            Your adventure begins here
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Complete your first quest
                            and it will appear in your
                            adventure log.
                        </Text>

                        <TouchableOpacity
                            style={
                                styles.questButton
                            }
                            activeOpacity={0.8}
                            onPress={() => {
                                if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace("/(tabs)/quests");
                                }
                            }}
                        >
                            <Text
                                style={
                                    styles.questButtonText
                                }
                            >
                                ⚔️ Go to Quests
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    history.map(
                        (item) => (
                            <View
                                key={item.id}
                                style={
                                    styles.historyCard
                                }
                            >
                                {/* TOP */}

                                <View
                                    style={
                                        styles.historyTop
                                    }
                                >
                                    <View
                                        style={
                                            styles.questIcon
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.questEmoji
                                            }
                                        >
                                            {item.emoji}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.questInfo
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.questTitle
                                            }
                                        >
                                            {item.title}
                                        </Text>

                                        <Text
                                            style={
                                                styles.questDescription
                                            }
                                        >
                                            {item.description}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.completedIcon
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.completedEmoji
                                            }
                                        >
                                            ✓
                                        </Text>
                                    </View>
                                </View>

                                {/* META */}

                                <View
                                    style={
                                        styles.metaRow
                                    }
                                >
                                    <View
                                        style={
                                            styles.badgeRow
                                        }
                                    >
                                        <View
                                            style={
                                                styles.typeBadge
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.typeText
                                                }
                                            >
                                                {item.custom
                                                    ? "CUSTOM"
                                                    : "DAILY"}
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.difficultyBadge
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.difficultyText
                                                }
                                            >
                                                {
                                                    item.difficulty
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.xpBadge
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.xpText
                                                }
                                            >
                                                +{
                                                    item.xpEarned
                                                }{" "}
                                                XP
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* DATE */}

                                <View
                                    style={
                                        styles.dateRow
                                    }
                                >
                                    <Text
                                        style={
                                            styles.dateIcon
                                        }
                                    >
                                        🗓️
                                    </Text>

                                    <Text
                                        style={
                                            styles.dateText
                                        }
                                    >
                                        Completed{" "}
                                        {formatDate(
                                            item.completedDate
                                        )}
                                    </Text>
                                </View>
                            </View>
                        )
                    )
                )}

                {/* BOTTOM MESSAGE */}

                {history.length > 0 && (
                    <View
                        style={
                            styles.bottomCard
                        }
                    >
                        <Text
                            style={
                                styles.bottomEmoji
                            }
                        >
                            🏆
                        </Text>

                        <View
                            style={
                                styles.bottomInfo
                            }
                        >
                            <Text
                                style={
                                    styles.bottomTitle
                                }
                            >
                                Your Legend Grows
                            </Text>

                            <Text
                                style={
                                    styles.bottomText
                                }
                            >
                                Every quest you complete
                                becomes part of your
                                permanent adventure
                                history.
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

const styles =
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor:
                "#0F172A",
        },

        loadingScreen: {
            flex: 1,
            backgroundColor:
                "#0F172A",
            justifyContent:
                "center",
            alignItems: "center",
            padding: 30,
        },

        loadingText: {
            color: "#94A3B8",
            fontSize: 13,
            marginTop: 15,
        },

        container: {
            padding: 20,
            paddingTop: 50,
            paddingBottom: 60,
        },

        backButton: {
            alignSelf:
                "flex-start",
            marginBottom: 25,
        },

        backText: {
            color: "#A78BFA",
            fontSize: 13,
            fontWeight: "800",
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

        summaryCard: {
            backgroundColor:
                "#1E293B",
            borderRadius: 18,
            borderWidth: 1,
            borderColor:
                "#334155",
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 18,
            marginBottom: 28,
        },

        summaryItem: {
            flex: 1,
            alignItems: "center",
        },

        summaryValue: {
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: "900",
        },

        summaryLabel: {
            color: "#94A3B8",
            fontSize: 9,
            marginTop: 4,
        },

        summaryDivider: {
            width: 1,
            height: 32,
            backgroundColor:
                "#334155",
        },

        sectionHeader: {
            flexDirection: "row",
            justifyContent:
                "space-between",
            alignItems: "center",
            marginBottom: 14,
        },

        sectionTitle: {
            color: "#FFFFFF",
            fontSize: 18,
            fontWeight: "800",
        },

        sectionCount: {
            color: "#A78BFA",
            fontSize: 11,
            fontWeight: "800",
        },

        historyCard: {
            backgroundColor:
                "#1E293B",
            borderRadius: 17,
            borderWidth: 1,
            borderColor:
                "#334155",
            padding: 15,
            marginBottom: 12,
        },

        historyTop: {
            flexDirection: "row",
            alignItems: "center",
        },

        questIcon: {
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor:
                "#0F172A",
            alignItems: "center",
            justifyContent:
                "center",
            marginRight: 12,
        },

        questEmoji: {
            fontSize: 23,
        },

        questInfo: {
            flex: 1,
            paddingRight: 8,
        },

        questTitle: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "800",
        },

        questDescription: {
            color: "#94A3B8",
            fontSize: 10,
            lineHeight: 15,
            marginTop: 4,
        },

        completedIcon: {
            width: 29,
            height: 29,
            borderRadius: 15,
            backgroundColor:
                "#14532D",
            alignItems: "center",
            justifyContent:
                "center",
        },

        completedEmoji: {
            color: "#86EFAC",
            fontSize: 14,
            fontWeight: "900",
        },

        metaRow: {
            marginTop: 14,
        },

        badgeRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
        },

        typeBadge: {
            backgroundColor:
                "#312E81",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 5,
        },

        typeText: {
            color: "#C4B5FD",
            fontSize: 8,
            fontWeight: "900",
        },

        difficultyBadge: {
            backgroundColor:
                "#0F172A",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 5,
        },

        difficultyText: {
            color: "#94A3B8",
            fontSize: 8,
            fontWeight: "800",
        },

        xpBadge: {
            backgroundColor:
                "#3F2B0B",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 5,
        },

        xpText: {
            color: "#FDE68A",
            fontSize: 8,
            fontWeight: "900",
        },

        dateRow: {
            flexDirection: "row",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor:
                "#334155",
            marginTop: 13,
            paddingTop: 11,
        },

        dateIcon: {
            fontSize: 12,
            marginRight: 6,
        },

        dateText: {
            color: "#64748B",
            fontSize: 9,
            fontWeight: "600",
        },

        emptyCard: {
            backgroundColor:
                "#1E293B",
            borderRadius: 18,
            borderWidth: 1,
            borderColor:
                "#334155",
            padding: 25,
            alignItems: "center",
        },

        emptyEmoji: {
            fontSize: 40,
            marginBottom: 12,
        },

        emptyTitle: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "900",
            textAlign: "center",
        },

        emptyText: {
            color: "#94A3B8",
            fontSize: 11,
            lineHeight: 17,
            textAlign: "center",
            marginTop: 7,
            marginBottom: 17,
        },

        questButton: {
            backgroundColor:
                "#7C3AED",
            paddingHorizontal: 17,
            paddingVertical: 10,
            borderRadius: 11,
        },

        questButtonText: {
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: "900",
        },

        bottomCard: {
            backgroundColor:
                "#312E81",
            borderRadius: 18,
            padding: 17,
            flexDirection: "row",
            alignItems: "center",
            marginTop: 14,
        },

        bottomEmoji: {
            fontSize: 30,
            marginRight: 13,
        },

        bottomInfo: {
            flex: 1,
        },

        bottomTitle: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "800",
            marginBottom: 5,
        },

        bottomText: {
            color: "#C4B5FD",
            fontSize: 10,
            lineHeight: 16,
        },
    });