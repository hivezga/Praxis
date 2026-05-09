import HegemonyNative from "@/modules/hegemony";
import type { ClassId, GameState, RoundSuggestion } from "./types/game";
import type { Mutation } from "./types/mutations";

export interface NewGameInput {
  name?: string;
  mode: "solo" | "party";
  playerCount: 2 | 3 | 4;
  classesInPlay: ClassId[];
  expansions: {
    crisisAndControl: boolean;
    modules: {
      automa: boolean;
      crisisCards: boolean;
      alternativeEvents: boolean;
      hiddenAgendas: boolean;
      newActionCards: boolean;
    };
  };
}

export interface VpBreakdown {
  total: number;
}

function parseOrThrow<T>(json: string): T {
  const v = JSON.parse(json) as unknown;
  if (typeof v === "object" && v !== null && "error" in v) {
    throw new Error((v as { error: string }).error);
  }
  return v as T;
}

export const engine = {
  createStartingState(input: NewGameInput): GameState {
    const json = HegemonyNative.createStartingState(JSON.stringify(input));
    return parseOrThrow<GameState>(json);
  },

  applyMutation(state: GameState, mutation: Mutation, label = ""): GameState {
    const json = HegemonyNative.applyMutation(
      JSON.stringify(state),
      JSON.stringify(mutation),
      label,
    );
    return parseOrThrow<GameState>(json);
  },

  undo(state: GameState): GameState | null {
    const json = HegemonyNative.undo(JSON.stringify(state));
    const result = parseOrThrow<GameState | null>(json);
    return result;
  },

  computeRoundSuggestion(state: GameState): RoundSuggestion {
    const json = HegemonyNative.computeRoundSuggestion(JSON.stringify(state));
    return parseOrThrow<RoundSuggestion>(json);
  },

  computeVp(state: GameState, classId: ClassId): VpBreakdown {
    const json = HegemonyNative.computeVp(
      JSON.stringify(state),
      JSON.stringify(classId),
    );
    return parseOrThrow<VpBreakdown>(json);
  },
};
