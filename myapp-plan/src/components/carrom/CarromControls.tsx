import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  angle: number;
  power: number;
  onAngleChange: (value: number) => void;
  onPowerChange: (value: number) => void;
  onShoot: () => void;
};

const CarromControls = ({
  angle,
  power,
  onAngleChange,
  onPowerChange,
  onShoot,
}: Props) => {
  return (
    <View style={styles.container}>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() =>
            onAngleChange(angle - 10)
          }
        >
          <Text style={styles.controlText}>
            ◀
          </Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.label}>
            AIM
          </Text>

          <Text style={styles.value}>
            {angle}°
          </Text>
        </View>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() =>
            onAngleChange(angle + 10)
          }
        >
          <Text style={styles.controlText}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.powerBox}>
        <Text style={styles.powerTitle}>
          POWER
        </Text>

        <View style={styles.powerTrack}>
          <View
            style={[
              styles.powerFill,
              {
                width: `${power}%`,
              },
            ]}
          />
        </View>

        <View style={styles.powerButtons}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              onPowerChange(
                Math.max(10, power - 10)
              )
            }
          >
            <Text style={styles.buttonText}>
              −
            </Text>
          </TouchableOpacity>

          <Text style={styles.powerValue}>
            {power}%
          </Text>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              onPowerChange(
                Math.min(100, power + 10)
              )
            }
          >
            <Text style={styles.buttonText}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.shootButton}
        onPress={onShoot}
        activeOpacity={0.8}
      >
        <Text style={styles.shootIcon}>
          🎯
        </Text>

        <Text style={styles.shootText}>
          SHOOT
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default CarromControls;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 15,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  controlButton: {
    width: 52,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#263A78",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#586FC5",
  },

  controlText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  info: {
    alignItems: "center",
  },

  label: {
    color: "#91A5E8",
    fontSize: 11,
    fontWeight: "800",
  },

  value: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  powerBox: {
    marginTop: 15,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "#182654",
  },

  powerTitle: {
    color: "#AAB8EA",
    fontSize: 11,
    fontWeight: "900",
  },

  powerTrack: {
    height: 9,
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#343E63",
  },

  powerFill: {
    height: "100%",
    backgroundColor: "#FF9D00",
    borderRadius: 10,
  },

  powerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },

  smallButton: {
    width: 35,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#354B8E",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  powerValue: {
    width: 70,
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "900",
  },

  shootButton: {
    height: 62,
    marginTop: 15,
    borderRadius: 18,
    backgroundColor: "#FF8A00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },

  shootIcon: {
    fontSize: 25,
    marginRight: 10,
  },

  shootText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 1,
  },
});