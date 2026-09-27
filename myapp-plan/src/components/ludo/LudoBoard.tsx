import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    Token,
    getAbsolutePosition,
    isSafeCell,
} from "./LudoGameEngine";

type LudoBoardProps = {
  yourTokens: Token[];
  cpuTokens: Token[];
  selectedToken: number | null;
  onTokenPress: (tokenId: number) => void;
};

const PATH_SIZE = 52;

const LudoBoard = ({
  yourTokens,
  cpuTokens,
  selectedToken,
  onTokenPress,
}: LudoBoardProps) => {
  const allTokens = [...yourTokens, ...cpuTokens];

  const getTokensAtPosition = (position: number) => {
    return allTokens.filter(
      (token) =>
        !token.finished &&
        getAbsolutePosition(token) === position
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.board}>

        {/* TOP LEFT HOME */}
        <View style={[styles.homeArea, styles.redHome]}>
          <Text style={styles.homeEmoji}>🔴</Text>

          <View style={styles.homeTokens}>
            {cpuTokens.map((token) => (
              <View
                key={token.id}
                style={[
                  styles.homeToken,
                  styles.redToken,
                ]}
              />
            ))}
          </View>
        </View>

        {/* TOP RIGHT HOME */}
        <View style={[styles.homeArea, styles.greenHome]}>
          <Text style={styles.homeEmoji}>🟢</Text>

          <View style={styles.homeTokens}>
            <View style={[styles.homeToken, styles.greenToken]} />
            <View style={[styles.homeToken, styles.greenToken]} />
            <View style={[styles.homeToken, styles.greenToken]} />
            <View style={[styles.homeToken, styles.greenToken]} />
          </View>
        </View>

        {/* BOTTOM LEFT HOME */}
        <View style={[styles.homeArea, styles.yellowHome]}>
          <Text style={styles.homeEmoji}>🟡</Text>

          <View style={styles.homeTokens}>
            {yourTokens.map((token) => (
              <TouchableOpacity
                key={token.id}
                onPress={() => onTokenPress(token.id)}
                activeOpacity={0.75}
                style={[
                  styles.homeToken,
                  styles.yellowToken,
                  selectedToken === token.id &&
                    styles.selectedToken,
                ]}
              />
            ))}
          </View>
        </View>

        {/* BOTTOM RIGHT HOME */}
        <View style={[styles.homeArea, styles.blueHome]}>
          <Text style={styles.homeEmoji}>🔵</Text>

          <View style={styles.homeTokens}>
            <View style={[styles.homeToken, styles.blueToken]} />
            <View style={[styles.homeToken, styles.blueToken]} />
            <View style={[styles.homeToken, styles.blueToken]} />
            <View style={[styles.homeToken, styles.blueToken]} />
          </View>
        </View>

        {/* CENTER */}
        <View style={styles.centerArea}>
          <View style={styles.centerTriangleRed} />
          <View style={styles.centerTriangleGreen} />
          <View style={styles.centerTriangleYellow} />
          <View style={styles.centerTriangleBlue} />

          <View style={styles.centerCircle}>
            <Text style={styles.centerText}>★</Text>
          </View>
        </View>

        {/* PATH */}
        <View style={styles.pathArea}>
          {Array.from({ length: PATH_SIZE }).map(
            (_, index) => {
              const tokens =
                getTokensAtPosition(index);

              const safe = isSafeCell(index);

              return (
                <View
                  key={index}
                  style={[
                    styles.pathCell,
                    safe && styles.safeCell,
                  ]}
                >
                  {safe && (
                    <Text style={styles.star}>
                      ★
                    </Text>
                  )}

                  {tokens.map((token, tokenIndex) => {
                    const isYou =
                      token.player === "YOU";

                    return (
                      <TouchableOpacity
                        key={`${token.player}-${token.id}`}
                        onPress={() =>
                          isYou &&
                          onTokenPress(token.id)
                        }
                        activeOpacity={0.8}
                        style={[
                          styles.boardToken,
                          isYou
                            ? styles.yellowBoardToken
                            : styles.redBoardToken,
                          {
                            transform: [
                              {
                                translateX:
                                  tokenIndex * 5,
                              },
                              {
                                translateY:
                                  tokenIndex * -5,
                              },
                            ],
                          },
                        ]}
                      >
                        <Text style={styles.tokenNumber}>
                          {token.id + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            }
          )}
        </View>
      </View>

      {/* PLAYER LABELS */}
      <View style={styles.playerLabels}>
        <View style={styles.playerLabel}>
          <View
            style={[
              styles.playerDot,
              styles.cpuDot,
            ]}
          />
          <Text style={styles.playerText}>
            CPU
          </Text>
        </View>

        <View style={styles.playerLabel}>
          <View
            style={[
              styles.playerDot,
              styles.youDot,
            ]}
          />
          <Text style={styles.playerText}>
            YOU
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LudoBoard;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginTop: 12,
  },

  board: {
    width: 350,
    height: 350,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F7F2E8",
    borderWidth: 5,
    borderColor: "#D5B77A",
    position: "relative",
  },

  homeArea: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },

  redHome: {
    top: 8,
    left: 8,
    backgroundColor: "#FFE0E0",
    borderColor: "#E34D5B",
  },

  greenHome: {
    top: 8,
    right: 8,
    backgroundColor: "#DDF7E5",
    borderColor: "#3BB86B",
  },

  yellowHome: {
    bottom: 8,
    left: 8,
    backgroundColor: "#FFF4BF",
    borderColor: "#E7B72C",
  },

  blueHome: {
    bottom: 8,
    right: 8,
    backgroundColor: "#DDEBFF",
    borderColor: "#4B86E8",
  },

  homeEmoji: {
    fontSize: 24,
    marginBottom: 7,
  },

  homeTokens: {
    width: 82,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },

  homeToken: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
  },

  redToken: {
    backgroundColor: "#E74C5A",
    borderColor: "#A92330",
  },

  greenToken: {
    backgroundColor: "#36B96B",
    borderColor: "#198348",
  },

  yellowToken: {
    backgroundColor: "#F6C82F",
    borderColor: "#BD8B00",
  },

  blueToken: {
    backgroundColor: "#4C89EA",
    borderColor: "#2458A8",
  },

  selectedToken: {
    borderWidth: 4,
    borderColor: "#FF7A00",
    transform: [
      {
        scale: 1.18,
      },
    ],
  },

  centerArea: {
    position: "absolute",
    width: 100,
    height: 100,
    left: 125,
    top: 125,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D6C7A8",
  },

  centerTriangleRed: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 50,
    borderBottomWidth: 50,
    borderLeftWidth: 50,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#E34D5B",
  },

  centerTriangleGreen: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 50,
    borderBottomWidth: 50,
    borderRightWidth: 50,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#3BB86B",
  },

  centerTriangleYellow: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 50,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#F6C82F",
  },

  centerTriangleBlue: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 50,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#4C89EA",
  },

  centerCircle: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    left: 29,
    top: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  centerText: {
    fontSize: 23,
    color: "#FF8A00",
  },

  pathArea: {
    position: "absolute",
    left: 70,
    top: 70,
    width: 210,
    height: 210,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    padding: 7,
  },

  pathCell: {
    width: 27,
    height: 27,
    margin: 1,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7D0C3",
    alignItems: "center",
    justifyContent: "center",
  },

  safeCell: {
    backgroundColor: "#FFF0C2",
  },

  star: {
    fontSize: 11,
    color: "#D79800",
  },

  boardToken: {
    position: "absolute",
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    zIndex: 10,
  },

  yellowBoardToken: {
    backgroundColor: "#F6C82F",
    borderColor: "#9E7300",
  },

  redBoardToken: {
    backgroundColor: "#E74C5A",
    borderColor: "#9F1E2B",
  },

  tokenNumber: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  playerLabels: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 35,
    marginTop: 10,
  },

  playerLabel: {
    flexDirection: "row",
    alignItems: "center",
  },

  playerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },

  cpuDot: {
    backgroundColor: "#E34D5B",
  },

  youDot: {
    backgroundColor: "#F6C82F",
  },

  playerText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#DCE9EF",
  },
});