import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type ChessSettings = {
  sound: boolean;
  showLastMove: boolean;
  pieceAnimation: boolean;
  showMoveHelp: boolean;
  confirmMoves: boolean;
  autoPromoteQueen: boolean;
  premove: boolean;
  showChat: boolean;
};

export const DEFAULT_CHESS_SETTINGS: ChessSettings = {
  sound: true,
  showLastMove: false,
  pieceAnimation: true,
  showMoveHelp: false,
  confirmMoves: false,
  autoPromoteQueen: true,
  premove: true,
  showChat: true,
};

const STORAGE_KEY = "@jaytech/chess-settings-v1";

export function useChessSettings() {
  const [settings, setSettings] =
    useState<ChessSettings>(DEFAULT_CHESS_SETTINGS);
  const settingsRef = useRef<ChessSettings>(DEFAULT_CHESS_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const next = {
            ...DEFAULT_CHESS_SETTINGS,
            ...parsed,
          } as ChessSettings;

          if (alive) {
            settingsRef.current = next;
            setSettings(next);
          }
        }
      } catch (error) {
        console.log("Chess settings load error:", error);
      } finally {
        if (alive) setLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const updateSettings = async (patch: Partial<ChessSettings>) => {
    // Use a ref so rapid successive toggles don't read stale React state.
    const next = {
      ...settingsRef.current,
      ...patch,
    };

    settingsRef.current = next;
    setSettings(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log("Chess settings save error:", error);
    }
  };

  const toggle = async (key: keyof ChessSettings) => {
    await updateSettings({
      [key]: !settingsRef.current[key],
    } as Partial<ChessSettings>);
  };

  return {
    settings,
    updateSettings,
    toggle,
    loaded,
  };
}

type SettingKey = keyof ChessSettings;

type ChessGameSettingsProps = {
  visible: boolean;
  settings: ChessSettings;
  onToggle: (key: SettingKey) => void;
  onClose: () => void;
};

const ROWS: Array<{
  key: SettingKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "sound", label: "Sound", icon: "volume-high-outline" },
  { key: "showLastMove", label: "Show last move", icon: "scan-outline" },
  { key: "pieceAnimation", label: "Piece animation", icon: "copy-outline" },
  { key: "showMoveHelp", label: "Show move help", icon: "help-circle-outline" },
  { key: "confirmMoves", label: "Confirm my moves", icon: "checkmark-outline" },
  { key: "autoPromoteQueen", label: "Auto promote queen", icon: "trophy-outline" },
  { key: "premove", label: "Premove", icon: "time-outline" },
  { key: "showChat", label: "Show chat", icon: "chatbox-ellipses-outline" },
];

export default function ChessGameSettings({
  visible,
  settings,
  onToggle,
  onClose,
}: ChessGameSettingsProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.card}>
          <Text style={styles.title}>Settings</Text>

          <View style={styles.rows}>
            {ROWS.map((row, index) => {
              const enabled = settings[row.key];

              return (
                <View
                  key={row.key}
                  style={[
                    styles.row,
                    index === ROWS.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={styles.labelWrap}>
                    <Ionicons name={row.icon} size={25} color="#ffffff" />
                    <Text style={styles.label}>{row.label}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel={row.label}
                    accessibilityState={{ checked: enabled }}
                    onPress={() => onToggle(row.key)}
                    style={[
                      styles.switch,
                      enabled ? styles.switchOn : styles.switchOff,
                    ]}
                  >
                    <View
                      style={[
                        styles.thumb,
                        enabled ? styles.thumbOn : styles.thumbOff,
                      ]}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#08789A",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    color: "#ffffff",
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
    paddingTop: 19,
    paddingBottom: 13,
  },
  rows: {
    paddingHorizontal: 15,
    paddingBottom: 9,
  },
  row: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.09)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 3,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  label: {
    color: "#ffffff",
    fontSize: 15.5,
    fontWeight: "900",
    marginLeft: 14,
  },
  switch: {
    width: 52,
    height: 30,
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchOn: {
    backgroundColor: "#b9c4ca",
  },
  switchOff: {
    backgroundColor: "#9ca7ad",
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  thumbOn: {
    alignSelf: "flex-end",
    backgroundColor: "#ff8b00",
  },
  thumbOff: {
    alignSelf: "flex-start",
    backgroundColor: "#c7c9ca",
  },
});
