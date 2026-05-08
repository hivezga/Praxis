import type { PersistenceAdapter } from "./adapter";

// Stub: keeps the type contract so a real Supabase implementation can drop in later
// without changes to the store. Calling these throws so we don't silently lose data.
export const supabaseAdapter: PersistenceAdapter = {
  async list() {
    throw new Error("SupabaseAdapter not implemented yet");
  },
  async load() {
    throw new Error("SupabaseAdapter not implemented yet");
  },
  async save() {
    throw new Error("SupabaseAdapter not implemented yet");
  },
  async remove() {
    throw new Error("SupabaseAdapter not implemented yet");
  },
};
