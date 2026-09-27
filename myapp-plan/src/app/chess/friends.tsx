import { router } from "expo-router";
import { useEffect, useState } from "react";

import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ChessBottomNav from "@/components/chess/ChessBottomNav";
import { useAppTheme } from "@/context/AppThemeContext";

import {
  getFriendRequests,
  getFriends,
} from "@/services/chessApi";

import {
  respondFriendRequest,
} from "@/services/chessSocket";

import {
  Friend,
  FriendRequest,
} from "@/types/chess";

// =============================================================
// COMPONENT
// =============================================================

export default function FriendsScreen() {
  const { isDark } = useAppTheme();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] =
    useState<FriendRequest[]>([]);

  // ===========================================================
  // THEME COLORS
  // ===========================================================

  const colors = {
    background: isDark
      ? "#071E2B"
      : "#F5F7FA",

    header: isDark
      ? "#071E2B"
      : "#FFFFFF",

    card: isDark
      ? "#17394B"
      : "#FFFFFF",

    cardSecondary: isDark
      ? "#244F65"
      : "#FFFFFF",

    border: isDark
      ? "#315B6E"
      : "#D7E1E6",

    title: isDark
      ? "#FFFFFF"
      : "#071E2B",

    text: isDark
      ? "#FFFFFF"
      : "#071E2B",

    secondaryText: isDark
      ? "#9DB5C0"
      : "#607784",

    emptyText: isDark
      ? "#A6BAC3"
      : "#708692",

    rejectBackground: isDark
      ? "#17394B"
      : "#EDF2F5",

    onlineOffline: isDark
      ? "#526873"
      : "#9AAAB2",
  };

  // ===========================================================
  // LOAD FRIENDS
  // ===========================================================

  const load = async () => {
    try {
      const [friendsResponse, requestsResponse] =
        await Promise.all([
          getFriends(),
          getFriendRequests(),
        ]);

      setFriends(
        friendsResponse?.friends || []
      );

      setRequests(
        requestsResponse?.requests || []
      );
    } catch (error) {
      console.error(
        "Friends loading error:",
        error
      );
    }
  };

  // ===========================================================
  // INITIAL LOAD
  // ===========================================================

  useEffect(() => {
    load();
  }, []);

  // ===========================================================
  // ACCEPT FRIEND REQUEST
  // ===========================================================

  const handleAccept = async (
    requestId: string
  ) => {
    try {
      await respondFriendRequest(
        requestId,
        true
      );

      await load();
    } catch (error) {
      console.error(
        "Accept friend request error:",
        error
      );
    }
  };

  // ===========================================================
  // REJECT FRIEND REQUEST
  // ===========================================================

  const handleReject = async (
    requestId: string
  ) => {
    try {
      await respondFriendRequest(
        requestId,
        false
      );

      await load();
    } catch (error) {
      console.error(
        "Reject friend request error:",
        error
      );
    }
  };

  // ===========================================================
  // FRIEND REQUEST ITEM
  // ===========================================================

  const renderRequest = ({
    item,
  }: {
    item: FriendRequest;
  }) => {
    return (
      <View
        style={[
          styles.request,
          {
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <View style={styles.requestInfo}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {item.from?.name || "Player"}
          </Text>

          <Text
            style={[
              styles.sub,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {item.from?.countryFlag
              ? `${item.from.countryFlag} • `
              : ""}
            ♟ {item.from?.rating || 1200}
          </Text>
        </View>

        {/* ACCEPT */}

        <Pressable
          onPress={() =>
            handleAccept(item.id)
          }
          style={({ pressed }) => [
            styles.accept,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.acceptText}>
            Accept
          </Text>
        </Pressable>

        {/* REJECT */}

        <Pressable
          onPress={() =>
            handleReject(item.id)
          }
          style={({ pressed }) => [
            styles.reject,
            {
              backgroundColor:
                colors.rejectBackground,
            },
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text style={styles.rejectText}>
            ✕
          </Text>
        </Pressable>
      </View>
    );
  };

  // ===========================================================
  // FRIEND ITEM
  // ===========================================================

  const renderFriend = ({
    item,
  }: {
    item: Friend;
  }) => {
    return (
      <View
        style={[
          styles.friend,
          {
            backgroundColor:
              colors.cardSecondary,
            borderColor:
              colors.border,
          },
        ]}
      >
        {/* AVATAR */}

        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {item.avatar || "♟️"}
          </Text>
        </View>

        {/* FRIEND INFO */}

        <View style={styles.friendContent}>
          <Text
            style={[
              styles.name,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            style={[
              styles.sub,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {item.countryFlag
              ? `${item.countryFlag} • `
              : ""}
            ♟ {item.rating}
          </Text>
        </View>

        {/* ONLINE STATUS */}

        <View
          style={[
            styles.online,
            {
              backgroundColor:
                item.online
                  ? "#39C978"
                  : colors.onlineOffline,
            },
          ]}
        />
      </View>
    );
  };

  // ===========================================================
  // SCREEN
  // ===========================================================

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.header,
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.replace(
                              "/chess"
                            )}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.back,
              {
                color: isDark
                  ? "#FFFFFF"
                  : "#071E2B",
              },
            ]}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: colors.title,
            },
          ]}
        >
          Friends
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* =====================================================
          FRIEND REQUESTS
      ===================================================== */}

      {requests.length > 0 && (
        <View
          style={[
            styles.requests,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text style={styles.section}>
            FRIEND REQUESTS
          </Text>

          {requests.map((request) =>
            renderRequest({
              item: request,
            })
          )}
        </View>
      )}

      {/* =====================================================
          FRIEND LIST
      ===================================================== */}

      <FlatList
        data={friends}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderFriend}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          friends.length > 0
            ? styles.list
            : styles.empty
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text
              style={[
                styles.emptyIcon,
                {
                  color: "#F4A000",
                },
              ]}
            >
              ♞
            </Text>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.title,
                },
              ]}
            >
              No Friends Yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.emptyText,
                },
              ]}
            >
              Send a friend request during
              an online game.
            </Text>
          </View>
        }
      />

      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <ChessBottomNav
        activeTab="friends"
      />
    </SafeAreaView>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  // ===========================================================
  // SAFE AREA
  // ===========================================================

  safe: {
    marginTop: 30,
    flex: 1,
  },

  // ===========================================================
  // HEADER
  // ===========================================================

  header: {
    height: 75,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 18,

    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,

    height: 50,

    alignItems: "flex-start",

    justifyContent: "center",
  },

  back: {
    fontSize: 40,

    fontWeight: "300",

    lineHeight: 45,
  },

  title: {
    fontSize: 22,

    fontWeight: "900",
  },

  headerSpacer: {
    width: 40,
  },

  // ===========================================================
  // REQUESTS
  // ===========================================================

  requests: {
    margin: 14,

    borderRadius: 18,

    padding: 14,

    borderWidth: 1,

    elevation: 4,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,

    shadowRadius: 5,
  },

  section: {
    color: "#F4A000",

    fontSize: 11,

    fontWeight: "900",

    marginBottom: 8,

    letterSpacing: 0.5,
  },

  request: {
    flexDirection: "row",

    alignItems: "center",

    paddingVertical: 9,

    borderBottomWidth: 1,
  },

  requestInfo: {
    flex: 1,

    paddingRight: 8,
  },

  // ===========================================================
  // FRIEND INFO
  // ===========================================================

  name: {
    fontSize: 15,

    fontWeight: "900",
  },

  sub: {
    fontSize: 10,

    marginTop: 2,
  },

  // ===========================================================
  // ACCEPT BUTTON
  // ===========================================================

  accept: {
    backgroundColor: "#F4A000",

    borderRadius: 10,

    paddingHorizontal: 11,

    paddingVertical: 8,
  },

  acceptText: {
    color: "#071E2B",

    fontWeight: "900",

    fontSize: 11,
  },

  // ===========================================================
  // REJECT BUTTON
  // ===========================================================

  reject: {
    width: 34,

    height: 34,

    borderRadius: 10,

    marginLeft: 6,

    alignItems: "center",

    justifyContent: "center",
  },

  rejectText: {
    color: "#FF7777",

    fontWeight: "900",

    fontSize: 13,
  },

  buttonPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  // ===========================================================
  // FRIEND LIST
  // ===========================================================

  list: {
    padding: 14,

    paddingBottom: 100,
  },

  friend: {
    minHeight: 70,

    borderRadius: 17,

    marginBottom: 9,

    paddingHorizontal: 13,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    elevation: 3,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.10,

    shadowRadius: 4,
  },

  // ===========================================================
  // AVATAR
  // ===========================================================

  avatarContainer: {
    width: 50,

    alignItems: "center",

    justifyContent: "center",
  },

  avatar: {
    fontSize: 30,
  },

  // ===========================================================
  // FRIEND CONTENT
  // ===========================================================

  friendContent: {
    flex: 1,

    marginLeft: 5,
  },

  // ===========================================================
  // ONLINE STATUS
  // ===========================================================

  online: {
    width: 10,

    height: 10,

    borderRadius: 5,

    marginRight: 3,
  },

  // ===========================================================
  // EMPTY STATE
  // ===========================================================

  empty: {
    flexGrow: 1,

    justifyContent: "center",

    alignItems: "center",

    padding: 25,

    paddingBottom: 100,
  },

  emptyBox: {
    alignItems: "center",

    maxWidth: 300,
  },

  emptyIcon: {
    fontSize: 70,
  },

  emptyTitle: {
    fontSize: 22,

    fontWeight: "900",

    marginTop: 10,
  },

  emptyText: {
    textAlign: "center",

    marginTop: 7,

    maxWidth: 270,

    lineHeight: 19,

    fontSize: 13,
  },
});
