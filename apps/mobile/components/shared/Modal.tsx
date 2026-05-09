import { Modal as RNModal, Pressable, ScrollView, Text, View } from "react-native";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: Props) {
  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/75 p-4"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900"
          onPress={(e) => e.stopPropagation()}
        >
          {title != null ? (
            <View className="flex-row items-center justify-between border-b border-slate-800 px-5 py-3.5">
              <Text className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                {typeof title === "string" ? title : ""}
              </Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={onClose}
                className="h-7 w-7 items-center justify-center rounded-md border border-slate-700"
              >
                <Text className="text-slate-400">✕</Text>
              </Pressable>
            </View>
          ) : null}
          <ScrollView
            className="max-h-96 p-5"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer != null ? (
            <View className="flex-row justify-end gap-2 border-t border-slate-800 px-5 py-3.5">
              {footer}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
