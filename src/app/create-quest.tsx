import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import {
    addDoc,
    collection,
    serverTimestamp,
} from "firebase/firestore";
import { useState } from "react";

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

export default function CreateQuestScreen() {
    const [title, setTitle] = useState("");
    const [description, setDescription] =
        useState("");

    const [difficulty, setDifficulty] =
        useState<Difficulty>("Easy");

    const [saving, setSaving] =
        useState(false);

    const selectedDifficulty =
        DIFFICULTIES.find(
            (item) => item.name === difficulty
        ) || DIFFICULTIES[0];

    const showMessage = (
        title: string,
        message: string
    ) => {
        if (Platform.OS === "web") {
            window.alert(`${title}\n\n${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const createQuest = async () => {
        const cleanTitle = title.trim();
        const cleanDescription =
            description.trim();

        if (!cleanTitle) {
            showMessage(
                "Quest Name Required",
                "Please enter a name for your quest."
            );

            return;
        }

        if (!cleanDescription) {
            showMessage(
                "Description Required",
                "Please describe your quest."
            );

            return;
        }

        const user = auth.currentUser;

        if (!user) {
            showMessage(
                "Session Error",
                "Please sign in again."
            );

            router.replace("/login");

            return;
        }

        try {
            setSaving(true);

            const customQuestsRef = collection(
                db,
                "users",
                user.uid,
                "quests"
            );

            await addDoc(customQuestsRef, {
                title: cleanTitle,
                description: cleanDescription,

                difficulty:
                    selectedDifficulty.name,

                xp: selectedDifficulty.xp,

                emoji:
                    selectedDifficulty.emoji,

                custom: true,

                active: true,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp(),
            });

            console.log(
                "CUSTOM QUEST CREATED:",
                cleanTitle
            );

            showMessage(
                "Quest Created! ⚔️",
                `${cleanTitle} has been added to your quests.`
            );

            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace("/(tabs)/quests");
            }
        } catch (error: any) {
            console.error(
                "CREATE QUEST ERROR:",
                error
            );

            showMessage(
                "Unable to Create Quest",
                error?.message ||
                "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={
                    false
                }
                keyboardShouldPersistTaps="handled"
            >
                {/* HEADER */}

                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/(tabs)/quests");
                        }
                    }}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backText}>
                        ← Back
                    </Text>
                </TouchableOpacity>

                <Text style={styles.eyebrow}>
                    QUEST CREATOR
                </Text>

                <Text style={styles.title}>
                    ⚔️ Create Quest
                </Text>

                <Text style={styles.subtitle}>
                    Turn your real-life goals into
                    missions and earn XP.
                </Text>

                {/* FORM */}

                <View style={styles.formCard}>
                    <Text style={styles.label}>
                        QUEST NAME
                    </Text>

                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Read 20 Pages"
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
                        placeholder="What do you need to complete?"
                        placeholderTextColor="#64748B"
                        style={[
                            styles.input,
                            styles.descriptionInput,
                        ]}
                        multiline
                        maxLength={150}
                        textAlignVertical="top"
                    />

                    {/* DIFFICULTY */}

                    <Text style={styles.label}>
                        DIFFICULTY
                    </Text>

                    <View
                        style={styles.difficultyRow}
                    >
                        {DIFFICULTIES.map((item) => {
                            const selected =
                                difficulty === item.name;

                            return (
                                <TouchableOpacity
                                    key={item.name}
                                    onPress={() =>
                                        setDifficulty(item.name)
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
                                        style={styles.difficultyXP}
                                    >
                                        +{item.xp} XP
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
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
                                {selectedDifficulty.name}{" "}
                                Quest
                            </Text>
                        </View>

                        <Text
                            style={styles.rewardXP}
                        >
                            +{selectedDifficulty.xp} XP
                        </Text>
                    </View>
                </View>

                {/* CREATE */}

                <TouchableOpacity
                    disabled={saving}
                    onPress={createQuest}
                    activeOpacity={0.8}
                    style={[
                        styles.createButton,

                        saving &&
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
                                style={styles.createText}
                            >
                                Creating Quest...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text
                                style={styles.createIcon}
                            >
                                ⚔️
                            </Text>

                            <Text
                                style={styles.createText}
                            >
                                Create Quest
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.tipCard}>
                    <Text style={styles.tipEmoji}>
                        💡
                    </Text>

                    <Text style={styles.tipText}>
                        Create quests for habits,
                        studying, fitness, reading or
                        any real-life goal you want to
                        complete.
                    </Text>
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

    createButton: {
        minHeight: 56,
        backgroundColor: "#7C3AED",
        borderRadius: 16,
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
    },

    disabledButton: {
        opacity: 0.6,
    },

    createIcon: {
        fontSize: 18,
    },

    createText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    tipCard: {
        backgroundColor: "#1E293B",
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 15,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
    },

    tipEmoji: {
        fontSize: 22,
        marginRight: 11,
    },

    tipText: {
        flex: 1,
        color: "#94A3B8",
        fontSize: 10,
        lineHeight: 16,
    },
});