import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";

type ShopItem = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: "title" | "theme" | "avatar";
};

const SHOP_ITEMS: ShopItem[] = [
  { id: "novice", name: "Novice Title", emoji: "🛡️", price: 0, category: "title" },
  { id: "warrior", name: "Warrior Title", emoji: "⚔️", price: 100, category: "title" },
  { id: "legend", name: "Legend Title", emoji: "👑", price: 300, category: "title" },
  { id: "purple", name: "Obsidian Theme", emoji: "🟣", price: 0, category: "theme" },
  { id: "gold", name: "Golden Royalty Theme", emoji: "🟡", price: 250, category: "theme" },
  { id: "warrior-avatar", name: "Warrior Avatar", emoji: "🧙", price: 0, category: "avatar" },
  { id: "knight-avatar", name: "Knight Avatar", emoji: "🤴", price: 200, category: "avatar" },
];

export default function ShopScreen() {
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [ownedTitles, setOwnedTitles] = useState<string[]>([]);
  const [ownedThemes, setOwnedThemes] = useState<string[]>([]);
  const [ownedAvatars, setOwnedAvatars] = useState<string[]>([]);

  const [equippedTitle, setEquippedTitle] = useState("");
  const [equippedTheme, setEquippedTheme] = useState("");
  const [equippedAvatar, setEquippedAvatar] = useState("");

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setCoins(data.coins ?? 0);
      setOwnedTitles(data.ownedTitles ?? ["novice"]);
      setOwnedThemes(data.ownedThemes ?? ["purple"]);
      setOwnedAvatars(data.ownedAvatars ?? ["warrior-avatar"]);
      setEquippedTitle(data.equippedTitle ?? "novice");
      setEquippedTheme(data.equippedTheme ?? "purple");
      setEquippedAvatar(data.equippedAvatar ?? "warrior-avatar");
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  const showToast = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const buyItem = async (item: ShopItem) => {
    if (!uid) return;

    try {
      const userRef = doc(db, "users", uid);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const currentCoins = data.coins ?? 0;

        if (currentCoins < item.price) {
          throw new Error("Insufficient gold coins!");
        }

        const updates: any = { coins: currentCoins - item.price };

        if (item.category === "title") {
          updates.ownedTitles = [...(data.ownedTitles ?? ["novice"]), item.id];
          updates.equippedTitle = item.id;
        } else if (item.category === "theme") {
          updates.ownedThemes = [...(data.ownedThemes ?? ["purple"]), item.id];
          updates.equippedTheme = item.id;
        } else if (item.category === "avatar") {
          updates.ownedAvatars = [...(data.ownedAvatars ?? ["warrior-avatar"]), item.id];
          updates.equippedAvatar = item.id;
        }

        tx.update(userRef, updates);
      });

      showToast("Purchase Successful! 🪙", `Unlocked ${item.name}!`);
    } catch (err: any) {
      showToast("Shop Error", err.message || "Failed to complete purchase.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.gold} />
        <Text style={styles.loadingText}>Opening Fantasy Marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="🪙 Fantasy Marketplace" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>ROYAL BAZAAR</Text>
        <Text style={styles.title}>🏪 Merchant's Vault</Text>

        <View style={styles.itemsGrid}>
          {SHOP_ITEMS.map((item) => {
            const isOwned =
              item.category === "title"
                ? ownedTitles.includes(item.id)
                : item.category === "theme"
                  ? ownedThemes.includes(item.id)
                  : ownedAvatars.includes(item.id);

            const isEquipped =
              item.category === "title"
                ? equippedTitle === item.id
                : item.category === "theme"
                  ? equippedTheme === item.id
                  : equippedAvatar === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  isEquipped && styles.itemCardEquipped,
                ]}
              >
                <View style={styles.itemIconFrame}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                </View>

                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemCategoryText}>
                  {item.category.toUpperCase()}
                </Text>

                {isOwned ? (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedText}>
                      {isEquipped ? "✓ EQUIPPED" : "OWNED"}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => buyItem(item)}
                  >
                    <Text style={styles.buyButtonText}>
                      Buy 🪙 {item.price}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const itemCardWidth = (Dimensions.get("window").width - 44) / 2;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: RPGTheme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
    fontWeight: "700",
  },
  container: {
    padding: 16,
    paddingBottom: 60,
  },
  eyebrow: {
    color: RPGTheme.colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  title: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 20,
  },

  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemCard: {
    width: itemCardWidth,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: RPGTheme.colors.cardBorder,
    alignItems: "center",
  },
  itemCardEquipped: {
    borderColor: RPGTheme.colors.gold,
    backgroundColor: RPGTheme.colors.secondaryCard,
  },
  itemIconFrame: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: RPGTheme.colors.secondaryCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    marginBottom: 10,
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  itemCategoryText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 12,
  },
  ownedBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RPGTheme.colors.goldBorder,
  },
  ownedText: {
    color: RPGTheme.colors.goldLight,
    fontSize: 10,
    fontWeight: "900",
  },
  buyButton: {
    backgroundColor: RPGTheme.colors.purplePrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});