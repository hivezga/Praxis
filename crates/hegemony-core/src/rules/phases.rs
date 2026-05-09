//! Phase orchestrator: deterministic transitions for Preparation,
//! Production, and Scoring phases. Action and Elections phases are
//! player-driven and stay out of this module.
//!
//! All three orchestrators take and return `GameState` — they do not
//! mutate in place. They emit a `PhaseLog` describing every change so
//! the UI can show a per-step breakdown to the user.

use serde::{Deserialize, Serialize};

use crate::rules::end_of_round::{apply_round_suggestion, compute_round_suggestion};
use crate::rules::imf::{apply_imf_intervention, imf_intervenes};
use crate::types::{GameState, Phase, RoundSuggestion};

const LOAN_INTEREST: i32 = 5;

/// Auto-apply mode for the Production Phase. `Manual` means we compute
/// the suggestion but do NOT mutate state - the UI shows the breakdown
/// and lets the user click +/- to apply each line. `Auto` means we
/// apply the full breakdown atomically.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ProductionMode {
    Auto,
    Manual,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PhaseLog {
    pub phase: Phase,
    pub round: u8,
    pub entries: Vec<String>,
    /// Suggestion produced by Production phase (None for Prep/Scoring).
    pub suggestion: Option<RoundSuggestion>,
    /// True if IMF triggered during Production.
    pub imf_intervened: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PhaseResult {
    pub state: GameState,
    pub log: PhaseLog,
}

// ---------------------------------------------------------------------------
// Preparation Phase
// ---------------------------------------------------------------------------

/// Apply the Preparation Phase deterministic effects:
///   - Pay loan interest (5¥ per Loan) for each Class
///   - Drop Prosperity: Working -1, Middle -2 (rulebook pages 14, 22)
///
/// Skipped on Round 1 (page 11).
///
/// Card drawing, immigration workers, and Company-market reveals are
/// player-choice or require modelling decks that aren't tracked in
/// core yet; they remain UI-driven.
pub fn apply_preparation_phase(state: &GameState) -> PhaseResult {
    let mut next = state.clone();
    let mut entries = Vec::new();

    if next.meta.round == 1 {
        return PhaseResult {
            state: next,
            log: PhaseLog {
                phase: Phase::Preparation,
                round: 1,
                entries: vec!["Round 1: Preparation Phase skipped per rulebook.".to_string()],
                suggestion: None,
                imf_intervened: false,
            },
        };
    }

    // Loan interest: each Class pays 5¥ per Loan from its money/revenue.
    let w_int = next.classes.working.loans * LOAN_INTEREST;
    if w_int > 0 {
        next.classes.working.money = (next.classes.working.money - w_int).max(0);
        entries.push(format!("Working pays {}¥ loan interest.", w_int));
    }
    let m_int = next.classes.middle.loans * LOAN_INTEREST;
    if m_int > 0 {
        next.classes.middle.money = (next.classes.middle.money - m_int).max(0);
        entries.push(format!("Middle pays {}¥ loan interest.", m_int));
    }
    // Capitalist pays from Capital (FAQ p.1).
    let c_int = next.classes.capitalist.loans * LOAN_INTEREST;
    if c_int > 0 {
        next.classes.capitalist.capital = (next.classes.capitalist.capital - c_int).max(0);
        entries.push(format!("Capitalist pays {}¥ loan interest.", c_int));
    }
    let s_int = next.classes.state.loans * LOAN_INTEREST;
    if s_int > 0 {
        next.classes.state.treasury = (next.classes.state.treasury - s_int).max(0);
        entries.push(format!("State pays {}¥ loan interest.", s_int));
    }

    // Drop Prosperity (Working -1, Middle -2).
    if next.classes.working.prosperity > 0 {
        next.classes.working.prosperity = (next.classes.working.prosperity - 1).max(0);
        entries.push("Working Class prosperity drops 1 step.".to_string());
    }
    if next.classes.middle.prosperity > 0 {
        let drop = 2.min(next.classes.middle.prosperity);
        next.classes.middle.prosperity -= drop;
        entries.push(format!("Middle Class prosperity drops {} step(s).", drop));
    }

    next.meta.phase = Phase::Action;

    let round = next.meta.round;
    PhaseResult {
        state: next,
        log: PhaseLog {
            phase: Phase::Preparation,
            round,
            entries,
            suggestion: None,
            imf_intervened: false,
        },
    }
}

// ---------------------------------------------------------------------------
// Production Phase
// ---------------------------------------------------------------------------

/// Apply the Production Phase. In `Auto` mode the full breakdown is
/// applied to the GameState atomically; in `Manual` mode the state is
/// returned unchanged and the suggestion is exposed for UI manual application.
///
/// Order of operations (rulebook page 11):
///   1. Compute round suggestion (wages, taxes, prosperity)
///   2. Check IMF: if triggers, apply IMF intervention BEFORE wages/taxes
///   3. (Auto only) Apply wages, taxes, strike-influence
///
/// Cover Needs and the per-Class produce-goods step are not yet
/// auto-applied because resource placement requires per-slot output
/// modelling. The breakdown is logged so the user can apply manually.
pub fn apply_production_phase(state: &GameState, mode: ProductionMode) -> PhaseResult {
    let mut entries = Vec::new();

    // 1. Check IMF first (it changes Policies which feed taxes).
    let imf_triggered = imf_intervenes(state);
    let post_imf = if imf_triggered {
        entries.push(
            "IMF intervenes: bills discarded, Policies reset, Loans paid, Legitimacy halved."
                .to_string(),
        );
        apply_imf_intervention(state)
    } else {
        state.clone()
    };

    // 2. Compute round suggestion against the (possibly IMF-mutated) state.
    let suggestion = compute_round_suggestion(&post_imf);
    entries.push(format!("Tax multiplier this round: \u{d7}{}", suggestion.taxes.multiplier));
    entries.push(format!(
        "Total taxes to Treasury: {}¥ (working {} + middle income {} + middle employment {} + capitalist corporate {} + capitalist employment {})",
        suggestion.taxes.total_to_treasury,
        suggestion.taxes.working_income_tax,
        suggestion.taxes.middle_income_tax,
        suggestion.taxes.middle_employment_tax,
        suggestion.taxes.capitalist_income_tax,
        suggestion.taxes.capitalist_employment_tax,
    ));
    entries.push(format!(
        "Wages: capitalist {}¥, middle {}¥, to working {}¥",
        suggestion.wages.from_capitalist,
        suggestion.wages.from_middle,
        suggestion.wages.to_working,
    ));

    let final_state = match mode {
        ProductionMode::Auto => {
            entries.push("Auto-mode: applying breakdown atomically.".to_string());
            let mut next = apply_round_suggestion(&post_imf, &suggestion);
            next.meta.phase = Phase::Elections;
            next
        }
        ProductionMode::Manual => {
            entries.push(
                "Manual mode: suggestion shown - apply each line via +/- on the UI."
                    .to_string(),
            );
            // Even in manual mode IMF auto-applies (it's a hard rule, not optional).
            let mut next = post_imf;
            next.meta.phase = Phase::Elections;
            next
        }
    };

    let round = final_state.meta.round;
    PhaseResult {
        state: final_state,
        log: PhaseLog {
            phase: Phase::Production,
            round,
            entries,
            suggestion: Some(suggestion),
            imf_intervened: imf_triggered,
        },
    }
}

// ---------------------------------------------------------------------------
// Scoring Phase
// ---------------------------------------------------------------------------

/// Apply the Scoring Phase. Computes per-Class VP from policies,
/// trade unions, prosperity, capital, etc. via `vp::vp_for`.
///
/// Then advances Round marker (or transitions to Game End if Round 5).
///
/// State-specific scoring (Legitimacy halving, Political Agenda) is
/// also applied here.
pub fn apply_scoring_phase(state: &GameState) -> PhaseResult {
    use crate::rules::vp::vp_round_delta_for;
    use crate::types::{ClassId, LegitimacyMap};

    let mut next = state.clone();
    let mut entries = Vec::new();

    // Legitimacy scoring (rulebook page 28-29):
    // Score VP = sum of 2 lowest Legitimacy values. Then halve markers.
    let leg = &next.classes.state.legitimacy;
    let mut values = [leg.working, leg.middle, leg.capitalist];
    values.sort();
    let leg_vp = values[0] + values[1];
    next.classes.state.vp = next.classes.state.vp.saturating_add(leg_vp);
    entries.push(format!("State scores {} VP from 2 lowest Legitimacies.", leg_vp));

    // Halve Legitimacy markers (rounded up).
    next.classes.state.legitimacy = LegitimacyMap {
        working: (leg.working + 1) / 2,
        middle: (leg.middle + 1) / 2,
        capitalist: (leg.capitalist + 1) / 2,
    };
    entries.push("Legitimacy markers halved (rounded up).".to_string());

    // Per-Class round delta — only the round-incremental components
    // (prosperity, trade unions, capital wealth, cash). Adds to the
    // running `vp` baseline rather than replacing it, so prior
    // pass-bill / scoring awards are preserved.
    let w_delta = vp_round_delta_for(ClassId::Working, &next);
    let m_delta = vp_round_delta_for(ClassId::Middle, &next);
    let c_delta = vp_round_delta_for(ClassId::Capitalist, &next);
    entries.push(format!("Working class scores {} VP this round.", w_delta));
    entries.push(format!("Middle class scores {} VP this round.", m_delta));
    entries.push(format!("Capitalist class scores {} VP this round.", c_delta));
    next.classes.working.vp = next.classes.working.vp.saturating_add(w_delta);
    next.classes.middle.vp = next.classes.middle.vp.saturating_add(m_delta);
    next.classes.capitalist.vp = next.classes.capitalist.vp.saturating_add(c_delta);

    // Round transition: advance round, set phase back to Preparation.
    if next.meta.round < 5 {
        next.meta.round += 1;
        next.meta.phase = Phase::Preparation;
        entries.push(format!("Advancing to Round {}.", next.meta.round));
    } else {
        // Game End: phase stays Scoring but indicate end.
        entries.push("Round 5 complete — Game End.".to_string());
    }

    let round = next.meta.round;
    PhaseResult {
        state: next,
        log: PhaseLog {
            phase: Phase::Scoring,
            round,
            entries,
            suggestion: None,
            imf_intervened: false,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::starting_state::create_starting_state;
    use crate::types::*;

    fn default_input() -> NewGameInput {
        NewGameInput {
            name: None,
            mode: GameMode::Solo,
            player_count: 4,
            classes_in_play: vec![
                ClassId::Working,
                ClassId::Middle,
                ClassId::Capitalist,
                ClassId::State,
            ],
            expansions: ExpansionFlags {
                crisis_and_control: false,
                modules: ExpansionModules {
                    automa: false,
                    crisis_cards: false,
                    alternative_events: false,
                    hidden_agendas: false,
                    new_action_cards: false,
                },
            },
            local_player_class: None,
        }
    }

    #[test]
    fn preparation_round1_skipped() {
        let state = create_starting_state(default_input());
        assert_eq!(state.meta.round, 1);
        let r = apply_preparation_phase(&state);
        assert!(r.log.entries[0].contains("skipped"));
    }

    #[test]
    fn preparation_pays_loan_interest() {
        let mut state = create_starting_state(default_input());
        state.meta.round = 2;
        state.classes.working.loans = 2;
        let starting_money = state.classes.working.money;
        let r = apply_preparation_phase(&state);
        // 2 loans * 5¥ = 10¥ interest
        assert_eq!(r.state.classes.working.money, starting_money - 10);
    }

    #[test]
    fn preparation_drops_prosperity() {
        let mut state = create_starting_state(default_input());
        state.meta.round = 2;
        state.classes.working.prosperity = 5;
        state.classes.middle.prosperity = 5;
        let r = apply_preparation_phase(&state);
        assert_eq!(r.state.classes.working.prosperity, 4);
        assert_eq!(r.state.classes.middle.prosperity, 3);
    }

    #[test]
    fn preparation_advances_phase_to_action() {
        let mut state = create_starting_state(default_input());
        state.meta.round = 2;
        let r = apply_preparation_phase(&state);
        assert_eq!(r.state.meta.phase, Phase::Action);
    }

    #[test]
    fn production_auto_applies_round_suggestion() {
        let state = create_starting_state(default_input());
        let r = apply_production_phase(&state, ProductionMode::Auto);
        assert!(!r.log.imf_intervened);
        // Treasury grows due to taxes.
        assert!(r.state.classes.state.treasury >= state.classes.state.treasury);
        assert_eq!(r.state.meta.phase, Phase::Elections);
    }

    #[test]
    fn production_manual_does_not_apply_taxes() {
        let state = create_starting_state(default_input());
        let r = apply_production_phase(&state, ProductionMode::Manual);
        // Treasury unchanged because Manual doesn't apply suggestion.
        assert_eq!(r.state.classes.state.treasury, state.classes.state.treasury);
        // But phase still advances.
        assert_eq!(r.state.meta.phase, Phase::Elections);
    }

    #[test]
    fn production_triggers_imf_when_overlevered() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 5;
        state.classes.state.treasury = 0;
        let r = apply_production_phase(&state, ProductionMode::Auto);
        assert!(r.log.imf_intervened);
    }

    #[test]
    fn scoring_advances_round() {
        let mut state = create_starting_state(default_input());
        state.meta.round = 2;
        let r = apply_scoring_phase(&state);
        assert_eq!(r.state.meta.round, 3);
        assert_eq!(r.state.meta.phase, Phase::Preparation);
    }

    #[test]
    fn scoring_round5_no_advance() {
        let mut state = create_starting_state(default_input());
        state.meta.round = 5;
        let r = apply_scoring_phase(&state);
        assert_eq!(r.state.meta.round, 5);
        assert!(r.log.entries.last().unwrap().contains("Game End"));
    }

    #[test]
    fn scoring_legitimacy_vp_from_two_lowest() {
        let mut state = create_starting_state(default_input());
        state.classes.state.legitimacy = LegitimacyMap {
            working: 6,
            middle: 4,
            capitalist: 5,
        };
        let starting_state_vp = state.classes.state.vp;
        let r = apply_scoring_phase(&state);
        // Two lowest = 4+5 = 9
        assert!(r.state.classes.state.vp >= starting_state_vp + 9);
    }

    #[test]
    fn scoring_preserves_pre_existing_vp() {
        // Regression: before fix, scoring computed total = base + delta and
        // then assigned `vp = total`, which equals `vp + delta`. With
        // saturating_add we now add `delta` directly. Both produce the
        // same value, but this test pins the invariant: a pass-bill
        // award (working.vp = 12) must remain in the running total
        // after scoring runs.
        let mut state = create_starting_state(default_input());
        state.classes.working.vp = 12; // simulate prior bill awards
        let r = apply_scoring_phase(&state);
        assert!(
            r.state.classes.working.vp >= 12,
            "scoring must not erase prior VP; got {} from base 12",
            r.state.classes.working.vp
        );
    }

    #[test]
    fn scoring_five_rounds_matches_hand_computed_table() {
        // Deterministic per-round delta scenario: Working has 30¥ cash
        // (3 cash VP), 0 prosperity, no trade unions = +3 VP/round.
        // After 5 rounds at constant state: 0 + 5×3 = 15 VP.
        // Capitalist starts with 0 capital → 0 capital VP/round → 0 total.
        // State legitimacy starts {2,2,2}; two-lowest=4. But Legitimacy
        // is HALVED each round, so per-round legit VP varies:
        //   R1: 2+2 = 4 → halve → all 1
        //   R2: 1+1 = 2 → halve → all 1
        //   R3: 1+1 = 2
        //   R4: 1+1 = 2
        //   R5: 1+1 = 2
        // State legit total = 4+2+2+2+2 = 12.
        let mut state = create_starting_state(default_input());
        let starting_working_vp = state.classes.working.vp;
        let mut working_running = starting_working_vp;
        for _ in 0..5 {
            let prev_working = state.classes.working.vp;
            let r = apply_scoring_phase(&state);
            // Monotonically non-decreasing.
            assert!(
                r.state.classes.working.vp >= prev_working,
                "VP regressed: {} -> {}",
                prev_working,
                r.state.classes.working.vp
            );
            working_running = r.state.classes.working.vp;
            state = r.state;
            // Reset round + phase so we can call scoring again deterministically.
            state.meta.phase = Phase::Scoring;
            state.meta.round = 1;
        }
        // 5 rounds × 3 cash VP = 15.
        assert_eq!(working_running - starting_working_vp, 15);
    }
}
