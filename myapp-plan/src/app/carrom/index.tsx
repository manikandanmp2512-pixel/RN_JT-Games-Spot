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

const CarromHome = () => {
  const [selectedMode, setSelectedMode] =
    useState("classic");

  const gameModes = [
    {
      id: "classic",
      title: "Classic",
      subtitle: "Traditional",
      icon: "🪙",
      color: "#F59E0B",
    },
    {
      id: "rapid",
      title: "Rapid",
      subtitle: "Fast Match",
      icon: "⚡",
      color: "#EF4444",
    },
    {
      id: "freestyle",
      title: "Freestyle",
      subtitle: "Fun Match",
      icon: "🎯",
      color: "#10B981",
    },
    {
      id: "tournament",
      title: "Tournament",
      subtitle: "Win Rewards",
      icon: "🏆",
      color: "#8B5CF6",
    },
  ];

  /* ==========================================================
     PLAY ONLINE
  ========================================================== */

  const playOnline = () => {
    router.push("/carrom/online");
  };

  /* ==========================================================
     PLAY CPU
  ========================================================== */

  const playCPU = () => {
    router.push("/carrom/cpu");
  };

  /* ==========================================================
     GO TO PROFILE / MAIN USER PAGE
  ========================================================== */

  const goToProfile = () => {
    router.replace("/user");
  };

  /* ==========================================================
     GO TO CARROM HOME
  ========================================================== */

  const goToCarromHome = () => {
    router.replace("/carrom");
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#170B05"
      />

      <View style={styles.container}>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>

          <View>

            <Text style={styles.brand}>
              JAY TECH
            </Text>

            <Text style={styles.gameTitle}>
              🪙 CARROM
            </Text>

          </View>

          <View style={styles.headerRight}>

            {/* COINS */}

            <View style={styles.coinBox}>

              <Text style={styles.coinIcon}>
                🪙
              </Text>

              <Text style={styles.coinText}>
                1,250
              </Text>

            </View>

            {/* PROFILE */}

            <TouchableOpacity
              style={styles.profile}
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
            SCROLL CONTENT
        ===================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* =================================================
              HERO
          ================================================= */}

          <View style={styles.hero}>

            <View style={styles.heroCircle1} />

            <View style={styles.heroCircle2} />

            <View style={styles.heroLeft}>

              <View style={styles.trophyCircle}>

                <Text style={styles.trophy}>
                  🏆
                </Text>

              </View>

              <View>

                <Text style={styles.heroTitle}>
                  Master The Board
                </Text>

                <Text style={styles.heroSubtitle}>
                  Strike • Pocket • Win
                </Text>

              </View>

            </View>

            {/* LIVE */}

            <View style={styles.liveBadge}>

              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                LIVE
              </Text>

            </View>

          </View>

          {/* =================================================
              ONLINE HEADER
          ================================================= */}

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>
              Play Online
            </Text>

            <View style={styles.playerBadge}>

              <View style={styles.greenDot} />

              <Text style={styles.playerText}>
                8,426 ONLINE
              </Text>

            </View>

          </View>

          {/* =================================================
              GAME MODES
          ================================================= */}

          <View style={styles.modeGrid}>

            {gameModes.map((mode) => {

              const selected =
                selectedMode === mode.id;

              return (
                <TouchableOpacity
                  key={mode.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedMode(mode.id)
                  }
                  style={[
                    styles.modeCard,
                    selected && {
                      borderColor: mode.color,
                      backgroundColor: "#392314",
                    },
                  ]}
                >

                  {/* MODE ICON */}

                  <View
                    style={[
                      styles.modeIconBox,
                      {
                        backgroundColor:
                          `${mode.color}30`,
                      },
                    ]}
                  >

                    <Text style={styles.modeIcon}>
                      {mode.icon}
                    </Text>

                  </View>

                  {/* TITLE */}

                  <Text style={styles.modeTitle}>
                    {mode.title}
                  </Text>

                  {/* SUBTITLE */}

                  <Text style={styles.modeSubtitle}>
                    {mode.subtitle}
                  </Text>

                  {/* CHECK */}

                  {selected && (
                    <View
                      style={[
                        styles.check,
                        {
                          backgroundColor:
                            mode.color,
                        },
                      ]}
                    >

                      <Text style={styles.checkText}>
                        ✓
                      </Text>

                    </View>
                  )}

                </TouchableOpacity>
              );
            })}

          </View>

          {/* SELECTED MODE */}

          <Text style={styles.selectedText}>
            {selectedMode.toUpperCase()} MODE SELECTED
          </Text>

          {/* =================================================
              PLAY ONLINE
          ================================================= */}

          <TouchableOpacity
            style={styles.playButton}
            activeOpacity={0.85}
            onPress={playOnline}
          >

            <View style={styles.playIconCircle}>

              <Text style={styles.playIcon}>
                🪙
              </Text>

            </View>

            <View>

              <Text style={styles.playTitle}>
                Play Online
              </Text>

              <Text style={styles.playSubtitle}>
                Find a random opponent
              </Text>

            </View>

            <View style={styles.arrowCircle}>

              <Text style={styles.arrow}>
                →
              </Text>

            </View>

          </TouchableOpacity>

          {/* =================================================
              MORE WAYS
          ================================================= */}

          <Text style={styles.moreHeading}>
            MORE WAYS TO PLAY
          </Text>

          <View style={styles.moreContainer}>

            {/* PLAY CPU */}

            <MoreItem
              icon="🤖"
              title="Play CPU"
              subtitle="Practice your skills"
              color="#A855F7"
              onPress={playCPU}
            />

            {/* TOURNAMENT */}

            <MoreItem
              icon="🏆"
              title="Tournaments"
              subtitle="Compete for rewards"
              color="#F59E0B"
              onPress={() => {}}
            />

            {/* DAILY CHALLENGES */}

            <MoreItem
              icon="🎯"
              title="Daily Challenges"
              subtitle="Complete missions"
              color="#10B981"
              onPress={() => {}}
            />

            {/* LEADERBOARD */}

            <MoreItem
              icon="📊"
              title="Leaderboard"
              subtitle="See top players"
              color="#EF4444"
              onPress={() => {}}
            />

          </View>

          <View style={styles.bottomSpace} />

        </ScrollView>

        {/* =====================================================
            BOTTOM NAVIGATION
        ===================================================== */}

        <View style={styles.bottomNav}>

          {/* PLAY */}

          <NavItem
            icon="🏠"
            title="Play"
            active
            onPress={goToCarromHome}
          />

          {/* EVENTS */}

          <NavItem
            icon="🏆"
            title="Events"
            onPress={() => {}}
          />

          {/* FRIENDS */}

          <NavItem
            icon="👥"
            title="Friends"
            onPress={() => {}}
          />

          {/* PROFILE */}

          <NavItem
            icon="👤"
            title="Profile"
            onPress={goToProfile}
          />

        </View>

      </View>

    </SafeAreaView>
  );
};

export default CarromHome;


/* =============================================================
   MORE ITEM
============================================================= */

const MoreItem = ({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) => {

  return (
    <TouchableOpacity
      style={styles.moreItem}
      activeOpacity={0.8}
      onPress={onPress}
    >

      {/* ICON */}

      <View
        style={[
          styles.moreIcon,
          {
            backgroundColor: `${color}30`,
            borderColor: `${color}60`,
          },
        ]}
      >

        <Text style={styles.moreEmoji}>
          {icon}
        </Text>

      </View>

      {/* CONTENT */}

      <View style={styles.moreContent}>

        <Text style={styles.moreTitle}>
          {title}
        </Text>

        <Text style={styles.moreSubtitle}>
          {subtitle}
        </Text>

      </View>

      {/* ARROW */}

      <Text style={styles.moreArrow}>
        ›
      </Text>

    </TouchableOpacity>
  );
};


/* =============================================================
   NAV ITEM
============================================================= */

const NavItem = ({
  icon,
  title,
  active,
  onPress,
}: {
  icon: string;
  title: string;
  active?: boolean;
  onPress?: () => void;
}) => {

  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active && styles.activeNavItem,
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >

      {/* ICON */}

      <Text
        style={[
          styles.navIcon,
          active && styles.activeNavIcon,
        ]}
      >
        {icon}
      </Text>

      {/* TEXT */}

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


/* =============================================================
   STYLES
============================================================= */

const styles = StyleSheet.create({

  /* ==========================================================
     MAIN
  ========================================================== */

  safeArea: {
    flex: 1,
    backgroundColor: "#170B05",
  },

  container: {
    flex: 1,
    backgroundColor: "#241208",
  },

  /* ==========================================================
     HEADER
  ========================================================== */

  header: {
    height: 78,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#4E2B18",
  },

  brand: {
    color: "#B98B64",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  gameTitle: {
    color: "#FFD08A",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  /* ==========================================================
     COINS
  ========================================================== */

  coinBox: {
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#3A2112",
    borderWidth: 1,
    borderColor: "#704325",
    flexDirection: "row",
    alignItems: "center",
  },

  coinIcon: {
    fontSize: 16,
    marginRight: 5,
  },

  coinText: {
    color: "#FFD477",
    fontSize: 12,
    fontWeight: "900",
  },

  /* ==========================================================
     PROFILE
  ========================================================== */

  profile: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#402516",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#654027",
  },

  profileIcon: {
    fontSize: 18,
  },

  /* ==========================================================
     SCROLL
  ========================================================== */

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 10,
  },

  /* ==========================================================
     HERO
  ========================================================== */

  hero: {
    height: 140,
    borderRadius: 24,
    backgroundColor: "#5A3017",
    borderWidth: 1,
    borderColor: "#96592D",
    paddingHorizontal: 17,
    justifyContent: "center",
    overflow: "hidden",
  },

  heroCircle1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -55,
    top: -45,
    backgroundColor: "#8B4D21",
    opacity: 0.45,
  },

  heroCircle2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    right: 55,
    bottom: -55,
    backgroundColor: "#D4822C",
    opacity: 0.18,
  },

  heroLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  trophyCircle: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#7A431F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    borderWidth: 1,
    borderColor: "#B87537",
  },

  trophy: {
    fontSize: 34,
  },

  heroTitle: {
    color: "#FFE5BD",
    fontSize: 20,
    fontWeight: "900",
  },

  heroSubtitle: {
    color: "#D3AA7D",
    fontSize: 12,
    marginTop: 4,
  },

  /* ==========================================================
     LIVE
  ========================================================== */

  liveBadge: {
    position: "absolute",
    right: 13,
    top: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28170D",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#36D67A",
    marginRight: 5,
  },

  liveText: {
    color: "#63E695",
    fontSize: 9,
    fontWeight: "900",
  },

  /* ==========================================================
     SECTION
  ========================================================== */

  sectionHeader: {
    marginTop: 22,
    marginBottom: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    color: "#FFB84A",
    fontSize: 21,
    fontWeight: "900",
  },

  playerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#392316",
    borderWidth: 1,
    borderColor: "#62432B",
  },

  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3BD77D",
    marginRight: 5,
  },

  playerText: {
    color: "#C6AF9A",
    fontSize: 9,
    fontWeight: "900",
  },

  /* ==========================================================
     GAME MODES
  ========================================================== */

  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  modeCard: {
    width: "48.3%",
    height: 140,
    marginBottom: 10,
    borderRadius: 19,
    backgroundColor: "#352015",
    borderWidth: 1,
    borderColor: "#5A3924",
    alignItems: "center",
    justifyContent: "center",
  },

  modeIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  modeIcon: {
    fontSize: 27,
  },

  modeTitle: {
    color: "#FFE5CD",
    fontSize: 15,
    fontWeight: "900",
  },

  modeSubtitle: {
    color: "#B99D85",
    fontSize: 10,
    marginTop: 3,
  },

  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  selectedText: {
    color: "#D79B54",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 11,
  },

  /* ==========================================================
     PLAY BUTTON
  ========================================================== */

  playButton: {
    height: 90,
    borderRadius: 21,
    backgroundColor: "#E88927",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    elevation: 10,
    shadowColor: "#F59E0B",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.4,
    shadowRadius: 13,
  },

  playIconCircle: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: "#F4A544",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  playIcon: {
    fontSize: 30,
  },

  playTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  playSubtitle: {
    color: "#FFE5C7",
    fontSize: 11,
    marginTop: 3,
  },

  arrowCircle: {
    marginLeft: "auto",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F19B3D",
    alignItems: "center",
    justifyContent: "center",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
  },

  /* ==========================================================
     MORE WAYS
  ========================================================== */

  moreHeading: {
    color: "#A98C73",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },

  moreContainer: {
    backgroundColor: "#311C11",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#55341F",
    paddingHorizontal: 13,
  },

  moreItem: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#4A2D1C",
  },

  moreIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  moreEmoji: {
    fontSize: 22,
  },

  moreContent: {
    flex: 1,
    marginLeft: 12,
  },

  moreTitle: {
    color: "#F3DECA",
    fontSize: 14,
    fontWeight: "900",
  },

  moreSubtitle: {
    color: "#A58B77",
    fontSize: 10,
    marginTop: 3,
  },

  moreArrow: {
    color: "#8E705A",
    fontSize: 28,
  },

  bottomSpace: {
    height: 25,
  },

  /* ==========================================================
     BOTTOM NAVIGATION
  ========================================================== */

  bottomNav: {
    height: 72,
    backgroundColor: "#1D1009",
    borderTopWidth: 1,
    borderTopColor: "#4C2D1B",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    height: 65,
  },

  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: "#F59E0B",
  },

  navIcon: {
    fontSize: 20,
    opacity: 0.5,
  },

  activeNavIcon: {
    opacity: 1,
  },

  navText: {
    color: "#806A59",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },

  activeNavText: {
    color: "#F2A33A",
    fontWeight: "900",
  },

});