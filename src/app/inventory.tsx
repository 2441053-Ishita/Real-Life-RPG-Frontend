import { auth, db } from "@/lib/firebase";
import InventoryService, { ALL_RPG_ITEMS } from "@/services/inventoryService";
import { router } from "expo-router";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  DEFAULT_EQUIPMENT,
  EquipmentSlot,
  EquipmentState,
  INITIAL_STARTER_ITEMS,
  InventoryItem,
  ItemCategory,
  RarityType,
  SLOT_LABELS,
  calculateTotalEquipmentStats,
  getRarityBg,
  getRarityColor,
} from "@/utils/inventory";
import { RPGTheme } from "@/utils/rpgTheme";
import RPGHeader from "@/components/RPGHeader";

const CATEGORIES: (ItemCategory | "all")[] = [
  "all",
  "weapons",
  "armor",
  "helmets",
  "boots",
  "shields",
  "accessories",
  "potions",
  "scrolls",
  "special",
];

const SLOTS: EquipmentSlot[] = [
  "weapon",
  "helmet",
  "armor",
  "boots",
  "shield",
  "accessory",
];

export default function InventoryScreen() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentState>(DEFAULT_EQUIPMENT);
  const [coins, setCoins] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "all">("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    // Trigger milestone unlocks check
    InventoryService.checkInventoryUnlocks(uid).catch(() => { });

    const userRef = doc(db, "users", uid);
    const userUnsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const eqState = {
            ...DEFAULT_EQUIPMENT,
            ...(data.equipment || {}),
          };

          setEquipment(eqState);
          setCoins(data.coins ?? 0);
        }
      },
      (error) => {
        console.error("USER PROFILE FIRESTORE ERROR:", error);
      }
    );

    const inventoryRef = collection(db, "users", uid, "inventory");
    const inventoryUnsub = onSnapshot(
      inventoryRef,
      (snapshot) => {
        const unlockedMap = new Map<string, any>();
        snapshot.docs.forEach((docSnap) => {
          unlockedMap.set(docSnap.id, docSnap.data());
        });

        // Map over ALL_RPG_ITEMS catalog so locked items are rendered in grey state
        const combinedItems = ALL_RPG_ITEMS.map((catalogItem) => {
          const unlockedData = unlockedMap.get(catalogItem.id);
          const isUnlocked = Boolean(unlockedData);
          return {
            ...catalogItem,
            unlocked: isUnlocked,
            equipped: isUnlocked ? Boolean(unlockedData.equipped) : false,
            unlockedAt: unlockedData?.unlockedAt ?? null,
            value: catalogItem.value ?? 20,
            statBonus: {
              strength: catalogItem.attack,
              defense: catalogItem.defense,
              intelligence: catalogItem.intelligence,
              vitality: catalogItem.vitality,
            },
          } as unknown as InventoryItem;
        });

        // Append any extra user items in Firestore not in ALL_RPG_ITEMS
        snapshot.docs.forEach((docSnap) => {
          if (!ALL_RPG_ITEMS.some((item) => item.id === docSnap.id)) {
            const data = docSnap.data();
            combinedItems.push({
              id: docSnap.id,
              name: data.name || "Custom Item",
              description: data.description || "",
              category: data.category || "special",
              rarity: data.rarity || "Common",
              icon: data.icon || "📦",
              attack: Number(data.attack ?? 0),
              defense: Number(data.defense ?? 0),
              intelligence: Number(data.intelligence ?? 0),
              vitality: Number(data.vitality ?? 0),
              speed: Number(data.speed ?? 0),
              slot: data.slot || null,
              value: data.value ?? 10,
              unlockRequirement: "Unlocked Item",
              unlocked: true,
              equipped: Boolean(data.equipped),
              unlockedAt: data.unlockedAt,
              statBonus: data.statBonus || {},
            } as unknown as InventoryItem);
          }
        });

        setInventory(combinedItems);
        setLoading(false);
      },
      (error) => {
        console.error("INVENTORY FIRESTORE ERROR:", error);
        setLoading(false);
      }
    );

    return () => {
      userUnsub();
      inventoryUnsub();
    };
  }, [uid]);

  const statBonuses = useMemo(() => {
    return calculateTotalEquipmentStats(equipment);
  }, [equipment]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  const showToast = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const isItemEquipped = (item: InventoryItem) => {
    if (!item.slot) return false;
    const equipped = equipment[item.slot];
    return equipped?.id === item.id;
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!uid) return;

    try {
      setUpdating(true);
      await InventoryService.equipItem(uid, item.id);

      if (item.slot) {
        const slot = item.slot;
        const newEquipment: EquipmentState = {
          ...equipment,
          [slot]: item,
        };
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          equipment: newEquipment,
        }).catch(() => { });
      }

      setSelectedItem(null);
      showToast("Item Equipped! 🛡️", `You equipped ${item.name}.`);
    } catch (err: any) {
      console.error("EQUIP ERROR:", err);
      showToast("Equip Error", err?.message || "Failed to equip item.");
    } finally {
      setUpdating(false);
    }
  };

  const handleUnequip = async (slot: EquipmentSlot) => {
    if (!uid) return;
    const item = equipment[slot];
    if (!item) return;

    try {
      setUpdating(true);
      const newEquipment: EquipmentState = {
        ...equipment,
        [slot]: null,
      };

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        equipment: newEquipment,
      });

      setSelectedItem(null);
      showToast("Item Unequipped", `Unequipped ${item.name}.`);
    } catch (err: any) {
      console.error("UNEQUIP ERROR:", err);
      showToast("Unequip Error", err?.message || "Failed to unequip item.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSell = async (item: InventoryItem) => {
    if (!uid) return;

    try {
      setUpdating(true);
      let newEquipment = { ...equipment };
      if (item.slot && equipment[item.slot]?.id === item.id) {
        newEquipment[item.slot] = null;
      }

      const updatedInventory = inventory.filter((i) => i.id !== item.id);
      const earnedCoins = Math.round(item.value * 0.7);

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        inventory: updatedInventory,
        equipment: newEquipment,
        coins: coins + earnedCoins,
      });

      setSelectedItem(null);
      showToast("Item Sold 🪙", `Sold ${item.name} for +${earnedCoins} coins.`);
    } catch (err: any) {
      console.error("SELL ERROR:", err);
      showToast("Sell Error", err?.message || "Failed to sell item.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={RPGTheme.colors.purplePrimary} />
        <Text style={styles.loadingText}>Opening Hero Armory Vault...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RPGHeader title="🎒 Armory & Vault" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>HERO EQUIPMENT & VAULT</Text>
        <Text style={styles.title}>🎒 Hero Armory</Text>

        {/* EQUIPMENT LOADOUT GRID */}
        <View style={styles.equipmentCard}>
          <View style={styles.equipmentHeader}>
            <Text style={styles.equipmentTitle}>Equipped Gear</Text>
            <Text style={styles.equipmentSub}>Tap slot to inspect or unequip</Text>
          </View>

          <View style={styles.slotsGrid}>
            {SLOTS.map((slotKey) => {
              const item = equipment[slotKey];
              const slotInfo = SLOT_LABELS[slotKey];

              return (
                <TouchableOpacity
                  key={slotKey}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (item) {
                      setSelectedItem(item);
                    }
                  }}
                  style={[
                    styles.slotBox,
                    item && { borderColor: getRarityColor(item.rarity) },
                  ]}
                >
                  {item ? (
                    <View style={styles.slotItemContent}>
                      <Text style={styles.slotItemIcon}>{item.icon}</Text>
                      <Text style={styles.slotItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptySlotContent}>
                      <Text style={styles.emptySlotIcon}>{slotInfo.icon}</Text>
                      <Text style={styles.emptySlotLabel}>{slotInfo.title}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* EQUIPPED STAT BONUSES */}
          <View style={styles.statsBreakdown}>
            <Text style={styles.statsBreakdownTitle}>Gear Stat Boosts</Text>
            <View style={styles.statsRowGrid}>
              <Text style={styles.statPillText}>💪 +{statBonuses.strength || 0} STR</Text>
              <Text style={styles.statPillText}>🧠 +{statBonuses.intelligence || 0} INT</Text>
              <Text style={styles.statPillText}>⚡ +{statBonuses.discipline || 0} DIS</Text>
              <Text style={styles.statPillText}>📚 +{statBonuses.wisdom || 0} WIS</Text>
              <Text style={styles.statPillText}>❤️ +{statBonuses.vitality || 0} VIT</Text>
              <Text style={styles.statPillText}>🎨 +{statBonuses.creativity || 0} CRE</Text>
            </View>
          </View>
        </View>

        {/* SEARCH & CATEGORY FILTERS */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Inventory Vault</Text>

          <View style={styles.searchBarContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search weapons, armor, potions..."
              placeholderTextColor={RPGTheme.colors.textMuted}
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((catKey) => {
              const active = selectedCategory === catKey;
              return (
                <TouchableOpacity
                  key={catKey}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(catKey)}
                  style={[
                    styles.categoryTab,
                    active && styles.activeCategoryTab,
                  ]}
                >
                  <Text style={styles.categoryTabIcon}>
                    {CATEGORY_ICONS[catKey]}
                  </Text>
                  <Text
                    style={[
                      styles.categoryTabText,
                      active && styles.activeCategoryTabText,
                    ]}
                  >
                    {CATEGORY_LABELS[catKey]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* INVENTORY ITEMS GRID */}
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>📦</Text>
            <Text style={styles.emptyStateTitle}>No Items Found</Text>
            <Text style={styles.emptyStateText}>
              Your inventory is empty. Visit the marketplace to earn gear!
            </Text>
          </View>
        ) : (
          <View style={styles.inventoryGrid}>
            {filteredInventory.map((item: any) => {
              const isLocked = item.unlocked === false;
              const equipped = isItemEquipped(item) || item.equipped;
              const rarityColor = isLocked ? "#64748B" : getRarityColor(item.rarity);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedItem(item)}
                  style={[
                    styles.itemCard,
                    { borderColor: rarityColor },
                    isLocked && { opacity: 0.6, backgroundColor: "#1E293B" },
                    equipped && styles.equippedCardHighlight,
                  ]}
                >
                  {equipped && (
                    <View style={styles.equippedBadge}>
                      <Text style={styles.equippedBadgeText}>EQUIPPED</Text>
                    </View>
                  )}

                  {isLocked && (
                    <View style={[styles.equippedBadge, { backgroundColor: "#475569" }]}>
                      <Text style={styles.equippedBadgeText}>🔒 LOCKED</Text>
                    </View>
                  )}

                  <View style={[styles.itemIconBg, { backgroundColor: isLocked ? "rgba(100, 116, 139, 0.2)" : getRarityBg(item.rarity) }]}>
                    <Text style={styles.itemEmoji}>{item.icon}</Text>
                  </View>

                  <Text style={[styles.itemName, isLocked && { color: "#94A3B8" }]} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                    <Text style={styles.rarityText}>{isLocked ? "LOCKED" : item.rarity}</Text>
                  </View>

                  <Text style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, fontWeight: "600" }}>
                    {isLocked ? `🔒 ${item.unlockRequirement}` : `🪙 ${item.value ?? 20}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedItem(null)}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalEmoji}>{selectedItem.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                    <Text style={{ color: getRarityColor(selectedItem.rarity), fontSize: 10, fontWeight: "900" }}>
                      {(selectedItem as any).unlocked === false ? "LOCKED ITEM" : selectedItem.rarity.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedItem(null)}>
                    <Text style={{ color: "#94A3B8", fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDesc}>{selectedItem.description}</Text>

                <View style={styles.modalActionsRow}>
                  {(selectedItem as any).unlocked === false ? (
                    <View style={{ width: "100%", alignItems: "center" }}>
                      <Text style={{ color: "#F59E0B", fontWeight: "700", marginBottom: 8, fontSize: 12 }}>
                        🔒 Requirement: {(selectedItem as any).unlockRequirement || "Reach Milestone"}
                      </Text>
                      <TouchableOpacity
                        disabled={true}
                        style={[styles.modalButton, { backgroundColor: "#475569", width: "100%" }]}
                      >
                        <Text style={styles.modalButtonText}>🔒 Item Locked</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {selectedItem.slot && (
                        isItemEquipped(selectedItem) ? (
                          <TouchableOpacity
                            disabled={updating}
                            onPress={() => handleUnequip(selectedItem.slot!)}
                            style={[styles.modalButton, { backgroundColor: RPGTheme.colors.danger }]}
                          >
                            <Text style={styles.modalButtonText}>Unequip Gear ❌</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            disabled={updating}
                            onPress={() => handleEquip(selectedItem)}
                            style={[styles.modalButton, { backgroundColor: RPGTheme.colors.purplePrimary }]}
                          >
                            <Text style={styles.modalButtonText}>Equip Gear 🛡️</Text>
                          </TouchableOpacity>
                        )
                      )}

                      <TouchableOpacity
                        disabled={updating}
                        onPress={() => handleSell(selectedItem)}
                        style={[styles.modalButton, { backgroundColor: RPGTheme.colors.secondaryCard }]}
                      >
                        <Text style={styles.modalButtonText}>
                          Sell (+{Math.round(selectedItem.value * 0.7)} 🪙)
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const itemCardWidth = (Dimensions.get("window").width - 52) / 2;

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
    color: RPGTheme.colors.purpleSecondary,
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

  // EQUIPMENT CARD
  equipmentCard: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    marginBottom: 24,
  },
  equipmentHeader: {
    marginBottom: 14,
  },
  equipmentTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  equipmentSub: {
    color: RPGTheme.colors.textMuted,
    fontSize: 11,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  slotBox: {
    width: (Dimensions.get("window").width - 72) / 3,
    height: 84,
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  slotItemContent: {
    alignItems: "center",
  },
  slotItemIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  slotItemName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySlotContent: {
    alignItems: "center",
  },
  emptySlotIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  emptySlotLabel: {
    color: RPGTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },
  statsBreakdown: {
    backgroundColor: RPGTheme.colors.secondaryCard,
    borderRadius: 14,
    padding: 12,
  },
  statsBreakdownTitle: {
    color: RPGTheme.colors.purpleSecondary,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },
  statsRowGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statPillText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    backgroundColor: RPGTheme.colors.primaryCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // FILTER SECTION
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: RPGTheme.colors.cardBorder,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: RPGTheme.colors.textPrimary,
    fontSize: 13,
  },
  categoriesScroll: {
    gap: 8,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RPGTheme.colors.primaryCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 6,
  },
  activeCategoryTab: {
    backgroundColor: RPGTheme.colors.purplePrimary,
  },
  categoryTabIcon: {
    fontSize: 14,
  },
  categoryTabText: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  activeCategoryTabText: {
    color: "#FFFFFF",
  },

  // INVENTORY GRID
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemCard: {
    width: itemCardWidth,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    alignItems: "center",
    position: "relative",
  },
  equippedCardHighlight: {
    backgroundColor: RPGTheme.colors.secondaryCard,
  },
  equippedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: RPGTheme.colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equippedBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },
  itemIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemName: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  rarityText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  itemValueText: {
    color: RPGTheme.colors.goldLight,
    fontSize: 11,
    fontWeight: "800",
  },
  emptyStateContainer: {
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
  },
  emptyStateEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyStateTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  emptyStateText: {
    color: RPGTheme.colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: RPGTheme.colors.primaryCard,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: RPGTheme.colors.purplePrimary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  modalEmoji: {
    fontSize: 30,
  },
  modalTitle: {
    color: RPGTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },
  modalDesc: {
    color: RPGTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalActionsRow: {
    gap: 10,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
