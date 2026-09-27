export type LudoPlayer = "YOU" | "CPU";

export type Token = {
  id: number;
  player: LudoPlayer;
  position: number;
  finished: boolean;
};

export const BOARD_PATH_LENGTH = 52;

export const START_POSITION = {
  YOU: 0,
  CPU: 26,
};

export const SAFE_CELLS = [
  0,
  8,
  13,
  21,
  26,
  34,
  39,
  47,
];

export const createTokens = (player: LudoPlayer): Token[] => {
  return [
    {
      id: 0,
      player,
      position: -1,
      finished: false,
    },
    {
      id: 1,
      player,
      position: -1,
      finished: false,
    },
    {
      id: 2,
      player,
      position: -1,
      finished: false,
    },
    {
      id: 3,
      player,
      position: -1,
      finished: false,
    },
  ];
};

export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

export const canMoveToken = (
  token: Token,
  dice: number
): boolean => {
  if (token.finished) {
    return false;
  }

  // Token is inside home.
  if (token.position === -1) {
    return dice === 6;
  }

  // Simplified finish condition.
  if (token.position + dice >= 51) {
    return true;
  }

  return true;
};

export const moveToken = (
  token: Token,
  dice: number
): Token => {
  // Token comes out of home when 6 is rolled.
  if (token.position === -1) {
    if (dice !== 6) {
      return token;
    }

    return {
      ...token,
      position:
        token.player === "YOU"
          ? START_POSITION.YOU
          : START_POSITION.CPU,
    };
  }

  const newPosition = token.position + dice;

  if (newPosition >= 51) {
    return {
      ...token,
      position: 51,
      finished: true,
    };
  }

  return {
    ...token,
    position: newPosition,
  };
};

export const hasWon = (tokens: Token[]): boolean => {
  return tokens.every((token) => token.finished);
};

export const getAbsolutePosition = (
  token: Token
): number => {
  if (token.position < 0) {
    return -1;
  }

  return (
    (START_POSITION[token.player] + token.position) %
    BOARD_PATH_LENGTH
  );
};

export const isSafeCell = (
  absolutePosition: number
): boolean => {
  return SAFE_CELLS.includes(absolutePosition);
};