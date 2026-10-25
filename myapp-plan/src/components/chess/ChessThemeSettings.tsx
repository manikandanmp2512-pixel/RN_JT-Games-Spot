import type {
  BoardImageTheme,
  ChessPieceSet,
} from "@/components/chess/ChessBoard";
import {
  CHESS_BOARD_THEME_STORAGE_KEY,
  CHESS_PIECE_SET_STORAGE_KEY,
} from "@/components/chess/ChessBoard";
import type { Difficulty } from "@/types/chess";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BOARD_OPTIONS: { id: BoardImageTheme; image: number; label: string }[] = [
  {
    id: "images_1",
    image: require("@/assets/chess/images_1.png"),
    label: "Board 1",
  },
  {
    id: "images_2",
    image: require("@/assets/chess/images_2.png"),
    label: "Board 2",
  },
  {
    id: "images_3",
    image: require("@/assets/chess/images_3.png"),
    label: "Board 3",
  },
  {
    id: "images_4",
    image: require("@/assets/chess/images_4.png"),
    label: "Board 4",
  },
  {
    id: "images_5",
    image: require("@/assets/chess/images_5.png"),
    label: "Board 5",
  },
  {
    id: "images_6",
    image: require("@/assets/chess/images_6.png"),
    label: "Board 6",
  },
  {
    id: "images_7",
    image: require("@/assets/chess/images_7.png"),
    label: "Board 7",
  },
  {
    id: "images_8",
    image: require("@/assets/chess/images_8.png"),
    label: "Board 8",
  },
  {
    id: "images_9",
    image: require("@/assets/chess/images_9.png"),
    label: "Board 9",
  },
  {
    id: "images_10",
    image: require("@/assets/chess/images_10.png"),
    label: "Board 10",
  },
];

type PieceOption = {
  id: ChessPieceSet;
  label: string;
  previewImages: number[];
};

const PIECE_OPTIONS: PieceOption[] = [
  {
    id: "set_1",
    label: "Classic",
    previewImages: [
      require("@/assets/chess-pieces/white_p.png"),
      require("@/assets/chess-pieces/white_n.png"),
      require("@/assets/chess-pieces/white_q.png"),
      require("@/assets/chess-pieces/black_k.png"),
    ],
  },
  {
    id: "set_2",
    label: "Piece Set 2",
    previewImages: [
      require("@/assets/chess-pieces/set_2/white_p.png"),
      require("@/assets/chess-pieces/set_2/white_n.png"),
      require("@/assets/chess-pieces/set_2/white_q.png"),
      require("@/assets/chess-pieces/set_2/black_k.png"),
    ],
  },
  {
    id: "set_3",
    label: "Piece Set 3",
    previewImages: [
      require("@/assets/chess-pieces/set_3/white_p.png"),
      require("@/assets/chess-pieces/set_3/white_n.png"),
      require("@/assets/chess-pieces/set_3/white_q.png"),
      require("@/assets/chess-pieces/set_3/black_k.png"),
    ],
  },
  {
    id: "set_4",
    label: "Piece Set 4",
    previewImages: [
      require("@/assets/chess-pieces/set_4/white_p.png"),
      require("@/assets/chess-pieces/set_4/white_n.png"),
      require("@/assets/chess-pieces/set_4/white_q.png"),
      require("@/assets/chess-pieces/set_4/black_k.png"),
    ],
  },
];

type Props = {
  pieceSet?: ChessPieceSet;
  onPieceSetChange?: (pieceSet: ChessPieceSet) => void;
  visible: boolean;
  theme: BoardImageTheme;
  onThemeChange: (theme: BoardImageTheme) => void;
  difficulty?: Difficulty;
  onDifficultyChange?: (difficulty: Difficulty) => void;
  showDifficulty?: boolean;
  onClose: () => void;
};

export default function ChessThemeSettings({
  pieceSet,
  onPieceSetChange,
  visible,
  theme,
  onThemeChange,
  difficulty = "medium",
  onDifficultyChange,
  showDifficulty = false,
  onClose,
}: Props) {
  const [selectedTheme, setSelectedTheme] = useState<BoardImageTheme>(
    theme || "images_1"
  );
  const [selectedPieceSet, setSelectedPieceSet] = useState<ChessPieceSet>(
    pieceSet || "set_1"
  );

  useEffect(() => {
    setSelectedTheme(theme || "images_1");
  }, [theme, visible]);

  useEffect(() => {
    let active = true;

    if (pieceSet) {
      setSelectedPieceSet(pieceSet);
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(CHESS_PIECE_SET_STORAGE_KEY)
      .then((savedSet) => {
        if (
          active &&
          (savedSet === "set_1" ||
            savedSet === "set_2" ||
            savedSet === "set_3" ||
            savedSet === "set_4")
        ) {
          setSelectedPieceSet(savedSet);
        }
      })
      .catch((error) => {
        console.warn("Could not load chess piece style:", error);
      });

    return () => {
      active = false;
    };
  }, [pieceSet, visible]);

  const chooseTheme = async (nextTheme: BoardImageTheme) => {
    setSelectedTheme(nextTheme);
    onThemeChange(nextTheme);
    try {
      await AsyncStorage.setItem(CHESS_BOARD_THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn("Could not save chess board image:", error);
    }
  };

  const choosePieceSet = async (nextSet: ChessPieceSet) => {
    setSelectedPieceSet(nextSet);
    onPieceSetChange?.(nextSet);
    try {
      await AsyncStorage.setItem(CHESS_PIECE_SET_STORAGE_KEY, nextSet);
    } catch (error) {
      console.warn("Could not save chess piece style:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>PERSONALIZE YOUR GAME</Text>
              <Text style={styles.title}>Board Background</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {BOARD_OPTIONS.map((option) => {
              const isSelected = selectedTheme === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => void chooseTheme(option.id)}
                  style={[
                    styles.imageOption,
                    isSelected && styles.imageOptionSelected,
                  ]}
                >
                  <Image
                    source={option.image}
                    resizeMode="cover"
                    style={styles.previewImage}
                  />
                  <View style={styles.optionFooter}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {isSelected ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.selectedCaption}>
            Selected:{" "}
            {BOARD_OPTIONS.find((option) => option.id === selectedTheme)
              ?.label || "Board 1"}
          </Text>

          <View style={styles.pieceSection}>
            <Text style={styles.sectionTitle}>Chess piece style</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {PIECE_OPTIONS.map((option) => {
              const isSelected = selectedPieceSet === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => void choosePieceSet(option.id)}
                  style={[
                    styles.pieceOption,
                    isSelected && styles.imageOptionSelected,
                  ]}
                >
                  <View style={styles.piecePreviewRow}>
                    {option.previewImages.map((source, index) => (
                      <Image
                        key={`${option.id}-${index}`}
                        source={source}
                        resizeMode="contain"
                        style={styles.piecePreviewImage}
                      />
                    ))}
                  </View>
                  <View style={styles.optionFooter}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {isSelected ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.selectedCaption}>
            Selected piece style:{" "}
            {PIECE_OPTIONS.find((option) => option.id === selectedPieceSet)
              ?.label || "Classic"}
          </Text>

          {showDifficulty && onDifficultyChange ? (
            <View style={styles.difficultySection}>
              <Text style={styles.difficultyTitle}>CPU difficulty</Text>
              <View style={styles.difficultyRow}>
                {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => onDifficultyChange(level)}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.difficultyButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        difficulty === level && styles.difficultyTextSelected,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    maxHeight: "94%",
    backgroundColor: "#010a43",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 22,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: "#32677D",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: "#FFB13B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
  },
  title: { color: "#FFFFFF", fontSize: 23, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#B9D0D9", fontSize: 12, lineHeight: 18, marginTop: 5 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17475B",
  },
  closeText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  carousel: { paddingHorizontal: 18, paddingBottom: 8, gap: 12 },
  imageOption: {
    width: 154,
    borderRadius: 16,
    padding: 5,
    backgroundColor: "#123E51",
    borderWidth: 2,
    borderColor: "#24576B",
  },
  imageOptionSelected: { borderColor: "#FFAA22", backgroundColor: "#011a8a" },
  previewImage: { width: "100%", height: 142, borderRadius: 11 },
  optionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    paddingVertical: 8,
  },
  optionLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  checkmark: { color: "#FFB13B", fontSize: 17, fontWeight: "900" },
  selectedCaption: {
    color: "#FFD38B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
    marginHorizontal: 20,
  },
  pieceSection: { marginHorizontal: 20, marginTop: 18, marginBottom: 7 },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  pieceOption: {
    width: 190,
    borderRadius: 16,
    padding: 8,
    backgroundColor: "#123E51",
    borderWidth: 2,
    borderColor: "#24576B",
  },
  piecePreviewRow: {
    height: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#F0E6D2",
    borderRadius: 11,
    paddingHorizontal: 5,
  },
  piecePreviewImage: { width: 38, height: 72 },
  difficultySection: { marginHorizontal: 20, marginTop: 19 },
  difficultyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 9,
  },
  difficultyRow: { flexDirection: "row", gap: 8 },
  difficultyButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#123E51",
    borderWidth: 1,
    borderColor: "#2C6479",
  },
  difficultyButtonSelected: {
    backgroundColor: "#010e84",
    borderColor: "#FFC45B",
  },
  difficultyText: { color: "#D8E8EE", fontSize: 12, fontWeight: "800" },
  difficultyTextSelected: { color: "white" },
  doneButton: {
    height: 49,
    marginHorizontal: 20,
    marginTop: 21,
    borderRadius: 14,
    backgroundColor: "#FF9200",
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
});
