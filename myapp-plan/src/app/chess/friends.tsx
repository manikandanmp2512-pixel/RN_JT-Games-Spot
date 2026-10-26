// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { router, useFocusEffect } from "expo-router";
// import { useCallback, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Pressable,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";

// import ChessBottomNav from "@/components/chess/ChessBottomNav";
// import { useAppTheme } from "@/context/AppThemeContext";
// import { getFriendRequests, getFriends } from "@/services/chessApi";
// import { respondFriendRequest } from "@/services/chessSocket";
// import { Friend, FriendRequest } from "@/types/chess";

// export default function FriendsScreen() {
//   const { isDark } = useAppTheme();

//   const [friends, setFriends] = useState<Friend[]>([]);
//   const [requests, setRequests] = useState<FriendRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [busyId, setBusyId] = useState<string | null>(null);

//   const colors = {
//     background: isDark ? "#070E20" : "#F3F6FC",
//     card: isDark ? "#101B32" : "#FFFFFF",
//     border: isDark ? "#263D61" : "#DFE7F3",
//     title: isDark ? "#F5F8FF" : "#14213D",
//     text: isDark ? "#EAF2FF" : "#172743",
//     secondary: isDark ? "#8EA7CD" : "#73839E",
//     muted: isDark ? "#172844" : "#EDF2FB",
//   };

//   const load = useCallback(async () => {
//     try {
//       setLoading(true);

//       const [friendsResponse, requestsResponse] = await Promise.all([
//         getFriends(),
//         getFriendRequests(),
//       ]);

//       setFriends(
//         Array.isArray(friendsResponse?.friends)
//           ? friendsResponse.friends
//           : []
//       );

//       setRequests(
//         Array.isArray(requestsResponse?.requests)
//           ? requestsResponse.requests
//           : []
//       );
//     } catch (error) {
//       console.error("Friends loading error:", error);
//       Alert.alert(
//         "Friends",
//         "Unable to load friends. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       void load();
//     }, [load])
//   );

//   const handleRespond = async (
//     requestId: string,
//     accept: boolean
//   ) => {
//     if (busyId) return;

//     setBusyId(requestId);

//     try {
//       const result = await respondFriendRequest(
//         requestId,
//         accept
//       );

//       if (result && result.success === false) {
//         throw new Error(result.message || "Request failed");
//       }

//       // Reload persisted server data; do not create a local friend record.
//       await load();

//       if (accept) {
//         Alert.alert(
//           "Friend request accepted",
//           "Both players are now friends."
//         );
//       }
//     } catch (error: any) {
//       Alert.alert(
//         "Friend request",
//         error?.message || "Unable to update the request."
//       );
//     } finally {
//       setBusyId(null);
//     }
//   };

//   const displayName = (item: any) =>
//     item?.name ||
//     [
//       item?.fname || item?.firstName,
//       item?.lname || item?.lastName,
//     ]
//       .filter(Boolean)
//       .join(" ") ||
//     "Player";

//   const renderRequest = (request: any) => {
//     const id = String(
//       request.id || request._id || request.requestId || ""
//     );

//     const from = request.from || request.sender || {};
//     const name = displayName(from);

//     return (
//       <View
//         key={id}
//         style={[
//           styles.playerCard,
//           {
//             backgroundColor: colors.card,
//             borderColor: colors.border,
//           },
//         ]}
//       >
//         <LinearGradient
//           colors={["#15C9F7", "#5854FF", "#A14DFF"]}
//           style={styles.avatarFrame}
//         >
//           <View style={styles.avatarInner}>
//             <Text style={styles.avatarText}>
//               {from.avatar || from.randomAvatar || "♟️"}
//             </Text>
//           </View>
//         </LinearGradient>

//         <View style={styles.playerInfo}>
//           <Text
//             numberOfLines={1}
//             style={[styles.playerName, { color: colors.text }]}
//           >
//             {name}
//           </Text>

//           <View style={styles.ratingRow}>
//             <MaterialCommunityIcons
//               name="chess-knight"
//               size={14}
//               color="#21CFFF"
//             />
//             <Text
//               style={[
//                 styles.playerMeta,
//                 { color: colors.secondary },
//               ]}
//             >
//               {from.rating ?? 100} rating
//             </Text>
//           </View>

//           <Text style={styles.requestLabel}>
//             WANTS TO CONNECT
//           </Text>
//         </View>

//         <View style={styles.requestActions}>
//           <Pressable
//             disabled={!id || busyId === id}
//             onPress={() => void handleRespond(id, true)}
//             accessibilityRole="button"
//             accessibilityLabel={`Accept friend request from ${name}`}
//             style={({ pressed }) => [
//               styles.acceptButton,
//               {
//                 opacity:
//                   !id || busyId === id
//                     ? 0.5
//                     : pressed
//                       ? 0.8
//                       : 1,
//               },
//             ]}
//           >
//             <LinearGradient
//               colors={["#17D7B0", "#0C9F91"]}
//               style={styles.acceptGradient}
//             >
//               {busyId === id ? (
//                 <ActivityIndicator
//                   size="small"
//                   color="#FFFFFF"
//                 />
//               ) : (
//                 <Ionicons
//                   name="checkmark"
//                   size={21}
//                   color="#FFFFFF"
//                 />
//               )}
//             </LinearGradient>
//           </Pressable>

//           <Pressable
//             disabled={!id || busyId === id}
//             onPress={() => void handleRespond(id, false)}
//             accessibilityRole="button"
//             accessibilityLabel={`Reject friend request from ${name}`}
//             style={({ pressed }) => [
//               styles.rejectButton,
//               {
//                 opacity:
//                   !id || busyId === id
//                     ? 0.5
//                     : pressed
//                       ? 0.75
//                       : 1,
//               },
//             ]}
//           >
//             <Ionicons
//               name="close"
//               size={19}
//               color="#FF8299"
//             />
//           </Pressable>
//         </View>
//       </View>
//     );
//   };

//   const renderFriend = (friend: any) => {
//     const id = String(
//       friend.id || friend._id || displayName(friend)
//     );

//     return (
//       <View
//         key={id}
//         style={[
//           styles.playerCard,
//           {
//             backgroundColor: colors.card,
//             borderColor: colors.border,
//           },
//         ]}
//       >
//         <LinearGradient
//           colors={["#25D8C0", "#1689ED", "#6855FF"]}
//           style={styles.avatarFrame}
//         >
//           <View style={styles.avatarInner}>
//             <Text style={styles.avatarText}>
//               {friend.avatar ||
//                 friend.profilePhoto ||
//                 friend.randomAvatar ||
//                 "♟️"}
//             </Text>
//           </View>
//         </LinearGradient>

//         <View style={styles.playerInfo}>
//           <Text
//             numberOfLines={1}
//             style={[styles.playerName, { color: colors.text }]}
//           >
//             {displayName(friend)}
//           </Text>

//           <View style={styles.ratingRow}>
//             <MaterialCommunityIcons
//               name="chess-knight"
//               size={14}
//               color="#21CFFF"
//             />
//             <Text
//               style={[
//                 styles.playerMeta,
//                 { color: colors.secondary },
//               ]}
//             >
//               {friend.rating ?? 100} rating
//             </Text>
//           </View>

//           <View style={styles.friendStatus}>
//             <View style={styles.friendStatusDot} />
//             <Text style={styles.friendStatusText}>
//               FRIEND
//             </Text>
//           </View>
//         </View>

//         <View style={styles.friendActionIcon}>
//           <Ionicons
//             name="people"
//             size={19}
//             color="#39D8C1"
//           />
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView
//       style={[
//         styles.container,
//         { backgroundColor: colors.background },
//       ]}
//     >
//       {/* HEADER */}
//       <View style={styles.header}>
//         <Pressable
//           onPress={() => router.back()}
//           accessibilityRole="button"
//           accessibilityLabel="Go back"
//           style={styles.backButton}
//         >
//           <Ionicons
//             name="arrow-back"
//             size={21}
//             color="#FFFFFF"
//           />
//         </Pressable>

//         <View style={styles.headerCopy}>
//           <Text style={[styles.headerTitle, { color: colors.title }]}>
//             Friends
//           </Text>
//           <Text
//             style={[
//               styles.headerSubtitle,
//               { color: colors.secondary },
//             ]}
//           >
//             Your chess circle
//           </Text>
//         </View>

//         <Pressable
//           onPress={() => void load()}
//           accessibilityRole="button"
//           accessibilityLabel="Refresh friends"
//           style={styles.refreshButton}
//         >
//           <Ionicons
//             name="refresh"
//             size={19}
//             color="#2DD9FF"
//           />
//         </Pressable>
//       </View>

//       <FlatList
//         data={[{ key: "requests" }, { key: "friends" }]}
//         keyExtractor={(item) => item.key}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.list}
//         ListHeaderComponent={
//           <LinearGradient
//             colors={["#102C4A", "#151B3C", "#291B4A"]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={styles.heroCard}
//           >
//             <View style={styles.heroCopy}>
//               <Text style={styles.heroEyebrow}>
//                 JAY TECH CHESS
//               </Text>
//               <Text style={styles.heroTitle}>
//                 Play together.{"\n"}
//                 <Text style={styles.heroAccent}>
//                   Grow together.
//                 </Text>
//               </Text>
//               <Text style={styles.heroSubtitle}>
//                 Connect with players and build your chess circle.
//               </Text>
//             </View>

//             <View style={styles.heroIcon}>
//               <MaterialCommunityIcons
//                 name="account-group"
//                 size={48}
//                 color="#38D8FF"
//               />
//             </View>

//             <View style={styles.statsRow}>
//               <View style={styles.statBox}>
//                 <Text style={styles.statNumber}>
//                   {friends.length}
//                 </Text>
//                 <Text style={styles.statLabel}>FRIENDS</Text>
//               </View>

//               <View style={styles.statDivider} />

//               <View style={styles.statBox}>
//                 <Text style={styles.statNumber}>
//                   {requests.length}
//                 </Text>
//                 <Text style={styles.statLabel}>REQUESTS</Text>
//               </View>

//               <View style={styles.statDivider} />

//               <View style={styles.statBox}>
//                 <Ionicons
//                   name="people-outline"
//                   size={20}
//                   color="#B79AFF"
//                 />
//                 <Text style={styles.statLabel}>COMMUNITY</Text>
//               </View>
//             </View>
//           </LinearGradient>
//         }
//         renderItem={({ item }) => {
//           if (item.key === "requests") {
//             return (
//               <View style={styles.section}>
//                 <View style={styles.sectionHeader}>
//                   <View style={styles.sectionIconPurple}>
//                     <Ionicons
//                       name="person-add"
//                       size={18}
//                       color="#C3A3FF"
//                     />
//                   </View>

//                   <View style={styles.sectionHeadingCopy}>
//                     <Text
//                       style={[
//                         styles.sectionTitle,
//                         { color: colors.title },
//                       ]}
//                     >
//                       Friend Requests
//                     </Text>
//                     <Text
//                       style={[
//                         styles.sectionSubtitle,
//                         { color: colors.secondary },
//                       ]}
//                     >
//                       Players waiting to connect
//                     </Text>
//                   </View>

//                   <View style={styles.countBadgePurple}>
//                     <Text style={styles.countBadgeText}>
//                       {requests.length}
//                     </Text>
//                   </View>
//                 </View>

//                 {loading ? (
//                   <ActivityIndicator
//                     size="small"
//                     color="#27D6FF"
//                     style={styles.inlineLoader}
//                   />
//                 ) : requests.length === 0 ? (
//                   <View
//                     style={[
//                       styles.emptyCard,
//                       {
//                         backgroundColor: colors.card,
//                         borderColor: colors.border,
//                       },
//                     ]}
//                   >
//                     <View style={styles.emptyIcon}>
//                       <Ionicons
//                         name="mail-open-outline"
//                         size={28}
//                         color="#8E83FF"
//                       />
//                     </View>
//                     <Text
//                       style={[
//                         styles.emptyTitle,
//                         { color: colors.text },
//                       ]}
//                     >
//                       All caught up!
//                     </Text>
//                     <Text
//                       style={[
//                         styles.emptyText,
//                         { color: colors.secondary },
//                       ]}
//                     >
//                       New friend requests will appear here.
//                     </Text>
//                   </View>
//                 ) : (
//                   requests.map(renderRequest)
//                 )}
//               </View>
//             );
//           }

//           return (
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <View style={styles.sectionIconCyan}>
//                   <Ionicons
//                     name="people"
//                     size={18}
//                     color="#30D9FF"
//                   />
//                 </View>

//                 <View style={styles.sectionHeadingCopy}>
//                   <Text
//                     style={[
//                       styles.sectionTitle,
//                       { color: colors.title },
//                     ]}
//                   >
//                     My Friends
//                   </Text>
//                   <Text
//                     style={[
//                       styles.sectionSubtitle,
//                       { color: colors.secondary },
//                     ]}
//                   >
//                     Your connected chess players
//                   </Text>
//                 </View>

//                 <View style={styles.countBadgeCyan}>
//                   <Text style={styles.countBadgeText}>
//                     {friends.length}
//                   </Text>
//                 </View>
//               </View>

//               {loading ? (
//                 <ActivityIndicator
//                   size="small"
//                   color="#27D6FF"
//                   style={styles.inlineLoader}
//                 />
//               ) : friends.length === 0 ? (
//                 <View
//                   style={[
//                     styles.emptyCard,
//                     {
//                       backgroundColor: colors.card,
//                       borderColor: colors.border,
//                     },
//                   ]}
//                 >
//                   <View style={styles.emptyIcon}>
//                     <MaterialCommunityIcons
//                       name="account-multiple-plus-outline"
//                       size={30}
//                       color="#2CCEFF"
//                     />
//                   </View>
//                   <Text
//                     style={[
//                       styles.emptyTitle,
//                       { color: colors.text },
//                     ]}
//                   >
//                     Your chess circle starts here
//                   </Text>
//                   <Text
//                     style={[
//                       styles.emptyText,
//                       { color: colors.secondary },
//                     ]}
//                   >
//                     Accepted friend requests will appear here.
//                   </Text>
//                 </View>
//               ) : (
//                 friends.map(renderFriend)
//               )}
//             </View>
//           );
//         }}
//         ListFooterComponent={<View style={{ height: 24 }} />}
//       />

//       <ChessBottomNav />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 17,
//     paddingTop: 12,
//     paddingBottom: 13,
//     gap: 12,
//   },

//   backButton: {
//     width: 43,
//     height: 43,
//     borderRadius: 15,
//     backgroundColor: "#152642",
//     borderWidth: 1,
//     borderColor: "#29476D",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   headerCopy: {
//     flex: 1,
//   },

//   headerTitle: {
//     fontSize: 25,
//     fontWeight: "900",
//     letterSpacing: -0.5,
//   },

//   headerSubtitle: {
//     fontSize: 11,
//     marginTop: 3,
//     fontWeight: "600",
//   },

//   refreshButton: {
//     width: 43,
//     height: 43,
//     borderRadius: 15,
//     backgroundColor: "#112640",
//     borderWidth: 1,
//     borderColor: "#23527B",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   list: {
//     paddingHorizontal: 15,
//     paddingBottom: 110,
//   },

//   heroCard: {
//     minHeight: 205,
//     borderRadius: 24,
//     borderWidth: 1,
//     borderColor: "rgba(57,177,255,0.42)",
//     padding: 18,
//     marginBottom: 25,
//     overflow: "hidden",
//   },

//   heroCopy: {
//     maxWidth: "76%",
//     zIndex: 1,
//   },

//   heroEyebrow: {
//     color: "#32D9FF",
//     fontSize: 9,
//     fontWeight: "900",
//     letterSpacing: 2,
//     marginBottom: 10,
//   },

//   heroTitle: {
//     color: "#F8FAFF",
//     fontSize: 25,
//     lineHeight: 31,
//     fontWeight: "900",
//   },

//   heroAccent: {
//     color: "#9D88FF",
//   },

//   heroSubtitle: {
//     color: "#B5C8E8",
//     fontSize: 10,
//     lineHeight: 16,
//     marginTop: 8,
//   },

//   heroIcon: {
//     position: "absolute",
//     top: 23,
//     right: 17,
//     width: 74,
//     height: 74,
//     borderRadius: 24,
//     backgroundColor: "rgba(31,199,255,0.10)",
//     borderWidth: 1,
//     borderColor: "rgba(49,205,255,0.35)",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   statsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 20,
//     paddingTop: 13,
//     borderTopWidth: 1,
//     borderTopColor: "rgba(127,166,218,0.19)",
//   },

//   statBox: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 3,
//   },

//   statNumber: {
//     color: "#FFFFFF",
//     fontSize: 19,
//     fontWeight: "900",
//   },

//   statLabel: {
//     color: "#91A9CF",
//     fontSize: 8,
//     fontWeight: "900",
//     letterSpacing: 1,
//   },

//   statDivider: {
//     width: 1,
//     height: 29,
//     backgroundColor: "rgba(127,166,218,0.25)",
//   },

//   section: {
//     marginBottom: 24,
//   },

//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 13,
//     gap: 10,
//   },

//   sectionIconPurple: {
//     width: 40,
//     height: 40,
//     borderRadius: 14,
//     backgroundColor: "rgba(143,94,255,0.15)",
//     borderWidth: 1,
//     borderColor: "rgba(164,122,255,0.34)",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   sectionIconCyan: {
//     width: 40,
//     height: 40,
//     borderRadius: 14,
//     backgroundColor: "rgba(30,198,255,0.12)",
//     borderWidth: 1,
//     borderColor: "rgba(30,198,255,0.30)",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   sectionHeadingCopy: {
//     flex: 1,
//   },

//   sectionTitle: {
//     fontSize: 17,
//     fontWeight: "900",
//   },

//   sectionSubtitle: {
//     fontSize: 10,
//     marginTop: 4,
//   },

//   countBadgePurple: {
//     minWidth: 30,
//     height: 30,
//     paddingHorizontal: 8,
//     borderRadius: 11,
//     backgroundColor: "#583AA0",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   countBadgeCyan: {
//     minWidth: 30,
//     height: 30,
//     paddingHorizontal: 8,
//     borderRadius: 11,
//     backgroundColor: "#105475",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   countBadgeText: {
//     color: "#FFFFFF",
//     fontSize: 12,
//     fontWeight: "900",
//   },

//   playerCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderRadius: 19,
//     padding: 12,
//     marginBottom: 10,
//     gap: 11,
//   },

//   avatarFrame: {
//     width: 51,
//     height: 51,
//     borderRadius: 18,
//     padding: 2,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   avatarInner: {
//     width: "100%",
//     height: "100%",
//     borderRadius: 16,
//     backgroundColor: "#111D36",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   avatarText: {
//     fontSize: 26,
//     color: "#FFFFFF",
//   },

//   playerInfo: {
//     flex: 1,
//     minWidth: 0,
//   },

//   playerName: {
//     fontSize: 14,
//     fontWeight: "900",
//   },

//   ratingRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     marginTop: 5,
//   },

//   playerMeta: {
//     fontSize: 10,
//     fontWeight: "700",
//   },

//   requestLabel: {
//     color: "#B79AFF",
//     fontSize: 8,
//     fontWeight: "900",
//     letterSpacing: 1,
//     marginTop: 6,
//   },

//   requestActions: {
//     alignItems: "center",
//     gap: 7,
//   },

//   acceptButton: {
//     borderRadius: 12,
//     overflow: "hidden",
//   },

//   acceptGradient: {
//     width: 39,
//     height: 37,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   rejectButton: {
//     width: 39,
//     height: 34,
//     borderRadius: 11,
//     backgroundColor: "rgba(255,92,125,0.10)",
//     borderWidth: 1,
//     borderColor: "rgba(255,92,125,0.30)",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   friendStatus: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     marginTop: 6,
//   },

//   friendStatusDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#2EDDB1",
//   },

//   friendStatusText: {
//     color: "#2EDDB1",
//     fontSize: 8,
//     fontWeight: "900",
//     letterSpacing: 1,
//   },

//   friendActionIcon: {
//     width: 37,
//     height: 37,
//     borderRadius: 13,
//     backgroundColor: "rgba(43,213,192,0.10)",
//     borderWidth: 1,
//     borderColor: "rgba(43,213,192,0.22)",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   emptyCard: {
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 25,
//     borderRadius: 19,
//     borderWidth: 1,
//   },

//   emptyIcon: {
//     width: 55,
//     height: 55,
//     borderRadius: 19,
//     backgroundColor: "rgba(80,126,255,0.12)",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12,
//   },

//   emptyTitle: {
//     fontSize: 14,
//     fontWeight: "900",
//     textAlign: "center",
//   },

//   emptyText: {
//     fontSize: 11,
//     lineHeight: 17,
//     textAlign: "center",
//     marginTop: 6,
//   },

//   inlineLoader: {
//     marginVertical: 24,
//   },
// });
