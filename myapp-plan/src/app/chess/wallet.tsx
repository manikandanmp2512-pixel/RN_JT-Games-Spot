import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import {
  fetchChessRewardBalance,
  fetchChessRewardHistory,
} from "@/services/chessRewardApi";

import { ChessTransaction } from "@/types/chessRewards";

export default function ChessWalletScreen() {
  const [coins, setCoins] = useState(0);
  const [transactions, setTransactions] = useState<ChessTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadWallet = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [balance, history] = await Promise.all([
        fetchChessRewardBalance(),
        fetchChessRewardHistory(1, 30),
      ]);

      setCoins(balance);
      setTransactions(history.transactions);
    } catch {
      setError("Unable to load your wallet. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [loadWallet])
  );

  const renderTransaction = ({ item }: { item: ChessTransaction }) => {
    const positive = item.amount > 0;

    return (
      <View style={styles.transaction}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>
            {item.description || item.type.replace(/_/g, " ")}
          </Text>

          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>

          <Text style={styles.matchId} numberOfLines={1}>
            Match: {item.matchId}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              positive ? styles.positive : styles.negative,
            ]}
          >
            {positive ? "+" : ""}
            {item.amount}
          </Text>

          <Text style={styles.balanceAfter}>
            {item.balanceAfter == null
              ? ""
              : `Balance: ${item.balanceAfter}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: "Chess Wallet",
          headerShown: true,
          headerStyle: { backgroundColor: "#071E2B" },
          headerTintColor: "#FFFFFF",
        }}
      />

      <View style={styles.container}>
        <Text style={styles.heading}>Your Chess Wallet</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Virtual Coin Balance</Text>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.balance}>{coins.toLocaleString()}</Text>
          <Text style={styles.balanceFootnote}>
            Non-transferable game rewards · No cash value
          </Text>
        </View>

        <Text style={styles.sectionHeading}>Transaction History</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#F4A000"
            style={styles.loader}
          />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item, index) =>
              item.transactionKey || `${item.matchId}-${index}`
            }
            renderItem={renderTransaction}
            contentContainerStyle={styles.historyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadWallet(true)}
                tintColor="#F4A000"
              />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                No virtual coin transactions yet.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#071E2B",
  },
  container: {
    flex: 1,
    padding: 18,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 18,
  },
  balanceCard: {
    backgroundColor: "#103447",
    borderColor: "#244F65",
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    marginBottom: 24,
  },
  balanceLabel: {
    color: "#B8C9D2",
    fontSize: 14,
  },
  coinIcon: {
    fontSize: 32,
    marginTop: 12,
  },
  balance: {
    color: "#F4A000",
    fontSize: 38,
    fontWeight: "900",
    marginVertical: 5,
  },
  balanceFootnote: {
    color: "#B8C9D2",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },
  sectionHeading: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  loader: {
    marginTop: 28,
  },
  historyList: {
    paddingBottom: 28,
    gap: 10,
  },
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#103447",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#244F65",
    padding: 13,
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
    gap: 5,
  },
  transactionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  transactionDate: {
    color: "#B8C9D2",
    fontSize: 10,
  },
  matchId: {
    color: "#829AA7",
    fontSize: 10,
  },
  amountContainer: {
    alignItems: "flex-end",
    gap: 5,
  },
  amount: {
    fontSize: 17,
    fontWeight: "800",
  },
  positive: {
    color: "#5CE0A0",
  },
  negative: {
    color: "#FF8B8B",
  },
  balanceAfter: {
    color: "#B8C9D2",
    fontSize: 10,
  },
  error: {
    color: "#FF8B8B",
    textAlign: "center",
    marginTop: 20,
  },
  empty: {
    color: "#B8C9D2",
    textAlign: "center",
    paddingVertical: 30,
  },
});