// Configuración de festividades y sus temáticas
module.exports = {
  Christmas: {
    dates: { month: 12, day: 25 },
    range: 15,
    theme: {
      emoji: "🎄",
      color: 0xFF0000,
    },
  },
  NewYear: {
    dates: { month: 1, day: 1 },
    range: 7,
    theme: {
      emoji: "🎉",
      color: 0xFFD700,
    },
  },
  Halloween: {
    dates: { month: 10, day: 31 },
    range: 7,
    theme: {
      emoji: "🎃",
      color: 0xFF6600,
    },
  },
  ValentinesDay: {
    dates: { month: 2, day: 14 },
    range: 3,
    theme: {
      emoji: "💕",
      color: 0xFF1493,
    },
  },
  EasterDay: {
    dates: { month: 4, day: 9 },
    range: 7,
    theme: {
      emoji: "🐰",
      color: 0x87CEEB,
    },
  },
  PrideMonth: {
    dates: { month: 6, day: 1 },
    range: 30,
    theme: {
      emoji: "🌈",
      color: 0xFF0000,
    },
  },
};
