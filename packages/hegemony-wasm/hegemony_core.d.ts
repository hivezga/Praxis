/* tslint:disable */
/* eslint-disable */

export function apply_mutation_wasm(state: any, mutation: any, label: string): any;

export function apply_preparation_phase_wasm(state: any): any;

export function apply_production_phase_wasm(state: any, mode: string): any;

export function apply_scoring_phase_wasm(state: any): any;

export function compute_round_suggestion_wasm(state: any): any;

export function compute_vp_wasm(state: any, class_id: any): any;

export function create_starting_state_wasm(input: any): any;

export function init(): void;

export function undo_wasm(state: any): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly apply_mutation_wasm: (a: any, b: any, c: number, d: number) => [number, number, number];
    readonly apply_preparation_phase_wasm: (a: any) => [number, number, number];
    readonly apply_production_phase_wasm: (a: any, b: number, c: number) => [number, number, number];
    readonly apply_scoring_phase_wasm: (a: any) => [number, number, number];
    readonly compute_round_suggestion_wasm: (a: any) => [number, number, number];
    readonly compute_vp_wasm: (a: any, b: any) => [number, number, number];
    readonly create_starting_state_wasm: (a: any) => [number, number, number];
    readonly init: () => void;
    readonly undo_wasm: (a: any) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
