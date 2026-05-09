#!/usr/bin/env bash
# Compiles hegemony-core into Android .so files inside an EAS Build Linux container.
# Wired via the `eas-build-pre-install` lifecycle hook in apps/mobile/package.json.
#
# Required env from the EAS image:
#   ANDROID_NDK_HOME (or ANDROID_NDK_ROOT) — set by EAS Android workers
#
# Optional env (set in eas.json profiles):
#   RUST_TARGETS — comma-separated list of cargo-ndk targets (default: arm64-v8a,x86_64)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MOBILE_ROOT/../.." && pwd)"
CRATE_PATH="$REPO_ROOT/crates/hegemony-core"
JNILIBS="$MOBILE_ROOT/modules/hegemony/android/src/main/jniLibs"

: "${RUST_TARGETS:=arm64-v8a,x86_64}"

if [[ -z "${ANDROID_NDK_HOME:-}" && -n "${ANDROID_NDK_ROOT:-}" ]]; then
  export ANDROID_NDK_HOME="$ANDROID_NDK_ROOT"
fi

echo "==> [eas-build-rust] crate: $CRATE_PATH"
echo "==> [eas-build-rust] jniLibs out: $JNILIBS"
echo "==> [eas-build-rust] targets: $RUST_TARGETS"
echo "==> [eas-build-rust] ANDROID_NDK_HOME: ${ANDROID_NDK_HOME:-<unset>}"

if ! command -v cargo >/dev/null 2>&1; then
  echo "==> [eas-build-rust] installing rustup + stable toolchain"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi

# Ensure $HOME/.cargo/bin is on PATH for subsequent steps in the build
export PATH="$HOME/.cargo/bin:$PATH"

IFS=',' read -r -a TARGETS <<< "$RUST_TARGETS"

declare -A NDK_TO_RUSTUP=(
  [arm64-v8a]=aarch64-linux-android
  [armeabi-v7a]=armv7-linux-androideabi
  [x86_64]=x86_64-linux-android
  [x86]=i686-linux-android
)

for t in "${TARGETS[@]}"; do
  rustup_target="${NDK_TO_RUSTUP[$t]:-}"
  if [[ -z "$rustup_target" ]]; then
    echo "!! Unknown cargo-ndk target alias '$t' — supported: arm64-v8a, armeabi-v7a, x86_64, x86" >&2
    exit 1
  fi
  echo "==> [eas-build-rust] adding rustup target $rustup_target"
  rustup target add "$rustup_target"
done

if ! command -v cargo-ndk >/dev/null 2>&1; then
  echo "==> [eas-build-rust] installing cargo-ndk"
  cargo install cargo-ndk --locked
fi

NDK_TARGET_FLAGS=()
for t in "${TARGETS[@]}"; do
  NDK_TARGET_FLAGS+=( -t "$t" )
done

cd "$CRATE_PATH"
echo "==> [eas-build-rust] cargo ndk ${NDK_TARGET_FLAGS[*]} -o $JNILIBS build --release"
cargo ndk "${NDK_TARGET_FLAGS[@]}" -o "$JNILIBS" build --release

echo "==> [eas-build-rust] produced .so files:"
find "$JNILIBS" -name '*.so' -print
