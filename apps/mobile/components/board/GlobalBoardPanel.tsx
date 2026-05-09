import { View } from "react-native";
import { BillsPanel } from "./BillsPanel";
import { MarketPanel } from "./MarketPanel";
import { PolicyTracksRow } from "./PolicyTracksRow";
import { PoolsPanel } from "./PoolsPanel";

export function GlobalBoardPanel() {
  return (
    <View className="gap-3">
      <PolicyTracksRow />
      <MarketPanel />
      <PoolsPanel />
      <BillsPanel />
    </View>
  );
}
