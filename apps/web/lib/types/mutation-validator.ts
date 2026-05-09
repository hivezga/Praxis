import type { Mutation } from "./mutations";

/**
 * Allow-list of every Mutation `type` discriminator. Derived by hand from
 * `mutations.ts`; if you add a new variant there, add it here too — the
 * exhaustive switch in `assertMutationType` will catch the omission.
 */
const KNOWN_TYPES = [
  "setPolicy",
  "advancePhase",
  "setPhase",
  "setRound",
  "proposeBill",
  "removeBill",
  "adjustMoney",
  "adjustRevenue",
  "adjustTreasury",
  "adjustCapital",
  "adjustVp",
  "adjustProsperity",
  "adjustPopulation",
  "adjustStorage",
  "adjustLoans",
  "adjustLegitimacy",
  "setNotes",
  "adjustUnemployedWorkers",
  "adjustSkilledWorkers",
  "adjustVotingCubes",
  "adjustBillMarkers",
  "adjustHandSize",
  "adjustSavings",
  "adjustTradeUnion",
  "adjustFreeTradeZone",
  "adjustMarket",
  "adjustPool",
  "adjustPublicService",
  "adjustLegitimacyTokens",
  "applyEndRound",
  "passBill",
  "failBill",
  "setWealthMarker",
  "sellWelfare",
] as const satisfies readonly Mutation["type"][];

const KNOWN_TYPE_SET: ReadonlySet<string> = new Set(KNOWN_TYPES);

/**
 * Returns true iff `value` is an object whose `type` field is in the
 * known-mutation allow-list. Does NOT validate the shape of payload
 * fields — Rust's serde will reject malformed payloads with a clean
 * `MutationError::InvalidArgument`. The point here is to keep
 * unknown variants out of WASM in the first place.
 */
export function isKnownMutationShape(value: unknown): value is Mutation {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && KNOWN_TYPE_SET.has(type);
}
