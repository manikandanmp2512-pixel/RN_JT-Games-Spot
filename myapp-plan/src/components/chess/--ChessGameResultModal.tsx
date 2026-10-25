import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PlayerChessStats } from "@/utils/chessGameStats";

type RatingChangeInfo = { previousRating: number; change: number; newRating: number };
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

export default function ChessGameResultModal({
  visible, winner, resultMessage = "Game finished", playerMaterialPoints = 0,
  opponentMaterialPoints = 0, playerCapturedPoints = 0, opponentCapturedPoints = 0,
  playerScore = 40, opponentScore = 40, myColor, playerName, opponentName,
  playerRating, opponentRating, playerStats, opponentStats, playerAvatar = "🦁",
  opponentAvatar = "👤", playerFlag = "🇮🇳", opponentFlag = "🏳️", points,
  onlineWinCoins = 5, dailyGameCoins = 50, onNewGame, onClose, onReviewGame, onSaveGame,
}: ChessGameResultModalProps) {
  const [saveSelected, setSaveSelected] = useState(false);
  const isDraw = winner === "draw";
  const didWin = !isDraw && winner === myColor;
  const safePlayerName = playerName?.trim() || "You";
  const safeOpponentName = opponentName?.trim() || "Opponent";
  const title = isDraw ? "Draw!" : didWin ? "You won!" : "You lost!";
  const normalizedResult = resultMessage.toLowerCase();
  const subtitle = isDraw ? "Game drawn — both players draw"
    : normalizedResult.includes("resign")
      ? normalizedResult.includes("you resign") || normalizedResult.includes("you resigned") ? "You resigned — you lose, opponent wins" : "Opponent resigned — you win"
      : normalizedResult.includes("timeout") || normalizedResult.includes("time out") ? "Time expired"
      : normalizedResult.includes("disconnect") ? "Opponent disconnected"
      : normalizedResult.includes("checkmate") ? "Checkmate" : "Game finished";
  const displayedPoints = points !== undefined ? points : isDraw ? 0 : didWin ? 3 : -3;

  useEffect(() => {
    if (visible) setSaveSelected(false);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.playersRow}>
            <View style={styles.playerSide}>
              <View style={styles.avatarCircle}><Text style={styles.avatar}>{playerAvatar}</Text><Text style={styles.flag}>{playerFlag}</Text></View>
              <Text style={styles.playerName} numberOfLines={1}>{safePlayerName}</Text>
              <Text style={[styles.outcomeLabel, isDraw ? styles.drawLabel : didWin ? styles.winLabel : styles.lossLabel]}>{isDraw ? "DRAW" : didWin ? "WINNER" : "LOSER"}</Text>
            </View>
            <View style={styles.pointsBox}>
              <Text style={[styles.points, displayedPoints >= 0 ? styles.pointsPositive : styles.pointsNegative]}>{displayedPoints >= 0 ? "+" : ""}{displayedPoints.toFixed(1)}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </View>
            <View style={styles.playerSide}>
              <View style={styles.avatarCircle}><Text style={styles.avatar}>{opponentAvatar}</Text><Text style={styles.flag}>{opponentFlag}</Text></View>
              <Text style={styles.playerName} numberOfLines={1}>{safeOpponentName}</Text>
              <Text style={[styles.outcomeLabel, isDraw ? styles.drawLabel : !didWin ? styles.winLabel : styles.lossLabel]}>{isDraw ? "DRAW" : !didWin ? "WINNER" : "LOSER"}</Text>
            </View>
          </View>

          {(playerRating || opponentRating) ? <View style={styles.ratingRow}>
            <RatingCard name={safePlayerName} rating={playerRating} />
            <RatingCard name={safeOpponentName} rating={opponentRating} />
          </View> : null}

          <ScrollView style={styles.statsScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={styles.statsContainer}>
              <StatRow left={playerStats.accuracy} label="Accuracy" right={opponentStats.accuracy} percentage />
              <StatRow left={playerStats.missedWins} label="Missed Wins" right={opponentStats.missedWins} warning />
              <StatRow left={playerStats.blunders} label="Blunders" right={opponentStats.blunders} warning />
              <StatRow left={playerStats.checks} label="Checks" right={opponentStats.checks} />
              <StatRow left={playerStats.captures} label="Captures" right={opponentStats.captures} />
              <StatRow left={playerScore} label="Match Score" right={opponentScore} />
              <StatRow left={playerMaterialPoints} label="Material Points" right={opponentMaterialPoints} />
              <StatRow left={playerCapturedPoints} label="Captured Points" right={opponentCapturedPoints} />
              <StatRow left={playerMaterialPoints - opponentMaterialPoints} label="Material Advantage" right={opponentMaterialPoints - playerMaterialPoints} />
              <StatRow left={playerStats.pieceValue} label="Piece Value" right={opponentStats.pieceValue} />
            </View>
          </ScrollView>

          {!isDraw && didWin ? <View style={styles.rewards}>
            <Text style={styles.rewardText}>Online win: <Text style={styles.coinText}>🪙 {onlineWinCoins}</Text></Text>
            <Text style={styles.rewardText}>Daily game: <Text style={styles.coinText}>🪙 {dailyGameCoins}</Text></Text>
          </View> : null}

          <Pressable style={styles.saveRow} onPress={() => setSaveSelected((previous) => {
            const next = !previous;
            if (next) onSaveGame?.();
            return next;
          })}>
            <View style={[styles.radio, saveSelected ? styles.radioActive : null]}>{saveSelected ? <View style={styles.radioDot} /> : null}</View>
            <Text style={styles.saveText}>Save Game</Text>
          </Pressable>

          <Pressable style={styles.newGameButton} onPress={onNewGame}><Text style={styles.newGameText}>New Game</Text></Pressable>
          <View style={styles.bottomButtons}>
            <Pressable style={styles.bottomButton} onPress={onClose}><Text style={styles.bottomButtonText}>Close</Text></Pressable>
            <Pressable style={styles.bottomButton} onPress={onReviewGame}><Text style={styles.bottomButtonText}>Review Game</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RatingCard({ name, rating }: { name: string; rating?: RatingChangeInfo | null }) {
  return <View style={styles.ratingCard}>
    <Text style={styles.ratingLabel} numberOfLines={1}>{name}</Text>
    <Text style={styles.ratingValue}>{rating?.newRating ?? "—"}</Text>
    {rating ? <Text style={[styles.ratingChange, rating.change >= 0 ? styles.ratingPositive : styles.ratingNegative]}>{rating.change >= 0 ? "+" : ""}{rating.change}</Text> : null}
    {rating ? <Text style={styles.ratingPrevious}>Previous: {rating.previousRating}</Text> : null}
  </View>;
}

function StatRow({ left, label, right, percentage = false, warning = false }: {
  left: number; label: string; right: number; percentage?: boolean; warning?: boolean;
}) {
  return <View style={styles.statRow}>
    <Text style={[styles.statNumber, warning && styles.warningNumber]}>{left}{percentage ? "%" : ""}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statNumber, warning && styles.warningNumber]}>{right}{percentage ? "%" : ""}</Text>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", paddingHorizontal: 23 },
  card: { width: "100%", maxWidth: 520, maxHeight: "94%", borderRadius: 23, backgroundColor: "#087391", borderWidth: 1, borderColor: "#2ca4c5", paddingHorizontal: 17, paddingTop: 19, paddingBottom: 17, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 15 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", textAlign: "center" },
  subtitle: { color: "#fff", fontSize: 17, fontWeight: "500", textAlign: "center", marginTop: 1 },
  playersRow: { marginTop: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  playerSide: { width: "29%", alignItems: "center" },
  avatarCircle: { width: 73, height: 73, borderRadius: 37, backgroundColor: "#f5f5f5", alignItems: "center", justifyContent: "center", position: "relative", borderWidth: 2, borderColor: "#fff" },
  avatar: { fontSize: 45 },
  flag: { position: "absolute", right: -2, bottom: -1, fontSize: 20 },
  playerName: { color: "#fff", fontSize: 14, marginTop: 5, textAlign: "center", maxWidth: 120, fontWeight: "700" },
  outcomeLabel: { marginTop: 3, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  winLabel: { color: "#7CFF9B" }, lossLabel: { color: "#FF9696" }, drawLabel: { color: "#FFE082" },
  ratingRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  ratingCard: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, backgroundColor: "rgba(0,35,55,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  ratingLabel: { color: "#D8F5FF", fontSize: 12, fontWeight: "700", textAlign: "center" },
  ratingValue: { color: "#fff", fontSize: 25, fontWeight: "900", marginTop: 3 },
  ratingChange: { fontSize: 17, fontWeight: "900", marginTop: 1 }, ratingPositive: { color: "#7CFF9B" }, ratingNegative: { color: "#FF9696" },
  ratingPrevious: { color: "#D0E6EE", fontSize: 11, marginTop: 3 },
  pointsBox: { flex: 1, alignItems: "center", justifyContent: "center" }, points: { fontSize: 28, fontWeight: "900" }, pointsPositive: { color: "#00e928" }, pointsNegative: { color: "#ff3030" },
  pointsLabel: { position: "absolute", left: "57%", top: 8, color: "#fff", fontSize: 22, fontWeight: "900" },
  statsScroll: { flexGrow: 0, maxHeight: 300, marginTop: 12 }, statsContainer: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)" },
  statRow: { minHeight: 37, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.20)" },
  statNumber: { width: "27%", color: "#fff", fontSize: 19, fontWeight: "900", textAlign: "center" }, warningNumber: { color: "#ff1717" }, statLabel: { flex: 1, color: "#fff", fontSize: 16, textAlign: "center" },
  rewards: { marginTop: 13, alignItems: "center" }, rewardText: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 3 }, coinText: { color: "#ffd21c", fontWeight: "900" },
  saveRow: { marginTop: 13, flexDirection: "row", alignItems: "center" }, radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" }, radioActive: { borderColor: "#fff" }, radioDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: "#fff" }, saveText: { color: "#fff", fontSize: 16, fontWeight: "800", marginLeft: 7 },
  newGameButton: { height: 73, borderRadius: 14, backgroundColor: "#ff7800", marginTop: 15, alignItems: "center", justifyContent: "center", borderBottomWidth: 4, borderBottomColor: "#db5500" }, newGameText: { color: "#fff", fontSize: 21, fontWeight: "900" },
  bottomButtons: { flexDirection: "row", gap: 13, marginTop: 14 }, bottomButton: { flex: 1, height: 70, borderRadius: 14, backgroundColor: "#075674", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }, bottomButtonText: { color: "#c6d9e0", fontSize: 16, fontWeight: "900" },
});
