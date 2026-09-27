import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LudoBoard from "../../components/ludo/LudoBoard";
import LudoDice from "../../components/ludo/LudoDice";

import {
  Token,
  canMoveToken,
  createTokens,
  hasWon,
  moveToken,
  rollDice,
} from "../../components/ludo/LudoGameEngine";

type Difficulty = "Easy" | "Medium" | "Hard";

const LudoCPU = () => {
  const [difficulty, setDifficulty] =
    useState<Difficulty>("Medium");

  const [yourTokens, setYourTokens] = useState<Token[]>(
    createTokens("YOU")
  );

  const [cpuTokens, setCpuTokens] = useState<Token[]>(
    createTokens("CPU")
  );

  const [dice, setDice] = useState(1);

  const [turn, setTurn] = useState<"YOU" | "CPU">(
    "YOU"
  );

  const [selectedToken, setSelectedToken] = useState<
    number | null
  >(null);

  const [gameOver, setGameOver] = useState(false);

  const [message, setMessage] = useState(
    "Your turn — roll the dice!"
  );

  /*
   * ============================================================
   * PLAYER TOKEN PRESS
   * ============================================================
   */

  const handleTokenPress = (tokenId: number) => {
    if (turn !== "YOU") {
      return;
    }

    if (gameOver) {
      return;
    }

    const token = yourTokens.find(
      (item) => item.id === tokenId
    );

    if (!token) {
      return;
    }

    if (!canMoveToken(token, dice)) {
      Alert.alert(
        "Cannot Move",
        "This token cannot move with the current dice value."
      );

      return;
    }

    const updatedTokens = yourTokens.map((item) =>
      item.id === tokenId
        ? moveToken(item, dice)
        : item
    );

    setYourTokens(updatedTokens);
    setSelectedToken(null);

    if (hasWon(updatedTokens)) {
      setGameOver(true);
      setMessage("🎉 You won!");
      return;
    }

    /*
     * Rolling 6 gives another turn.
     */
    if (dice === 6) {
      setMessage("You rolled a 6! Roll again.");
      return;
    }

    setTurn("CPU");
    setMessage("CPU is thinking...");
  };

  /*
   * ============================================================
   * ROLL DICE
   * ============================================================
   */

  const handleRollDice = () => {
    if (turn !== "YOU") {
      return;
    }

    if (gameOver) {
      return;
    }

    const value = rollDice();

    setDice(value);
    setSelectedToken(null);

    const movableTokens = yourTokens.filter(
      (token) => canMoveToken(token, value)
    );

    if (movableTokens.length === 0) {
      setMessage(
        `You rolled ${value}. No token can move.`
      );

      if (value !== 6) {
        setTimeout(() => {
          setTurn("CPU");
          setMessage("CPU is thinking...");
        }, 900);
      }

      return;
    }

    setMessage(
      value === 6
        ? "🎲 You rolled 6! Choose a token."
        : `🎲 You rolled ${value}. Choose a token.`
    );

    /*
     * If only one token can move,
     * automatically select it.
     */
    if (movableTokens.length === 1) {
      setSelectedToken(movableTokens[0].id);
    }
  };

  /*
   * ============================================================
   * CPU TURN
   * ============================================================
   */

  useEffect(() => {
    if (turn !== "CPU") {
      return;
    }

    if (gameOver) {
      return;
    }

    const timer = setTimeout(() => {
      const cpuDice = rollDice();

      setDice(cpuDice);
      setMessage(`CPU rolled ${cpuDice}`);

      setTimeout(() => {
        setCpuTokens((previousTokens) => {
          const movableTokens = previousTokens.filter(
            (token) =>
              canMoveToken(token, cpuDice)
          );

          if (movableTokens.length === 0) {
            setMessage(
              "CPU cannot move. Your turn!"
            );

            if (cpuDice !== 6) {
              setTurn("YOU");
            }

            return previousTokens;
          }

          /*
           * Difficulty controls which CPU token is selected.
           */

          let selectedCPU = movableTokens[0];

          if (difficulty === "Easy") {
            selectedCPU =
              movableTokens[
                Math.floor(
                  Math.random() *
                    movableTokens.length
                )
              ];
          }

          if (difficulty === "Medium") {
            selectedCPU =
              movableTokens[
                movableTokens.length - 1
              ];
          }

          if (difficulty === "Hard") {
            selectedCPU = [...movableTokens].sort(
              (a, b) =>
                b.position - a.position
            )[0];
          }

          const updatedTokens =
            previousTokens.map((token) =>
              token.id === selectedCPU.id
                ? moveToken(token, cpuDice)
                : token
            );

          if (hasWon(updatedTokens)) {
            setGameOver(true);
            setMessage("🤖 CPU won!");
            Alert.alert(
              "Game Over",
              "CPU won the game!"
            );
          } else if (cpuDice === 6) {
            setMessage(
              "CPU rolled 6! CPU gets another turn."
            );
          } else {
            setTurn("YOU");
            setMessage(
              "Your turn — roll the dice!"
            );
          }

          return updatedTokens;
        });
      }, 700);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [turn, gameOver, difficulty]);

  /*
   * ============================================================
   * NEW GAME
   * ============================================================
   */

  const startNewGame = () => {
    setYourTokens(createTokens("YOU"));
    setCpuTokens(createTokens("CPU"));
    setDice(1);
    setTurn("YOU");
    setSelectedToken(null);
    setGameOver(false);
    setMessage("Your turn — roll the dice!");
  };

  /*
   * ============================================================
   * UI
   * ============================================================
   */

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
            onPress={() => router.replace("/ludo")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              LUDO
            </Text>

            <Text style={styles.headerSubtitle}>
              PLAY VS CPU
            </Text>
          </View>

          <TouchableOpacity
            onPress={startNewGame}
            style={styles.restartButton}
          >
            <Text style={styles.restartText}>
              ↻
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* DIFFICULTY */}
          <View style={styles.difficultyCard}>
            <Text style={styles.sectionTitle}>
              CPU DIFFICULTY
            </Text>

            <View style={styles.difficultyRow}>
              {(
                ["Easy", "Medium", "Hard"] as Difficulty[]
              ).map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() =>
                    setDifficulty(level)
                  }
                  style={[
                    styles.difficultyButton,
                    difficulty === level &&
                      styles.activeDifficulty,
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      difficulty === level &&
                        styles.activeDifficultyText,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* TURN STATUS */}
          <View style={styles.statusCard}>
            <View
              style={[
                styles.statusDot,
                turn === "YOU"
                  ? styles.youStatus
                  : styles.cpuStatus,
              ]}
            />

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {turn === "YOU"
                  ? "YOUR TURN"
                  : "CPU TURN"}
              </Text>

              <Text style={styles.statusMessage}>
                {message}
              </Text>
            </View>
          </View>

          {/* SCORE */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>
                YOU
              </Text>

              <Text style={styles.scoreValue}>
                {
                  yourTokens.filter(
                    (token) => token.finished
                  ).length
                }
                /4
              </Text>
            </View>

            <View style={styles.vs}>
              <Text style={styles.vsText}>
                VS
              </Text>
            </View>

            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>
                CPU
              </Text>

              <Text style={styles.scoreValue}>
                {
                  cpuTokens.filter(
                    (token) => token.finished
                  ).length
                }
                /4
              </Text>
            </View>
          </View>

          {/* BOARD */}
          <LudoBoard
            yourTokens={yourTokens}
            cpuTokens={cpuTokens}
            selectedToken={selectedToken}
            onTokenPress={handleTokenPress}
          />

          {/* DICE */}
          <View style={styles.controls}>
            <LudoDice
              value={dice}
              disabled={
                turn !== "YOU" || gameOver
              }
              onPress={handleRollDice}
            />
          </View>

          {/* SELECTED TOKEN */}
          {selectedToken !== null && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedText}>
                Token {selectedToken + 1} selected
              </Text>

              <Text style={styles.selectedSubText}>
                Tap the highlighted token to move
              </Text>
            </View>
          )}

          {/* GAME OVER */}
          {gameOver && (
            <View style={styles.gameOverCard}>
              <Text style={styles.gameOverEmoji}>
                🏆
              </Text>

              <Text style={styles.gameOverTitle}>
                {yourTokens.every(
                  (token) => token.finished
                )
                  ? "YOU WIN!"
                  : "CPU WINS!"}
              </Text>

              <TouchableOpacity
                onPress={startNewGame}
                style={styles.newGameButton}
              >
                <Text style={styles.newGameText}>
                  PLAY AGAIN
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default LudoCPU;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#071E2B",
  },

  container: {
    flex: 1,
    backgroundColor: "#214E65",
  },

  header: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#193E52",
    borderBottomWidth: 1,
    borderBottomColor: "#3F7185",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#244F65",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 36,
  },

  headerCenter: {
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },

  headerSubtitle: {
    color: "#9EBAC5",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 2,
  },

  restartButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FF9200",
    alignItems: "center",
    justifyContent: "center",
  },

  restartText: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  difficultyCard: {
    backgroundColor: "#244F65",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#47768A",
  },

  sectionTitle: {
    color: "#91ACB8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },

  difficultyButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#193E52",
    borderWidth: 1,
    borderColor: "#3C697C",
    alignItems: "center",
  },

  activeDifficulty: {
    backgroundColor: "#FF9200",
    borderColor: "#FFB13B",
  },

  difficultyText: {
    color: "#AFC4CD",
    fontSize: 12,
    fontWeight: "800",
  },

  activeDifficultyText: {
    color: "#FFFFFF",
  },

  statusCard: {
    marginTop: 12,
    backgroundColor: "#193E52",
    borderRadius: 17,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3C697C",
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },

  youStatus: {
    backgroundColor: "#F6C82F",
  },

  cpuStatus: {
    backgroundColor: "#E34D5B",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  statusMessage: {
    color: "#AFC4CD",
    fontSize: 11,
    marginTop: 2,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 10,
  },

  scoreCard: {
    width: 95,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "#244F65",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#47768A",
  },

  scoreLabel: {
    color: "#8FAAB6",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  scoreValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },

  vs: {
    width: 35,
    alignItems: "center",
  },

  vsText: {
    color: "#FF9200",
    fontSize: 11,
    fontWeight: "900",
  },

  controls: {
    alignItems: "center",
    marginTop: 16,
  },

  selectedInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#315E6C",
    borderWidth: 1,
    borderColor: "#FF9200",
    alignItems: "center",
  },

  selectedText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  selectedSubText: {
    color: "#C9D9DF",
    fontSize: 10,
    marginTop: 3,
  },

  gameOverCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#244F65",
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF9200",
  },

  gameOverEmoji: {
    fontSize: 40,
  },

  gameOverTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 5,
  },

  newGameButton: {
    marginTop: 14,
    backgroundColor: "#FF9200",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 14,
  },

  newGameText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  bottomSpace: {
    height: 35,
  },
});