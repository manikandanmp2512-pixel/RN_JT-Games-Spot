import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type LudoDiceProps = {
  value: number;
  disabled?: boolean;
  onPress: () => void;
};

const diceFaces: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

const LudoDice = ({
  value,
  disabled = false,
  onPress,
}: LudoDiceProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.dice,
          disabled && styles.disabled,
        ]}
      >
        <Text style={styles.diceText}>
          {diceFaces[value] || "⚄"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>
        {disabled ? "WAIT..." : "ROLL DICE"}
      </Text>
    </View>
  );
};

export default LudoDice;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },

  dice: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#E6B92E",
    elevation: 8,
  },

  disabled: {
    opacity: 0.45,
  },

  diceText: {
    fontSize: 52,
    color: "#172A38",
  },

  label: {
    marginTop: 7,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#B9CCD5",
  },
});