import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const classes = [
  {
    id: "warrior",
    emoji: "🛡️",
    title: "Warrior",
    desc: "High Health • Balanced Attack",
  },
  {
    id: "mage",
    emoji: "🧙",
    title: "Mage",
    desc: "High Magic • Low Health",
  },
  {
    id: "archer",
    emoji: "🏹",
    title: "Archer",
    desc: "Fast • Accurate",
  },
  {
    id: "assassin",
    emoji: "🥷",
    title: "Assassin",
    desc: "Critical Damage • Agile",
  },
];

export default function CharacterScreen() {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleContinue = async () => {
    // Check class
    if (!selected) {
      showMessage(
        "Choose Your Class",
        "Please select a class before continuing."
      );
      return;
    }

    // Check logged-in user
    const user = auth.currentUser;

    if (!user) {
      showMessage(
        "Session Error",
        "User session not found. Please sign in again."
      );

      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      console.log("==========================");
      console.log("SAVING CHARACTER CLASS");
      console.log("USER UID:", user.uid);
      console.log("SELECTED CLASS:", selected);
      console.log("==========================");

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      // Save class in Firestore
      await updateDoc(userRef, {
        class: selected,
        updatedAt: serverTimestamp(),
      });

      console.log(
        "CHARACTER CLASS SAVED TO FIRESTORE"
      );

      console.log(
        "NAVIGATING TO HOME..."
      );

      // Go to actual tabs Home screen
      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error(
        "=========================="
      );
      console.error(
        "CHARACTER SAVE ERROR"
      );
      console.error("ERROR:", error);
      console.error(
        "ERROR CODE:",
        error?.code
      );
      console.error(
        "ERROR MESSAGE:",
        error?.message
      );
      console.error(
        "=========================="
      );

      showMessage(
        "Unable to save character",
        error?.message ||
        "Something went wrong while saving your character."
      );
    } finally {
      setLoading(false);
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
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            ✦ DEFINE YOUR PATH ✦
          </Text>

          <Text style={styles.title}>
            ⚔️ Choose Your Class
          </Text>

          <Text style={styles.subtitle}>
            Every hero begins with a class.
            Choose the path that represents
            you.
          </Text>
        </View>

        {/* CLASS LIST */}

        <View style={styles.classList}>
          {classes.map((item) => {
            const isSelected =
              selected === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                disabled={loading}
                activeOpacity={0.8}
                onPress={() =>
                  setSelected(item.id)
                }
                style={[
                  styles.classCard,
                  isSelected &&
                  styles.selectedCard,
                ]}
              >
                {/* ICON */}

                <View
                  style={[
                    styles.iconContainer,
                    isSelected &&
                    styles.selectedIcon,
                  ]}
                >
                  <Text
                    style={styles.emoji}
                  >
                    {item.emoji}
                  </Text>
                </View>

                {/* INFO */}

                <View
                  style={styles.classInfo}
                >
                  <Text
                    style={[
                      styles.classTitle,
                      isSelected &&
                      styles.selectedTitle,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={
                      styles.description
                    }
                  >
                    {item.desc}
                  </Text>
                </View>

                {/* RADIO */}

                <View
                  style={[
                    styles.radioOuter,
                    isSelected &&
                    styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && (
                    <View
                      style={
                        styles.radioInner
                      }
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SELECTED MESSAGE */}

        {selected ? (
          <View
            style={
              styles.selectedMessage
            }
          >
            <Text
              style={
                styles.selectedMessageText
              }
            >
              ✓{" "}
              {
                classes.find(
                  (item) =>
                    item.id === selected
                )?.title
              }{" "}
              selected
            </Text>
          </View>
        ) : null}

        {/* CONTINUE BUTTON */}

        <TouchableOpacity
          disabled={!selected || loading}
          onPress={handleContinue}
          activeOpacity={0.8}
          style={[
            styles.continueButton,
            (!selected || loading) &&
            styles.disabledButton,
          ]}
        >
          {loading ? (
            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={styles.spinner}
              />

              <Text
                style={
                  styles.continueText
                }
              >
                Saving Hero...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={
                  styles.continueText
                }
              >
                Begin Adventure
              </Text>

              <Text
                style={
                  styles.continueIcon
                }
              >
                ⚔️
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Your class will become part of
          your hero profile.
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

  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  eyebrow: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.5,
    marginBottom: 12,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 350,
  },

  classList: {
    width: "100%",
  },

  classCard: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
  },

  selectedCard: {
    backgroundColor: "#312E81",
    borderColor: "#8B5CF6",
    borderWidth: 2,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  selectedIcon: {
    backgroundColor: "#4C1D95",
  },

  emoji: {
    fontSize: 27,
  },

  classInfo: {
    flex: 1,
  },

  classTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 5,
  },

  selectedTitle: {
    color: "#DDD6FE",
  },

  description: {
    color: "#94A3B8",
    fontSize: 11,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  radioOuterSelected: {
    borderColor: "#A78BFA",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#A78BFA",
  },

  selectedMessage: {
    backgroundColor: "#1E1B4B",
    borderWidth: 1,
    borderColor: "#4C1D95",
    borderRadius: 12,
    padding: 11,
    alignItems: "center",
    marginTop: 4,
  },

  selectedMessageText: {
    color: "#C4B5FD",
    fontSize: 11,
    fontWeight: "700",
  },

  continueButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,

    shadowColor: "#7C3AED",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  disabledButton: {
    backgroundColor: "#475569",
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.7,
  },

  spinner: {
    marginRight: 9,
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  continueIcon: {
    fontSize: 17,
    marginLeft: 9,
  },

  footerText: {
    color: "#64748B",
    fontSize: 10,
    textAlign: "center",
    marginTop: 14,
  },
});