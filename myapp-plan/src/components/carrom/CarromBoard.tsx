import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    BOARD_SIZE,
    Coin,
    getPocketPositions,
    Striker,
} from "./CarromGameEngine";

type Props = {
  coins: Coin[];
  striker: Striker;
  angle: number;
  power: number;
};

const CarromBoard = ({
  coins,
  striker,
  angle,
  power,
}: Props) => {
  const pockets = getPocketPositions();

  return (
    <View style={styles.wrapper}>
      <View style={styles.board}>

        {/* Wooden Border */}
        <View style={styles.innerBoard}>

          {/* Center Circle */}
          <View style={styles.centerCircle}>
            <View style={styles.centerDot} />
          </View>

          {/* Center Lines */}
          <View style={styles.verticalLine} />
          <View style={styles.horizontalLine} />

          {/* Pockets */}
          {pockets.map((pocket, index) => (
            <View
              key={index}
              style={[
                styles.pocket,
                {
                  left: pocket.x - 18,
                  top: pocket.y - 18,
                },
              ]}
            />
          ))}

          {/* Coins */}
          {coins.map((coin) => {
            if (coin.pocketed) return null;

            return (
              <View
                key={coin.id}
                style={[
                  styles.coin,
                  {
                    left: coin.x - 9,
                    top: coin.y - 9,
                    backgroundColor:
                      coin.color === "white"
                        ? "#F4F4F4"
                        : coin.color === "black"
                        ? "#171717"
                        : "#E53935",
                  },
                ]}
              >
                {coin.color === "queen" && (
                  <Text style={styles.queen}>
                    Q
                  </Text>
                )}
              </View>
            );
          })}

          {/* Aim Line */}
          <View
            style={[
              styles.aimLine,
              {
                left: striker.x,
                top: striker.y,
                width: 100 + power,
                transform: [
                  {
                    rotate: `${angle}deg`,
                  },
                ],
              },
            ]}
          />

          {/* Striker */}
          <View
            style={[
              styles.striker,
              {
                left: striker.x - 13,
                top: striker.y - 13,
              },
            ]}
          >
            <View style={styles.strikerInner} />
          </View>

        </View>
      </View>
    </View>
  );
};

export default CarromBoard;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  board: {
    width: BOARD_SIZE + 20,
    height: BOARD_SIZE + 20,
    padding: 10,
    borderRadius: 25,
    backgroundColor: "#8A4B20",
    elevation: 10,
  },

  innerBoard: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: "#DDA56B",
    borderWidth: 5,
    borderColor: "#713713",
  },

  centerCircle: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#7B3F18",
    left: 115,
    top: 115,
    alignItems: "center",
    justifyContent: "center",
  },

  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E53935",
  },

  verticalLine: {
    position: "absolute",
    width: 2,
    height: 70,
    backgroundColor: "#7B3F18",
    left: 159,
    top: 0,
  },

  horizontalLine: {
    position: "absolute",
    height: 2,
    width: 70,
    backgroundColor: "#7B3F18",
    left: 0,
    top: 159,
  },

  pocket: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111111",
    borderWidth: 4,
    borderColor: "#52240E",
  },

  coin: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#5B321C",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  queen: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },

  striker: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  strikerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
  },

  aimLine: {
    position: "absolute",
    height: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.65,
    transformOrigin: "left center",
  },
});