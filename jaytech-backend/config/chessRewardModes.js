const CHESS_REWARD_MODES = {
  free: {
    id: "free",
    name: "Free",
    entryCoins: 0,
    winnerCoins: 10,
    loserCoins: 2,
    platformCoins: 0,
  },

  bronze: {
    id: "bronze",
    name: "Bronze",
    entryCoins: 100,
    winnerCoins: 150,
    loserCoins: 25,
    platformCoins: 25,
  },

  silver: {
    id: "silver",
    name: "Silver",
    entryCoins: 200,
    winnerCoins: 300,
    loserCoins: 50,
    platformCoins: 50,
  },

  gold: {
    id: "gold",
    name: "Gold",
    entryCoins: 300,
    winnerCoins: 400,
    loserCoins: 100,
    platformCoins: 100,
  },

  platinum: {
    id: "platinum",
    name: "Platinum",
    entryCoins: 400,
    winnerCoins: 500,
    loserCoins: 200,
    platformCoins: 100,
  },

  diamond: {
    id: "diamond",
    name: "Diamond",
    entryCoins: 500,
    winnerCoins: 600,
    loserCoins: 300,
    platformCoins: 100,
  },
};

module.exports = CHESS_REWARD_MODES;