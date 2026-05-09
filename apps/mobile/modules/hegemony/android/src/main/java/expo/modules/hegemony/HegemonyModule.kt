package expo.modules.hegemony

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HegemonyModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("Hegemony")

        Function("createStartingState") { inputJson: String ->
            HegemonyBridge.nativeCreateStartingState(inputJson)
        }

        Function("applyMutation") { stateJson: String, mutationJson: String, label: String ->
            HegemonyBridge.nativeApplyMutation(stateJson, mutationJson, label)
        }

        Function("undo") { stateJson: String ->
            HegemonyBridge.nativeUndo(stateJson)
        }

        Function("computeRoundSuggestion") { stateJson: String ->
            HegemonyBridge.nativeComputeRoundSuggestion(stateJson)
        }

        Function("computeVp") { stateJson: String, classIdJson: String ->
            HegemonyBridge.nativeComputeVp(stateJson, classIdJson)
        }
    }
}
