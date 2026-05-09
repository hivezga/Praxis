/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const apply_mutation_wasm: (a: any, b: any, c: number, d: number) => [number, number, number];
export const apply_preparation_phase_wasm: (a: any) => [number, number, number];
export const apply_production_phase_wasm: (a: any, b: number, c: number) => [number, number, number];
export const apply_scoring_phase_wasm: (a: any) => [number, number, number];
export const compute_round_suggestion_wasm: (a: any) => [number, number, number];
export const compute_vp_wasm: (a: any, b: any) => [number, number, number];
export const create_starting_state_wasm: (a: any) => [number, number, number];
export const init: () => void;
export const undo_wasm: (a: any) => [number, number, number];
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
