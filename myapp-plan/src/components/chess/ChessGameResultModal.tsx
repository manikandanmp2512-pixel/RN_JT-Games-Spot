import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PlayerChessStats } from "@/utils/chessGameStats";

type RatingChangeInfo = {
  previousRating: number;
  change: number;
  newRating: number;
};

type ChessGameResultModalProps = {
  playerRating?: RatingChangeInfo | null;
  opponentRating?: RatingChangeInfo | null;
  visible: boolean;

  winner: "white" | "black" | "draw";
  resultMessage?: string;

  playerMaterialPoints?: number;
  opponentMaterialPoints?: number;
  playerCapturedPoints?: number;
  opponentCapturedPoints?: number;
  playerScore?: number;
  opponentScore?: number;

  myColor: "white" | "black";
  playerName: string;
  opponentName: string;

  playerStats: PlayerChessStats;
  opponentStats: PlayerChessStats;

  playerAvatar?: string;
  opponentAvatar?: string;
  playerFlag?: string;
  opponentFlag?: string;

  points?: number;
  onlineWinCoins?: number;
  dailyGameCoins?: number;

  onNewGame: () => void;
  onClose: () => void;
  onReviewGame: () => void;
  onSaveGame?: () => void;
};

const safeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export default function ChessGameResultModal({
  visible,
  winner,
  resultMessage = "Game finished",
  playerMaterialPoints = 0,
  opponentMaterialPoints = 0,
  playerCapturedPoints = 0,
  opponentCapturedPoints = 0,
  playerScore = 0,
  opponentScore = 0,
  myColor,
  playerName,
  opponentName,
  playerRating,
  opponentRating,
  playerStats,
  opponentStats,
  playerAvatar = "🦁",
  opponentAvatar = "👤",
  playerFlag = "🇮🇳",
  opponentFlag = "🏳️",
  points,
  onlineWinCoins = 5,
  dailyGameCoins = 50,
  onNewGame,
  onClose,
  onReviewGame,
  onSaveGame,
}: ChessGameResultModalProps) {
  const [saveSelected, setSaveSelected] = useState(false);

  useEffect(() => {
    if (visible) setSaveSelected(false);
  }, [visible]);

  const isDraw = winner === "draw";
  const didWin = !isDraw && winner === myColor;
  const didLose = !isDraw && !didWin;

  const title = isDraw
    ? "Game Drawn"
    : didWin
      ? "Victory!"
      : "Game Lost";

  const normalizedResult = resultMessage.toLowerCase();

  const reasonLabel = normalizedResult.includes("resign")
    ? normalizedResult.includes("you resign") ||
      normalizedResult.includes("you resigned")
      ? "You resigned — opponent wins"
      : "Opponent resigned — you win"
    : normalizedResult.includes("timeout") ||
        normalizedResult.includes("time out")
      ? "Time expired"
      : normalizedResult.includes("disconnect")
        ? "Opponent disconnected"
        : normalizedResult.includes("checkmate")
          ? "Checkmate"
          : isDraw
            ? "Neither player won"
            : resultMessage;

  const displayedPoints =
    points !== undefined ? points : isDraw ? 0 : didWin ? 3 : -3;

  const myStats = playerStats;
  const theirStats = opponentStats;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.kicker}>JAYTECH CHESS • GAME RESULT</Text>

            <Text
              style={[
                styles.title,
                isDraw ? styles.drawText : didWin ? styles.winText : styles.lossText,
              ]}
            >
              {title}
            </Text>

            <Text style={styles.subtitle}>{reasonLabel}</Text>

            <View style={styles.playersRow}>
              <PlayerSummary
                name={playerName || "You"}
                avatar={playerAvatar}
                flag={playerFlag}
                outcome={isDraw ? "DRAW" : didWin ? "WINNER" : "LOSER"}
                outcomeStyle={isDraw ? styles.drawText : didWin ? styles.winText : styles.lossText}
              />

              <View style={styles.pointsBox}>
                <Text
                  style={[
                    styles.pointsValue,
                    displayedPoints >= 0 ? styles.winText : styles.lossText,
                  ]}
                >
                  {displayedPoints > 0 ? "+" : ""}
                  {safeNumber(displayedPoints).toFixed(1)}
                </Text>
                <Text style={styles.pointsCaption}>result points</Text>
              </View>

              <PlayerSummary
                name={opponentName || "Opponent"}
                avatar={opponentAvatar}
                flag={opponentFlag}
                outcome={isDraw ? "DRAW" : didWin ? "LOSER" : "WINNER"}
                outcomeStyle={isDraw ? styles.drawText : didWin ? styles.lossText : styles.winText}
              />
            </View>

            <Text style={styles.sectionTitle}>Rating changes</Text>

            <View style={styles.ratingRow}>
              <RatingCard
                name={playerName || "You"}
                rating={playerRating}
              />
              <RatingCard
                name={opponentName || "Opponent"}
                rating={opponentRating}
              />
            </View>

            <Text style={styles.sectionTitle}>Game statistics</Text>

            <View style={styles.statsContainer}>
              <StatRow
                left={safeNumber(myStats?.accuracy)}
                label="Accuracy"
                right={safeNumber(theirStats?.accuracy)}
                suffix="%"
              />
              <StatRow
                left={safeNumber(myStats?.missedWins)}
                label="Missed wins"
                right={safeNumber(theirStats?.missedWins)}
              />
              <StatRow
                left={safeNumber(myStats?.blunders)}
                label="Blunders"
                right={safeNumber(theirStats?.blunders)}
              />
              <StatRow
                left={safeNumber(myStats?.checks)}
                label="Checks"
                right={safeNumber(theirStats?.checks)}
              />
              <StatRow
                left={safeNumber(myStats?.captures)}
                label="Captures"
                right={safeNumber(theirStats?.captures)}
              />
              <StatRow
                left={safeNumber(playerScore)}
                label="Capture score"
                right={safeNumber(opponentScore)}
              />
              <StatRow
                left={safeNumber(playerCapturedPoints)}
                label="Captured-piece points"
                right={safeNumber(opponentCapturedPoints)}
              />
              <StatRow
                left={safeNumber(playerMaterialPoints)}
                label="Material remaining"
                right={safeNumber(opponentMaterialPoints)}
              />
              <StatRow
                left={safeNumber(myStats?.pieceValue)}
                label="Piece value"
                right={safeNumber(theirStats?.pieceValue)}
              />
            </View>

            {!isDraw && didWin && (
              <View style={styles.rewards}>
                <Text style={styles.rewardsTitle}>Game rewards</Text>
                <Text style={styles.rewardText}>
                  Online win: <Text style={styles.coinText}>🪙 {onlineWinCoins}</Text>
                </Text>
                <Text style={styles.rewardText}>
                  Daily game: <Text style={styles.coinText}>🪙 {dailyGameCoins}</Text>
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: saveSelected }}
              style={styles.saveRow}
              onPress={() => {
                const next = !saveSelected;
                setSaveSelected(next);
                if (next) onSaveGame?.();
              }}
            >
              <View style={[styles.checkbox, saveSelected && styles.checkboxChecked]}>
                {saveSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.saveText}>Save game</Text>
            </Pressable>

            <Pressable
              style={styles.newGameButton}
              onPress={onNewGame}
            >
              <Text style={styles.newGameText}>New Game</Text>
            </Pressable>

            <View style={styles.bottomButtons}>
              {/* <Pressable style={styles.bottomButton} onPress={onClose}>
                <Text style={styles.bottomButtonText}>Close</Text>
              </Pressable> */}
              <Pressable style={styles.bottomButton} onPress={() => router.replace("/chess")}>
                  <Text style={styles.bottomButtonText}>Close</Text>
                </Pressable>

              <Pressable style={styles.bottomButton} onPress={onReviewGame}>
                <Text style={styles.bottomButtonText}>Review Game</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PlayerSummary({
  name,
  avatar,
  flag,
  outcome,
  outcomeStyle,
}: {
  name: string;
  avatar: string;
  flag: string;
  outcome: string;
  outcomeStyle: object;
}) {
  return (
    <View style={styles.playerSide}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatar}>{avatar}</Text>
        <Text style={styles.flag}>{flag}</Text>
      </View>

      <Text style={styles.playerName} numberOfLines={2}>
        {name}
      </Text>

      <Text style={[styles.outcomeLabel, outcomeStyle]}>
        {outcome}
      </Text>
    </View>
  );
}

function RatingCard({
  name,
  rating,
}: {
  name: string;
  rating?: RatingChangeInfo | null;
}) {
  const change = rating?.change ?? 0;

  return (
    <View style={styles.ratingCard}>
      <Text style={styles.ratingLabel} numberOfLines={1}>
        {name}
      </Text>

      <Text style={styles.ratingValue}>
        {rating ? rating.newRating : "—"}
      </Text>

      {rating ? (
        <>
          <Text
            style={[
              styles.ratingChange,
              change > 0 ? styles.winText : change < 0 ? styles.lossText : styles.drawText,
            ]}
          >
            {change > 0 ? "+" : ""}
            {change}
          </Text>

          <Text style={styles.ratingPrevious}>
            Previous: {rating.previousRating}
          </Text>
        </>
      ) : (
        <Text style={styles.ratingPrevious}>Rating unavailable</Text>
      )}
    </View>
  );
}

function StatRow({
  left,
  label,
  right,
  suffix = "",
}: {
  left: number;
  label: string;
  right: number;
  suffix?: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statNumber}>
        {left}{suffix}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statNumber}>
        {right}{suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "95%",
    borderRadius: 24,
    backgroundColor: "#073B50",
    borderWidth: 1,
    borderColor: "#278AA8",
    overflow: "hidden",
  },
  scrollContent: {
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 18,
  },
  kicker: {
    color: "#A6DDEB",
    textAlign: "center",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  title: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 7,
  },
  winText: { color: "#7CFF9B" },
  lossText: { color: "#FF9696" },
  drawText: { color: "#FFE082" },
  subtitle: {
    color: "#E1F4F8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 3,
  },
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 19,
  },
  playerSide: {
    width: "31%",
    alignItems: "center",
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F3FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatar: { fontSize: 39 },
  flag: {
    position: "absolute",
    right: -3,
    bottom: -3,
    fontSize: 19,
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 7,
    minHeight: 32,
  },
  outcomeLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 3,
  },
  pointsBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsValue: {
    fontSize: 26,
    fontWeight: "900",
  },
  pointsCaption: {
    color: "#D2EAF0",
    fontSize: 10,
    textAlign: "center",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 10,
  },
  ratingCard: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: "#052D3F",
    borderWidth: 1,
    borderColor: "#246B81",
  },
  ratingLabel: {
    color: "#D5EFF5",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  ratingValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 3,
  },
  ratingChange: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 1,
  },
  ratingPrevious: {
    color: "#B5D4DE",
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },
  statsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#286478",
  },
  statRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#205468",
  },
  statNumber: {
    width: "27%",
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
  },
  statLabel: {
    flex: 1,
    color: "#D7EDF2",
    textAlign: "center",
    fontSize: 12,
  },
  rewards: {
    alignItems: "center",
    padding: 12,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#052D3F",
  },
  rewardsTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 5,
  },
  rewardText: {
    color: "#D7EDF2",
    fontSize: 13,
    marginTop: 2,
  },
  coinText: {
    color: "#FFD34F",
    fontWeight: "900",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    minHeight: 35,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#0D9C6A",
    borderColor: "#70F4B5",
  },
  checkmark: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 9,
  },
  newGameButton: {
    height: 53,
    borderRadius: 13,
    backgroundColor: "#FF8500",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    borderBottomWidth: 3,
    borderBottomColor: "#C85C00",
  },
  newGameText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  bottomButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 11,
  },
  bottomButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 12,
    backgroundColor: "#0A536C",
    borderWidth: 1,
    borderColor: "#1C718A",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});