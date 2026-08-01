export const getHeroRank = (level: number) => {
    if (level >= 51)
        return {
            name: "Mythic",
            emoji: "🌌",
            color: "#A855F7", // Glossy Purple
        };

    if (level >= 36)
        return {
            name: "Legend",
            emoji: "🐉",
            color: "#D4AF37", // Royal Gold
        };

    if (level >= 21)
        return {
            name: "Champion",
            emoji: "👑",
            color: "#8B5CF6", // Royal Violet
        };

    if (level >= 11)
        return {
            name: "Knight",
            emoji: "🛡️",
            color: "#2563EB", // Royal Blue
        };

    if (level >= 6)
        return {
            name: "Warrior",
            emoji: "⚔️",
            color: "#6366F1", // Glossy Indigo / Blue-Purple
        };

    return {
        name: "Rookie",
        emoji: "🥉",
        color: "#64748B", // Slate Blue
    };
};