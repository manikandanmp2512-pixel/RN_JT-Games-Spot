import { AudioPlayer, createAudioPlayer } from "expo-audio";

const MOVE_SOUND = require("@/assets/sounds/chess_move.wav");

let movePlayer: AudioPlayer | null = null;

export const playChessMoveSound = async (
  enabled: boolean = true
): Promise<void> => {
  if (!enabled) {
    return;
  }

  try {
    if (!movePlayer) {
      movePlayer = createAudioPlayer(MOVE_SOUND);
    }

    movePlayer.seekTo(0);
    movePlayer.play();
  } catch (error) {
    console.log("⚠️ Chess move sound error:", error);
  }
};

export const releaseChessSound = (): void => {
  try {
    if (movePlayer) {
      movePlayer.remove();
      movePlayer = null;
    }
  } catch (error) {
    console.log("⚠️ Chess sound release error:", error);
    movePlayer = null;
  }
};