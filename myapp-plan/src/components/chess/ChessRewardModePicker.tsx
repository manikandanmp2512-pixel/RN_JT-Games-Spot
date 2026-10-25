import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ChessRewardMode,
  ChessRewardModeId,
} from "@/types/chessRewards";

import { fetchChessRewardModes } from "@/services/chessRewardApi";

type Props = {
  selectedMode: ChessRewardModeId;
  onSelectMode: (mode: ChessRewardMode) => void;
  disabled?: boolean;
};

export default function ChessRewardModePicker({
  selectedMode,
  onSelectMode,
  disabled = false,
}: Props) {
  const [modes, setModes] = useState<ChessRewardMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadModes() {
      try {
        setLoading(true);
        setError("");

        const result = await fetchChessRewardModes();

        if (active) {
          setModes(result);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load game modes. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadModes();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#F4A000" />
        <Text style={styles.muted}>Loading game modes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.muted}>
          Check your backend connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose Online Game</Text>
      <Text style={styles.subtitle}>
        Select a mode to see its virtual coin rewards.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {modes.map((mode) => {
          const selected = selectedMode === mode.id;

          return (
            <Pressable
              key={mode.id}
              disabled={disabled}
              onPress={() => onSelectMode(mode)}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              style={[
                styles.card,
                selected && styles.selectedCard,
                disabled && styles.disabledCard,
              ]}
            >
              <Text style={styles.modeName}>{mode.name}</Text>

              <Text style={styles.entry}>
                {mode.entryCoins === 0
                  ? "Free to play"
                  : `${mode.entryCoins} virtual coins`}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.rewardLabel}>Winner reward</Text>
              <Text style={styles.winnerReward}>
                {mode.winnerCoins} coins
              </Text>

              <Text style={styles.rewardLabel}>Other player</Text>
              <Text style={styles.otherReward}>
                {mode.loserCoins} coins
              </Text>

              {selected && (
                <Text style={styles.selectedText}>Selected</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* <Text style={styles.disclaimer}>
        Virtual coins have no cash value and cannot be withdrawn or
        transferred. Selecting a mode does not start a match.
      </Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 12,
  },
  center: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  heading: {
    color: "#F4A000",
    fontSize: 21,
    fontWeight: "800",
  },
  subtitle: {
    color: "#B8C9D2",
    fontSize: 13,
  },
  muted: {
    color: "#B8C9D2",
    fontSize: 13,
  },
  error: {
    color: "#FF7777",
    textAlign: "center",
  },
  list: {
    gap: 12,
    paddingVertical: 8,
    paddingRight: 12,
  },
  card: {
    alignItems: "center",
    width: 164,
    maxHeight: 230,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#244F65",
    backgroundColor: "#0C2A3A",
    gap: 7,
  },
  selectedCard: {
    borderColor: "#F4A000",
    borderWidth: 2,
    backgroundColor: "#173A4B",
  },
  disabledCard: {
    opacity: 0.6,
  },
  modeName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  entry: {
    color: "#F4A000",
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#244F65",
    marginVertical: 4,
  },
  rewardLabel: {
    color: "#B8C9D2",
    fontSize: 11,
  },
  winnerReward: {
    color: "#5CE0A0",
    fontSize: 19,
    fontWeight: "800",
  },
  otherReward: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  selectedText: {
    color: "#F4A000",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  disclaimer: {
    color: "#9EB1BC",
    fontSize: 11,
    lineHeight: 16,
  },
});