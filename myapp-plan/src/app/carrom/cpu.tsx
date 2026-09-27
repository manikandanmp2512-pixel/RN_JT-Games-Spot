import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import CarromBoard from "../../components/carrom/CarromBoard";
import CarromControls from "../../components/carrom/CarromControls";

import {
  Coin,
  createInitialState
} from "../../components/carrom/CarromGameEngine";

const CarromCPU = () => {
  const [coins, setCoins] = useState<Coin[]>(
    createInitialState().coins
  );

  const [striker, setStriker] = useState(
    createInitialState().striker
  );

  const [angle, setAngle] = useState(-90);

  const [power, setPower] = useState(50);

  const [yourScore, setYourScore] =
    useState(0);

  const [cpuScore, setCpuScore] =
    useState(0);

  const [turn, setTurn] =
    useState<"YOU" | "CPU">("YOU");

  const [shooting, setShooting] =
    useState(false);

  const [gameOver, setGameOver] =
    useState(false);

  const shoot = () => {
    if (turn !== "YOU" || shooting) {
      return;
    }

    setShooting(true);

    setTimeout(() => {
      setCoins((previousCoins) => {
        const available =
          previousCoins.filter(
            (coin) => !coin.pocketed
          );

        if (available.length === 0) {
          return previousCoins;
        }

        const target =
          available[
            Math.floor(
              Math.random() *
                available.length
            )
          ];

        const shouldPocket =
          Math.random() < 0.65;

        if (!shouldPocket) {
          return previousCoins;
        }

        const updated =
          previousCoins.map((coin) => {
            if (coin.id === target.id) {
              return {
                ...coin,
                pocketed: true,
              };
            }

            return coin;
          });

        const value =
          target.color === "queen" ? 3 : 1;

        setYourScore(
          (score) => score + value
        );

        return updated;
      });

      setShooting(false);

      setTimeout(() => {
        setTurn("CPU");
      }, 500);
    }, 700);
  };

  useEffect(() => {
    if (turn !== "CPU") {
      return;
    }

    const timer = setTimeout(() => {
      setCoins((previousCoins) => {
        const available =
          previousCoins.filter(
            (coin) => !coin.pocketed
          );

        if (available.length === 0) {
          return previousCoins;
        }

        const target =
          available[
            Math.floor(
              Math.random() *
                available.length
            )
          ];

        const shouldPocket =
          Math.random() < 0.55;

        if (!shouldPocket) {
          return previousCoins;
        }

        const updated =
          previousCoins.map((coin) => {
            if (coin.id === target.id) {
              return {
                ...coin,
                pocketed: true,
              };
            }

            return coin;
          });

        const value =
          target.color === "queen" ? 3 : 1;

        setCpuScore(
          (score) => score + value
        );

        return updated;
      });

      setTurn("YOU");
    }, 1200);

    return () => clearTimeout(timer);
  }, [turn]);

  useEffect(() => {
    const remaining =
      coins.filter(
        (coin) => !coin.pocketed
      );

    if (remaining.length === 0) {
      setGameOver(true);
    }
  }, [coins]);

  useEffect(() => {
    if (!gameOver) {
      return;
    }

    const winner =
      yourScore > cpuScore
        ? "You Win! 🏆"
        : yourScore < cpuScore
        ? "CPU Wins 🤖"
        : "Match Draw 🤝";

    Alert.alert(
      "Game Over",
      `${winner}\n\nYou: ${yourScore}\nCPU: ${cpuScore}`,
      [
        {
          text: "Play Again",
          onPress: resetGame,
        },
        {
          text: "Exit",
          onPress: () =>
            router.replace("/carrom"),
        },
      ]
    );
  }, [gameOver]);

  const resetGame = () => {
    const initial =
      createInitialState();

    setCoins(initial.coins);
    setStriker(initial.striker);
    setYourScore(0);
    setCpuScore(0);
    setTurn("YOU");
    setGameOver(false);
    setAngle(-90);
    setPower(50);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#070B20"
      />

      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>

          <Text
            style={styles.back}
            onPress={() =>
              router.back()
            }
          >
            ‹
          </Text>

          <View>
            <Text style={styles.title}>
              CARROM
            </Text>

            <Text style={styles.subtitle}>
              PLAY VS CPU
            </Text>
          </View>

          <View style={styles.difficulty}>
            <Text style={styles.robot}>
              🤖
            </Text>

            <Text style={styles.easy}>
              HARD
            </Text>
          </View>

        </View>

        {/* SCORE */}
        <View style={styles.scoreRow}>

          <View
            style={[
              styles.playerCard,
              turn === "YOU" &&
                styles.activePlayer,
            ]}
          >
            <Text style={styles.playerName}>
              YOU
            </Text>

            <Text style={styles.score}>
              {yourScore}
            </Text>
          </View>

          <Text style={styles.vs}>
            VS
          </Text>

          <View
            style={[
              styles.playerCard,
              turn === "CPU" &&
                styles.activePlayer,
            ]}
          >
            <Text style={styles.playerName}>
              CPU
            </Text>

            <Text style={styles.score}>
              {cpuScore}
            </Text>
          </View>

        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.content
          }
        >

          <View style={styles.turnBox}>
            <Text style={styles.turnText}>
              {turn === "YOU"
                ? "🎯 YOUR TURN"
                : "🤖 CPU THINKING..."}
            </Text>
          </View>

          <CarromBoard
            coins={coins}
            striker={striker}
            angle={angle}
            power={power}
          />

          <CarromControls
            angle={angle}
            power={power}
            onAngleChange={(value) =>
              setAngle(value)
            }
            onPowerChange={(value) =>
              setPower(value)
            }
            onShoot={shoot}
          />

          <View style={styles.rules}>
            <Text style={styles.rulesTitle}>
              GAME RULES
            </Text>

            <Text style={styles.rule}>
              • Pocket white coins to score
            </Text>

            <Text style={styles.rule}>
              • Black coins belong to CPU
            </Text>

            <Text style={styles.rule}>
              • Queen gives 3 points
            </Text>

            <Text style={styles.rule}>
              • Clear the board to win
            </Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CarromCPU;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070B20",
  },

  container: {
    flex: 1,
    backgroundColor: "#10183D",
  },

  header: {
    height: 75,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#151E4C",
    borderBottomWidth: 1,
    borderBottomColor: "#34417A",
  },

  back: {
    color: "#FFFFFF",
    fontSize: 40,
    width: 45,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    color: "#8898D0",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },

  difficulty: {
    alignItems: "center",
  },

  robot: {
    fontSize: 22,
  },

  easy: {
    color: "#FF9D00",
    fontSize: 9,
    fontWeight: "900",
  },

  scoreRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  playerCard: {
    width: 105,
    paddingVertical: 8,
    borderRadius: 13,
    alignItems: "center",
    backgroundColor: "#1D2857",
    borderWidth: 1,
    borderColor: "#35447F",
  },

  activePlayer: {
    borderColor: "#FF9900",
    backgroundColor: "#29366F",
  },

  playerName: {
    color: "#AAB8E5",
    fontSize: 10,
    fontWeight: "900",
  },

  score: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  vs: {
    color: "#7180B3",
    marginHorizontal: 15,
    fontWeight: "900",
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    alignItems: "center",
  },

  turnBox: {
    width: "100%",
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#202C62",
  },

  turnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },

  rules: {
    width: "100%",
    marginTop: 20,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#151E45",
    borderWidth: 1,
    borderColor: "#303D70",
  },

  rulesTitle: {
    color: "#FF9D00",
    fontWeight: "900",
    fontSize: 12,
    marginBottom: 8,
  },

  rule: {
    color: "#AAB5D6",
    fontSize: 11,
    marginTop: 4,
  },
});