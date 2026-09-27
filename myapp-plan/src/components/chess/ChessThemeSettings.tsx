import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ChessBoardTheme,
  Difficulty,
} from "@/types/chess";

type Props = {
  visible: boolean;

  theme: ChessBoardTheme;
  onThemeChange: (theme: ChessBoardTheme) => void;

  difficulty?: Difficulty;
  onDifficultyChange?: (difficulty: Difficulty) => void;

  showDifficulty?: boolean;

  onClose: () => void;
};

const THEMES: {
  id: ChessBoardTheme;
  title: string;
  subtitle: string;
  image: any;
}[] = [
  {
    id: "wood",
    title: "Wood",
    subtitle: "Classic wooden board",
    image: require("@/assets/chess/images_1.png"),
  },
  {
    id: "marble",
    title: "Marble",
    subtitle: "Premium marble style",
    image: require("@/assets/chess/images_2.png"),
  },
  {
    id: "neon",
    title: "Neon",
    subtitle: "Modern neon board",
    image: require("@/assets/chess/images_3.png"),
  },
];

const DIFFICULTIES: {
  id: Difficulty;
  title: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "simple",
    title: "Simple",
    icon: "🙂",
    description: "Easy opponent",
  },
  {
    id: "medium",
    title: "Medium",
    icon: "🧠",
    description: "Balanced opponent",
  },
  {
    id: "complex",
    title: "Complex",
    icon: "🔥",
    description: "Strong opponent",
  },
];

export default function ChessThemeSettings({
  visible,
  theme,
  onThemeChange,
  difficulty = "medium",
  onDifficultyChange,
  showDifficulty = false,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                Chess Settings
              </Text>

              <Text style={styles.subtitle}>
                Customize your chess experience
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >

            {/* BOARD THEME */}
            <Text style={styles.sectionTitle}>
              BOARD BACKGROUND
            </Text>

            <Text style={styles.sectionDescription}>
              Choose the background image for your chess board.
            </Text>

            <View style={styles.themeGrid}>
              {THEMES.map((item) => {
                const selected = theme === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onThemeChange(item.id)}
                    style={[
                      styles.themeItem,
                      selected && styles.themeSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.preview,
                        {
                          backgroundColor:
                            item.id === "wood"
                              ? "#70411F"
                              : item.id === "marble"
                              ? "#D7D7D7"
                              : "#151B38",
                        },
                      ]}
                    >
                      <Text style={styles.previewIcon}>
                        {item.id === "wood"
                          ? "♜"
                          : item.id === "marble"
                          ? "♛"
                          : "♞"}
                      </Text>
                    </View>

                    <Text style={styles.themeTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.themeSubtitle}>
                      {item.subtitle}
                    </Text>

                    {selected && (
                      <View style={styles.check}>
                        <Text style={styles.checkText}>
                          ✓
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* DIFFICULTY */}
            {showDifficulty && (
              <>
                <Text style={[styles.sectionTitle, styles.difficultyHeading]}>
                  CPU DIFFICULTY
                </Text>

                <Text style={styles.sectionDescription}>
                  Choose how strong the computer opponent should be.
                </Text>

                <View style={styles.difficultyList}>
                  {DIFFICULTIES.map((item) => {
                    const selected =
                      difficulty === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          onDifficultyChange?.(item.id)
                        }
                        style={[
                          styles.difficultyItem,
                          selected &&
                            styles.difficultySelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.difficultyIcon,
                            selected &&
                              styles.difficultyIconSelected,
                          ]}
                        >
                          <Text style={styles.difficultyEmoji}>
                            {item.icon}
                          </Text>
                        </View>

                        <View style={styles.difficultyInfo}>
                          <Text style={styles.difficultyTitle}>
                            {item.title}
                          </Text>

                          <Text
                            style={
                              styles.difficultyDescription
                            }
                          >
                            {item.description}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.radio,
                            selected &&
                              styles.radioSelected,
                          ]}
                        >
                          {selected && (
                            <View
                              style={styles.radioDot}
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* DONE */}
            <Pressable
              onPress={onClose}
              style={styles.doneButton}
            >
              <Text style={styles.doneText}>
                Done
              </Text>
            </Pressable>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },

  card: {
    width: "100%",
    maxHeight: "88%",
    backgroundColor: "#102B3A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
  },

  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  subtitle: {
    color: "#8EAAB8",
    fontSize: 11,
    marginTop: 4,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#244F65",
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  sectionTitle: {
    color: "#F4A000",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  sectionDescription: {
    color: "#8EAAB8",
    fontSize: 11,
    marginBottom: 14,
    lineHeight: 17,
  },

  themeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  themeItem: {
    flex: 1,
    backgroundColor: "#183C4F",
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },

  themeSelected: {
    borderColor: "#F4A000",
  },

  preview: {
    height: 72,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  previewIcon: {
    color: "#FFFFFF",
    fontSize: 38,
  },

  themeTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
  },

  themeSubtitle: {
    color: "#8EAAB8",
    fontSize: 8,
    marginTop: 3,
  },

  check: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  difficultyHeading: {
    marginTop: 25,
  },

  difficultyList: {
    gap: 8,
  },

  difficultyItem: {
    minHeight: 65,
    borderRadius: 15,
    backgroundColor: "#183C4F",
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  difficultySelected: {
    borderColor: "#F4A000",
    backgroundColor: "#244F65",
  },

  difficultyIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#244F65",
    alignItems: "center",
    justifyContent: "center",
  },

  difficultyIconSelected: {
    backgroundColor: "#F4A000",
  },

  difficultyEmoji: {
    fontSize: 22,
  },

  difficultyInfo: {
    flex: 1,
    marginLeft: 12,
  },

  difficultyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  difficultyDescription: {
    color: "#8EAAB8",
    fontSize: 10,
    marginTop: 3,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#65818D",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#F4A000",
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F4A000",
  },

  doneButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F4A000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },

  doneText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});