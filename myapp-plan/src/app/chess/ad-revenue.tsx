import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";

import { fetchAdRevenueSummary } from "@/services/chessRewardApi";

type RevenueSummary = {
  network: string;
  currency: string;
  estimatedRevenue: number;
  finalizedRevenue: number;
  paidRevenue: number;
  reportCount: number;
};

export default function AdRevenueScreen() {
  const [summaries, setSummaries] = useState<RevenueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const result = await fetchAdRevenueSummary();
      setSummaries(result.summaries);
    } catch {
      setError(
        "Unable to load revenue reports. Check your admin access and provider reporting setup."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: "Ad Revenue",
          headerShown: true,
          headerStyle: { backgroundColor: "#071E2B" },
          headerTintColor: "#FFFFFF",
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadReports(true)}
            tintColor="#F4A000"
          />
        }
      >
        <Text style={styles.title}>Publisher Revenue</Text>

        <Text style={styles.subtitle}>
          Reported advertising earnings across your configured networks.
        </Text>

        {loading ? (
          <ActivityIndicator color="#F4A000" size="large" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : summaries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No revenue reports yet</Text>
            <Text style={styles.subtitle}>
              Connect your provider reporting integration and import a report
              to display earnings here.
            </Text>
          </View>
        ) : (
          summaries.map((item) => (
            <View
              key={`${item.network}-${item.currency}`}
              style={styles.card}
            >
              <Text style={styles.network}>
                {item.network.toUpperCase()} · {item.currency}
              </Text>

              <RevenueRow
                label="Estimated revenue"
                value={item.estimatedRevenue}
                currency={item.currency}
              />

              <RevenueRow
                label="Finalized revenue"
                value={item.finalizedRevenue}
                currency={item.currency}
              />

              <RevenueRow
                label="Reported paid revenue"
                value={item.paidRevenue}
                currency={item.currency}
              />

              <Text style={styles.reportCount}>
                Reports imported: {item.reportCount}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.disclaimer}>
          These totals reflect imported provider reports. They are not a live
          per-view payout estimate, and a report alone does not confirm a bank
          deposit.
        </Text>
      </ScrollView>
    </View>
  );
}

function RevenueRow({
  label,
  value,
  currency,
}: {
  label: string;
  value: number;
  currency: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {currency} {value.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071E2B",
  },
  content: {
    padding: 18,
    gap: 14,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },
  subtitle: {
    color: "#B8C9D2",
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    backgroundColor: "#103447",
    borderColor: "#244F65",
    borderWidth: 1,
    borderRadius: 16,
    padding: 17,
    gap: 15,
  },
  network: {
    color: "#F4A000",
    fontSize: 16,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  rowLabel: {
    flex: 1,
    color: "#B8C9D2",
    fontSize: 12,
  },
  rowValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  reportCount: {
    color: "#829AA7",
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: "#103447",
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  error: {
    color: "#FF8B8B",
    lineHeight: 20,
  },
  disclaimer: {
    color: "#829AA7",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
});