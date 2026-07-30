export const getHeroRank = (level: number) => {
    if (level >= 51)
        return {
            name: "Mythic",
            emoji: "🌌",
            color: "#8B5CF6",
        };

    if (level >= 36)
        return {
            name: "Legend",
            emoji: "🐉",
            color: "#F59E0B",
        };

    if (level >= 21)
        return {
            name: "Champion",
            emoji: "👑",
            color: "#EAB308",
        };

    if (level >= 11)
        return {
            name: "Knight",
            emoji: "🛡️",
            color: "#3B82F6",
        };

    if (level >= 6)
        return {
            name: "Warrior",
            emoji: "⚔️",
            color: "#22C55E",
        };

    return {
        name: "Rookie",
        emoji: "🥉",
        color: "#94A3B8",
    };
};