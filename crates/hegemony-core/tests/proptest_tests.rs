use hegemony_core::*;
use proptest::prelude::*;

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

fn section_from_u8(n: u8) -> PolicySection {
    match n % 3 {
        0 => PolicySection::A,
        1 => PolicySection::B,
        _ => PolicySection::C,
    }
}

proptest! {
    #[test]
    fn tax_multiplier_in_range(
        tax in 0u8..3,
        health in 0u8..3,
        edu in 0u8..3,
    ) {
        let mut state = create_starting_state(default_input());
        state.policies.taxation.position = section_from_u8(tax);
        state.policies.health_benefits.position = section_from_u8(health);
        state.policies.education_welfare.position = section_from_u8(edu);

        let m = compute_tax_multiplier(&state.policies);
        // Rulebook page 31: printed track values {1,2,3,4,5,6,7,9,11}.
        let printed = [1, 2, 3, 4, 5, 6, 7, 9, 11];
        prop_assert!(
            printed.contains(&m),
            "multiplier {} not in printed track {:?}",
            m,
            printed
        );
    }

    #[test]
    fn working_vp_never_negative(
        money in 0i32..10_000,
        vp in 0i32..100,
        prosperity in 0i32..50,
        workers_assigned_0 in 0i32..10,
        workers_assigned_1 in 0i32..10,
    ) {
        let mut state = create_starting_state(default_input());
        state.classes.working.money = money;
        state.classes.working.vp = vp;
        state.classes.working.prosperity = prosperity;
        state.classes.working.trade_unions[0].workers_assigned = workers_assigned_0;
        state.classes.working.trade_unions[1].workers_assigned = workers_assigned_1;

        let breakdown = working_vp(&state);
        prop_assert!(breakdown.total >= 0, "working VP {} is negative", breakdown.total);
    }

    #[test]
    fn middle_vp_never_negative(
        money in 0i32..10_000,
        vp in 0i32..100,
        prosperity in 0i32..50,
        food in 0i32..20,
        luxury in 0i32..20,
        health in 0i32..20,
        education in 0i32..20,
        influence in 0i32..20,
    ) {
        let mut state = create_starting_state(default_input());
        state.classes.middle.money = money;
        state.classes.middle.vp = vp;
        state.classes.middle.prosperity = prosperity;
        state.classes.middle.storage.food = food;
        state.classes.middle.storage.luxury = luxury;
        state.classes.middle.storage.health = health;
        state.classes.middle.storage.education = education;
        state.classes.middle.storage.influence = influence;

        let breakdown = middle_vp(&state);
        prop_assert!(breakdown.total >= 0, "middle VP {} is negative", breakdown.total);
    }

    #[test]
    fn capitalist_vp_never_negative(capital in 0i32..5_000) {
        let mut state = create_starting_state(default_input());
        state.classes.capitalist.capital = capital;

        let breakdown = capitalist_vp(&state);
        prop_assert!(breakdown.total >= 0, "capitalist VP {} is negative", breakdown.total);
    }

    #[test]
    fn state_vp_never_negative(
        treasury in 0i32..5_000,
        working_leg in 0i32..20,
        middle_leg in 0i32..20,
        cap_leg in 0i32..20,
    ) {
        let mut state = create_starting_state(default_input());
        state.classes.state.treasury = treasury;
        state.classes.state.legitimacy.working = working_leg;
        state.classes.state.legitimacy.middle = middle_leg;
        state.classes.state.legitimacy.capitalist = cap_leg;

        let breakdown = state_vp(&state);
        prop_assert!(breakdown.total >= 0, "state VP {} is negative", breakdown.total);
    }

    #[test]
    fn undo_restores_state(delta in -100i64..100i64) {
        let state = create_starting_state(default_input());
        let mutated = apply_mutation(
            &state,
            Mutation::AdjustMoney { class_id: ClassId::Working, delta },
            "test",
        );
        let restored = undo(&mutated).unwrap();
        prop_assert_eq!(restored.classes.working.money, state.classes.working.money);
    }

    #[test]
    fn apply_mutation_history_grows_by_one(delta in 0i64..50i64) {
        let state = create_starting_state(default_input());
        let before_len = state.history.len();
        let next = apply_mutation(
            &state,
            Mutation::AdjustMoney { class_id: ClassId::Working, delta },
            "test",
        );
        prop_assert_eq!(next.history.len(), before_len + 1);
    }

    #[test]
    fn money_never_goes_below_zero(delta in i64::MIN / 2..0i64) {
        let state = create_starting_state(default_input());
        let next = apply_mutation(
            &state,
            Mutation::AdjustMoney { class_id: ClassId::Working, delta },
            "test",
        );
        prop_assert!(next.classes.working.money >= 0);
    }

    #[test]
    fn adjust_vp_never_goes_below_zero(delta in -100i32..0i32) {
        let state = create_starting_state(default_input());
        let next = apply_mutation(
            &state,
            Mutation::AdjustVp { class_id: ClassId::Working, delta },
            "test",
        );
        prop_assert!(next.classes.working.vp >= 0);
    }
}
