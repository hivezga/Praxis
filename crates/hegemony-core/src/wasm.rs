#![cfg(target_arch = "wasm32")]

use wasm_bindgen::prelude::*;

use crate::error::MutationError;
use crate::mutations::{apply_mutation, undo, Mutation};
use crate::rules::end_of_round::compute_round_suggestion;
use crate::rules::phases::{
    apply_preparation_phase, apply_production_phase, apply_scoring_phase, ProductionMode,
};
use crate::rules::vp::vp_for;
use crate::starting_state::create_starting_state;
use crate::types::{ClassId, GameState, NewGameInput};

#[wasm_bindgen(start)]
pub fn init() {
    // Forward Rust panic messages to console.error with source locations.
    console_error_panic_hook::set_once();
}

fn js_err<E: std::fmt::Display>(e: E) -> JsValue {
    JsValue::from_str(&e.to_string())
}

fn mutation_err_to_js(e: MutationError) -> JsValue {
    // Serialise as structured JS object so JS can pattern-match `kind`.
    serde_wasm_bindgen::to_value(&e).unwrap_or_else(|_| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn create_starting_state_wasm(input: JsValue) -> Result<JsValue, JsValue> {
    let input: NewGameInput = serde_wasm_bindgen::from_value(input).map_err(js_err)?;
    serde_wasm_bindgen::to_value(&create_starting_state(input)).map_err(js_err)
}

#[wasm_bindgen]
pub fn compute_round_suggestion_wasm(state: JsValue) -> Result<JsValue, JsValue> {
    let state: GameState = serde_wasm_bindgen::from_value(state).map_err(js_err)?;
    serde_wasm_bindgen::to_value(&compute_round_suggestion(&state)).map_err(js_err)
}

#[wasm_bindgen]
pub fn apply_mutation_wasm(
    state: JsValue,
    mutation: JsValue,
    label: &str,
) -> Result<JsValue, JsValue> {
    let state: GameState = serde_wasm_bindgen::from_value(state).map_err(js_err)?;
    let mutation: Mutation = serde_wasm_bindgen::from_value(mutation).map_err(js_err)?;
    let next = apply_mutation(&state, mutation, label).map_err(mutation_err_to_js)?;
    serde_wasm_bindgen::to_value(&next).map_err(js_err)
}

#[wasm_bindgen]
pub fn compute_vp_wasm(state: JsValue, class_id: JsValue) -> Result<JsValue, JsValue> {
    let state: GameState = serde_wasm_bindgen::from_value(state).map_err(js_err)?;
    let class_id: ClassId = serde_wasm_bindgen::from_value(class_id).map_err(js_err)?;
    serde_wasm_bindgen::to_value(&vp_for(class_id, &state)).map_err(js_err)
}

#[wasm_bindgen]
pub fn undo_wasm(state: JsValue) -> Result<JsValue, JsValue> {
    let state: GameState = serde_wasm_bindgen::from_value(state).map_err(js_err)?;
    let result = undo(&state).map_err(mutation_err_to_js)?;
    serde_wasm_bindgen::to_value(&result).map_err(js_err)
}

#[wasm_bindgen]
pub fn apply_preparation_phase_wasm(state: JsValue) -> Result<JsValue, JsValue> {
    let state: GameState = serde_wasm_bindgen::from_value(state).map_err(js_err)?;
    serde_wasm_bindgen::to_value(&apply_preparation_phase(&state)).map_err(js_err)
}

#[wasm_bindgen]
pub fn apply_production_phase_wasm(state: JsValue, mode: &str) -> Result<JsValue, JsValue> {
    let state: GameState = serde_wasm_bindgen::from_value(state).map_err(js_err)?;
    let mode = match mode {
        "manual" => ProductionMode::Manual,
        _ => ProductionMode::Auto,
    };
    serde_wasm_bindgen::to_value(&apply_production_phase(&state, mode)).map_err(js_err)
}

#[wasm_bindgen]
pub fn apply_scoring_phase_wasm(state: JsValue) -> Result<JsValue, JsValue> {
    let state: GameState = serde_wasm_bindgen::from_value(state).map_err(js_err)?;
    serde_wasm_bindgen::to_value(&apply_scoring_phase(&state)).map_err(js_err)
}
