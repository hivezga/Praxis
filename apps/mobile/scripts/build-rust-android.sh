#!/usr/bin/env bash
# Builds hegemony-core as a shared library for Android.
# Prerequisites:
#   cargo install cargo-ndk
#   rustup target add aarch64-linux-android x86_64-linux-android
#
# Run from the monorepo root: bash apps/mobile/scripts/build-rust-android.sh

set -e

command -v cargo >/dev/null 2>&1 || {
  echo "cargo not found. Install rustup: https://rustup.rs" >&2
  exit 1
}
command -v cargo-ndk >/dev/null 2>&1 || {
  echo "cargo-ndk not installed. Run: cargo install cargo-ndk --locked" >&2
  exit 1
}

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CRATE_PATH="$REPO_ROOT/crates/hegemony-core"
JNILIBS="$REPO_ROOT/apps/mobile/modules/hegemony/android/src/main/jniLibs"

echo "Building hegemony-core for arm64-v8a..."
cd "$CRATE_PATH"
cargo ndk -t arm64-v8a -o "$JNILIBS" build --release

echo "Building hegemony-core for x86_64 (emulator)..."
cargo ndk -t x86_64 -o "$JNILIBS" build --release

echo "Done. .so files placed in:"
find "$JNILIBS" -name "*.so"
