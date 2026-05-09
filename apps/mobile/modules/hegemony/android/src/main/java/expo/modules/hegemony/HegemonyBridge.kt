package expo.modules.hegemony

class HegemonyBridge {
    companion object {
        init {
            System.loadLibrary("hegemony_core")
        }

        @JvmStatic
        external fun nativeCreateStartingState(inputJson: String): String

        @JvmStatic
        external fun nativeApplyMutation(stateJson: String, mutationJson: String, label: String): String

        @JvmStatic
        external fun nativeUndo(stateJson: String): String

        @JvmStatic
        external fun nativeComputeRoundSuggestion(stateJson: String): String

        @JvmStatic
        external fun nativeComputeVp(stateJson: String, classIdJson: String): String
    }
}
