export type HegemonyModuleType = {
  createStartingState(inputJson: string): string;
  applyMutation(stateJson: string, mutationJson: string, label: string): string;
  undo(stateJson: string): string;
  computeRoundSuggestion(stateJson: string): string;
  computeVp(stateJson: string, classIdJson: string): string;
};
