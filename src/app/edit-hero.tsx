import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import {
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";
import {
    useEffect,
    useState,
} from "react";

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

// ============================================
// TYPES
// ============================================

type HeroClass =
    | "warrior"
    | "mage"
    | "archer"
    | "assassin";

type ClassOption = {
    id: HeroClass;
    emoji: string;
    title: string;
    description: string;
};

// ============================================
// HERO CLASSES
// ============================================

const heroClasses: ClassOption[] = [
    {
        id: "warrior",
        emoji: "🛡️",
        title: "Warrior",
        description:
            "Strong, disciplined and fearless.",
    },

    {
        id: "mage",
        emoji: "🧙",
        title: "Mage",
        description:
            "Wise, focused and intelligent.",
    },

    {
        id: "archer",
        emoji: "🏹",
        title: "Archer",
        description:
            "Precise, agile and consistent.",
    },

    {
        id: "assassin",
        emoji: "🥷",
        title: "Assassin",
        description:
            "Fast, strategic and determined.",
    },
];

// ============================================
// EDIT HERO SCREEN
// ============================================

export default function EditHeroScreen() {
    const [heroName, setHeroName] =
        useState("");

    const [selectedClass, setSelectedClass] =
        useState<HeroClass>("warrior");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    // ============================================
    // LOAD CURRENT HERO
    // ============================================

    useEffect(() => {
        const loadHero = async () => {
            try {
                const user = auth.currentUser;

                if (!user) {
                    router.replace("/login");
                    return;
                }

                const userRef = doc(
                    db,
                    "users",
                    user.uid
                );

                const snapshot =
                    await getDoc(userRef);

                if (!snapshot.exists()) {
                    showMessage(
                        "Hero Not Found",
                        "Your hero profile could not be found."
                    );

                    router.back();
                    return;
                }

                const data =
                    snapshot.data();

                setHeroName(
                    data.heroName || "Hero"
                );

                const currentClass =
                    data.class;

                const validClass =
                    heroClasses.some(
                        (item) =>
                            item.id === currentClass
                    );

                if (validClass) {
                    setSelectedClass(
                        currentClass as HeroClass
                    );
                } else {
                    setSelectedClass(
                        "warrior"
                    );
                }
            } catch (error: any) {
                console.error(
                    "LOAD HERO ERROR:",
                    error
                );

                showMessage(
                    "Error",
                    error?.message ||
                    "Unable to load your hero."
                );
            } finally {
                setLoading(false);
            }
        };

        loadHero();
    }, []);

    // ============================================
    // MESSAGE
    // ============================================

    const showMessage = (
        title: string,
        message: string
    ) => {
        if (Platform.OS === "web") {
            window.alert(
                `${title}\n\n${message}`
            );
        } else {
            Alert.alert(
                title,
                message
            );
        }
    };

    // ============================================
    // SAVE HERO
    // ============================================

    const handleSave = async () => {
        if (saving) {
            return;
        }

        const cleanName =
            heroName.trim();

        // Empty validation

        if (!cleanName) {
            showMessage(
                "Hero Name Required",
                "Please enter your hero name."
            );

            return;
        }

        // Minimum length

        if (cleanName.length < 2) {
            showMessage(
                "Name Too Short",
                "Hero name must contain at least 2 characters."
            );

            return;
        }

        // Maximum length

        if (cleanName.length > 25) {
            showMessage(
                "Name Too Long",
                "Hero name cannot contain more than 25 characters."
            );

            return;
        }

        try {
            setSaving(true);

            const user =
                auth.currentUser;

            if (!user) {
                showMessage(
                    "Session Expired",
                    "Please login again."
                );

                router.replace(
                    "/login"
                );

                return;
            }

            const userRef = doc(
                db,
                "users",
                user.uid
            );

            // IMPORTANT:
            // Only these two fields are updated.
            // XP, level, streak, quests etc.
            // remain unchanged.

            await updateDoc(
                userRef,
                {
                    heroName:
                        cleanName,

                    class:
                        selectedClass,
                }
            );

            console.log(
                "HERO UPDATED SUCCESSFULLY"
            );

            if (
                Platform.OS === "web"
            ) {
                window.alert(
                    "Hero updated successfully!"
                );

                router.back();
            } else {
                Alert.alert(
                    "Hero Updated! ⚔️",
                    "Your hero has been updated successfully.",
                    [
                        {
                            text: "Done",
                            onPress: () =>
                                router.back(),
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error(
                "UPDATE HERO ERROR:",
                error
            );

            showMessage(
                "Update Failed",
                error?.message ||
                "Unable to update your hero."
            );
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // LOADING SCREEN
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
                    Loading your hero...
                </Text>
            </View>
        );
    }

    // ============================================
    // SELECTED CLASS
    // ============================================

    const currentClass =
        heroClasses.find(
            (item) =>
                item.id ===
                selectedClass
        ) || heroClasses[0];

    // ============================================
    // UI
    // ============================================

    return (
        <View
            style={styles.screen}
        >
            <ScrollView
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={
                    false
                }
                keyboardShouldPersistTaps="handled"
            >
                {/* BACK BUTTON */}

                <TouchableOpacity
                    style={
                        styles.backButton
                    }
                    activeOpacity={0.7}
                    onPress={() =>
                        router.back()
                    }
                >
                    <Text
                        style={
                            styles.backIcon
                        }
                    >
                        ‹
                    </Text>

                    <Text
                        style={
                            styles.backText
                        }
                    >
                        Profile
                    </Text>
                </TouchableOpacity>

                {/* HEADER */}

                <Text
                    style={
                        styles.eyebrow
                    }
                >
                    HERO CUSTOMIZATION
                </Text>

                <Text
                    style={styles.title}
                >
                    ✏️ Edit Hero
                </Text>

                <Text
                    style={
                        styles.subtitle
                    }
                >
                    Customize your hero name
                    and choose your class.
                </Text>

                {/* HERO PREVIEW */}

                <View
                    style={
                        styles.previewCard
                    }
                >
                    <Text
                        style={
                            styles.previewLabel
                        }
                    >
                        HERO PREVIEW
                    </Text>

                    <View
                        style={
                            styles.avatar
                        }
                    >
                        <Text
                            style={
                                styles.avatarEmoji
                            }
                        >
                            {
                                currentClass.emoji
                            }
                        </Text>
                    </View>

                    <Text
                        style={
                            styles.previewName
                        }
                        numberOfLines={1}
                    >
                        {heroName.trim() ||
                            "Your Hero"}
                    </Text>

                    <Text
                        style={
                            styles.previewClass
                        }
                    >
                        {
                            currentClass.title
                        }
                    </Text>
                </View>

                {/* HERO NAME */}

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Hero Name
                </Text>

                <View
                    style={
                        styles.inputCard
                    }
                >
                    <Text
                        style={
                            styles.inputLabel
                        }
                    >
                        NAME
                    </Text>

                    <TextInput
                        value={heroName}
                        onChangeText={
                            setHeroName
                        }
                        placeholder="Enter hero name"
                        placeholderTextColor="#64748B"
                        style={
                            styles.input
                        }
                        maxLength={25}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />

                    <View
                        style={
                            styles.inputFooter
                        }
                    >
                        <Text
                            style={
                                styles.inputHint
                            }
                        >
                            This name appears on
                            your hero profile.
                        </Text>

                        <Text
                            style={
                                styles.characterCount
                            }
                        >
                            {heroName.length}/25
                        </Text>
                    </View>
                </View>

                {/* HERO CLASS */}

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    Choose Class
                </Text>

                <Text
                    style={
                        styles.sectionDescription
                    }
                >
                    Choose the class that
                    represents your journey.
                </Text>

                {/* CLASS OPTIONS */}

                {heroClasses.map(
                    (item) => {
                        const selected =
                            selectedClass ===
                            item.id;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.classCard,

                                    selected &&
                                    styles.selectedClassCard,
                                ]}
                                activeOpacity={0.75}
                                onPress={() =>
                                    setSelectedClass(
                                        item.id
                                    )
                                }
                            >
                                <View
                                    style={[
                                        styles.classIcon,

                                        selected &&
                                        styles.selectedClassIcon,
                                    ]}
                                >
                                    <Text
                                        style={
                                            styles.classEmoji
                                        }
                                    >
                                        {item.emoji}
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.classInfo
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.classTitle,

                                            selected &&
                                            styles.selectedClassTitle,
                                        ]}
                                    >
                                        {item.title}
                                    </Text>

                                    <Text
                                        style={
                                            styles.classDescription
                                        }
                                    >
                                        {
                                            item.description
                                        }
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.radioOuter,

                                        selected &&
                                        styles.radioOuterSelected,
                                    ]}
                                >
                                    {selected && (
                                        <View
                                            style={
                                                styles.radioInner
                                            }
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }
                )}

                {/* INFO */}

                <View
                    style={
                        styles.infoCard
                    }
                >
                    <Text
                        style={
                            styles.infoEmoji
                        }
                    >
                        💡
                    </Text>

                    <Text
                        style={
                            styles.infoText
                        }
                    >
                        Changing your hero name
                        or class will not affect
                        your XP, level, streak,
                        completed quests or
                        achievements.
                    </Text>
                </View>

                {/* SAVE */}

                <TouchableOpacity
                    style={[
                        styles.saveButton,

                        saving &&
                        styles.disabledButton,
                    ]}
                    activeOpacity={0.8}
                    disabled={saving}
                    onPress={
                        handleSave
                    }
                >
                    {saving ? (
                        <>
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />

                            <Text
                                style={
                                    styles.saveButtonText
                                }
                            >
                                Saving Hero...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text
                                style={
                                    styles.saveIcon
                                }
                            >
                                💾
                            </Text>

                            <Text
                                style={
                                    styles.saveButtonText
                                }
                            >
                                Save Changes
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* CANCEL */}

                <TouchableOpacity
                    style={
                        styles.cancelButton
                    }
                    activeOpacity={0.7}
                    disabled={saving}
                    onPress={() =>
                        router.back()
                    }
                >
                    <Text
                        style={
                            styles.cancelText
                        }
                    >
                        Cancel
                    </Text>
                </TouchableOpacity>
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
            paddingTop: 45,
            paddingBottom: 50,
        },

        // ========================================
        // BACK
        // ========================================

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

        // ========================================
        // HEADER
        // ========================================

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

        // ========================================
        // PREVIEW
        // ========================================

        previewCard: {
            backgroundColor:
                "#1E293B",
            borderRadius: 22,
            borderWidth: 1,
            borderColor:
                "#334155",
            padding: 22,
            alignItems: "center",
            marginBottom: 28,
        },

        previewLabel: {
            color: "#64748B",
            fontSize: 9,
            fontWeight: "900",
            letterSpacing: 1.5,
            marginBottom: 15,
        },

        avatar: {
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor:
                "#312E81",
            borderWidth: 2,
            borderColor:
                "#7C3AED",
            alignItems: "center",
            justifyContent:
                "center",
            marginBottom: 13,
        },

        avatarEmoji: {
            fontSize: 44,
        },

        previewName: {
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: "900",
            maxWidth: "90%",
        },

        previewClass: {
            color: "#A78BFA",
            fontSize: 12,
            fontWeight: "700",
            marginTop: 5,
        },

        // ========================================
        // SECTION
        // ========================================

        sectionTitle: {
            color: "#FFFFFF",
            fontSize: 18,
            fontWeight: "800",
            marginBottom: 8,
        },

        sectionDescription: {
            color: "#64748B",
            fontSize: 10,
            lineHeight: 16,
            marginBottom: 13,
        },

        // ========================================
        // INPUT
        // ========================================

        inputCard: {
            backgroundColor:
                "#1E293B",
            borderRadius: 16,
            borderWidth: 1,
            borderColor:
                "#334155",
            padding: 14,
            marginBottom: 27,
        },

        inputLabel: {
            color: "#A78BFA",
            fontSize: 9,
            fontWeight: "900",
            letterSpacing: 1.2,
            marginBottom: 8,
        },

        input: {
            backgroundColor:
                "#0F172A",
            borderWidth: 1,
            borderColor:
                "#334155",
            borderRadius: 12,
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "600",
            minHeight: 48,
            paddingHorizontal: 13,
            outlineStyle:
                "none" as any,
        },

        inputFooter: {
            flexDirection: "row",
            justifyContent:
                "space-between",
            alignItems: "center",
            marginTop: 9,
        },

        inputHint: {
            color: "#64748B",
            fontSize: 8,
            flex: 1,
        },

        characterCount: {
            color: "#64748B",
            fontSize: 8,
            marginLeft: 10,
        },

        // ========================================
        // CLASS CARDS
        // ========================================

        classCard: {
            backgroundColor:
                "#1E293B",
            borderWidth: 1,
            borderColor:
                "#334155",
            borderRadius: 16,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
        },

        selectedClassCard: {
            backgroundColor:
                "#25244A",
            borderColor:
                "#7C3AED",
        },

        classIcon: {
            width: 50,
            height: 50,
            borderRadius: 14,
            backgroundColor:
                "#0F172A",
            alignItems: "center",
            justifyContent:
                "center",
            marginRight: 12,
        },

        selectedClassIcon: {
            backgroundColor:
                "#312E81",
        },

        classEmoji: {
            fontSize: 25,
        },

        classInfo: {
            flex: 1,
            paddingRight: 8,
        },

        classTitle: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "800",
        },

        selectedClassTitle: {
            color: "#C4B5FD",
        },

        classDescription: {
            color: "#64748B",
            fontSize: 9,
            lineHeight: 14,
            marginTop: 4,
        },

        radioOuter: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor:
                "#475569",
            alignItems: "center",
            justifyContent:
                "center",
        },

        radioOuterSelected: {
            borderColor:
                "#8B5CF6",
        },

        radioInner: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor:
                "#8B5CF6",
        },

        // ========================================
        // INFO
        // ========================================

        infoCard: {
            backgroundColor:
                "#172554",
            borderRadius: 15,
            borderWidth: 1,
            borderColor:
                "#1E3A8A",
            padding: 14,
            flexDirection: "row",
            alignItems:
                "flex-start",
            marginTop: 12,
            marginBottom: 22,
        },

        infoEmoji: {
            fontSize: 18,
            marginRight: 10,
        },

        infoText: {
            flex: 1,
            color: "#93C5FD",
            fontSize: 9,
            lineHeight: 15,
        },

        // ========================================
        // BUTTONS
        // ========================================

        saveButton: {
            backgroundColor:
                "#7C3AED",
            borderRadius: 15,
            minHeight: 54,
            flexDirection: "row",
            alignItems: "center",
            justifyContent:
                "center",
            gap: 8,
        },

        disabledButton: {
            opacity: 0.6,
        },

        saveIcon: {
            fontSize: 16,
        },

        saveButtonText: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "900",
        },

        cancelButton: {
            minHeight: 48,
            alignItems: "center",
            justifyContent:
                "center",
            marginTop: 8,
        },

        cancelText: {
            color: "#94A3B8",
            fontSize: 12,
            fontWeight: "700",
        },
    });