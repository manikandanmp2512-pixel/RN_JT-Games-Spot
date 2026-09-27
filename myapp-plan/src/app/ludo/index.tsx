import { router } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LudoHome = () => {
  const [selectedModes, setSelectedModes] =
    useState<string[]>(["classic"]);

  const gameModes = [
    {
      id: "classic",
      title: "Classic",
      icon: "🎲",
      subtitle: "Traditional Ludo",
    },
    {
      id: "quick",
      title: "Quick",
      icon: "⚡",
      subtitle: "Fast gameplay",
    },
    {
      id: "master",
      title: "Master",
      icon: "👑",
      subtitle: "Advanced rules",
    },
  ];

  // ============================================================
  // MODE SELECTION
  // ============================================================

  const toggleMode = (id: string) => {
    setSelectedModes((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        );
      }

      return [...previous, id];
    });
  };

  // ============================================================
  // GAME NAVIGATION
  // ============================================================

  const playOnline = () => {
    router.push("/ludo/online");
  };

  const playCPU = () => {
    router.push("/ludo/cpu");
  };

  // ============================================================
  // PROFILE NAVIGATION
  // Same concept as Chess / Carrom
  // ============================================================

  const goToProfile = () => {
    router.replace("/user");
  };

  // ============================================================
  // LUDO HOME
  // ============================================================

  const goToLudoHome = () => {
    router.replace("/ludo");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#071E2B"
      />

      <View style={styles.container}>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>

          <View style={styles.headerLeft}>
            <Text style={styles.logo}>
              LUDO
            </Text>

            <Text style={styles.subtitle}>
              JAY TECH GAMING
            </Text>
          </View>

          <View style={styles.headerRight}>

            {/* ONLINE STATUS */}

            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />

              <Text style={styles.onlineText}>
                ONLINE
              </Text>
            </View>

            {/* PROFILE */}

            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.75}
              onPress={goToProfile}
            >
              <Text style={styles.profileIcon}>
                👤
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* TITLE */}

          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Let's Play Ludo
            </Text>

            <Text style={styles.description}>
              Choose your game mode and start
              rolling the dice.
            </Text>
          </View>

          {/* ===================================================
              GAME MODES
          =================================================== */}

          <View style={styles.modeContainer}>

            <View style={styles.modeHeader}>

              <Text style={styles.modeTitle}>
                GAME MODES
              </Text>

              <Text style={styles.modeCount}>
                {selectedModes.length} SELECTED
              </Text>

            </View>

            <View style={styles.modeGrid}>

              {gameModes.map((mode) => {

                const selected =
                  selectedModes.includes(mode.id);

                return (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() =>
                      toggleMode(mode.id)
                    }
                    activeOpacity={0.85}
                    style={[
                      styles.modeCard,
                      selected &&
                        styles.selectedModeCard,
                    ]}
                  >

                    <Text style={styles.modeIcon}>
                      {mode.icon}
                    </Text>

                    <Text style={styles.modeName}>
                      {mode.title}
                    </Text>

                    <Text style={styles.modeSubtitle}>
                      {mode.subtitle}
                    </Text>

                    {selected && (
                      <View
                        style={styles.checkCircle}
                      >
                        <Text
                          style={styles.checkText}
                        >
                          ✓
                        </Text>
                      </View>
                    )}

                  </TouchableOpacity>
                );
              })}

            </View>
          </View>

          {/* ===================================================
              ONLINE GAME
          =================================================== */}

          <TouchableOpacity
            onPress={playOnline}
            activeOpacity={0.85}
            style={styles.onlineButton}
          >

            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>
                🎮
              </Text>
            </View>

            <View style={styles.buttonContent}>

              <Text style={styles.buttonTitle}>
                Play Online
              </Text>

              <Text style={styles.buttonSubtitle}>
                Challenge a random player
              </Text>

            </View>

            <Text style={styles.arrow}>
              →
            </Text>

          </TouchableOpacity>

          {/* ===================================================
              CPU GAME
          =================================================== */}

          <TouchableOpacity
            onPress={playCPU}
            activeOpacity={0.85}
            style={styles.cpuButton}
          >

            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>
                🤖
              </Text>
            </View>

            <View style={styles.buttonContent}>

              <Text style={styles.buttonTitle}>
                Play CPU
              </Text>

              <Text style={styles.buttonSubtitle}>
                Practice against computer
              </Text>

            </View>

            <Text style={styles.arrow}>
              →
            </Text>

          </TouchableOpacity>

          {/* ===================================================
              HOW TO PLAY
          =================================================== */}

          <View style={styles.infoCard}>

            <Text style={styles.infoTitle}>
              🎯 HOW TO PLAY
            </Text>

            <Text style={styles.infoText}>
              Roll a 6 to bring your token onto
              the board. Move your tokens around
              the board and get all four home
              before your opponent.
            </Text>

          </View>

          <View style={styles.bottomSpace} />

        </ScrollView>

        {/* =====================================================
            BOTTOM NAVIGATION
        ===================================================== */}

        <LudoBottomNav
          activeTab="play"
          onPlay={goToLudoHome}
          onProfile={goToProfile}
        />

      </View>
    </SafeAreaView>
  );
};

export default LudoHome;

// ================================================================
// BOTTOM NAVIGATION
// ================================================================

type LudoBottomNavProps = {
  activeTab: "play" | "events" | "friends" | "profile";
  onPlay: () => void;
  onProfile: () => void;
};

const LudoBottomNav = ({
  activeTab,
  onPlay,
  onProfile,
}: LudoBottomNavProps) => {
  return (
    <View style={styles.bottomNav}>

      {/* PLAY */}

      <NavItem
        icon="🏠"
        title="Play"
        active={activeTab === "play"}
        onPress={onPlay}
      />

      {/* EVENTS */}

      <NavItem
        icon="🏆"
        title="Events"
        active={activeTab === "events"}
        onPress={() => {}}
      />

      {/* FRIENDS */}

      <NavItem
        icon="👥"
        title="Friends"
        active={activeTab === "friends"}
        onPress={() => {}}
      />

      {/* PROFILE */}

      <NavItem
        icon="👤"
        title="Profile"
        active={activeTab === "profile"}
        onPress={onProfile}
      />

    </View>
  );
};

// ================================================================
// NAV ITEM
// ================================================================

type NavItemProps = {
  icon: string;
  title: string;
  active?: boolean;
  onPress?: () => void;
};

const NavItem = ({
  icon,
  title,
  active = false,
  onPress,
}: NavItemProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active && styles.activeNavItem,
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <Text
        style={[
          styles.navIcon,
          active && styles.activeNavIcon,
        ]}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.navText,
          active && styles.activeNavText,
        ]}
      >
        {title}
      </Text>

    </TouchableOpacity>
  );
};

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#071E2B",
  },

  container: {
    flex: 1,
    backgroundColor: "#214E65",
  },

  // ============================================================
  // HEADER
  // ============================================================

  header: {
    height: 78,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#193E52",
    borderBottomWidth: 1,
    borderBottomColor: "#3F7185",
  },

  headerLeft: {
    justifyContent: "center",
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 3,
  },

  subtitle: {
    color: "#8EAAB5",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#244F65",
    borderWidth: 1,
    borderColor: "#397C65",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#39C978",
    marginRight: 6,
  },

  onlineText: {
    color: "#CDE5D9",
    fontSize: 9,
    fontWeight: "900",
  },

  // ============================================================
  // PROFILE BUTTON
  // ============================================================

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#244F65",
    borderWidth: 1,
    borderColor: "#47768A",
    alignItems: "center",
    justifyContent: "center",
  },

  profileIcon: {
    fontSize: 20,
  },

  // ============================================================
  // SCROLL
  // ============================================================

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
  },

  // ============================================================
  // TITLE
  // ============================================================

  titleSection: {
    marginBottom: 18,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },

  description: {
    color: "#AFC4CD",
    fontSize: 13,
    marginTop: 5,
  },

  // ============================================================
  // MODES
  // ============================================================

  modeContainer: {
    backgroundColor: "#244F65",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#47768A",
    padding: 14,
  },

  modeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  modeTitle: {
    color: "#FF9500",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  modeCount: {
    color: "#9EB6C0",
    fontSize: 9,
    fontWeight: "900",
  },

  modeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modeCard: {
    width: "31.5%",
    minHeight: 120,
    borderRadius: 16,
    backgroundColor: "#193E52",
    borderWidth: 1,
    borderColor: "#3C697C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    position: "relative",
  },

  selectedModeCard: {
    borderColor: "#FF9200",
    backgroundColor: "#315E6C",
  },

  modeIcon: {
    fontSize: 30,
  },

  modeName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 7,
  },

  modeSubtitle: {
    color: "#8FAAB6",
    fontSize: 8,
    textAlign: "center",
    marginTop: 3,
  },

  checkCircle: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF9200",
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  // ============================================================
  // ONLINE BUTTON
  // ============================================================

  onlineButton: {
    marginTop: 16,
    height: 84,
    borderRadius: 18,
    backgroundColor: "#FF9200",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 5,
  },

  // ============================================================
  // CPU BUTTON
  // ============================================================

  cpuButton: {
    marginTop: 12,
    height: 84,
    borderRadius: 18,
    backgroundColor: "#396F88",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 4,
  },

  buttonIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonIconText: {
    fontSize: 27,
  },

  buttonContent: {
    flex: 1,
    marginLeft: 13,
  },

  buttonTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  buttonSubtitle: {
    color: "#DDE8ED",
    fontSize: 11,
    marginTop: 2,
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "300",
  },

  // ============================================================
  // INFO
  // ============================================================

  infoCard: {
    marginTop: 18,
    backgroundColor: "#193E52",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#3C697C",
  },

  infoTitle: {
    color: "#FFB13B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  infoText: {
    color: "#AFC4CD",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },

  bottomSpace: {
    height: 30,
  },

  // ============================================================
  // BOTTOM NAVIGATION
  // ============================================================

  bottomNav: {
    height: 72,
    backgroundColor: "#193E52",
    borderTopWidth: 1,
    borderTopColor: "#3F7185",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },

  navItem: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 2,
    borderTopColor: "transparent",
  },

  activeNavItem: {
    borderTopColor: "#FF9200",
  },

  navIcon: {
    fontSize: 20,
    opacity: 0.65,
  },

  activeNavIcon: {
    opacity: 1,
  },

  navText: {
    color: "#7895A2",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },

  activeNavText: {
    color: "#FFB13B",
  },
});