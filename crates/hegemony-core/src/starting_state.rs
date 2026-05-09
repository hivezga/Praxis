use uuid::Uuid;

use crate::types::*;

fn now_ms() -> u64 {
    #[cfg(not(target_arch = "wasm32"))]
    {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }
    #[cfg(target_arch = "wasm32")]
    {
        0
    }
}

fn make_working() -> WorkingClassState {
    WorkingClassState {
        money: 30,
        vp: 0,
        prosperity: 0,
        population: 10,
        unemployed_workers: 2,
        unemployed_skilled_workers: 0,
        companies: vec![],
        trade_unions: vec![
            TradeUnionPresence { industry: 1, workers_assigned: 0 },
            TradeUnionPresence { industry: 2, workers_assigned: 0 },
            TradeUnionPresence { industry: 3, workers_assigned: 0 },
            TradeUnionPresence { industry: 4, workers_assigned: 0 },
            TradeUnionPresence { industry: 5, workers_assigned: 0 },
        ],
        cooperating_farms_remaining: 2,
        storage: WorkingStorage {
            food: 0,
            health: 0,
            education: 0,
            luxury: 0,
            influence: 1,
        },
        loans: 0,
        hand_size: 7,
        voting_cubes_in_bag: 8,
        bill_markers_available: 3,
        notes: String::new(),
    }
}

fn make_middle() -> MiddleClassState {
    MiddleClassState {
        money: 40,
        capital: 0,
        vp: 0,
        prosperity: 0,
        savings: 0,
        population: 10,
        unemployed_workers: 0,
        unemployed_skilled_workers: 0,
        companies: vec![
            MiddleCompany {
                id: Uuid::new_v4().to_string(),
                label: "Convenience Store".to_string(),
                workers_assigned: 1,
                working_class_employees: 0,
                wage_level: 2,
                fully_operational: false,
            },
            MiddleCompany {
                id: Uuid::new_v4().to_string(),
                label: "Doctor's Office".to_string(),
                workers_assigned: 1,
                working_class_employees: 0,
                wage_level: 2,
                fully_operational: false,
            },
        ],
        market_company_ids: vec![],
        storage: MiddleStorage {
            food: 1,
            luxury: 0,
            health: 1,
            education: 0,
            influence: 1,
            prices: MiddlePrices {
                food: 12,
                luxury: 8,
                health: 8,
                education: 8,
            },
        },
        loans: 0,
        hand_size: 7,
        voting_cubes_in_bag: 8,
        bill_markers_available: 3,
        notes: String::new(),
    }
}

fn make_capitalist() -> CapitalistState {
    CapitalistState {
        revenue: 120,
        capital: 0,
        vp: 0,
        companies: vec![
            CapitalistCompany {
                id: Uuid::new_v4().to_string(),
                label: "Supermarket".to_string(),
                workers_assigned: 0,
                wage_level: 1,
                industry: 1,
                on_strike: false,
            },
            CapitalistCompany {
                id: Uuid::new_v4().to_string(),
                label: "Shopping Mall".to_string(),
                workers_assigned: 0,
                wage_level: 1,
                industry: 2,
                on_strike: false,
            },
            CapitalistCompany {
                id: Uuid::new_v4().to_string(),
                label: "College".to_string(),
                workers_assigned: 0,
                wage_level: 1,
                industry: 5,
                on_strike: false,
            },
            CapitalistCompany {
                id: Uuid::new_v4().to_string(),
                label: "Clinic".to_string(),
                workers_assigned: 0,
                wage_level: 1,
                industry: 4,
                on_strike: false,
            },
        ],
        market_company_ids: vec![],
        storage: CapitalistStorage {
            food: 1,
            luxury: 2,
            health: 0,
            education: 2,
            influence: 1,
            free_trade_zone: FreeTradeZone { food: 0, luxury: 0 },
            prices: CapitalistPrices {
                food: 12,
                luxury: 8,
                health: 8,
                education: 8,
            },
        },
        loans: 0,
        hand_size: 7,
        voting_cubes_in_bag: 8,
        bill_markers_available: 3,
        notes: String::new(),
    }
}

fn make_state() -> StateClassState {
    StateClassState {
        treasury: 120,
        vp: 0,
        legitimacy: LegitimacyMap { working: 2, middle: 2, capitalist: 2 },
        legitimacy_tokens: LegitimacyMap { working: 0, middle: 0, capitalist: 0 },
        public_companies: vec![],
        storage: StateStorage { food: 0, luxury: 0, influence: 1 },
        welfare: WelfareState {
            health: PolicySection::B,
            education: PolicySection::C,
        },
        event_card_ids: vec![],
        political_agenda_card_id: None,
        loans: 0,
        hand_size: 7,
        bill_markers_available: 3,
        notes: String::new(),
    }
}

pub fn create_starting_state(input: NewGameInput) -> GameState {
    let now = now_ms();

    let policies = Policies {
        fiscal_policy: PolicyState { id: PolicyId::FiscalPolicy, position: PolicySection::C },
        labor_market: PolicyState { id: PolicyId::LaborMarket, position: PolicySection::B },
        taxation: PolicyState { id: PolicyId::Taxation, position: PolicySection::A },
        health_benefits: PolicyState { id: PolicyId::HealthBenefits, position: PolicySection::B },
        education_welfare: PolicyState { id: PolicyId::EducationWelfare, position: PolicySection::C },
        foreign_trade: PolicyState { id: PolicyId::ForeignTrade, position: PolicySection::B },
        immigration: PolicyState { id: PolicyId::Immigration, position: PolicySection::B },
    };

    let automa = if input.mode == GameMode::Solo
        && input.expansions.crisis_and_control
        && input.expansions.modules.automa
    {
        Some(AutomaState {
            difficulty: "easy".to_string(),
            opponents: AutomaOpponents {
                middle: AutomaOpponent {
                    enabled: true,
                    vp: 0,
                    money: 40,
                    influence: 1,
                    legitimacy: None,
                    capital: None,
                    prosperity: Some(0),
                    notes: String::new(),
                },
                capitalist: AutomaOpponent {
                    enabled: true,
                    vp: 0,
                    money: 120,
                    influence: 1,
                    legitimacy: None,
                    capital: Some(0),
                    prosperity: None,
                    notes: String::new(),
                },
                state: AutomaOpponent {
                    enabled: false,
                    vp: 0,
                    money: 120,
                    influence: 1,
                    legitimacy: Some(6),
                    capital: None,
                    prosperity: None,
                    notes: String::new(),
                },
            },
        })
    } else {
        None
    };

    let crisis = if input.expansions.crisis_and_control {
        Some(CrisisState {
            crisis_cards: vec![],
            active_crisis_card_id: None,
            bonds: vec![],
            automa,
        })
    } else {
        None
    };

    GameState {
        meta: GameMeta {
            id: Uuid::new_v4().to_string(),
            name: input.name
                .as_deref()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "New Game".to_string()),
            created_at: now,
            updated_at: now,
            mode: input.mode,
            expansions: input.expansions,
            player_count: input.player_count,
            classes_in_play: input.classes_in_play,
            round: 1,
            phase: Phase::Preparation,
            active_class: None,
            local_player_class: input.local_player_class,
        },
        policies,
        market: MarketState { food: 0, luxury: 0, health_goods: 0, education_goods: 0 },
        public_services: PublicServices { health: 0, education: 0, media_influence: 0 },
        pools: PopulationPools { workers: 0, middle_class: 0, foreign_capital: 0 },
        bills: vec![],
        business_deals: vec![],
        classes: Classes {
            working: make_working(),
            middle: make_middle(),
            capitalist: make_capitalist(),
            state: make_state(),
        },
        crisis,
        history: vec![],
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

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
    fn policy_defaults_are_correct() {
        let state = create_starting_state(default_input());
        assert_eq!(state.policies.fiscal_policy.position, PolicySection::C);
        assert_eq!(state.policies.labor_market.position, PolicySection::B);
        assert_eq!(state.policies.taxation.position, PolicySection::A);
        assert_eq!(state.policies.health_benefits.position, PolicySection::B);
        assert_eq!(state.policies.education_welfare.position, PolicySection::C);
        assert_eq!(state.policies.foreign_trade.position, PolicySection::B);
        assert_eq!(state.policies.immigration.position, PolicySection::B);
        assert_eq!(state.classes.state.welfare.health, PolicySection::B);
        assert_eq!(state.classes.state.welfare.education, PolicySection::C);
    }

    #[test]
    fn starting_money_values() {
        let state = create_starting_state(default_input());
        assert_eq!(state.classes.working.money, 30);
        assert_eq!(state.classes.middle.money, 40);
        assert_eq!(state.classes.capitalist.revenue, 120);
        assert_eq!(state.classes.state.treasury, 120);
    }

    #[test]
    fn crisis_none_when_disabled() {
        let state = create_starting_state(default_input());
        assert!(state.crisis.is_none());
    }

    #[test]
    fn crisis_some_when_enabled() {
        let mut input = default_input();
        input.expansions.crisis_and_control = true;
        let state = create_starting_state(input);
        assert!(state.crisis.is_some());
    }

    #[test]
    fn automa_some_when_solo_and_enabled() {
        let input = NewGameInput {
            name: None,
            mode: GameMode::Solo,
            player_count: 2,
            classes_in_play: vec![ClassId::Working],
            expansions: ExpansionFlags {
                crisis_and_control: true,
                modules: ExpansionModules {
                    automa: true,
                    crisis_cards: false,
                    alternative_events: false,
                    hidden_agendas: false,
                    new_action_cards: false,
                },
            },
            local_player_class: Some(ClassId::Working),
        };
        let state = create_starting_state(input);
        assert!(state.crisis.unwrap().automa.is_some());
    }

    #[test]
    fn phase_starts_at_preparation() {
        let state = create_starting_state(default_input());
        assert_eq!(state.meta.phase, Phase::Preparation);
    }

    #[test]
    fn round_starts_at_1() {
        let state = create_starting_state(default_input());
        assert_eq!(state.meta.round, 1);
    }

    #[test]
    fn default_name_used_when_none() {
        let state = create_starting_state(default_input());
        assert_eq!(state.meta.name, "New Game");
    }

    #[test]
    fn working_trade_unions_are_5() {
        let state = create_starting_state(default_input());
        assert_eq!(state.classes.working.trade_unions.len(), 5);
    }

    #[test]
    fn middle_has_two_starting_companies() {
        let state = create_starting_state(default_input());
        assert_eq!(state.classes.middle.companies.len(), 2);
    }

    #[test]
    fn capitalist_has_four_starting_companies() {
        let state = create_starting_state(default_input());
        assert_eq!(state.classes.capitalist.companies.len(), 4);
    }

    #[test]
    fn state_legitimacy_defaults() {
        let state = create_starting_state(default_input());
        let leg = &state.classes.state.legitimacy;
        assert_eq!(leg.working, 2);
        assert_eq!(leg.middle, 2);
        assert_eq!(leg.capitalist, 2);
    }
}
