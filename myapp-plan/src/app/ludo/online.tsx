import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type PlayerColor = "red" | "green" | "yellow" | "blue";

const COLORS = {
  red: "#E9434E",
  green: "#36C979",
  yellow: "#F4B83F",
  blue: "#438BE8",
};

const playerNames = {
  red: "YOU",
  green: "NOVA",
  yellow: "ACE",
  blue: "MAX",
};

const LudoOnline = () => {
  const [dice, setDice] = useState(1);
  const [turn, setTurn] =
    useState<PlayerColor>("red");

  const [moves, setMoves] = useState({
    red: 0,
    green: 0,
    yellow: 0,
    blue: 0,
  });

  const [winner, setWinner] =
    useState<PlayerColor | null>(null);

  const tokens = useMemo(
    () => [
      { color: "red" as PlayerColor, x: 18, y: 18 },
      { color: "red" as PlayerColor, x: 29, y: 29 },
      { color: "green" as PlayerColor, x: 82, y: 18 },
      { color: "green" as PlayerColor, x: 71, y: 29 },
      { color: "yellow" as PlayerColor, x: 82, y: 82 },
      { color: "yellow" as PlayerColor, x: 71, y: 71 },
      { color: "blue" as PlayerColor, x: 18, y: 82 },
      { color: "blue" as PlayerColor, x: 29, y: 71 },
    ],
    []
  );

  const rollDice = () => {
    if (turn !== "red" || winner) return;

    const value = Math.floor(Math.random() * 6) + 1;
    setDice(value);

    setMoves((previous) => ({
      ...previous,
      red: previous.red + value,
    }));

    if (moves.red + value >= 30) {
      setWinner("red");
      return;
    }

    setTimeout(() => {
      setTurn("green");

      setTimeout(() => {
        setTurn("yellow");

        setTimeout(() => {
          setTurn("blue");

          setTimeout(() => {
            setTurn("red");
          }, 900);
        }, 900);
      }, 900);
    }, 900);
  };

  const reset = () => {
    setDice(1);
    setTurn("red");
    setMoves({
      red: 0,
      green: 0,
      yellow: 0,
      blue: 0,
    });
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
            style={styles.back}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>LUDO ARENA</Text>
            <Text style={styles.subtitle}>
              ONLINE MATCH
            </Text>
          </View>

          <View style={styles.live}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* PLAYERS */}
        <View style={styles.players}>
          {(
            [
              "red",
              "green",
              "yellow",
              "blue",
            ] as PlayerColor[]
          ).map((color) => (
            <View
              key={color}
              style={[
                styles.player,
                turn === color && {
                  borderColor: COLORS[color],
                },
              ]}
            >
              <View
                style={[
                  styles.playerDot,
                  {
                    backgroundColor: COLORS[color],
                  },
                ]}
              />

              <Text style={styles.playerName}>
                {playerNames[color]}
              </Text>

              <Text style={styles.playerMoves}>
                {moves[color]}
              </Text>
            </View>
          ))}
        </View>

        {/* TURN */}
        <View style={styles.turnBar}>
          <View
            style={[
              styles.turnColor,
              {
                backgroundColor: COLORS[turn],
              },
            ]}
          />

          <Text style={styles.turnText}>
            {turn === "red"
              ? "YOUR TURN — ROLL DICE"
              : `${playerNames[turn]} IS PLAYING...`}
          </Text>
        </View>

        {/* BOARD */}
        <View style={styles.board}>
          {/* HOMES */}
          <View
            style={[
              styles.home,
              styles.redHome,
              { backgroundColor: COLORS.red },
            ]}
          >
            <View style={styles.homeInner}>
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
            </View>
          </View>

          <View
            style={[
              styles.home,
              styles.greenHome,
              { backgroundColor: COLORS.green },
            ]}
          >
            <View style={styles.homeInner}>
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
            </View>
          </View>

          <View
            style={[
              styles.home,
              styles.yellowHome,
              { backgroundColor: COLORS.yellow },
            ]}
          >
            <View style={styles.homeInner}>
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
            </View>
          </View>

          <View
            style={[
              styles.home,
              styles.blueHome,
              { backgroundColor: COLORS.blue },
            ]}
          >
            <View style={styles.homeInner}>
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
              <View style={styles.homeToken} />
            </View>
          </View>

          {/* TRACK */}
          <View style={styles.track}>
            {Array.from({ length: 25 }).map(
              (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.trackCell,
                    index % 4 === 0 &&
                      styles.specialCell,
                  ]}
                />
              )
            )}
          </View>

          {/* CENTER */}
          <View style={styles.center}>
            <View
              style={[
                styles.centerTriangle,
                {
                  borderBottomColor: COLORS.red,
                },
              ]}
            />
            <View
              style={[
                styles.centerTriangle,
                {
                  borderLeftColor: COLORS.green,
                },
              ]}
            />
            <View
              style={[
                styles.centerTriangle,
                {
                  borderTopColor: COLORS.yellow,
                },
              ]}
            />
            <View
              style={[
                styles.centerTriangle,
                {
                  borderRightColor: COLORS.blue,
                },
              ]}
            />

            <Text style={styles.homeIcon}>★</Text>
          </View>

          {/* TOKENS */}
          {tokens.map((token, index) => (
            <View
              key={index}
              style={[
                styles.token,
                {
                  backgroundColor:
                    COLORS[token.color],
                  left: `${token.x}%`,
                  top: `${token.y}%`,
                },
              ]}
            >
              <Text style={styles.tokenText}>●</Text>
            </View>
          ))}
        </View>

        {/* DICE */}
        <View style={styles.diceArea}>
          <View style={styles.diceInfo}>
            <Text style={styles.diceLabel}>
              LAST ROLL
            </Text>

            <Text style={styles.diceNumber}>
              {dice}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.diceButton,
              turn !== "red" && styles.disabled,
            ]}
            onPress={rollDice}
            disabled={turn !== "red"}
          >
            <Text style={styles.diceEmoji}>🎲</Text>
            <Text style={styles.rollText}>
              ROLL DICE
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helper}>
          Roll 6 to bring a token out of home
        </Text>

        {/* WINNER */}
        {winner && (
          <View style={styles.overlay}>
            <View style={styles.winner}>
              <Text style={styles.trophy}>🏆</Text>

              <Text style={styles.winnerTitle}>
                {playerNames[winner]} WINS!
              </Text>

              <Text style={styles.winnerSub}>
                Congratulations!
              </Text>

              <TouchableOpacity
                style={styles.playAgain}
                onPress={reset}
              >
                <Text style={styles.playAgainText}>
                  PLAY AGAIN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/user")}
              >
                <Text style={styles.exit}>
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

export default LudoOnline;

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
    height: 65,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#204F66",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    color: "#FFF",
    fontSize: 35,
  },

  headerCenter: {
    alignItems: "center",
  },

  title: {
    color: "#FFB52E",
    fontSize: 19,
    fontWeight: "900",
  },

  subtitle: {
    color: "#8DAAB6",
    fontSize: 9,
    fontWeight: "800",
  },

  live: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#244F62",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#36E37B",
    marginRight: 4,
  },

  liveText: {
    color: "#36E37B",
    fontSize: 8,
    fontWeight: "900",
  },

  players: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
  },

  player: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#204F66",
    borderWidth: 1,
    borderColor: "#2B6075",
    alignItems: "center",
    justifyContent: "center",
  },

  playerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    position: "absolute",
    top: 5,
    right: 6,
  },

  playerName: {
    color: "#DCE9ED",
    fontSize: 8,
    fontWeight: "900",
  },

  playerMoves: {
    color: "#FFB52E",
    fontSize: 12,
    fontWeight: "900",
  },

  turnBar: {
    marginHorizontal: 15,
    marginTop: 8,
    height: 32,
    borderRadius: 11,
    backgroundColor: "#204E64",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  turnColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  turnText: {
    color: "#E0EBEF",
    fontSize: 9,
    fontWeight: "900",
  },

  board: {
    width: "92%",
    aspectRatio: 1,
    maxWidth: 390,
    alignSelf: "center",
    marginTop: 12,
    backgroundColor: "#F1F0DF",
    borderRadius: 22,
    borderWidth: 5,
    borderColor: "#8C6A3A",
    overflow: "hidden",
    position: "relative",
    elevation: 10,
  },

  home: {
    position: "absolute",
    width: "39%",
    height: "39%",
    padding: 14,
  },

  redHome: {
    left: 0,
    top: 0,
  },

  greenHome: {
    right: 0,
    top: 0,
  },

  yellowHome: {
    right: 0,
    bottom: 0,
  },

  blueHome: {
    left: 0,
    bottom: 0,
  },

  homeInner: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignItems: "center",
  },

  homeToken: {
    width: "35%",
    aspectRatio: 1,
    borderRadius: 100,
    backgroundColor: "#E9E9E9",
    borderWidth: 3,
    borderColor: "#D1D1D1",
  },

  track: {
    position: "absolute",
    left: "26%",
    top: "26%",
    width: "48%",
    height: "48%",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#C4C1A9",
  },

  trackCell: {
    width: "20%",
    height: "20%",
    borderWidth: 0.5,
    borderColor: "#D5D3C4",
    backgroundColor: "#F8F7EB",
  },

  specialCell: {
    backgroundColor: "#E9E8D7",
  },

  center: {
    position: "absolute",
    left: "40%",
    top: "40%",
    width: "20%",
    height: "20%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },

  centerTriangle: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 30,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },

  homeIcon: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  token: {
    position: "absolute",
    width: "9%",
    aspectRatio: 1,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    elevation: 5,
  },

  tokenText: {
    color: "rgba(255,255,255,.5)",
    fontSize: 9,
  },

  diceArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 12,
  },

  diceInfo: {
    width: 65,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#204F66",
    alignItems: "center",
    justifyContent: "center",
  },

  diceLabel: {
    color: "#819FAA",
    fontSize: 7,
    fontWeight: "900",
  },

  diceNumber: {
    color: "#FFB52E",
    fontSize: 20,
    fontWeight: "900",
  },

  diceButton: {
    width: 190,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#FF9200",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  disabled: {
    opacity: 0.4,
  },

  diceEmoji: {
    fontSize: 24,
    marginRight: 9,
  },

  rollText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },

  helper: {
    color: "#7897A4",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
  },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,.72)",
    justifyContent: "center",
    alignItems: "center",
  },

  winner: {
    width: "78%",
    borderRadius: 25,
    backgroundColor: "#1C4B62",
    borderWidth: 1,
    borderColor: "#FFB52E",
    padding: 25,
    alignItems: "center",
  },

  trophy: {
    fontSize: 52,
  },

  winnerTitle: {
    color: "#FFB52E",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 5,
  },

  winnerSub: {
    color: "#A9C0C8",
    marginTop: 5,
  },

  playAgain: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FF9200",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  playAgainText: {
    color: "#FFF",
    fontWeight: "900",
  },

  exit: {
    color: "#8EAAB5",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 15,
  },
});