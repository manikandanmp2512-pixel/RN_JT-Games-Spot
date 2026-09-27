export type Player = "YOU" | "CPU";

export type Coin = {
  id: number;
  x: number;
  y: number;
  color: "white" | "black" | "queen";
  pocketed: boolean;
};

export type Striker = {
  x: number;
  y: number;
};

export type CarromState = {
  coins: Coin[];
  striker: Striker;
  currentPlayer: Player;
  yourScore: number;
  cpuScore: number;
  queenPocketed: boolean;
};

export const BOARD_SIZE = 320;
export const POCKET_SIZE = 42;

export const INITIAL_COINS: Coin[] = [
  {
    id: 1,
    x: 160,
    y: 160,
    color: "queen",
    pocketed: false,
  },

  {
    id: 2,
    x: 145,
    y: 160,
    color: "white",
    pocketed: false,
  },
  {
    id: 3,
    x: 175,
    y: 160,
    color: "white",
    pocketed: false,
  },
  {
    id: 4,
    x: 160,
    y: 145,
    color: "white",
    pocketed: false,
  },
  {
    id: 5,
    x: 160,
    y: 175,
    color: "white",
    pocketed: false,
  },

  {
    id: 6,
    x: 145,
    y: 145,
    color: "black",
    pocketed: false,
  },
  {
    id: 7,
    x: 175,
    y: 145,
    color: "black",
    pocketed: false,
  },
  {
    id: 8,
    x: 145,
    y: 175,
    color: "black",
    pocketed: false,
  },
  {
    id: 9,
    x: 175,
    y: 175,
    color: "black",
    pocketed: false,
  },
];

export const createInitialState = (): CarromState => ({
  coins: INITIAL_COINS,
  striker: {
    x: 160,
    y: 285,
  },
  currentPlayer: "YOU",
  yourScore: 0,
  cpuScore: 0,
  queenPocketed: false,
});

export const getPocketPositions = () => [
  {
    x: 0,
    y: 0,
  },
  {
    x: BOARD_SIZE,
    y: 0,
  },
  {
    x: 0,
    y: BOARD_SIZE,
  },
  {
    x: BOARD_SIZE,
    y: BOARD_SIZE,
  },
];

export const isInsidePocket = (
  x: number,
  y: number
) => {
  const pockets = getPocketPositions();

  return pockets.some((pocket) => {
    const distance = Math.sqrt(
      Math.pow(x - pocket.x, 2) +
        Math.pow(y - pocket.y, 2)
    );

    return distance < POCKET_SIZE;
  });
};

export const calculateCoinValue = (
  color: Coin["color"]
) => {
  if (color === "queen") {
    return 3;
  }

  return 1;
};