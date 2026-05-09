import type { PolicyId, PolicySection } from "@/lib/types/game";

export interface PolicyDefinition {
  id: PolicyId;
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  axis: "leftRight" | "natGlobal";
  // Short labels per section for the policy track UI.
  sections: Record<PolicySection, { label: string; tooltip: string }>;
  defaultStart: PolicySection;
}

export const POLICIES: PolicyDefinition[] = [
  {
    id: "fiscalPolicy",
    number: 1,
    name: "Fiscal Policy",
    axis: "leftRight",
    sections: {
      A: { label: "Large Public Sector", tooltip: "9 public companies; 2 loans before IMF" },
      B: { label: "Medium Public Sector", tooltip: "6 public companies" },
      C: { label: "Small Public Sector", tooltip: "3 public companies; 1 loan before IMF" },
    },
    defaultStart: "C",
  },
  {
    id: "laborMarket",
    number: 2,
    name: "Labor Market",
    axis: "leftRight",
    sections: {
      A: { label: "Min wage L3", tooltip: "Companies must pay wage level 3" },
      B: { label: "Min wage L2", tooltip: "Wage levels 2 or 3 allowed" },
      C: { label: "Min wage L1", tooltip: "Any wage level allowed" },
    },
    defaultStart: "C",
  },
  {
    id: "taxation",
    number: 3,
    name: "Taxation",
    axis: "leftRight",
    sections: {
      A: { label: "High tax", tooltip: "Tax base 3" },
      B: { label: "Medium tax", tooltip: "Tax base 2" },
      C: { label: "Low tax", tooltip: "Tax base 1" },
    },
    defaultStart: "A",
  },
  {
    id: "healthBenefits",
    number: 4,
    name: "Health & Benefits",
    axis: "leftRight",
    sections: {
      A: { label: "Universal", tooltip: "Free healthcare; tax multiplier +2" },
      B: { label: "Subsidized", tooltip: "$5 per use; tax multiplier +1" },
      C: { label: "Private", tooltip: "$10 per use; no extra tax" },
    },
    defaultStart: "C",
  },
  {
    id: "educationWelfare",
    number: 5,
    name: "Education",
    axis: "leftRight",
    sections: {
      A: { label: "Universal", tooltip: "Free education; tax multiplier +2" },
      B: { label: "Subsidized", tooltip: "$5 per use; tax multiplier +1" },
      C: { label: "Private", tooltip: "$10 per use; no extra tax" },
    },
    defaultStart: "C",
  },
  {
    id: "foreignTrade",
    number: 6,
    name: "Foreign Trade",
    axis: "natGlobal",
    sections: {
      A: { label: "Protectionist", tooltip: "Import tariffs +10/+6; 0 deals/round" },
      B: { label: "Mixed", tooltip: "Tariffs +5/+3; 1 deal/round" },
      C: { label: "Free Trade", tooltip: "No tariffs; 2 deals/round" },
    },
    defaultStart: "C",
  },
  {
    id: "immigration",
    number: 7,
    name: "Immigration",
    axis: "natGlobal",
    sections: {
      A: { label: "Closed", tooltip: "0 immigrants per round" },
      B: { label: "Selective", tooltip: "1 immigrant per round" },
      C: { label: "Open", tooltip: "2 immigrants per round" },
    },
    defaultStart: "A",
  },
];

export const POLICIES_BY_ID: Record<PolicyId, PolicyDefinition> = Object.fromEntries(
  POLICIES.map((p) => [p.id, p])
) as Record<PolicyId, PolicyDefinition>;
