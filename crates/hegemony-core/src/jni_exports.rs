#![cfg(target_os = "android")]

use jni::objects::{JClass, JString};
use jni::sys::jstring;
use jni::JNIEnv;

use crate::mutations::{apply_mutation, undo, Mutation};
use crate::rules::end_of_round::compute_round_suggestion;
use crate::rules::vp::vp_for;
use crate::starting_state::create_starting_state;
use crate::types::{ClassId, GameState, NewGameInput};

fn jstring_to_rust(env: &mut JNIEnv, s: &JString) -> String {
    env.get_string(s).expect("invalid JString").into()
}

fn rust_to_jstring(env: &mut JNIEnv, s: &str) -> jstring {
    env.new_string(s).expect("could not create JString").into_raw()
}

fn error_jstring(env: &mut JNIEnv, msg: &str) -> jstring {
    let payload = serde_json::json!({ "error": msg }).to_string();
    rust_to_jstring(env, &payload)
}

#[no_mangle]
pub extern "C" fn Java_expo_modules_hegemony_HegemonyBridge_nativeCreateStartingState(
    mut env: JNIEnv,
    _class: JClass,
    input_json: JString,
) -> jstring {
    let json = jstring_to_rust(&mut env, &input_json);
    match serde_json::from_str::<NewGameInput>(&json) {
        Ok(input) => {
            let state = create_starting_state(input);
            match serde_json::to_string(&state) {
                Ok(s) => rust_to_jstring(&mut env, &s),
                Err(e) => error_jstring(&mut env, &e.to_string()),
            }
        }
        Err(e) => error_jstring(&mut env, &e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn Java_expo_modules_hegemony_HegemonyBridge_nativeApplyMutation(
    mut env: JNIEnv,
    _class: JClass,
    state_json: JString,
    mutation_json: JString,
    label_jstr: JString,
) -> jstring {
    let state_s = jstring_to_rust(&mut env, &state_json);
    let mutation_s = jstring_to_rust(&mut env, &mutation_json);
    let label = jstring_to_rust(&mut env, &label_jstr);
    let state = match serde_json::from_str::<GameState>(&state_s) {
        Ok(v) => v,
        Err(e) => return error_jstring(&mut env, &e.to_string()),
    };
    let mutation = match serde_json::from_str::<Mutation>(&mutation_s) {
        Ok(v) => v,
        Err(e) => return error_jstring(&mut env, &e.to_string()),
    };
    let next = apply_mutation(&state, mutation, &label);
    match serde_json::to_string(&next) {
        Ok(s) => rust_to_jstring(&mut env, &s),
        Err(e) => error_jstring(&mut env, &e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn Java_expo_modules_hegemony_HegemonyBridge_nativeUndo(
    mut env: JNIEnv,
    _class: JClass,
    state_json: JString,
) -> jstring {
    let json = jstring_to_rust(&mut env, &state_json);
    let state = match serde_json::from_str::<GameState>(&json) {
        Ok(v) => v,
        Err(e) => return error_jstring(&mut env, &e.to_string()),
    };
    let result = undo(&state);
    match serde_json::to_string(&result) {
        Ok(s) => rust_to_jstring(&mut env, &s),
        Err(e) => error_jstring(&mut env, &e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn Java_expo_modules_hegemony_HegemonyBridge_nativeComputeRoundSuggestion(
    mut env: JNIEnv,
    _class: JClass,
    state_json: JString,
) -> jstring {
    let json = jstring_to_rust(&mut env, &state_json);
    let state = match serde_json::from_str::<GameState>(&json) {
        Ok(v) => v,
        Err(e) => return error_jstring(&mut env, &e.to_string()),
    };
    let suggestion = compute_round_suggestion(&state);
    match serde_json::to_string(&suggestion) {
        Ok(s) => rust_to_jstring(&mut env, &s),
        Err(e) => error_jstring(&mut env, &e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn Java_expo_modules_hegemony_HegemonyBridge_nativeComputeVp(
    mut env: JNIEnv,
    _class: JClass,
    state_json: JString,
    class_id_json: JString,
) -> jstring {
    let state_s = jstring_to_rust(&mut env, &state_json);
    let class_s = jstring_to_rust(&mut env, &class_id_json);
    let state = match serde_json::from_str::<GameState>(&state_s) {
        Ok(v) => v,
        Err(e) => return error_jstring(&mut env, &e.to_string()),
    };
    let class_id = match serde_json::from_str::<ClassId>(&class_s) {
        Ok(v) => v,
        Err(e) => return error_jstring(&mut env, &e.to_string()),
    };
    let vp = vp_for(class_id, &state);
    match serde_json::to_string(&vp) {
        Ok(s) => rust_to_jstring(&mut env, &s),
        Err(e) => error_jstring(&mut env, &e.to_string()),
    }
}
