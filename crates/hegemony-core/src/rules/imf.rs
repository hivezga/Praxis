//! IMF Intervention rules (rulebook page 33-34).
//!
//! Triggered during the "Check IMF" step of the Production Phase if the
//! State has more Loans than its Fiscal Policy allows AND cannot pay
//! them off at 55¥ per Loan.
//!
//! Effects (in order):
//!   1. Discard all proposed Bills
//!   2. Each player gets 1 Influence per discarded Bill they proposed
//!      (NB: Influence sourcing per-player is not yet tracked in core)
//!   3. Apply hardcoded Politics changes (post-IMF target table)
//!   4. State pays off Loans at 55¥ each, as much as it can afford
//!   5. Halve Legitimacy markers (rounded up)
//!
//! Crisis Response expansion (page 14) overrides this fixed flow with
//! a drawn card. Handled separately in `crisis_response.rs`.

use crate::types::{
    Bill, GameState, LegitimacyMap, PolicyId, PolicySection, Policies,
};

const LOAN_PAYOFF_COST: i32 = 55;

/// Maximum Loans the State may carry without IMF intervening.
/// Rulebook page 30: Fiscal C = 1, Fiscal A or B = 2.
pub fn fiscal_loan_limit(fiscal: &PolicySection) -> i32 {
    match fiscal {
        PolicySection::A | PolicySection::B => 2,
        PolicySection::C => 1,
    }
}

/// True iff the State should trigger IMF intervention. Triggers when
/// Loans exceed the Fiscal Policy limit AND Treasury cannot pay them
/// down to the limit at 55¥ per Loan.
pub fn imf_intervenes(state: &GameState) -> bool {
    let fiscal = &state.policies.fiscal_policy.position;
    let limit = fiscal_loan_limit(fiscal);
    let loans = state.classes.state.loans;
    if loans <= limit {
        return false;
    }
    let excess = loans - limit;
    let need = excess * LOAN_PAYOFF_COST;
    state.classes.state.treasury < need
}

/// Apply hardcoded post-IMF Politics table (rulebook page 33).
/// Returns the new Policies struct - fields not in the IMF table keep
/// their current value because Welfare State + Foreign Trade do change.
pub fn imf_post_intervention_policies(_current: &Policies) -> Policies {
    Policies {
        fiscal_policy: super::ps(PolicyId::FiscalPolicy, PolicySection::C),
        labor_market: super::ps(PolicyId::LaborMarket, PolicySection::C),
        taxation: super::ps(PolicyId::Taxation, PolicySection::A),
        health_benefits: super::ps(PolicyId::HealthBenefits, PolicySection::B),
        education_welfare: super::ps(PolicyId::EducationWelfare, PolicySection::C),
        foreign_trade: super::ps(PolicyId::ForeignTrade, PolicySection::B),
        immigration: super::ps(PolicyId::Immigration, PolicySection::B),
    }
}

/// Apply IMF intervention to the GameState. Mutates: bills, policies,
/// state.loans, state.treasury, state.legitimacy.
pub fn apply_imf_intervention(state: &GameState) -> GameState {
    let mut next = state.clone();

    // 1. Discard all proposed Bills.
    let _discarded: Vec<Bill> = std::mem::take(&mut next.bills);
    // 2. Influence-per-bill is per-player tracking; left as TODO.

    // 3. Apply post-IMF Politics table.
    next.policies = imf_post_intervention_policies(&state.policies);
    // Wages on all Companies must be set to L1 - rulebook page 30 / 33.
    // Labor Market becomes C, which means L1 wages allowed; the
    // intervention forces all Companies down to L1.
    for c in next.classes.capitalist.companies.iter_mut() {
        c.wage_level = 1;
    }
    for c in next.classes.middle.companies.iter_mut() {
        c.wage_level = 1;
    }
    for c in next.classes.state.public_companies.iter_mut() {
        c.wage_level = 1;
    }

    // 4. Pay off Loans as much as Treasury allows, 55¥ each.
    let mut treasury = next.classes.state.treasury;
    let mut loans = next.classes.state.loans;
    while loans > 0 && treasury >= LOAN_PAYOFF_COST {
        treasury -= LOAN_PAYOFF_COST;
        loans -= 1;
    }
    next.classes.state.treasury = treasury;
    next.classes.state.loans = loans;

    // 5. Halve Legitimacy markers (rounded up).
    let leg = &state.classes.state.legitimacy;
    next.classes.state.legitimacy = LegitimacyMap {
        working: half_up(leg.working),
        middle: half_up(leg.middle),
        capitalist: half_up(leg.capitalist),
    };

    next
}

fn half_up(n: i32) -> i32 {
    if n <= 0 {
        return 0;
    }
    (n + 1) / 2
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
    fn fiscal_loan_limits() {
        assert_eq!(fiscal_loan_limit(&PolicySection::A), 2);
        assert_eq!(fiscal_loan_limit(&PolicySection::B), 2);
        assert_eq!(fiscal_loan_limit(&PolicySection::C), 1);
    }

    #[test]
    fn imf_does_not_trigger_at_starting_state() {
        let state = create_starting_state(default_input());
        assert!(!imf_intervenes(&state));
    }

    #[test]
    fn imf_triggers_when_over_limit_and_broke() {
        let mut state = create_starting_state(default_input());
        // Fiscal C, limit=1. 3 loans, no money in Treasury.
        state.classes.state.loans = 3;
        state.classes.state.treasury = 0;
        assert!(imf_intervenes(&state));
    }

    #[test]
    fn imf_does_not_trigger_when_can_afford() {
        let mut state = create_starting_state(default_input());
        // Fiscal C, limit=1. 3 loans means 2 excess to pay. 2*55=110.
        state.classes.state.loans = 3;
        state.classes.state.treasury = 110;
        assert!(!imf_intervenes(&state));
    }

    #[test]
    fn apply_imf_halves_legitimacy() {
        let mut state = create_starting_state(default_input());
        state.classes.state.legitimacy = LegitimacyMap {
            working: 6,
            middle: 5,
            capitalist: 7,
        };
        state.classes.state.loans = 5;
        state.classes.state.treasury = 0;
        let next = apply_imf_intervention(&state);
        // 6/2=3, 5/2=2.5 round up to 3, 7/2=3.5 round up to 4
        assert_eq!(next.classes.state.legitimacy.working, 3);
        assert_eq!(next.classes.state.legitimacy.middle, 3);
        assert_eq!(next.classes.state.legitimacy.capitalist, 4);
    }

    #[test]
    fn apply_imf_pays_loans_as_much_as_possible() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 4;
        state.classes.state.treasury = 120; // 2 * 55 = 110, can pay 2
        let next = apply_imf_intervention(&state);
        assert_eq!(next.classes.state.loans, 2);
        assert_eq!(next.classes.state.treasury, 10); // 120 - 110
    }

    #[test]
    fn apply_imf_resets_policies_to_imf_table() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 5;
        state.classes.state.treasury = 0;
        let next = apply_imf_intervention(&state);
        assert_eq!(next.policies.fiscal_policy.position, PolicySection::C);
        assert_eq!(next.policies.labor_market.position, PolicySection::C);
        assert_eq!(next.policies.taxation.position, PolicySection::A);
        assert_eq!(next.policies.health_benefits.position, PolicySection::B);
        assert_eq!(next.policies.education_welfare.position, PolicySection::C);
        assert_eq!(next.policies.foreign_trade.position, PolicySection::B);
        assert_eq!(next.policies.immigration.position, PolicySection::B);
    }

    #[test]
    fn apply_imf_drops_all_bills() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 3;
        state.classes.state.treasury = 0;
        state.bills.push(Bill {
            id: "b1".to_string(),
            policy_id: PolicyId::FiscalPolicy,
            proposed_section: PolicySection::B,
            proposed_by: ClassId::Working,
            immediate_vote: false,
        });
        let next = apply_imf_intervention(&state);
        assert!(next.bills.is_empty());
    }

    #[test]
    fn apply_imf_forces_l1_wages() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 3;
        state.classes.state.treasury = 0;
        for c in state.classes.capitalist.companies.iter_mut() {
            c.wage_level = 3;
        }
        let next = apply_imf_intervention(&state);
        for c in &next.classes.capitalist.companies {
            assert_eq!(c.wage_level, 1);
        }
    }
}
