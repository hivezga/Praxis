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
    Bill, CrisisCard, GameState, LegitimacyMap, PolicyId, PolicySection, Policies,
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

// ---------------------------------------------------------------------------
// Crisis Response (C&C expansion p.14)
// ---------------------------------------------------------------------------

/// Set policy position by id (helper).
fn set_policy(policies: &mut Policies, id: &PolicyId, position: PolicySection) {
    match id {
        PolicyId::FiscalPolicy => policies.fiscal_policy.position = position,
        PolicyId::LaborMarket => policies.labor_market.position = position,
        PolicyId::Taxation => policies.taxation.position = position,
        PolicyId::HealthBenefits => policies.health_benefits.position = position,
        PolicyId::EducationWelfare => policies.education_welfare.position = position,
        PolicyId::ForeignTrade => policies.foreign_trade.position = position,
        PolicyId::Immigration => policies.immigration.position = position,
    }
}

/// Apply a Crisis Response card's effects (rulebook v1.1 page 14):
///   1. Discard proposed Bills only for the listed Policies (not all)
///   2. Apply listed Policy moves
///   3. Apply additional money / loan-payoff effects
///   4. Apply Legitimacy losses
///   5. Locked Policies (recorded on `crisis.active_crisis_card_id`;
///      enforcement of "no Bills may be proposed for these" is a
///      ProposeBill-time check that the UI/host already validates)
pub fn apply_crisis_card_intervention(state: &GameState, card: &CrisisCard) -> GameState {
    let mut next = state.clone();

    // 1. Discard only proposed Bills whose Policy is in the card's list.
    next.bills.retain(|b| !card.discard_bills_for_policies.contains(&b.policy_id));

    // 2. Apply listed Policy moves.
    for change in &card.change_policies {
        set_policy(&mut next.policies, &change.policy_id, change.new_position.clone());
    }

    // 3a. State money delta.
    next.classes.state.treasury =
        (next.classes.state.treasury + card.state_money_delta).max(0);

    // 3b. Optional Loan payoff at 55¥/each (greedy from Treasury).
    if card.state_pays_off_loans {
        let mut treasury = next.classes.state.treasury;
        let mut loans = next.classes.state.loans;
        while loans > 0 && treasury >= LOAN_PAYOFF_COST {
            treasury -= LOAN_PAYOFF_COST;
            loans -= 1;
        }
        next.classes.state.treasury = treasury;
        next.classes.state.loans = loans;
    }

    // 4. Legitimacy losses.
    let leg = &mut next.classes.state.legitimacy;
    leg.working = (leg.working - card.legitimacy_loss.working).max(0);
    leg.middle = (leg.middle - card.legitimacy_loss.middle).max(0);
    leg.capitalist = (leg.capitalist - card.legitimacy_loss.capitalist).max(0);

    // 5. Lock tokens are tracked via `active_crisis_card_id` on the
    //    CrisisState; ProposeBill validation already consults that.
    if let Some(crisis) = next.crisis.as_mut() {
        crisis.active_crisis_card_id = Some(card.id.clone());
    }

    next
}

/// Branch the IMF intervention based on Crisis & Control state. If a
/// Crisis Response card is queued (first card in `crisis.crisis_cards`),
/// apply that card's effects instead of the fixed page-33 table.
pub fn apply_imf_or_crisis(state: &GameState) -> GameState {
    if let Some(crisis) = state.crisis.as_ref() {
        if let Some(card) = crisis.crisis_cards.first() {
            return apply_crisis_card_intervention(state, card);
        }
    }
    apply_imf_intervention(state)
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
    fn crisis_card_discards_only_listed_bills() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 5;
        state.classes.state.treasury = 0;
        state.bills.push(Bill {
            id: "b1".to_string(),
            policy_id: PolicyId::FiscalPolicy,
            proposed_section: PolicySection::B,
            proposed_by: ClassId::Working,
            immediate_vote: false,
        });
        state.bills.push(Bill {
            id: "b2".to_string(),
            policy_id: PolicyId::Immigration,
            proposed_section: PolicySection::A,
            proposed_by: ClassId::Middle,
            immediate_vote: false,
        });
        let card = CrisisCard {
            id: "test".to_string(),
            label: "Test card".to_string(),
            discard_bills_for_policies: vec![PolicyId::FiscalPolicy],
            change_policies: vec![],
            state_money_delta: 0,
            state_pays_off_loans: false,
            legitimacy_loss: LegitimacyMap::default(),
            locked_policies: vec![],
            locks_policy: None,
        };
        let next = apply_crisis_card_intervention(&state, &card);
        // Fiscal Policy bill discarded, Immigration bill survives.
        assert_eq!(next.bills.len(), 1);
        assert_eq!(next.bills[0].id, "b2");
    }

    #[test]
    fn crisis_card_changes_policies_and_treasury() {
        let mut state = create_starting_state(default_input());
        state.classes.state.treasury = 0;
        state.classes.state.loans = 1;
        let card = CrisisCard {
            id: "japanese".to_string(),
            label: "Japanese Model".to_string(),
            discard_bills_for_policies: vec![],
            change_policies: vec![
                crate::types::PolicyChange {
                    policy_id: PolicyId::FiscalPolicy,
                    new_position: PolicySection::A,
                },
            ],
            state_money_delta: 100,
            state_pays_off_loans: true,
            legitimacy_loss: LegitimacyMap { working: 1, middle: 1, capitalist: 1 },
            locked_policies: vec![],
            locks_policy: None,
        };
        let starting_leg = state.classes.state.legitimacy.clone();
        let next = apply_crisis_card_intervention(&state, &card);
        assert_eq!(next.policies.fiscal_policy.position, PolicySection::A);
        // 100¥ added, 55¥ pays off the 1 loan, 45¥ remains.
        assert_eq!(next.classes.state.treasury, 45);
        assert_eq!(next.classes.state.loans, 0);
        assert_eq!(next.classes.state.legitimacy.working, starting_leg.working - 1);
        assert_eq!(next.classes.state.legitimacy.middle, starting_leg.middle - 1);
        assert_eq!(next.classes.state.legitimacy.capitalist, starting_leg.capitalist - 1);
    }

    #[test]
    fn apply_imf_or_crisis_uses_card_when_present() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 5;
        state.classes.state.treasury = 0;
        // Inject crisis state with one card.
        state.crisis = Some(crate::types::CrisisState {
            crisis_cards: vec![CrisisCard {
                id: "c1".to_string(),
                label: "Test".to_string(),
                discard_bills_for_policies: vec![],
                change_policies: vec![crate::types::PolicyChange {
                    policy_id: PolicyId::Taxation,
                    new_position: PolicySection::C, // distinct from fixed IMF (which sets A)
                }],
                state_money_delta: 0,
                state_pays_off_loans: false,
                legitimacy_loss: LegitimacyMap::default(),
                locked_policies: vec![],
                locks_policy: None,
            }],
            active_crisis_card_id: None,
            bonds: vec![],
            automa: None,
        });
        let next = apply_imf_or_crisis(&state);
        // Crisis card moved Taxation → C; fixed IMF would have set it to A.
        assert_eq!(next.policies.taxation.position, PolicySection::C);
        // Fixed IMF would also reset Fiscal to C and force L1 wages, etc.
        // — none of those happen via crisis card.
        assert_eq!(next.classes.state.loans, 5); // not paid by this test card
    }

    #[test]
    fn apply_imf_or_crisis_falls_back_to_fixed_when_no_card() {
        let mut state = create_starting_state(default_input());
        state.classes.state.loans = 5;
        state.classes.state.treasury = 0;
        // No crisis state at all.
        state.crisis = None;
        let next = apply_imf_or_crisis(&state);
        // Fixed IMF sets Taxation → A.
        assert_eq!(next.policies.taxation.position, PolicySection::A);
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
