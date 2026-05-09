use crate::types::{ClassId, GameState, VpBreakdown};

/// Capital wealth table — rulebook v1.2 page 21.
/// Board spaces: 10, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350,
/// 400, 450, 500¥. VP value = number of spaces reached.
pub(crate) const WEALTH_SPACES: &[i32] = &[
    10, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500,
];

/// Returns the wealth space index reached by `capital` (1-15), or 0 if
/// below the first space.
pub(crate) fn capital_vp(capital: i32) -> i32 {
    WEALTH_SPACES.iter().filter(|&&t| capital >= t).count() as i32
}

// Per-class breakdowns for the running scoreboard. Only includes per-round
// Scoring Phase contributions per Hegemony rulebook v1.2:
//   Working   (page 13): 2 VP per Trade Union (≥4 workers).
//   Middle    (page 21): nothing per round; Scoring is a free Prosperity
//                        bump opportunity. Prosperity itself is event-driven
//                        and awarded by the prosperity-up mutation, not
//                        re-summed each round.
//   Capitalist (page 21): VP from the Wealth table on current Capital.
//   State     (page 28): sum of two lowest Legitimacy values.
//
// Cash, storage, treasury, capital (Working / Middle / Capitalist / State)
// and policy-section bonuses are *game-end only* per the rulebook and are
// excluded from `total` here. They remain populated as Option<i32> on the
// breakdown for UI projection, but do not contribute to the running total.
//
// `total` therefore equals what the running scoreboard would show after
// this round's Scoring Phase resolves.

pub fn working_vp(state: &GameState) -> VpBreakdown {
    let w = &state.classes.working;
    let trade_unions = w.trade_unions.iter().filter(|t| t.workers_assigned >= 4).count() as i32 * 2;
    let cash = w.money / 10; // Game-end only — informational, not added to total.
    VpBreakdown {
        base: w.vp,
        prosperity: Some(w.prosperity),
        trade_unions: Some(trade_unions),
        storage: None,
        legitimacy: None,
        cash: Some(cash),
        capital: None,
        capital_marker_bonus: None,
        total: w.vp + trade_unions,
    }
}

pub fn middle_vp(state: &GameState) -> VpBreakdown {
    let m = &state.classes.middle;
    let s = &m.storage;
    let storage = (s.food + s.luxury + s.health + s.education + s.influence) / 2;
    let cash = m.money / 15; // Game-end only.
    VpBreakdown {
        base: m.vp,
        prosperity: Some(m.prosperity),
        trade_unions: None,
        storage: Some(storage), // Game-end only.
        legitimacy: None,
        cash: Some(cash),
        capital: None,
        capital_marker_bonus: None,
        total: m.vp,
    }
}

pub fn capitalist_vp(state: &GameState) -> VpBreakdown {
    let c = &state.classes.capitalist;
    let cap_vp = capital_vp(c.capital);
    // Wealth-marker movement bonus: +3 VP per space the marker would
    // advance to reach `cap_vp` (rulebook v1.2 page 21). Marker never
    // moves left, so a Capital drop yields no negative bonus.
    let bonus = ((cap_vp - c.wealth_marker_position as i32).max(0)) * 3;
    VpBreakdown {
        base: c.vp,
        prosperity: None,
        trade_unions: None,
        storage: None,
        legitimacy: None,
        cash: None,
        capital: Some(cap_vp),
        capital_marker_bonus: Some(bonus),
        total: c.vp + cap_vp + bonus,
    }
}

pub fn state_vp(state: &GameState) -> VpBreakdown {
    let s = &state.classes.state;
    let mut values = [
        s.legitimacy.working,
        s.legitimacy.middle,
        s.legitimacy.capitalist,
    ];
    values.sort_unstable();
    let legitimacy = values[0] + values[1];
    let cash = s.treasury / 30; // Game-end only.
    VpBreakdown {
        base: s.vp,
        prosperity: None,
        trade_unions: None,
        storage: None,
        legitimacy: Some(legitimacy),
        cash: Some(cash),
        capital: None,
        capital_marker_bonus: None,
        total: s.vp + legitimacy,
    }
}

pub fn vp_for(class_id: ClassId, state: &GameState) -> VpBreakdown {
    match class_id {
        ClassId::Working => working_vp(state),
        ClassId::Middle => middle_vp(state),
        ClassId::Capitalist => capitalist_vp(state),
        ClassId::State => state_vp(state),
    }
}

/// Per-round VP increment for a class — total minus the running base.
///
/// Used by `apply_scoring_phase` so each round adds only the round's
/// own contribution (prosperity, trade unions, cash, etc.), without
/// double-counting the previously accumulated `vp` baseline.
pub fn vp_round_delta_for(class_id: ClassId, state: &GameState) -> i32 {
    let breakdown = vp_for(class_id, state);
    breakdown.total - breakdown.base
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
            local_player_class: None,
        }
    }

    #[test]
    fn working_vp_at_start() {
        let state = create_starting_state(default_input());
        let vp = working_vp(&state);
        // Per rulebook v1.2 page 13: per-round = trade_unions * 2 only.
        // Cash is game-end (informational on breakdown but excluded from total).
        // base=0, trade_unions=0 (all workers_assigned=0) → total=0.
        assert_eq!(vp.base, 0);
        assert_eq!(vp.prosperity, Some(0));
        assert_eq!(vp.trade_unions, Some(0));
        assert_eq!(vp.cash, Some(3)); // floor(30/10) — game-end only
        assert_eq!(vp.total, 0);
    }

    #[test]
    fn working_vp_with_trade_unions() {
        let mut state = create_starting_state(default_input());
        // Give first two trade unions ≥4 workers
        state.classes.working.trade_unions[0].workers_assigned = 4;
        state.classes.working.trade_unions[1].workers_assigned = 5;
        let vp = working_vp(&state);
        // 2 unions * 2 VP = 4
        assert_eq!(vp.trade_unions, Some(4));
        assert_eq!(vp.total, 4); // base 0 + trade_unions 4
    }

    #[test]
    fn middle_vp_at_start() {
        let state = create_starting_state(default_input());
        let vp = middle_vp(&state);
        // Per rulebook v1.2 page 21: Middle's Scoring Phase is a free
        // Prosperity-bump opportunity, not a per-round VP source. Storage
        // and cash are game-end only.
        // base=0 → total=0.
        assert_eq!(vp.base, 0);
        assert_eq!(vp.prosperity, Some(0));
        assert_eq!(vp.storage, Some(1)); // game-end only
        assert_eq!(vp.cash, Some(2));    // floor(40/15) — game-end only
        assert_eq!(vp.total, 0);
    }

    #[test]
    fn capitalist_vp_at_start() {
        let state = create_starting_state(default_input());
        let vp = capitalist_vp(&state);
        // capital=0 → 0 capital VP
        assert_eq!(vp.base, 0);
        assert_eq!(vp.capital, Some(0));
        assert_eq!(vp.total, 0);
    }

    #[test]
    fn capitalist_vp_wealth_table() {
        let mut state = create_starting_state(default_input());
        // (capital, expected_space_index) — board spaces:
        //   10=1, 25=2, 50=3, 75=4, 100=5, 125=6, 150=7, 175=8, 200=9,
        //   250=10, 300=11, 350=12, 400=13, 450=14, 500=15
        let cases = [
            (0, 0), (9, 0),
            (10, 1), (24, 1),
            (25, 2), (34, 2), (49, 2),
            (50, 3), (57, 3), (74, 3),
            (75, 4), (99, 4),
            (100, 5), (124, 5),
            (125, 6), (149, 6),
            (150, 7), (166, 7), (174, 7),
            (175, 8), (199, 8),
            (200, 9), (249, 9),
            (250, 10), (299, 10),
            (300, 11), (349, 11),
            (350, 12), (399, 12),
            (400, 13), (449, 13),
            (450, 14), (499, 14),
            (500, 15), (1000, 15),
        ];
        for (capital, expected) in cases {
            state.classes.capitalist.capital = capital;
            assert_eq!(
                capitalist_vp(&state).capital,
                Some(expected),
                "capital_vp({}) wrong",
                capital,
            );
        }
    }

    #[test]
    fn state_vp_at_start() {
        let state = create_starting_state(default_input());
        let vp = state_vp(&state);
        // Per rulebook v1.2 page 28: per-round = sum of two lowest Legitimacies.
        // Treasury cash is game-end only (rulebook page 29: "1 VP per 30¥
        // remaining in the State Treasury" — Game End section).
        // legitimacy {2,2,2} → two lowest = 4. Treasury 120 → 4 cash (game-end).
        assert_eq!(vp.legitimacy, Some(4));
        assert_eq!(vp.cash, Some(4)); // game-end only
        assert_eq!(vp.total, 4);      // base 0 + legitimacy 4
    }

    #[test]
    fn state_vp_uses_two_lowest_legitimacy() {
        let mut state = create_starting_state(default_input());
        state.classes.state.legitimacy.working = 1;
        state.classes.state.legitimacy.middle = 3;
        state.classes.state.legitimacy.capitalist = 5;
        let vp = state_vp(&state);
        // two lowest: 1 + 3 = 4
        assert_eq!(vp.legitimacy, Some(4));
    }

    #[test]
    fn vp_for_dispatches_correctly() {
        let state = create_starting_state(default_input());
        assert_eq!(vp_for(ClassId::Working, &state), working_vp(&state));
        assert_eq!(vp_for(ClassId::Middle, &state), middle_vp(&state));
        assert_eq!(vp_for(ClassId::Capitalist, &state), capitalist_vp(&state));
        assert_eq!(vp_for(ClassId::State, &state), state_vp(&state));
    }

    #[test]
    fn capitalist_wealth_marker_bonus_full_movement_first_score() {
        // Rulebook p.21 example: capital=57, marker at 0 → space 3 → +9 VP bonus.
        let mut state = create_starting_state(default_input());
        state.classes.capitalist.capital = 57;
        state.classes.capitalist.wealth_marker_position = 0;
        let vp = capitalist_vp(&state);
        assert_eq!(vp.capital, Some(3));
        assert_eq!(vp.capital_marker_bonus, Some(9));
        assert_eq!(vp.total, 12); // base 0 + 3 + 9
    }

    #[test]
    fn capitalist_wealth_marker_bonus_zero_when_capital_drops() {
        // Rulebook p.21 round 2 example: capital=34, marker already at 3 → no bonus.
        let mut state = create_starting_state(default_input());
        state.classes.capitalist.capital = 34;
        state.classes.capitalist.wealth_marker_position = 3;
        let vp = capitalist_vp(&state);
        assert_eq!(vp.capital, Some(2));
        assert_eq!(vp.capital_marker_bonus, Some(0));
        assert_eq!(vp.total, 2); // static table only
    }

    #[test]
    fn capitalist_wealth_marker_bonus_partial_advance() {
        // Rulebook p.21 round 3 example: capital=166, marker at 3 → space 7 → +12 VP bonus.
        let mut state = create_starting_state(default_input());
        state.classes.capitalist.capital = 166;
        state.classes.capitalist.wealth_marker_position = 3;
        let vp = capitalist_vp(&state);
        assert_eq!(vp.capital, Some(7));
        assert_eq!(vp.capital_marker_bonus, Some(12)); // (7-3)*3
        assert_eq!(vp.total, 19); // 7 + 12
    }

    #[test]
    fn working_vp_never_negative_with_zero_resources() {
        let mut state = create_starting_state(default_input());
        state.classes.working.money = 0;
        state.classes.working.vp = 0;
        state.classes.working.prosperity = 0;
        let vp = working_vp(&state);
        assert!(vp.total >= 0);
    }
}
