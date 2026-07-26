import { auth, db } from "@/lib/firebase";
import { router, useLocalSearchParams } from "expo-router";

import {
    deleteDoc,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Difficulty = "Easy" | "Medium" | "Hard";

const DIFFICULTIES: {
    name: Difficulty;
    xp: number;
    emoji: string;
}[] = [
        {
            name: "Easy",
            xp: 10,
            emoji: "🌱",
        },
        {
            name: "Medium",
            xp: 20,
            emoji: "⚔️",
        },
        {
            name: "Hard",
            xp: 30,
            emoji: "🔥",
        },
    ];

export default function EditQuestScreen() {
    const params = useLocalSearchParams();

    const questId = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const [title, setTitle] = useState("");
    const [description, setDescription] =
        useState("");

    const [difficulty, setDifficulty] =
        useState<Difficulty>("Easy");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const selectedDifficulty =
        DIFFICULTIES.find(
            (item) => item.name === difficulty
        ) || DIFFICULTIES[0];

    // ==========================================
    // MESSAGE
    // ==========================================

    const showMessage = (
        title: string,
        message: string
    ) => {
        if (Platform.OS === "web") {
            window.alert(
                `${title}\n\n${message}`
            );
        } else {
            Alert.alert(title, message);
        }
    };

    // ==========================================
    // LOAD QUEST
    // ==========================================

    useEffect(() => {
        const loadQuest = async () => {
            const user = auth.currentUser;

            if (!user) {
                router.replace("/login");
                return;
            }

            if (!questId) {
                showMessage(
                    "Quest Error",
                    "Quest ID was not found."
                );

                router.back();
                return;
            }

            try {
                const questRef = doc(
                    db,
                    "users",
                    user.uid,
                    "customQuests",
                    questId
                );

                const snapshot =
                    await getDoc(questRef);

                if (!snapshot.exists()) {
                    showMessage(
                        "Quest Not Found",
                        "This quest does not exist."
                    );

                    router.back();
                    return;
                }

                const data = snapshot.data();

                setTitle(
                    data.title || ""
                );

                setDescription(
                    data.description || ""
                );

                setDifficulty(
                    data.difficulty || "Easy"
                );
            } catch (error: any) {
                console.error(
                    "LOAD QUEST ERROR:",
                    error
                );

                showMessage(
                    "Unable to Load Quest",
                    error?.message ||
                    "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        };

        loadQuest();
    }, [questId]);

    // ==========================================
    // UPDATE QUEST
    // ==========================================

    const updateQuest = async () => {
        const cleanTitle = title.trim();

        const cleanDescription =
            description.trim();

        if (!cleanTitle) {
            showMessage(
                "Quest Name Required",
                "Please enter a quest name."
            );

            return;
        }

        if (!cleanDescription) {
            showMessage(
                "Description Required",
                "Please enter a description."
            );

            return;
        }

        const user = auth.currentUser;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (!questId) {
            return;
        }

        try {
            setSaving(true);

            const questRef = doc(
                db,
                "users",
                user.uid,
                "customQuests",
                questId
            );

            await updateDoc(questRef, {
                title: cleanTitle,

                description:
                    cleanDescription,

                difficulty:
                    selectedDifficulty.name,

                xp:
                    selectedDifficulty.xp,

                emoji:
                    selectedDifficulty.emoji,

                updatedAt:
                    serverTimestamp(),
            });

            console.log(
                "QUEST UPDATED:",
                cleanTitle
            );

            showMessage(
                "Quest Updated! ⚔️",
                `${cleanTitle} has been updated.`
            );

            router.back();
        } catch (error: any) {
            console.error(
                "UPDATE QUEST ERROR:",
                error
            );

            showMessage(
                "Unable to Update Quest",
                error?.message ||
                "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // ACTUAL DELETE
    // ==========================================

    const performDelete = async () => {
        const user = auth.currentUser;

        if (!user || !questId) {
            return;
        }

        try {
            setDeleting(true);

            const questRef = doc(
                db,
                "users",
                user.uid,
                "customQuests",
                questId
            );

            await deleteDoc(questRef);

            console.log(
                "QUEST DELETED:",
                questId
            );

            showMessage(
                "Quest Deleted",
                "Your custom quest has been removed."
            );

            router.back();
        } catch (error: any) {
            console.error(
                "DELETE QUEST ERROR:",
                error
            );

            showMessage(
                "Unable to Delete Quest",
                error?.message ||
                "Something went wrong."
            );
        } finally {
            setDeleting(false);
        }
    };

    // ==========================================
    // DELETE CONFIRMATION
    // ==========================================

    const deleteQuest = () => {
        if (Platform.OS === "web") {
            const confirmed =
                window.confirm(
                    `Delete "${title}"?\n\nThis action cannot be undone.`
                );

            if (confirmed) {
                performDelete();
            }

            return;
        }

        Alert.alert(
            "Delete Quest?",
            `Are you sure you want to delete "${title}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: performDelete,
                },
            ]
        );
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator
                    size="large"
                    color="#7C3AED"
                />

                <Text style={styles.loadingText}>
                    Loading quest...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={
                    styles.container
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* BACK */}

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>
                        ← Back
                    </Text>
                </TouchableOpacity>

                {/* HEADER */}

                <Text style={styles.eyebrow}>
                    QUEST EDITOR
                </Text>

                <Text style={styles.pageTitle}>
                    ✏️ Edit Quest
                </Text>

                <Text style={styles.subtitle}>
                    Update your mission or remove it
                    from your adventure.
                </Text>

                {/* FORM */}

                <View style={styles.formCard}>
                    <Text style={styles.label}>
                        QUEST NAME
                    </Text>

                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Quest name"
                        placeholderTextColor="#64748B"
                        style={styles.input}
                        maxLength={50}
                    />

                    <Text style={styles.label}>
                        DESCRIPTION
                    </Text>

                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Quest description"
                        placeholderTextColor="#64748B"
                        multiline
                        maxLength={150}
                        textAlignVertical="top"
                        style={[
                            styles.input,
                            styles.descriptionInput,
                        ]}
                    />

                    {/* DIFFICULTY */}

                    <Text style={styles.label}>
                        DIFFICULTY
                    </Text>

                    <View
                        style={styles.difficultyRow}
                    >
                        {DIFFICULTIES.map(
                            (item) => {
                                const selected =
                                    difficulty ===
                                    item.name;

                                return (
                                    <TouchableOpacity
                                        key={item.name}
                                        onPress={() =>
                                            setDifficulty(
                                                item.name
                                            )
                                        }
                                        activeOpacity={0.75}
                                        style={[
                                            styles.difficultyCard,

                                            selected &&
                                            styles.selectedDifficulty,
                                        ]}
                                    >
                                        <Text
                                            style={
                                                styles.difficultyEmoji
                                            }
                                        >
                                            {item.emoji}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.difficultyName,

                                                selected &&
                                                styles.selectedDifficultyText,
                                            ]}
                                        >
                                            {item.name}
                                        </Text>

                                        <Text
                                            style={
                                                styles.difficultyXP
                                            }
                                        >
                                            +{item.xp} XP
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }
                        )}
                    </View>

                    {/* REWARD */}

                    <View style={styles.rewardCard}>
                        <View>
                            <Text
                                style={styles.rewardLabel}
                            >
                                QUEST REWARD
                            </Text>

                            <Text
                                style={styles.rewardText}
                            >
                                {
                                    selectedDifficulty.name
                                }{" "}
                                Quest
                            </Text>
                        </View>

                        <Text style={styles.rewardXP}>
                            +{selectedDifficulty.xp} XP
                        </Text>
                    </View>
                </View>

                {/* SAVE */}

                <TouchableOpacity
                    disabled={saving || deleting}
                    onPress={updateQuest}
                    style={[
                        styles.saveButton,

                        (saving || deleting) &&
                        styles.disabledButton,
                    ]}
                >
                    {saving ? (
                        <>
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />

                            <Text
                                style={styles.saveText}
                            >
                                Saving...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text
                                style={styles.buttonIcon}
                            >
                                💾
                            </Text>

                            <Text
                                style={styles.saveText}
                            >
                                Save Changes
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* DELETE */}

                <TouchableOpacity
                    disabled={saving || deleting}
                    onPress={deleteQuest}
                    style={[
                        styles.deleteButton,

                        (saving || deleting) &&
                        styles.disabledButton,
                    ]}
                >
                    {deleting ? (
                        <>
                            <ActivityIndicator
                                size="small"
                                color="#FCA5A5"
                            />

                            <Text
                                style={styles.deleteText}
                            >
                                Deleting...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text
                                style={styles.buttonIcon}
                            >
                                🗑️
                            </Text>

                            <Text
                                style={styles.deleteText}
                            >
                                Delete Quest
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.warning}>
                    Deleting a quest cannot be undone.
                </Text>
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
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        color: "#94A3B8",
        fontSize: 13,
        marginTop: 15,
    },

    container: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 50,
        paddingBottom: 50,
    },

    backButton: {
        alignSelf: "flex-start",
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

    pageTitle: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "900",
        marginBottom: 7,
    },

    subtitle: {
        color: "#94A3B8",
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 25,
    },

    formCard: {
        backgroundColor: "#1E293B",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#334155",
        padding: 18,
    },

    label: {
        color: "#CBD5E1",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
        marginBottom: 8,
    },

    input: {
        width: "100%",
        backgroundColor: "#0F172A",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 13,
        paddingHorizontal: 14,
        paddingVertical: 13,
        color: "#FFFFFF",
        fontSize: 13,
        marginBottom: 20,
    },

    descriptionInput: {
        minHeight: 90,
    },

    difficultyRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },

    difficultyCard: {
        flex: 1,
        backgroundColor: "#0F172A",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 13,
        alignItems: "center",
        paddingVertical: 13,
    },

    selectedDifficulty: {
        backgroundColor: "#312E81",
        borderColor: "#8B5CF6",
    },

    difficultyEmoji: {
        fontSize: 21,
        marginBottom: 5,
    },

    difficultyName: {
        color: "#CBD5E1",
        fontSize: 10,
        fontWeight: "800",
    },

    selectedDifficultyText: {
        color: "#FFFFFF",
    },

    difficultyXP: {
        color: "#A78BFA",
        fontSize: 9,
        fontWeight: "800",
        marginTop: 4,
    },

    rewardCard: {
        backgroundColor: "#312E81",
        borderRadius: 13,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    rewardLabel: {
        color: "#A78BFA",
        fontSize: 8,
        fontWeight: "900",
        letterSpacing: 1,
    },

    rewardText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 4,
    },

    rewardXP: {
        color: "#C4B5FD",
        fontSize: 17,
        fontWeight: "900",
    },

    saveButton: {
        minHeight: 56,
        backgroundColor: "#7C3AED",
        borderRadius: 16,
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
    },

    saveText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    deleteButton: {
        minHeight: 54,
        backgroundColor: "#3F1D2E",
        borderWidth: 1,
        borderColor: "#7F1D1D",
        borderRadius: 16,
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
    },

    deleteText: {
        color: "#FCA5A5",
        fontSize: 14,
        fontWeight: "900",
    },

    buttonIcon: {
        fontSize: 17,
    },

    disabledButton: {
        opacity: 0.6,
    },

    warning: {
        color: "#64748B",
        fontSize: 9,
        textAlign: "center",
        marginTop: 12,
    },
});