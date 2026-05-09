import type { ClassId, Good, Phase, PolicyId, PolicySection } from "./game";

export type PoolId = "workers" | "middleClass" | "foreignCapital";
export type ServiceId = "health" | "education" | "mediaInfluence";

export type Mutation =
  | { type: "setPolicy"; policyId: PolicyId; position: PolicySection }
  | { type: "advancePhase" }
  | { type: "setPhase"; phase: Phase }
  | { type: "setRound"; round: number }
  | { type: "proposeBill"; policyId: PolicyId; proposedSection: PolicySection; proposedBy: ClassId; immediateVote: boolean }
  | { type: "removeBill"; id: string }
  | { type: "adjustMoney"; classId: ClassId; delta: number }
  | { type: "adjustRevenue"; delta: number }
  | { type: "adjustTreasury"; delta: number }
  | { type: "adjustCapital"; classId: ClassId; delta: number }
  | { type: "adjustVp"; classId: ClassId; delta: number }
  | { type: "adjustProsperity"; classId: ClassId; delta: number }
  | { type: "adjustPopulation"; classId: ClassId; delta: number }
  | { type: "adjustStorage"; classId: ClassId; good: Good; delta: number }
  | { type: "adjustLoans"; classId: ClassId; delta: number }
  | { type: "adjustLegitimacy"; fromClass: ClassId; delta: number }
  | { type: "setNotes"; classId: ClassId; text: string }
  | { type: "adjustUnemployedWorkers"; classId: ClassId; delta: number }
  | { type: "adjustSkilledWorkers"; classId: ClassId; delta: number }
  | { type: "adjustVotingCubes"; classId: ClassId; delta: number }
  | { type: "adjustBillMarkers"; classId: ClassId; delta: number }
  | { type: "adjustHandSize"; classId: ClassId; delta: number }
  | { type: "adjustSavings"; delta: number }
  | { type: "adjustTradeUnion"; index: number; delta: number }
  | { type: "adjustFreeTradeZone"; good: Good; delta: number }
  | { type: "adjustMarket"; good: Good; delta: number }
  | { type: "adjustPool"; pool: PoolId; delta: number }
  | { type: "adjustPublicService"; service: ServiceId; delta: number }
  | { type: "adjustLegitimacyTokens"; fromClass: ClassId; delta: number }
  | {
      type: "applyEndRound";
      wagesFromCapitalist: number;
      wagesFromMiddle: number;
      wagesToWorking: number;
      workingIncomeTax: number;
      middleIncomeTax: number;
      middleEmploymentTax: number;
      capitalistIncomeTax: number;
      capitalistEmploymentTax: number;
      totalToTreasury: number;
      welfareCost: number;
      workingProsperitySteps: number;
      middleProsperitySteps: number;
    }
  | { type: "passBill"; billId: string }
  | { type: "failBill"; billId: string };
