use crate::rules::taxes::suggest_taxes;
use crate::rules::vp::vp_for;
use crate::types::{
    ClassId, GameState, PolicySection, ProsperityDelta, RoundSuggestion, VpAtScoring,
    WagesSuggestion, WelfareCostsSuggestion,
};

/// Compute a heuristic suggestion for end-of-round calculations.
pub fn compute_round_suggestion(state: &GameState) -> RoundSuggestion {
    let taxes = suggest_taxes(state);
    let m = taxes.multiplier;

    // Wages: each capitalist company pays workers_assigned * wage_level * 5
    let from_capitalist: i32 = state.classes.capitalist.companies.iter()
        .map(|c| c.workers_assigned * c.wage_level as i32 * 5)
        .sum();

    // Wages from middle: working_class_employees * wage_level * 5
    let from_middle: i32 = state.classes.middle.companies.iter()
        .map(|c| c.working_class_employees * c.wage_level as i32 * 5)
        .sum();

    let to_working = from_capitalist + from_middle;

    // Welfare: free at policy A, cost charged when A
    let welfare_use_estimate =
        state.classes.working.population + state.classes.middle.population;

    let from_state = {
        let health_cost = if state.policies.health_benefits.position == PolicySection::A {
            welfare_use_estimate
        } else {
            0
        };
        let edu_cost = if state.policies.education_welfare.position == PolicySection::A {
            welfare_use_estimate
        } else {
            0
        };
        health_cost + edu_cost
    };

    // Prosperity heuristic: +1 if health + education + luxury >= population
    let w = &state.classes.working;
    let md = &state.classes.middle;

    let working_pros = if w.storage.health + w.storage.education + w.storage.luxury >= w.population {
        1
    } else {
        0
    };
    let middle_pros = if md.storage.health + md.storage.education + md.storage.luxury >= md.population {
        1
    } else {
        0
    };

    RoundSuggestion {
        taxes,
        wages: WagesSuggestion {
            from_capitalist,
            from_middle,
            to_working,
        },
        welfare_costs: WelfareCostsSuggestion {
            from_state,
            notes: "Free policies (section A) cost the State per use; sections B/C charge users instead.".to_string(),
        },
        prosperity_delta: ProsperityDelta {
            working: working_pros,
            middle: middle_pros,
        },
        vp_at_scoring: VpAtScoring {
            working: vp_for(ClassId::Working, state).total,
            middle: vp_for(ClassId::Middle, state).total,
            capitalist: vp_for(ClassId::Capitalist, state).total,
            state: vp_for(ClassId::State, state).total,
        },
        notes: vec![
            format!("Tax multiplier this round: \u{d7}{}", m),
            "Suggestions are heuristics \u{2014} edit any number before applying.".to_string(),
        ],
    }
}

/// Apply the round suggestion to the game state: taxes flow to treasury,
/// wages deducted from capitalist/middle and added to working.
pub fn apply_round_suggestion(state: &GameState, suggestion: &RoundSuggestion) -> GameState {
    let mut next = state.clone();

    // Taxes → treasury
    next.classes.state.treasury =
        (next.classes.state.treasury + suggestion.taxes.total_to_treasury).max(0);

    // Wages deducted from capitalist revenue
    next.classes.capitalist.revenue =
        (next.classes.capitalist.revenue - suggestion.wages.from_capitalist).max(0);

    // Wages deducted from middle money
    next.classes.middle.money =
        (next.classes.middle.money - suggestion.wages.from_middle).max(0);

    // Wages added to working money
    next.classes.working.money =
        (next.classes.working.money + suggestion.wages.to_working).max(0);

    next
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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
        }
    }

    #[test]
    fn round_suggestion_tax_multiplier() {
        let state = create_starting_state(default_input());
        // taxation=A, health=C, edu=C → 3
        let suggestion = compute_round_suggestion(&state);
        assert_eq!(suggestion.taxes.multiplier, 3);
    }

    #[test]
    fn round_suggestion_wages_sum() {
        let state = create_starting_state(default_input());
        let suggestion = compute_round_suggestion(&state);
        // All capitalist companies have workers_assigned=0 at start, so wages=0
        assert_eq!(suggestion.wages.from_capitalist, 0);
        assert_eq!(suggestion.wages.from_middle, 0);
        assert_eq!(suggestion.wages.to_working, 0);
    }

    #[test]
    fn round_suggestion_wages_with_assigned_workers() {
        let mut state = create_starting_state(default_input());
        // Assign 2 workers at wage level 3 to first capitalist company
        state.classes.capitalist.companies[0].workers_assigned = 2;
        state.classes.capitalist.companies[0].wage_level = 3;
        // Assign 1 working-class employee at wage level 2 to first middle company
        state.classes.middle.companies[0].working_class_employees = 1;
        state.classes.middle.companies[0].wage_level = 2;

        let suggestion = compute_round_suggestion(&state);
        assert_eq!(suggestion.wages.from_capitalist, 2 * 3 * 5); // 30
        assert_eq!(suggestion.wages.from_middle, 1 * 2 * 5);     // 10
        assert_eq!(suggestion.wages.to_working, 40);
    }

    #[test]
    fn apply_round_suggestion_mutates_treasury_and_money() {
        let state = create_starting_state(default_input());
        let suggestion = compute_round_suggestion(&state);
        let next = apply_round_suggestion(&state, &suggestion);

        assert_eq!(
            next.classes.state.treasury,
            state.classes.state.treasury + suggestion.taxes.total_to_treasury
        );
        assert_eq!(
            next.classes.working.money,
            state.classes.working.money + suggestion.wages.to_working
        );
    }

    #[test]
    fn prosperity_delta_zero_at_start() {
        let state = create_starting_state(default_input());
        // working: health=0, education=0, luxury=0 sum=0 < population=10 → 0
        let suggestion = compute_round_suggestion(&state);
        assert_eq!(suggestion.prosperity_delta.working, 0);
    }

    #[test]
    fn notes_contain_multiplier() {
        let state = create_starting_state(default_input());
        let suggestion = compute_round_suggestion(&state);
        assert!(suggestion.notes[0].contains('3'));
    }
}
