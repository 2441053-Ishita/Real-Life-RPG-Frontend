import { InventoryItem } from "./inventory";

export type DialogueSpeaker = "Village Elder" | "Merchant" | "Blacksmith" | "Wizard" | "Boss" | "Hero";

export type StoryDialogue = {
  speaker: DialogueSpeaker;
  avatar: string;
  text: string;
};

export type ChapterBoss = {
  id: string;
  name: string;
  type: "mini" | "final";
  hp: number;
  maxHp: number;
  emoji: string;
  rewardXP: number;
  rewardCoins: number;
  description: string;
  preBattleDialog: StoryDialogue[];
  victoryDialog: StoryDialogue[];
};

export type ChapterQuest = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xp: number;
  category: string;
};

export type ChapterReward = {
  xp: number;
  coins: number;
  title: string;
  item: InventoryItem;
};

export type Chapter = {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  story: string;
  emoji: string;
  bgGradient: string;
  accentColor: string;
  npcIntro: StoryDialogue[];
  quests: ChapterQuest[];
  miniBoss: ChapterBoss;
  finalBoss: ChapterBoss;
  reward: ChapterReward;
};

export const CHAPTERS_DATA: Chapter[] = [
  {
    id: 1,
    name: "Beginner's Forest",
    subtitle: "The Journey Begins",
    description: "Venturing into ancient woods teeming with novice monsters and quiet wisdom.",
    story: "The kingdom has fallen into darkness. Your journey begins in the abandoned forest where strange void corruption has appeared. Complete daily habits to gain strength and defeat the Forest Guardians.",
    emoji: "🌲",
    bgGradient: "#166534",
    accentColor: "#22C55E",
    npcIntro: [
      { speaker: "Village Elder", avatar: "👴", text: "Brave adventurer, darkness has seized our woods. Complete your daily habits to sharpen your resolve!" },
      { speaker: "Wizard", avatar: "🧙‍♂️", text: "The ancient leylines grow corrupt. Only your continuous discipline can restore light to this land." }
    ],
    quests: [
      { id: "ch1-q1", title: "Morning Stretch & Warmup", description: "Do 15 mins of light exercises", emoji: "🧘", xp: 20, category: "Fitness" },
      { id: "ch1-q2", title: "Gather Forest Herbs", description: "Drink 2L of fresh water", emoji: "💧", xp: 15, category: "Health" },
      { id: "ch1-q3", title: "Read Ancient Tome", description: "Read 10 pages of a book", emoji: "📖", xp: 25, category: "Study" },
    ],
    miniBoss: {
      id: "ch1-mini",
      name: "Forest Goblin",
      type: "mini",
      hp: 100,
      maxHp: 100,
      emoji: "👺",
      rewardXP: 50,
      rewardCoins: 30,
      description: "A sneaky creature guarding the forest crossroad.",
      preBattleDialog: [
        { speaker: "Merchant", avatar: "👳", text: "Watch out! That goblin stole my caravan supplies at the crossroad!" },
        { speaker: "Boss", avatar: "👺", text: "Grah! You shall not pass through this woodland realm alive, hero!" }
      ],
      victoryDialog: [
        { speaker: "Hero", avatar: "🧙", text: "The Forest Goblin is vanquished. The crossroad is safe again." },
        { speaker: "Merchant", avatar: "👳", text: "Thank you, champion! Take these coins and proceed deeper into the woods." }
      ]
    },
    finalBoss: {
      id: "ch1-final",
      name: "Ancient Treant",
      type: "final",
      hp: 250,
      maxHp: 250,
      emoji: "🪵",
      rewardXP: 150,
      rewardCoins: 100,
      description: "A colossal living tree awakening from centuries of slumber.",
      preBattleDialog: [
        { speaker: "Village Elder", avatar: "👴", text: "The Ancient Treant has been corrupted by dark magic. Strike true with your habit stats!" },
        { speaker: "Boss", avatar: "🪵", text: "WHO DISTURBS MY ETERNAL SLUMBER... DIE MORTAL!" }
      ],
      victoryDialog: [
        { speaker: "Wizard", avatar: "🧙‍♂️", text: "Incredible power! The forest corruption is cleansed! Chapter 1 is victorious!" },
        { speaker: "Village Elder", avatar: "👴", text: "You have earned the title of Forest Ranger! Proceed to Goblin Valley!" }
      ]
    },
    reward: {
      xp: 200,
      coins: 150,
      title: "Forest Ranger",
      item: {
        id: "forest-bow",
        name: "Verdant Ranger Bow",
        description: "A bow carved from ancient forest wood.",
        category: "weapons",
        slot: "weapon",
        rarity: "Rare",
        icon: "🏹",
        value: 200,
        statBonus: { discipline: 15, strength: 10 },
      },
    },
  },
  {
    id: 2,
    name: "Goblin Valley",
    subtitle: "Territory of the Horde",
    description: "Traverse jagged canyons ruled by relentless goblin war clans.",
    story: "With the forest corruption cleansed, you arrive at the jagged pass of Goblin Valley. The horde has fortified war camps. Prove your endurance through daily work to breach their citadel.",
    emoji: "🏺",
    bgGradient: "#9A3412",
    accentColor: "#F97316",
    npcIntro: [
      { speaker: "Blacksmith", avatar: "⚒️", text: "The canyons are filled with goblin steel. Keep your habit momentum high if you wish to survive!" },
      { speaker: "Merchant", avatar: "👳", text: "Trade routes are blocked. Clear out their outposts and I will grant rare equipment bargains!" }
    ],
    quests: [
      { id: "ch2-q1", title: "Fortify Camp Defense", description: "Clean workspace for 20 mins", emoji: "🧹", xp: 25, category: "Work" },
      { id: "ch2-q2", title: "Scout Enemy Outposts", description: "Complete 1 hour of deep study", emoji: "🧠", xp: 35, category: "Study" },
      { id: "ch2-q3", title: "Endurance March", description: "Walk or run 3,000 steps", emoji: "🏃", xp: 30, category: "Fitness" },
    ],
    miniBoss: {
      id: "ch2-mini",
      name: "Goblin Warlord",
      type: "mini",
      hp: 200,
      maxHp: 200,
      emoji: "👹",
      rewardXP: 80,
      rewardCoins: 60,
      description: "A battle-hardened warlord wielding dual scimitars.",
      preBattleDialog: [
        { speaker: "Blacksmith", avatar: "⚒️", text: "That warlord wears heavy iron plate armor! Focus your strength!" },
        { speaker: "Boss", avatar: "👹", text: "Weak human! You cannot defeat the Goblin Horde!" }
      ],
      victoryDialog: [
        { speaker: "Hero", avatar: "🧙", text: "The Warlord falls! The horde's front lines have crumbled!" }
      ]
    },
    finalBoss: {
      id: "ch2-final",
      name: "Goblin King",
      type: "final",
      hp: 400,
      maxHp: 400,
      emoji: "👑",
      rewardXP: 250,
      rewardCoins: 200,
      description: "The ruthless ruler of the canyon horde.",
      preBattleDialog: [
        { speaker: "Wizard", avatar: "🧙‍♂️", text: "The Goblin King channels dark void runes! Stand firm, warrior!" },
        { speaker: "Boss", avatar: "👑", text: "KNEEL BEFORE THE GOBLIN KING!" }
      ],
      victoryDialog: [
        { speaker: "Blacksmith", avatar: "⚒️", text: "Victory! You shattered his crown! Goblin Valley is liberated!" }
      ]
    },
    reward: {
      xp: 350,
      coins: 250,
      title: "Goblin Slayer",
      item: {
        id: "warlord-axe",
        name: "Warlord's Battleaxe",
        description: "Forged in the fires of Goblin Valley.",
        category: "weapons",
        slot: "weapon",
        rarity: "Epic",
        icon: "🪓",
        value: 400,
        statBonus: { strength: 25, attack: 35 },
      },
    },
  },
  {
    id: 3,
    name: "Dark Cave",
    subtitle: "Echoes of the Abyss",
    description: "Descend into pitch-black caverns filled with shadowy monstrosities.",
    story: "You descend into the subterranean underworld where sunlight cannot reach. Pitch-black shadows test your mental focus and spiritual tranquility.",
    emoji: "🦇",
    bgGradient: "#3B0764",
    accentColor: "#A855F7",
    npcIntro: [
      { speaker: "Wizard", avatar: "🧙‍♂️", text: "In these cavern depths, only mental clarity and daily meditation can pierce the darkness." }
    ],
    quests: [
      { id: "ch3-q1", title: "Light the Torch", description: "Meditate for 15 minutes", emoji: "🧘", xp: 30, category: "Meditation" },
      { id: "ch3-q2", title: "Decode Cave Glyphs", description: "Solve a puzzle or code 30 mins", emoji: "💻", xp: 40, category: "Coding" },
      { id: "ch3-q3", title: "Night Watch", description: "Sleep by 11 PM tonight", emoji: "🌙", xp: 35, category: "Health" },
    ],
    miniBoss: {
      id: "ch3-mini",
      name: "Shadow Spider",
      type: "mini",
      hp: 350,
      maxHp: 350,
      emoji: "🕷️",
      rewardXP: 120,
      rewardCoins: 90,
      description: "A terrifying giant arachnid spinning venomous webs.",
      preBattleDialog: [
        { speaker: "Boss", avatar: "🕷️", text: "Sssss... more prey stumbles into my dark web..." }
      ],
      victoryDialog: [
        { speaker: "Hero", avatar: "🧙", text: "The webs melt away in the light of discipline!" }
      ]
    },
    finalBoss: {
      id: "ch3-final",
      name: "Cave Drake",
      type: "final",
      hp: 600,
      maxHp: 600,
      emoji: "🐲",
      rewardXP: 400,
      rewardCoins: 300,
      description: "A wingless dragon slumbering in the abyss.",
      preBattleDialog: [
        { speaker: "Boss", avatar: "🐲", text: "ROAAAR! MY SHADOW FIRE SHALL CONSUME YOUR SOUL!" }
      ],
      victoryDialog: [
        { speaker: "Wizard", avatar: "🧙‍♂️", text: "The abyss is conquered! The Cloak of the Abyss is yours!" }
      ]
    },
    reward: {
      xp: 500,
      coins: 400,
      title: "Shadow Conqueror",
      item: {
        id: "shadow-veil",
        name: "Cloak of the Abyss",
        description: "Woven from darkness, granting immense defense.",
        category: "armor",
        slot: "armor",
        rarity: "Epic",
        icon: "🥷",
        value: 550,
        statBonus: { defense: 40, wisdom: 20, vitality: 15 },
      },
    },
  },
  {
    id: 4,
    name: "Frozen Kingdom",
    subtitle: "Realm of Eternal Ice",
    description: "Brave blistering blizzards and frostbound castles.",
    story: "Crossing into the glacial peaks, you enter the Frozen Kingdom. Sub-zero temperatures test your physical endurance and inner resolve.",
    emoji: "❄️",
    bgGradient: "#1E3A8A",
    accentColor: "#38BDF8",
    npcIntro: [
      { speaker: "Village Elder", avatar: "👴", text: "The cold freezes weak wills! Maintain your habits every day to keep the warm flame of victory alive!" }
    ],
    quests: [
      { id: "ch4-q1", title: "Cold Water Bath", description: "Take a cold shower / splash water", emoji: "🚿", xp: 35, category: "Health" },
      { id: "ch4-q2", title: "Frostbite Training", description: "Complete 45 mins workout", emoji: "🏋️", xp: 50, category: "Fitness" },
      { id: "ch4-q3", title: "Winter Study", description: "Focus without distractions for 2 hours", emoji: "🧠", xp: 45, category: "Study" },
    ],
    miniBoss: {
      id: "ch4-mini",
      name: "Frost Sentinel",
      type: "mini",
      hp: 500,
      maxHp: 500,
      emoji: "🧊",
      rewardXP: 180,
      rewardCoins: 150,
      description: "An armored icy knight guarding the glacial citadel.",
      preBattleDialog: [
        { speaker: "Boss", avatar: "🧊", text: "HALT MORTAL! NONE SHALL ENTER THE FROZEN CITADEL!" }
      ],
      victoryDialog: [
        { speaker: "Hero", avatar: "🧙", text: "The Glacial Sentinel is shattered into frost shards!" }
      ]
    },
    finalBoss: {
      id: "ch4-final",
      name: "Ice Dragon",
      type: "final",
      hp: 850,
      maxHp: 850,
      emoji: "🐉",
      rewardXP: 600,
      rewardCoins: 500,
      description: "A legendary wyrm breathing sub-zero frost.",
      preBattleDialog: [
        { speaker: "Boss", avatar: "🐉", text: "SKREEECH! FEEL THE FREEZING WRATH OF ETERNAL WINTER!" }
      ],
      victoryDialog: [
        { speaker: "Village Elder", avatar: "👴", text: "The Ice Dragon has fallen! You are the true Frost Warden!" }
      ]
    },
    reward: {
      xp: 750,
      coins: 600,
      title: "Frost Warden",
      item: {
        id: "frost-shield",
        name: "Glacial Aegis Shield",
        description: "Infused with eternal frost energy.",
        category: "shields",
        slot: "shield",
        rarity: "Legendary",
        icon: "🛡️",
        value: 800,
        statBonus: { defense: 50, vitality: 30, discipline: 20 },
      },
    },
  },
  {
    id: 5,
    name: "Dragon Mountain",
    subtitle: "The Ultimate Summit",
    description: "Ascend the volcanic peak to challenge the apex dragon lord.",
    story: "You have reached the final volcanic peak. The source of all void corruption resides inside the magma caldera. Face the Crimson Archdragon and claim supreme victory!",
    emoji: "🌋",
    bgGradient: "#831843",
    accentColor: "#EF4444",
    npcIntro: [
      { speaker: "Wizard", avatar: "🧙‍♂️", text: "This is the final battle for the entire realm! Everything you have strived for culminates now!" }
    ],
    quests: [
      { id: "ch5-q1", title: "Volcanic Sprint", description: "High intensity workout for 30 mins", emoji: "🔥", xp: 60, category: "Fitness" },
      { id: "ch5-q2", title: "Mastery Craft", description: "Work on a creative / coding project 1 hour", emoji: "🎨", xp: 60, category: "Creative" },
      { id: "ch5-q3", title: "Final Reflection", description: "Journal and plan goals for the future", emoji: "✍️", xp: 50, category: "Wisdom" },
    ],
    miniBoss: {
      id: "ch5-mini",
      name: "Fire Elemental",
      type: "mini",
      hp: 750,
      maxHp: 750,
      emoji: "🔥",
      rewardXP: 250,
      rewardCoins: 200,
      description: "A living flame born from the mountain's magma core.",
      preBattleDialog: [
        { speaker: "Boss", avatar: "🔥", text: "BURN! ALL SHALL BE CONSUMED IN MAGMA!" }
      ],
      victoryDialog: [
        { speaker: "Hero", avatar: "🧙", text: "The magma elemental fades to embers!" }
      ]
    },
    finalBoss: {
      id: "ch5-final",
      name: "Crimson Archdragon",
      type: "final",
      hp: 1200,
      maxHp: 1200,
      emoji: "🐲",
      rewardXP: 1000,
      rewardCoins: 800,
      description: "The supreme dragon overlord of the entire realm.",
      preBattleDialog: [
        { speaker: "Boss", avatar: "🐲", text: "INSIGNIFICANT INSECT! I AM THE OVERLORD OF REALMS!" }
      ],
      victoryDialog: [
        { speaker: "Wizard", avatar: "🧙‍♂️", text: "THE ARCHDRAGON IS SLAIN! THE REALM IS SAVED! YOU ARE THE DRAGON SOVEREIGN!" }
      ]
    },
    reward: {
      xp: 1200,
      coins: 1000,
      title: "Dragon Sovereign",
      item: {
        id: "dragon-crown",
        name: "Crown of the Archdragon",
        description: "The supreme relic of the Dragon Mountain overlord.",
        category: "special",
        slot: "accessory",
        rarity: "Mythic",
        icon: "👑",
        value: 1500,
        statBonus: { strength: 30, intelligence: 30, discipline: 30, wisdom: 30, vitality: 30, creativity: 30 },
      },
    },
  },
];

export function getChapterProgress(
  chapter: Chapter,
  completedQuests: string[],
  bossesDefeated: Record<string, boolean>
) {
  const questCount = chapter.quests.length;
  const completedQuestCount = chapter.quests.filter((q) =>
    completedQuests.includes(q.id)
  ).length;

  const miniDefeated = !!bossesDefeated[chapter.miniBoss.id];
  const finalDefeated = !!bossesDefeated[chapter.finalBoss.id];

  const totalSteps = questCount + 2;
  let completedSteps = completedQuestCount;
  if (miniDefeated) completedSteps += 1;
  if (finalDefeated) completedSteps += 1;

  const percent = Math.min(100, Math.round((completedSteps / totalSteps) * 100));

  return {
    questCount,
    completedQuestCount,
    miniDefeated,
    finalDefeated,
    totalSteps,
    completedSteps,
    percent,
    isChapterComplete: completedSteps === totalSteps,
  };
}
