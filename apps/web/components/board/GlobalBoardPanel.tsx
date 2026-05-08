"use client";

import { BillsPanel } from "./BillsPanel";
import { MarketPanel } from "./MarketPanel";
import { PolicyTracksRow } from "./PolicyTracksRow";
import { PoolsPanel } from "./PoolsPanel";

export function GlobalBoardPanel() {
  return (
    <div className="space-y-3">
      <PolicyTracksRow />
      <div className="grid gap-3 lg:grid-cols-3">
        <MarketPanel />
        <PoolsPanel />
        <BillsPanel />
      </div>
    </div>
  );
}
