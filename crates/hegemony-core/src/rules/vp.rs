use crate::types::{ClassId, GameState, VpBreakdown};

/// Capital wealth table derived from rulebook examples:
/// 34→2VP, 57→3VP, 166→7VP
/// Thresholds: [0, 10, 30, 50, 75, 100, 130, 160]
fn capital_vp(capital: i32) -> i32 {
    match capital {
        c if c < 10 => 0,
        c if c < 30 => 1,
        c if c < 50 => 2,
        c if c < 75 => 3,
        c if c < 100 => 4,
        c if c < 130 => 5,
        c if c < 160 => 6,
        _ => 7,
    }
}

pub fn working_vp(state: &GameState) -> VpBreakdown {
    let w = &state.classes.working;
    let trade_unions = w.trade_unions.iter().filter(|t| t.workers_assigned >= 4).count() as i32 * 2;
    let cash = w.money / 10;
    VpBreakdown {
        base: w.vp,
        prosperity: Some(w.prosperity),
        trade_unions: Some(trade_unions),
        storage: None,
        legitimacy: None,
        cash: Some(cash),
        capital: None,
        total: w.vp + w.prosperity + trade_unions + cash,
    }
}

pub fn middle_vp(state: &GameState) -> VpBreakdown {
    let m = &state.classes.middle;
    let s = &m.storage;
    let storage = (s.food + s.luxury + s.health + s.education + s.influence) / 2;
    let cash = m.money / 15;
    VpBreakdown {
        base: m.vp,
        prosperity: Some(m.prosperity),
        trade_unions: None,
        storage: Some(storage),
        legitimacy: None,
        cash: Some(cash),
        capital: None,
        total: m.vp + m.prosperity + storage + cash,
    }
}

pub fn capitalist_vp(state: &GameState) -> VpBreakdown {
    let c = &state.classes.capitalist;
    let cap_vp = capital_vp(c.capital);
    VpBreakdown {
        base: c.vp,
        prosperity: None,
        trade_unions: None,
        storage: None,
        legitimacy: None,
        cash: None,
        capital: Some(cap_vp),
        total: c.vp + cap_vp,
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
    let cash = s.treasury / 30;
    VpBreakdown {
        base: s.vp,
        prosperity: None,
        trade_unions: None,
        storage: None,
        legitimacy: Some(legitimacy),
        cash: Some(cash),
        capital: None,
        total: s.vp + legitimacy + cash,
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
        // vp=0, prosperity=0, trade_unions: 0 (all workers_assigned=0), cash: floor(30/10)=3
        assert_eq!(vp.base, 0);
        assert_eq!(vp.prosperity, Some(0));
        assert_eq!(vp.trade_unions, Some(0));
        assert_eq!(vp.cash, Some(3));
        assert_eq!(vp.total, 3);
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
    }

    #[test]
    fn middle_vp_at_start() {
        let state = create_starting_state(default_input());
        let vp = middle_vp(&state);
        // vp=0, prosperity=0
        // storage: food=1, luxury=0, health=1, education=0, influence=1 → sum=3, floor(3/2)=1
        // cash: floor(40/15)=2
        assert_eq!(vp.base, 0);
        assert_eq!(vp.prosperity, Some(0));
        assert_eq!(vp.storage, Some(1));
        assert_eq!(vp.cash, Some(2));
        assert_eq!(vp.total, 3);
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

        state.classes.capitalist.capital = 34;
        assert_eq!(capitalist_vp(&state).capital, Some(2));

        state.classes.capitalist.capital = 57;
        assert_eq!(capitalist_vp(&state).capital, Some(3));

        state.classes.capitalist.capital = 166;
        assert_eq!(capitalist_vp(&state).capital, Some(7));

        state.classes.capitalist.capital = 9;
        assert_eq!(capitalist_vp(&state).capital, Some(0));

        state.classes.capitalist.capital = 10;
        assert_eq!(capitalist_vp(&state).capital, Some(1));

        state.classes.capitalist.capital = 160;
        assert_eq!(capitalist_vp(&state).capital, Some(7));
    }

    #[test]
    fn state_vp_at_start() {
        let state = create_starting_state(default_input());
        let vp = state_vp(&state);
        // legitimacy: working=2, middle=2, capitalist=2 → sorted [2,2,2], two lowest = 4
        // cash: floor(120/30) = 4
        assert_eq!(vp.legitimacy, Some(4));
        assert_eq!(vp.cash, Some(4));
        assert_eq!(vp.total, 8);
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
    fn working_vp_never_negative_with_zero_resources() {
        let mut state = create_starting_state(default_input());
        state.classes.working.money = 0;
        state.classes.working.vp = 0;
        state.classes.working.prosperity = 0;
        let vp = working_vp(&state);
        assert!(vp.total >= 0);
    }
}
