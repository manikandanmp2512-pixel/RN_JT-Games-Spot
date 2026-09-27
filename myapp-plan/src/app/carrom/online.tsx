import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get("window");

const BOARD_SIZE = Math.min(width - 30, 390);
const INNER = BOARD_SIZE * 0.09;

type Coin = {
  id: number;
  color: string;
  x: number;
  y: number;
  pocketed: boolean;
};

const CarromOnline = () => {
  const params = useLocalSearchParams();

  const modes = String(params.modes || "rapid");

  const [turn, setTurn] = useState<"you" | "opponent">("you");
  const [time, setTime] = useState(58);
  const [power, setPower] = useState(55);
  const [angle, setAngle] = useState(0);
  const [strikerX, setStrikerX] = useState(50);
  const [strikes, setStrikes] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  const initialCoins = useMemo<Coin[]>(
    () => [
      { id: 1, color: "#E53935", x: 50, y: 50, pocketed: false },
      { id: 2, color: "#161B22", x: 44, y: 50, pocketed: false },
      { id: 3, color: "#F5F5F5", x: 56, y: 50, pocketed: false },
      { id: 4, color: "#161B22", x: 50, y: 44, pocketed: false },
      { id: 5, color: "#F5F5F5", x: 50, y: 56, pocketed: false },
      { id: 6, color: "#161B22", x: 45.5, y: 45.5, pocketed: false },
      { id: 7, color: "#F5F5F5", x: 54.5, y: 45.5, pocketed: false },
      { id: 8, color: "#161B22", x: 45.5, y: 54.5, pocketed: false },
      { id: 9, color: "#F5F5F5", x: 54.5, y: 54.5, pocketed: false },
    ],
    []
  );

  const [coins, setCoins] = useState(initialCoins);

  useEffect(() => {
    if (winner || turn !== "you") return;

    const timer = setInterval(() => {
      setTime((previous) => {
        if (previous <= 1) {
          setTurn("opponent");
          return 60;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turn, winner]);

  useEffect(() => {
    if (winner || turn !== "opponent") return;

    const timer = setTimeout(() => {
      setTurn("you");
      setTime(60);
    }, 1800);

    return () => clearTimeout(timer);
  }, [turn, winner]);

  const strike = () => {
    if (turn !== "you" || winner) return;

    setStrikes((value) => value + 1);

    const randomPocket = Math.random() > 0.58;

    if (randomPocket) {
      const available = coins.filter((coin) => !coin.pocketed);

      if (available.length > 0) {
        const selected =
          available[Math.floor(Math.random() * available.length)];

        setCoins((previous) =>
          previous.map((coin) =>
            coin.id === selected.id
              ? { ...coin, pocketed: true }
              : coin
          )
        );

        const remaining = available.length - 1;

        if (remaining <= 0) {
          setWinner("YOU");
          return;
        }
      }
    }

    setTurn("opponent");
    setTime(60);
  };

  const resetGame = () => {
    setCoins(initialCoins);
    setTurn("you");
    setTime(60);
    setStrikes(0);
    setWinner(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#071E2B"
      />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.gameTitle}>CARROM ARENA</Text>
            <Text style={styles.modeText}>
              ONLINE • {modes.toUpperCase()}
            </Text>
          </View>

          <View style={styles.onlineDot} />
        </View>

        {/* PLAYERS */}
        <View style={styles.playersRow}>
          <View
            style={[
              styles.playerCard,
              turn === "you" && styles.activePlayer,
            ]}
          >
            <View style={styles.avatar}>
              <Text>😎</Text>
            </View>

            <View>
              <Text style={styles.playerName}>YOU</Text>
              <Text style={styles.playerScore}>
                {coins.filter((coin) => coin.pocketed).length}
              </Text>
            </View>
          </View>

          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View
            style={[
              styles.playerCard,
              turn === "opponent" && styles.activePlayer,
            ]}
          >
            <View style={styles.avatarOpponent}>
              <Text>🤖</Text>
            </View>

            <View>
              <Text style={styles.playerName}>RIVAL</Text>
              <Text style={styles.playerScore}>2</Text>
            </View>
          </View>
        </View>

        {/* TURN */}
        <View style={styles.turnBar}>
          <View style={styles.liveDot} />

          <Text style={styles.turnText}>
            {turn === "you"
              ? "YOUR TURN — AIM & STRIKE"
              : "OPPONENT IS PLAYING..."}
          </Text>

          <Text style={styles.timer}>
            00:{String(time).padStart(2, "0")}
          </Text>
        </View>

        {/* BOARD */}
        <View style={styles.boardWrapper}>
          <View style={styles.board}>
            {/* POCKETS */}
            <View style={[styles.pocket, styles.pocketTL]} />
            <View style={[styles.pocket, styles.pocketTR]} />
            <View style={[styles.pocket, styles.pocketBL]} />
            <View style={[styles.pocket, styles.pocketBR]} />

            {/* INNER BOARD */}
            <View style={styles.innerBoard}>
              <View style={styles.centerCircle}>
                <View style={styles.centerRed} />
              </View>

              <View style={styles.lineHorizontal} />
              <View style={styles.lineHorizontalBottom} />
              <View style={styles.lineVertical} />
              <View style={styles.lineVerticalRight} />

              {/* COINS */}
              {coins
                .filter((coin) => !coin.pocketed)
                .map((coin) => (
                  <View
                    key={coin.id}
                    style={[
                      styles.coin,
                      {
                        backgroundColor: coin.color,
                        left: `${coin.x}%`,
                        top: `${coin.y}%`,
                      },
                    ]}
                  />
                ))}

              {/* STRIKER */}
              <View
                style={[
                  styles.striker,
                  {
                    left: `${strikerX}%`,
                  },
                ]}
              >
                <View style={styles.strikerInner} />
              </View>
            </View>
          </View>
        </View>

        {/* CONTROLS */}
        <View style={styles.controls}>
          <Text style={styles.controlLabel}>STRIKER POSITION</Text>

          <View style={styles.sliderRow}>
            <TouchableOpacity
              style={styles.smallControl}
              onPress={() =>
                setStrikerX((value) => Math.max(15, value - 5))
              }
            >
              <Text style={styles.controlText}>−</Text>
            </TouchableOpacity>

            <View style={styles.slider}>
              <View
                style={[
                  styles.sliderProgress,
                  { width: `${strikerX}%` },
                ]}
              />
            </View>

            <TouchableOpacity
              style={styles.smallControl}
              onPress={() =>
                setStrikerX((value) => Math.min(85, value + 5))
              }
            >
              <Text style={styles.controlText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.powerRow}>
            <TouchableOpacity
              onPress={() =>
                setAngle((value) => Math.max(-45, value - 5))
              }
            >
              <Text style={styles.arrow}>↶</Text>
            </TouchableOpacity>

            <View style={styles.powerBox}>
              <Text style={styles.powerTitle}>POWER</Text>
              <Text style={styles.powerValue}>{power}%</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setAngle((value) => Math.min(45, value + 5))
              }
            >
              <Text style={styles.arrow}>↷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.angleText}>
            AIM ANGLE {angle > 0 ? "+" : ""}
            {angle}°
          </Text>

          <TouchableOpacity
            style={[
              styles.strikeButton,
              turn !== "you" && styles.disabled,
            ]}
            onPress={strike}
            disabled={turn !== "you"}
          >
            <Text style={styles.strikeIcon}>🎯</Text>
            <Text style={styles.strikeText}>STRIKE</Text>
          </TouchableOpacity>

          <Text style={styles.strikeCount}>
            STRIKES {strikes}
          </Text>
        </View>

        {/* WINNER */}
        {winner && (
          <View style={styles.overlay}>
            <View style={styles.winnerCard}>
              <Text style={styles.trophy}>🏆</Text>
              <Text style={styles.winnerTitle}>
                {winner} WIN!
              </Text>

              <Text style={styles.winnerSubtitle}>
                Amazing carrom skills!
              </Text>

              <TouchableOpacity
                style={styles.playAgain}
                onPress={resetGame}
              >
                <Text style={styles.playAgainText}>
                  PLAY AGAIN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/user")}
              >
                <Text style={styles.exitText}>
                  EXIT GAME
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CarromOnline;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#071E2B",
  },

  container: {
    flex: 1,
    backgroundColor: "#123C52",
  },

  header: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#204F66",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 35,
    lineHeight: 35,
  },

  gameTitle: {
    color: "#FFB52E",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
  },

  modeText: {
    color: "#8EAFBD",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 2,
  },

  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#36E37B",
  },

  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  playerCard: {
    flex: 1,
    height: 58,
    borderRadius: 17,
    backgroundColor: "#1D4C63",
    borderWidth: 1,
    borderColor: "#32647A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    gap: 8,
  },

  activePlayer: {
    borderColor: "#FFAA20",
    backgroundColor: "#285A6F",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#334F69",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarOpponent: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#573D6E",
    alignItems: "center",
    justifyContent: "center",
  },

  playerName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  playerScore: {
    color: "#FFB52E",
    fontSize: 18,
    fontWeight: "900",
  },

  vsCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FF8C00",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 7,
  },

  vsText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  turnBar: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#204D63",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#36E37B",
    marginRight: 7,
  },

  turnText: {
    flex: 1,
    color: "#DDEBF0",
    fontSize: 10,
    fontWeight: "900",
  },

  timer: {
    color: "#FFB52E",
    fontWeight: "900",
    fontSize: 13,
  },

  boardWrapper: {
    alignItems: "center",
    marginTop: 12,
  },

  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: "#B87838",
    borderRadius: 25,
    padding: INNER,
    borderWidth: 5,
    borderColor: "#7A431D",
    elevation: 12,
  },

  innerBoard: {
    flex: 1,
    backgroundColor: "#E5B36E",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "#8B5428",
  },

  pocket: {
    position: "absolute",
    width: BOARD_SIZE * 0.105,
    height: BOARD_SIZE * 0.105,
    borderRadius: BOARD_SIZE * 0.06,
    backgroundColor: "#17120F",
    zIndex: 10,
  },

  pocketTL: {
    left: INNER * 0.2,
    top: INNER * 0.2,
  },

  pocketTR: {
    right: INNER * 0.2,
    top: INNER * 0.2,
  },

  pocketBL: {
    left: INNER * 0.2,
    bottom: INNER * 0.2,
  },

  pocketBR: {
    right: INNER * 0.2,
    bottom: INNER * 0.2,
  },

  centerCircle: {
    position: "absolute",
    width: "28%",
    aspectRatio: 1,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#8D4D25",
    left: "36%",
    top: "36%",
    alignItems: "center",
    justifyContent: "center",
  },

  centerRed: {
    width: "35%",
    aspectRatio: 1,
    borderRadius: 100,
    backgroundColor: "#D72B35",
  },

  lineHorizontal: {
    position: "absolute",
    top: "18%",
    left: "12%",
    right: "12%",
    height: 2,
    backgroundColor: "#7F4928",
  },

  lineHorizontalBottom: {
    position: "absolute",
    bottom: "18%",
    left: "12%",
    right: "12%",
    height: 2,
    backgroundColor: "#7F4928",
  },

  lineVertical: {
    position: "absolute",
    left: "18%",
    top: "12%",
    bottom: "12%",
    width: 2,
    backgroundColor: "#7F4928",
  },

  lineVerticalRight: {
    position: "absolute",
    right: "18%",
    top: "12%",
    bottom: "12%",
    width: 2,
    backgroundColor: "#7F4928",
  },

  coin: {
    position: "absolute",
    width: "8%",
    aspectRatio: 1,
    borderRadius: 100,
    marginLeft: "-4%",
    marginTop: "-4%",
    borderWidth: 1.5,
    borderColor: "#7C4C2C",
    elevation: 4,
  },

  striker: {
    position: "absolute",
    bottom: "8%",
    width: "13%",
    aspectRatio: 1,
    borderRadius: 100,
    marginLeft: "-6.5%",
    backgroundColor: "#F8F5E8",
    borderWidth: 3,
    borderColor: "#DA8B26",
    alignItems: "center",
    justifyContent: "center",
  },

  strikerInner: {
    width: "45%",
    aspectRatio: 1,
    borderRadius: 100,
    backgroundColor: "#DA8B26",
  },

  controls: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  controlLabel: {
    color: "#8EAFBD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },

  smallControl: {
    width: 32,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#24566D",
    alignItems: "center",
    justifyContent: "center",
  },

  controlText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  slider: {
    flex: 1,
    height: 8,
    backgroundColor: "#2A6077",
    borderRadius: 10,
    overflow: "hidden",
  },

  sliderProgress: {
    height: "100%",
    backgroundColor: "#FF9A1A",
    borderRadius: 10,
  },

  powerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  arrow: {
    color: "#FFB52E",
    fontSize: 28,
    paddingHorizontal: 25,
  },

  powerBox: {
    alignItems: "center",
  },

  powerTitle: {
    color: "#7F9EAA",
    fontSize: 8,
    fontWeight: "900",
  },

  powerValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  angleText: {
    color: "#7F9EAA",
    textAlign: "center",
    fontSize: 8,
    fontWeight: "800",
  },

  strikeButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FF9200",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  disabled: {
    opacity: 0.4,
  },

  strikeIcon: {
    fontSize: 19,
    marginRight: 8,
  },

  strikeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },

  strikeCount: {
    color: "#7595A2",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 3,
  },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  winnerCard: {
    width: "78%",
    borderRadius: 25,
    backgroundColor: "#1C4A61",
    borderWidth: 1,
    borderColor: "#FFAA20",
    padding: 25,
    alignItems: "center",
  },

  trophy: {
    fontSize: 52,
  },

  winnerTitle: {
    color: "#FFB52E",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 5,
  },

  winnerSubtitle: {
    color: "#C4D8DF",
    marginTop: 5,
  },

  playAgain: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FF9200",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  playAgainText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  exitText: {
    color: "#91B1BD",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 15,
  },
});